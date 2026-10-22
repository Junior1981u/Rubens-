// ==========================================================
// NEXORA TRADER AI V15 PRO — VOLATILITY & BREAKOUT STRATEGY
// ==========================================================

import { Candle, TechnicalFeatures } from "../../../src/types.js";
import { ModularStrategy, StrategyResult } from "./types.js";

export class VolatilityBreakoutStrategy implements ModularStrategy {
  public readonly name = "Volatilidade, Bandas & Falsos Rompimentos";

  public evaluate(
    candles: Candle[],
    indicators: TechnicalFeatures,
    lastClosedCandle: Candle,
    formingCandle?: Candle
  ): StrategyResult {
    const evidence: string[] = [];
    const counterEvidence: string[] = [];
    const limitations: string[] = [];

    const { bollingerBands, atr, candleBody, upperWick, lowerWick, range } = indicators;
    const { percentB, bandwidth, upper, lower } = bollingerBands;

    limitations.push("Volatilidade mede dispersão de preços, não probabilidade direcional absoluta.");

    // 1. Squeeze Detection (Compressão Extrema)
    if (bandwidth < 0.0012) {
      return {
        strategyName: this.name,
        direction: "WAIT",
        confidenceWeight: 0.2,
        evidence: ["Compressão de Bandas de Bollinger detectada (Squeeze)."],
        counterEvidence: ["Mercado em acumulação de baixa volatilidade; aguardar expansão antes de operar."],
        limitations,
        invalidation: "Expansão da largura de bandas (Bandwidth > 0.0020).",
        isSidewaysMarket: true,
        marketStructure: "RANGING",
      };
    }

    let direction: "PAR" | "IMPAR" | "WAIT" = "WAIT";

    // 2. Falso Rompimento com Rejeição por Pavio (Fakeout Trap)
    const upperWickRatio = upperWick / range;
    const lowerWickRatio = lowerWick / range;

    if (lastClosedCandle.high > upper && lastClosedCandle.close < upper && upperWickRatio > 0.40) {
      direction = "IMPAR";
      evidence.push(`Falso rompimento de alta identificado: rejeição na banda superior com pavio vendedor de ${(upperWickRatio * 100).toFixed(0)}%.`);
    } else if (lastClosedCandle.low < lower && lastClosedCandle.close > lower && lowerWickRatio > 0.40) {
      direction = "PAR";
      evidence.push(`Falso rompimento de baixa identificado: rejeição na banda inferior com pavio comprador de ${(lowerWickRatio * 100).toFixed(0)}%.`);
    }
    // 3. Rompimento Legítimo com Corpo Cheio (Expansão de Volatilidade)
    else if (percentB >= 0.95 && candleBody / range > 0.65) {
      direction = "PAR";
      evidence.push(`Expansão direcional compradora com candle de força fechando no topo das bandas (%B = ${percentB.toFixed(2)}).`);
    } else if (percentB <= 0.05 && candleBody / range > 0.65) {
      direction = "IMPAR";
      evidence.push(`Expansão direcional vendedora com candle de força fechando no fundo das bandas (%B = ${percentB.toFixed(2)}).`);
    } else {
      direction = "WAIT";
      counterEvidence.push(`Preço contido dentro do canal normal de Bollinger (%B = ${percentB.toFixed(2)}).`);
    }

    return {
      strategyName: this.name,
      direction,
      confidenceWeight: direction === "WAIT" ? 0.3 : 0.8,
      evidence,
      counterEvidence,
      limitations,
      invalidation: direction === "PAR" ? "Retorno do preço para a média central de Bollinger." : "Retorno do preço para a média central de Bollinger.",
      isSidewaysMarket: false,
      marketStructure: direction === "PAR" ? "BULLISH" : direction === "IMPAR" ? "BEARISH" : "RANGING",
    };
  }
}
