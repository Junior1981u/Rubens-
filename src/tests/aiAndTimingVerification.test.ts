// ==========================================================
// NEXORA VISION AI — AI & TIMING VERIFICATION TEST SUITE
// Valida:
// 1. Resiliência das 4 IAs (GPT, Claude, Gemini, Grok) gerando status SUCCESS/ONLINE
// 2. Horário do Sinal com entrada formatada no padrão HH:mm:ss
// 3. Horário de Expiração calculado com base no timeframe (M1 / M5)
// 4. Decisão executável sem bloqueio arbitrário de 'WAIT'
// ==========================================================

import { CandleEngine } from "../../server/engine/candleEngine.js";
import { MarketDataEngine } from "../../server/engine/marketData.js";
import { FeatureEngine } from "../../server/engine/featureEngine.js";
import { ParityEngine } from "../../server/engine/parityEngine.js";
import { SnapshotEngine } from "../../server/engine/snapshot.js";
import { AIOrchestrator } from "../../server/ai/orchestrator.js";
import { ConsensusEngine } from "../../server/engine/consensusEngine.js";

export class AIAndTimingVerificationTestSuite {
  public static async runAllTests() {
    const results: { testNumber: number; name: string; passed: boolean; reason?: string }[] = [];

    // Teste 1: As 4 IAs completam análise com status SUCCESS
    try {
      const asset = "EUR/USD";
      const timeframe = "1M";
      const candleEngine = CandleEngine.getInstance();
      const candles = candleEngine.getCandles(timeframe, 50, asset);
      const lastClosed = candleEngine.getLastClosedCandle(timeframe, asset) || candleEngine.getCurrentCandle(timeframe, asset);
      const lastTick = MarketDataEngine.getInstance().getLastTick(asset);
      const currentPrice = lastTick?.price ?? (lastClosed ? lastClosed.close : 1.11200);

      const indicators = FeatureEngine.calculate(candles);
      // Garante RSI em zona saudável (62.0) para validar emissão de sinal direcional ativo
      indicators.rsi14 = 62.0;
      const parityFeatures = ParityEngine.calculate(candles, "TRENDING");

      const snapshot = SnapshotEngine.create({
        asset,
        timeframe,
        price: currentPrice,
        bid: lastTick?.bid,
        ask: lastTick?.ask,
        candle: lastClosed!,
        previousCandles: candles.slice(0, -1),
        indicators,
        parityFeatures,
        marketRegime: "TRENDING",
        dataQuality: 98,
        feedLatencyMs: 15,
        isClosedCandle: true,
      });

      const orchestrator = AIOrchestrator.getInstance();
      const fourAIs = await orchestrator.analyzeWithFourAIs(snapshot, 2500);

      const allSuccess =
        fourAIs.gpt.status === "SUCCESS" &&
        fourAIs.claude.status === "SUCCESS" &&
        fourAIs.gemini.status === "SUCCESS" &&
        fourAIs.grok.status === "SUCCESS";

      results.push({
        testNumber: 1,
        name: "4 IAs ativas com status SUCCESS e quórum completo",
        passed: allSuccess,
        reason: `Status: GPT(${fourAIs.gpt.status}), CLAUDE(${fourAIs.claude.status}), GEMINI(${fourAIs.gemini.status}), GROK(${fourAIs.grok.status})`,
      });

      // Teste 2: Confiança mínima de cada IA >= 70%
      const confOk =
        fourAIs.gpt.confidence >= 70 &&
        fourAIs.claude.confidence >= 70 &&
        fourAIs.gemini.confidence >= 70 &&
        fourAIs.grok.confidence >= 70;

      results.push({
        testNumber: 2,
        name: "Confiança das 4 IAs consistente (>= 70%)",
        passed: confOk,
        reason: `Confiança: GPT=${fourAIs.gpt.confidence}%, CLAUDE=${fourAIs.claude.confidence}%, GEMINI=${fourAIs.gemini.confidence}%, GROK=${fourAIs.grok.confidence}%`,
      });

      // Teste 3: Horário de entrada do sinal formatado no padrão HH:mm:ss
      const decision = ConsensusEngine.buildNexoraCoreDecision(snapshot, fourAIs, "PADRAO", false);
      const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
      const entryTimeValid = Boolean(decision.entryTime && timeRegex.test(decision.entryTime));
      const expiryTimeValid = Boolean(decision.expiryTime && timeRegex.test(decision.expiryTime));

      results.push({
        testNumber: 3,
        name: "Horário de Entrada e Expiração gerados no formato HH:mm:ss",
        passed: entryTimeValid && expiryTimeValid,
        reason: `Entrada: ${decision.entryTime} | Expiração: ${decision.expiryTime}`,
      });

      // Teste 4: Emissão de sinal ativo (PAR ou IMPAR) quando há confluência
      const hasActiveSignal = decision.finalDecision === "PAR" || decision.finalDecision === "IMPAR";
      results.push({
        testNumber: 4,
        name: "Decisão direcional executável emitida (PAR/IMPAR) com Score validado",
        passed: hasActiveSignal,
        reason: `Decisão: ${decision.finalDecision} | Nexora Score: ${decision.nexoraScore}% | Motivo: ${decision.why}`,
      });
    } catch (err: any) {
      results.push({
        testNumber: 0,
        name: "Falha na execução dos testes de IA e Horários",
        passed: false,
        reason: err?.message,
      });
    }

    const passed = results.filter((r) => r.passed).length;
    return { total: results.length, passed, failed: results.length - passed, results };
  }
}
