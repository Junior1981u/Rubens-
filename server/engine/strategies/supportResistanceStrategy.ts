// ==========================================================
// NEXORA TRADER AI V15 PRO — SUPPORT & RESISTANCE SWING STRATEGY
// ==========================================================

import { Candle, TechnicalFeatures } from "../../../src/types.js";
import { ModularStrategy, StrategyResult } from "./types.js";

export class SupportResistanceStrategy implements ModularStrategy {
  public readonly name = "Suportes & Resistências Dinâmicos";

  public evaluate(
    candles: Candle[],
    indicators: TechnicalFeatures,
    lastClosedCandle: Candle,
    formingCandle?: Candle
  ): StrategyResult {
    const evidence: string[] = [];
    const counterEvidence: string[] = [];
    const limitations: string[] = [];

    if (candles.length < 15) {
      return {
        strategyName: this.name,
        direction: "WAIT",
        confidenceWeight: 0,
        evidence: [],
        counterEvidence: ["Histórico de candles insuficiente para calcular zonas de suporte e resistência."],
        limitations: ["Necessário mínimo de 15 candles."],
        invalidation: "Dados insuficientes.",
        isSidewaysMarket: false,
        marketStructure: "CHOPPY",
      };
    }

    limitations.push("Zonas de suporte e resistência são regiões dinâmicas de liquidez, não barreiras infalíveis.");

    const lookback = candles.slice(-20);
    const swingHigh = Math.max(...lookback.map((c) => c.high));
    const swingLow = Math.min(...lookback.map((c) => c.low));
    const currentPrice = lastClosedCandle.close;

    const distToResistance = Math.abs(swingHigh - currentPrice);
    const distToSupport = Math.abs(currentPrice - swingLow);
    const totalRange = swingHigh - swingLow;

    let direction: "PAR" | "IMPAR" | "WAIT" = "WAIT";

    // Proximidade com Suporte (Rebote de Alta)
    if (totalRange > 0.0003 && distToSupport <= totalRange * 0.15) {
      direction = "PAR";
      evidence.push(`Preço testando suporte dinâmico em ${swingLow.toFixed(5)} com margem de segurança.`);
    }
    // Proximidade com Resistência (Rejeição de Baixa)
    else if (totalRange > 0.0003 && distToResistance <= totalRange * 0.15) {
      direction = "IMPAR";
      evidence.push(`Preço testando resistência dinâmica em ${swingHigh.toFixed(5)} com margem de segurança.`);
    } else {
      direction = "WAIT";
      counterEvidence.push(`Cotação em zona intermediária do canal [Suporte: ${swingLow.toFixed(5)} | Resistência: ${swingHigh.toFixed(5)}].`);
    }

    return {
      strategyName: this.name,
      direction,
      confidenceWeight: direction === "WAIT" ? 0.25 : 0.75,
      evidence,
      counterEvidence,
      limitations,
      invalidation: direction === "PAR" ? `Rompimento do suporte em ${swingLow.toFixed(5)}.` : `Rompimento da resistência em ${swingHigh.toFixed(5)}.`,
      isSidewaysMarket: false,
      marketStructure: direction === "PAR" ? "BULLISH" : direction === "IMPAR" ? "BEARISH" : "RANGING",
    };
  }
}
