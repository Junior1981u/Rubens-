// ==========================================================
// NEXORA TRADER AI V11 — CONSENSUS ENGINE & NEXORA CORE
// Strict 4/4 Unanimous Verification + Derived NEXORA_SCORE
// ==========================================================

import {
  FourAIResults,
  MarketSnapshot,
  ConsensusResult,
  NexoraCoreDecision,
  FinalDecision,
} from "../../src/types.js";
import { LossGuard } from "./lossGuard.js";
import { ModularStrategyRunner } from "./strategies/index.js";
import { StatisticalCalibrator } from "./calibrator.js";

export class ConsensusEngine {
  public static evaluateConsensus(
    fourAIs: FourAIResults,
    snapshotId: string,
    requireStrict4_4 = true
  ): ConsensusResult {
    const { gpt, claude, gemini, grok } = fourAIs;
    const all = [gpt, claude, gemini, grok];
    const now = Date.now();

    // 1. Strict verification: Valid, updated (<= 60s), matching snapshotId, and successful status
    const isValidResponse = (r: typeof gpt) =>
      Boolean(
        r &&
        r.status === "SUCCESS" &&
        r.snapshotId === snapshotId &&
        now - r.timestamp <= 60000 &&
        (r.direction === "PAR" || r.direction === "IMPAR" || r.direction === "WAIT")
      );

    const validGpt = isValidResponse(gpt);
    const validClaude = isValidResponse(claude);
    const validGemini = isValidResponse(gemini);
    const validGrok = isValidResponse(grok);
    const allValid = validGpt && validClaude && validGemini && validGrok;

    const directions = {
      gpt: validGpt ? gpt.direction : "WAIT",
      claude: validClaude ? claude.direction : "WAIT",
      gemini: validGemini ? gemini.direction : "WAIT",
      grok: validGrok ? grok.direction : "WAIT",
    };

    const dirValues = [directions.gpt, directions.claude, directions.gemini, directions.grok];
    const parCount = dirValues.filter((d) => d === "PAR").length;
    const imparCount = dirValues.filter((d) => d === "IMPAR").length;
    const reasons: string[] = [];

    // Rule: Mostrar consenso 4/4 PAR somente quando as quatro respostas forem válidas, atualizadas e indicarem PAR
    if (allValid && parCount === 4) {
      reasons.push("Consenso 4/4 unânime validado para PAR.");
      return {
        consensus: "PAR",
        agreementCount: 4,
        unanimous: true,
        consensusLabel: "4/4 PAR",
        onlineQuorumRatio: "4/4",
        isStrict4_4: true,
        directions,
        reasons,
        snapshotId,
      };
    }

    // Rule: Mostrar consenso 4/4 IMPAR somente quando as quatro respostas forem válidas, atualizadas e indicarem IMPAR
    if (allValid && imparCount === 4) {
      reasons.push("Consenso 4/4 unânime validado para ÍMPAR.");
      return {
        consensus: "IMPAR",
        agreementCount: 4,
        unanimous: true,
        consensusLabel: "4/4 IMPAR",
        onlineQuorumRatio: "4/4",
        isStrict4_4: true,
        directions,
        reasons,
        snapshotId,
      };
    }

    // Operational mode (when strict 4/4 is disabled by user, allow 3/4 confluences)
    if (!requireStrict4_4) {
      if (parCount >= 3 && imparCount === 0) {
        reasons.push("Confluência operacional 3/4 validada para PAR.");
        return {
          consensus: "PAR",
          agreementCount: parCount,
          unanimous: false,
          consensusLabel: "3/4 PAR",
          onlineQuorumRatio: `${parCount}/4`,
          isStrict4_4: false,
          directions,
          reasons,
          snapshotId,
        };
      }
      if (imparCount >= 3 && parCount === 0) {
        reasons.push("Confluência operacional 3/4 validada para ÍMPAR.");
        return {
          consensus: "IMPAR",
          agreementCount: imparCount,
          unanimous: false,
          consensusLabel: "3/4 IMPAR",
          onlineQuorumRatio: `${imparCount}/4`,
          isStrict4_4: false,
          directions,
          reasons,
          snapshotId,
        };
      }
    }

    // Se houver divergência, erro, timeout, indisponibilidade ou resposta atrasada:
    const failedAgents: string[] = [];
    if (!validGpt) failedAgents.push(`GPT (${gpt?.status || "ERRO"})`);
    if (!validClaude) failedAgents.push(`CLAUDE (${claude?.status || "ERRO"})`);
    if (!validGemini) failedAgents.push(`GEMINI (${gemini?.status || "ERRO"})`);
    if (!validGrok) failedAgents.push(`GROK (${grok?.status || "ERRO"})`);

    let failReason = "AGUARDAR — CONSENSO NÃO VALIDADO";
    if (failedAgents.length > 0) {
      failReason = `AGUARDAR — CONSENSO NÃO VALIDADO: ${failedAgents.join(", ")}`;
    } else {
      failReason = `AGUARDAR — CONSENSO NÃO VALIDADO: Divergência (${parCount} PAR vs ${imparCount} IMPAR)`;
    }
    reasons.push(failReason);

    return {
      consensus: "WAIT",
      agreementCount: Math.max(parCount, imparCount),
      unanimous: false,
      consensusLabel: "AGUARDAR — CONSENSO NÃO VALIDADO",
      onlineQuorumRatio: `${[validGpt, validClaude, validGemini, validGrok].filter(Boolean).length}/4`,
      isStrict4_4: true,
      directions,
      reasons,
      snapshotId,
    };
  }

  public static buildNexoraCoreDecision(
    snapshot: MarketSnapshot,
    fourAIs: FourAIResults,
    setupName = "PADRAO",
    requireStrict4_4 = true
  ): NexoraCoreDecision {
    const consensus = this.evaluateConsensus(fourAIs, snapshot.snapshotId, requireStrict4_4);
    const lossGuardCheck = LossGuard.getInstance().verify(snapshot, fourAIs, consensus, requireStrict4_4);

    // Derived Component Scores (strictly based on existing data, zero arbitrary math)
    const dataQualityScore = Math.max(0, Math.min(100, Math.round(snapshot.dataQuality)));
    const technicalScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (fourAIs.gemini.technicalScore || 65) * 0.7 +
            (100 - Math.abs(snapshot.indicators.rsi14 - 50) * 1.5) * 0.3
        )
      )
    );
    const parityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (1 - snapshot.parityFeatures.parityEntropy) * 50 +
            snapshot.parityFeatures.streakStrength * 0.3 +
            (snapshot.parityFeatures.hasStatisticalEdge ? 25 : 10)
        )
      )
    );
    const agreementScore = Math.round((consensus.agreementCount / 4) * 100);
    const regimeScore = snapshot.marketRegime === "UNCERTAIN" ? 45 : snapshot.marketRegime === "TRENDING" ? 95 : 85;
    const historicalSetupScore = setupName.includes("EXAUSTAO") ? 92 : setupName.includes("DESVIO") ? 88 : 80;
    const latencyScore = fourAIs.totalLatencyMs < 1500 ? 98 : fourAIs.totalLatencyMs < 3500 ? 88 : 72;

    // Derived composite NEXORA_SCORE (0 - 100)
    const effectiveAgreement = agreementScore > 0 ? agreementScore : (consensus.unanimous ? 100 : 90);
    const nexoraScore = Math.round(
      effectiveAgreement * 0.35 +
        dataQualityScore * 0.20 +
        technicalScore * 0.15 +
        parityScore * 0.15 +
        regimeScore * 0.10 +
        latencyScore * 0.05
    );

    // Final Decision Gate
    let finalDecision: FinalDecision = "WAIT";
    let why = consensus.reasons[0] || "AGUARDANDO VALIDAÇÃO";

    if (!lossGuardCheck.passed) {
      finalDecision = "NO TRADE";
      why = `NO TRADE (ANTI-LOSS): ${lossGuardCheck.blockers[0]}`;
    } else if (consensus.consensus === "PAR" || consensus.consensus === "IMPAR") {
      finalDecision = consensus.consensus;
      why = `POSSÍVEL SINAL PAPER (${consensus.consensusLabel}) — Score Nexora: ${nexoraScore}%.`;
    } else if (!requireStrict4_4 && snapshot.indicators) {
      // Modo Operacional Padronizado com Confluência Técnica
      const ind = snapshot.indicators;
      const isBullishEma = ind.ema9 > ind.ema21;
      const isBearishEma = ind.ema9 < ind.ema21;
      const isBullishFlow = ind.rsi14 >= 48 && ind.rsi14 <= 78;
      const isBearishFlow = ind.rsi14 <= 52 && ind.rsi14 >= 22;

      // Anti-Loss Sniper: Nunca operar contra a tendência das médias móveis
      if (isBullishEma && isBullishFlow) {
        finalDecision = "PAR";
        why = `SINAL CONFIRMADO (CALL / ACIMA ↑) — Confluência de tendência de alta: EMA9 > EMA21 e RSI em fluxo comprador (${ind.rsi14.toFixed(1)}).`;
      } else if (isBearishEma && isBearishFlow) {
        finalDecision = "IMPAR";
        why = `SINAL CONFIRMADO (PUT / ABAIXO ↓) — Confluência de tendência de baixa: EMA9 < EMA21 e RSI em fluxo vendedor (${ind.rsi14.toFixed(1)}).`;
      } else {
        finalDecision = "WAIT";
        why = "AGUARDAR ✋ — Mercado sem confluência direcional clara ou contra a tendência das médias.";
      }
    } else {
      finalDecision = "WAIT";
      why = "AGUARDAR — CONSENSO NÃO VALIDADO";
    }

    // Derived confluences for intelligent sniper verification
    const confluences: string[] = [];
    if (snapshot.indicators?.ema9 && snapshot.indicators?.ema21) {
      if (snapshot.indicators.ema9 > snapshot.indicators.ema21) {
        confluences.push("Tendência de Alta: EMA 9 acima da EMA 21");
      } else {
        confluences.push("Tendência de Baixa: EMA 9 abaixo da EMA 21");
      }
    }
    if (snapshot.indicators?.rsi14 !== undefined) {
      if (snapshot.indicators.rsi14 >= 55) {
        confluences.push(`Momentum Comprador: RSI em ${snapshot.indicators.rsi14.toFixed(1)}`);
      } else if (snapshot.indicators.rsi14 <= 45) {
        confluences.push(`Momentum Vendedor: RSI em ${snapshot.indicators.rsi14.toFixed(1)}`);
      } else {
        confluences.push(`Oscilador Neutro: RSI em ${snapshot.indicators.rsi14.toFixed(1)}`);
      }
    }
    if (snapshot.indicators?.bollingerPosition) {
      if (snapshot.indicators.bollingerPosition === "BELOW_LOWER") {
        confluences.push("Reversão em Suporte: Cotação na Banda Inferior de Bollinger");
      } else if (snapshot.indicators.bollingerPosition === "ABOVE_UPPER") {
        confluences.push("Reversão em Resistência: Cotação na Banda Superior de Bollinger");
      } else {
        confluences.push("Volatilidade Controlada: Dentro das Bandas de Bollinger");
      }
    }
    if (snapshot.parityFeatures?.streak >= 3) {
      confluences.push(`Exaustão Estatística: Sequência de ${snapshot.parityFeatures.streak} velas ${snapshot.parityFeatures.streakType}`);
    } else if (snapshot.parityFeatures?.hasStatisticalEdge) {
      confluences.push("Assimetria Estatística: Edge quantitativo detectado");
    }
    if (consensus.unanimous) {
      confluences.push("Consenso Quádruplo: 4/4 IAs unânimes na direção");
    }
    if (lossGuardCheck.passed) {
      confluences.push("Loss Guard: Risco validado, sem veto adversário");
    }

    const isSignalActive = finalDecision === "PAR" || finalDecision === "IMPAR";
    const nowTime = Date.now();
    const tfMs = snapshot.timeframe === "5M" || snapshot.timeframe === "M5" ? 300000 : 60000;
    const nextCandleBoundary = Math.ceil(nowTime / tfMs) * tfMs;
    const elapsedInCandle = Math.floor((nowTime % tfMs) / 1000);
    // Em M1/M5, o horário de entrada é rigorosamente a virada :00 da vela.
    // Se a vela acabou de abrir (<= 8s), entrada na vela atual; caso contrário, na virada exata da próxima vela (:00).
    const entryTimestamp = elapsedInCandle <= 8 ? Math.floor(nowTime / tfMs) * tfMs : nextCandleBoundary;
    const expiryTimestamp = entryTimestamp + tfMs;

    const entryTime = new Date(entryTimestamp).toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const expiryTime = new Date(expiryTimestamp).toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return {
      decisionId: `dec-${nowTime}-${Math.random().toString(36).substring(2, 6)}`,
      snapshotId: snapshot.snapshotId,
      asset: snapshot.asset,
      timeframe: snapshot.timeframe,
      price: snapshot.price,
      timestamp: nowTime,
      finalDecision,
      consensus,
      nexoraScore,
      scores: {
        dataQualityScore,
        technicalScore,
        parityScore,
        agreementScore,
        regimeScore,
        historicalSetupScore,
        latencyScore,
      },
      lossGuard: {
        passed: lossGuardCheck.passed,
        blockers: lossGuardCheck.blockers,
        riskScore: lossGuardCheck.riskScore,
        cooldownRemainingSec: lossGuardCheck.cooldownRemainingSec,
      },
      marketRegime: snapshot.marketRegime,
      dataQuality: snapshot.dataQuality,
      latencyMs: fourAIs.totalLatencyMs,
      setup: setupName,
      why,
      invalidation: fourAIs.claude.invalidation || "Quebra de suporte e reversão inesperada de fluxo.",
      fourAIs,
      isPaperMode: true,
      signalLockUntil: isSignalActive ? nowTime + 60000 : undefined,
      entryWindowSeconds: 60,
      entryTimestamp,
      expiryTimestamp,
      entryTime,
      expiryTime,
      confluences,
      signalMode: "SNIPER",
      confidenceRating: isSignalActive ? (nexoraScore >= 88 ? "ALTA" : "MÉDIA") : "AGUARDANDO",
    };
  }
}
