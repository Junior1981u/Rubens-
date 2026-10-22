// ==========================================================
// NEXORA TRADER AI V15 PRO — MOMENTUM & OSCILLATOR STRATEGY
// ==========================================================

import { Candle, TechnicalFeatures } from "../../../src/types.js";
import { ModularStrategy, StrategyResult } from "./types.js";

export class MomentumOscillatorStrategy implements ModularStrategy {
  public readonly name = "Momentum & Osciladores (RSI + MACD)";

  public evaluate(
    candles: Candle[],
    indicators: TechnicalFeatures,
    lastClosedCandle: Candle,
    formingCandle?: Candle
  ): StrategyResult {
    const evidence: string[] = [];
    const counterEvidence: string[] = [];
    const limitations: string[] = [];

    const { rsi14, macd } = indicators;
    const hist = macd.histogram;

    // Disciplinary rule: RSI and MACD are correlated indicators
    limitations.push("RSI e MACD compartilham a mesma base matemática de momentum; avaliados conjuntamente e não somados como confirmações independentes.");

    let direction: "PAR" | "IMPAR" | "WAIT" = "WAIT";

    // 1. Reversão por Exaustão Extrema
    if (rsi14 >= 70 && hist < 0) {
      direction = "IMPAR";
      evidence.push(`RSI em sobrecompra (${rsi14.toFixed(1)}) acompanhado de perda de força no histograma MACD.`);
    } else if (rsi14 <= 30 && hist > 0) {
      direction = "PAR";
      evidence.push(`RSI em sobrevenda (${rsi14.toFixed(1)}) com inflexão compradora no histograma MACD.`);
    }
    // 2. Fluxo e Continuação Direcional
    else if (rsi14 >= 53 && rsi14 <= 66 && hist > 0) {
      direction = "PAR";
      evidence.push(`Fluxo comprador saudável com RSI (${rsi14.toFixed(1)}) em expansão e MACD positivo.`);
    } else if (rsi14 <= 47 && rsi14 >= 34 && hist < 0) {
      direction = "IMPAR";
      evidence.push(`Fluxo vendedor saudável com RSI (${rsi14.toFixed(1)}) em retração e MACD negativo.`);
    } else {
      direction = "WAIT";
      counterEvidence.push(`Zona neutra de osciladores (RSI em ${rsi14.toFixed(1)} e histograma MACD próximo a zero).`);
    }

    return {
      strategyName: this.name,
      direction,
      confidenceWeight: direction === "WAIT" ? 0.3 : 0.75,
      evidence,
      counterEvidence,
      limitations,
      invalidation: direction === "PAR" ? "Histograma MACD cruzar para o terreno negativo." : "Histograma MACD cruzar para o terreno positivo.",
      isSidewaysMarket: rsi14 >= 47 && rsi14 <= 53 && Math.abs(hist) < 0.00005,
      marketStructure: direction === "PAR" ? "BULLISH" : direction === "IMPAR" ? "BEARISH" : "RANGING",
    };
  }
}
