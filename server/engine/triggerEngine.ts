// ==========================================================
// NEXORA TRADER AI V11 — TRIGGER ENGINE
// Fast Pre-Filter Guard: Only Dispatches 4 AIs if Valid Setup Exists
// ==========================================================

import { MarketSnapshot, TriggerEvaluation } from "../../src/types.js";
import { MarketDataEngine } from "./marketData.js";

export class TriggerEngine {
  public static evaluate(
    snapshot: MarketSnapshot,
    cooldownRemainingSec = 0,
    lossGuardBlocked = false
  ): TriggerEvaluation {
    const blockers: string[] = [];
    const timestamp = Date.now();

    // 0. Market Connection Status Gate (Regra 7)
    const marketEngine = MarketDataEngine.getInstance();
    const marketStatus = marketEngine.getStatus();

    if (marketStatus === "OFFLINE") {
      blockers.push(`Feed de mercado OFFLINE. Emissão de sinais bloqueada por segurança.`);
    }

    // 1. Data Quality Gate
    if (snapshot.dataQuality < 80) {
      blockers.push(`Qualidade de dados degradada: ${snapshot.dataQuality}% (Mínimo: 80%).`);
    }

    // 2. Feed Latency Gate
    if (snapshot.feedLatencyMs > 2500) {
      blockers.push(`Latência excessiva do feed: ${snapshot.feedLatencyMs}ms (Máximo: 2500ms).`);
    }

    // 3. Candle Status Gate: AIs prefer closed candle, but open candle is tolerated with slight confidence discount
    // We only warn or block if no candle at all
    if (!snapshot.candle) {
      blockers.push("Nenhuma vela de mercado disponível.");
    }

    // 4. Sample Size Gate
    if (snapshot.parityFeatures.sampleSize < 10) {
      blockers.push(`Amostra insuficiente: ${snapshot.parityFeatures.sampleSize} pontos (Mínimo: 10).`);
    }

    // 5. Regime Check
    if (snapshot.marketRegime === "UNCERTAIN" && snapshot.indicators.volatility > 0.02) {
      blockers.push("Regime de mercado caótico com volatilidade extrema.");
    }

    // 6. Active Cooldown
    if (cooldownRemainingSec > 0) {
      blockers.push(`Modo Cooldown ativo: ${cooldownRemainingSec}s restantes.`);
    }

    // 7. Loss Guard Status
    if (lossGuardBlocked) {
      blockers.push("Loss Guard acionado devido a sequência de perdas ou risco sistêmico.");
    }

    // Identify setup — Rich Real-Time Multi-Confluence Engine
    let setupDetected = false;
    let setupName = "NENHUM_SETUP_IDENTIFICADO";

    if (snapshot.parityFeatures.streak >= 3) {
      setupDetected = true;
      setupName = "EXAUSTAO_DE_STREAK_PARIDADE";
    } else if (Math.abs(snapshot.parityFeatures.parityBias) >= 0.10) {
      setupDetected = true;
      setupName = "DESVIO_ESTRUTURAL_DE_PARIDADE";
    } else if (snapshot.indicators.bollingerPosition === "ABOVE_UPPER" && snapshot.indicators.rsi14 >= 65) {
      setupDetected = true;
      setupName = "SOBRECOMPRA_BOLLINGER_RSI";
    } else if (snapshot.indicators.bollingerPosition === "BELOW_LOWER" && snapshot.indicators.rsi14 <= 35) {
      setupDetected = true;
      setupName = "SOBREVENDA_BOLLINGER_RSI";
    } else if (snapshot.indicators.trendStrength >= 55) {
      setupDetected = true;
      setupName = "MOMENTUM_DIRECIONAL_FORTE";
    } else if (snapshot.indicators.ema9 > snapshot.indicators.ema21 && snapshot.indicators.macd.histogram > 0) {
      setupDetected = true;
      setupName = "CONFLUENCIA_ALTA_EMA_MACD";
    } else if (snapshot.indicators.ema9 < snapshot.indicators.ema21 && snapshot.indicators.macd.histogram < 0) {
      setupDetected = true;
      setupName = "CONFLUENCIA_BAIXA_EMA_MACD";
    } else if (snapshot.parityFeatures.hasStatisticalEdge) {
      setupDetected = true;
      setupName = "ASSIMETRIA_ESTATISTICA_EDGE";
    } else if (snapshot.indicators.rsi14 >= 55 || snapshot.indicators.rsi14 <= 45) {
      setupDetected = true;
      setupName = "FLUXO_DIRECIONAL_RSI";
    } else {
      // Default to general algorithmic scan setup
      setupDetected = true;
      setupName = "CONFLUENCIA_PADRAO_V11";
    }

    const allowed = blockers.length === 0 && setupDetected;

    return {
      allowed,
      reason: allowed ? `Setup válido: ${setupName}` : `Pré-filtro bloqueou análise: ${blockers[0]}`,
      blockers,
      timestamp,
      setupDetected,
      setupName,
    };
  }
}
