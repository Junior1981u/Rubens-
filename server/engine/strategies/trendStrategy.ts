// ==========================================================
// NEXORA TRADER AI V15 PRO — TREND & MARKET STRUCTURE STRATEGY
// ==========================================================

import { Candle, TechnicalFeatures } from "../../../src/types.js";
import { ModularStrategy, StrategyResult } from "./types.js";

export class TrendStructureStrategy implements ModularStrategy {
  public readonly name = "Estrutura de Mercado & Tendência";

  public evaluate(
    candles: Candle[],
    indicators: TechnicalFeatures,
    lastClosedCandle: Candle,
    formingCandle?: Candle
  ): StrategyResult {
    const evidence: string[] = [];
    const counterEvidence: string[] = [];
    const limitations: string[] = [];

    if (candles.length < 20) {
      return {
        strategyName: this.name,
        direction: "WAIT",
        confidenceWeight: 0,
        evidence: [],
        counterEvidence: ["Amostra insuficiente de candles para cálculo de estrutura."],
        limitations: ["Necessário mínimo de 20 candles para validação."],
        invalidation: "Dados insuficientes.",
        isSidewaysMarket: true,
        marketStructure: "CHOPPY",
      };
    }

    const { ema9, ema21, ema50 } = indicators;
    const price = lastClosedCandle.close;

    // 1. Sideways / Flat EMA detection
    const emaDelta = Math.abs(ema9 - ema21);
    const emaBase = (ema9 + ema21) / 2;
    const isEmaTangled = (emaDelta / emaBase) < 0.00012; // less than 0.012% separation

    if (isEmaTangled) {
      return {
        strategyName: this.name,
        direction: "WAIT",
        confidenceWeight: 0.2,
        evidence: ["Médias móveis em compressão"],
        counterEvidence: ["Mercado em consolidação lateral sem expansão direcional."],
        limitations: ["EMAs não oferecem direção quando o preço oscila em torno da média."],
        invalidation: "Rompimento com candle de força fora da faixa de compressão.",
        isSidewaysMarket: true,
        marketStructure: "RANGING",
      };
    }

    // 2. Highs and Lows Structure
    const recent = candles.slice(-10);
    let higherHighs = 0;
    let lowerLows = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].high > recent[i - 1].high) higherHighs++;
      if (recent[i].low < recent[i - 1].low) lowerLows++;
    }

    const isBullishStructure = ema9 > ema21 && price > ema21 && higherHighs >= 5;
    const isBearishStructure = ema9 < ema21 && price < ema21 && lowerLows >= 5;

    let direction: "PAR" | "IMPAR" | "WAIT" = "WAIT";
    let structure: "BULLISH" | "BEARISH" | "RANGING" | "CHOPPY" = "RANGING";

    if (isBullishStructure) {
      direction = "PAR";
      structure = "BULLISH";
      evidence.push(`EMA9 (${ema9.toFixed(5)}) acima da EMA21 (${ema21.toFixed(5)}) com estrutura de topos ascendentes.`);
      if (ema50 && ema21 > ema50) {
        evidence.push(`Alinhamento triplo favorável com EMA50 (${ema50.toFixed(5)}).`);
      }
    } else if (isBearishStructure) {
      direction = "IMPAR";
      structure = "BEARISH";
      evidence.push(`EMA9 (${ema9.toFixed(5)}) abaixo da EMA21 (${ema21.toFixed(5)}) com estrutura de fundos descendentes.`);
      if (ema50 && ema21 < ema50) {
        evidence.push(`Alinhamento triplo vendedor com EMA50 (${ema50.toFixed(5)}).`);
      }
    } else {
      direction = "WAIT";
      structure = "CHOPPY";
      counterEvidence.push("Conflito entre posição das médias móveis e topos/fundos.");
    }

    // Forming candle check
    if (formingCandle) {
      if (direction === "PAR" && formingCandle.close < formingCandle.open) {
        counterEvidence.push("Vela em formação momentaneamente em correção de baixa.");
      } else if (direction === "IMPAR" && formingCandle.close > formingCandle.open) {
        counterEvidence.push("Vela em formação momentaneamente em correção de alta.");
      }
    }

    limitations.push("Médias móveis são rastreadoras de tendência com defasagem natural.");

    return {
      strategyName: this.name,
      direction,
      confidenceWeight: direction === "WAIT" ? 0.3 : 0.8,
      evidence,
      counterEvidence,
      limitations,
      invalidation: direction === "PAR" ? "Fechamento de candle abaixo da EMA 21." : "Fechamento de candle acima da EMA 21.",
      isSidewaysMarket: false,
      marketStructure: structure,
    };
  }
}
