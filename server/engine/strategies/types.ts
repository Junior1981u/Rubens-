// ==========================================================
// NEXORA TRADER AI V15 PRO — MODULAR STRATEGY TYPES
// ==========================================================

import { Candle, TechnicalFeatures } from "../../../src/types.js";

export interface StrategyResult {
  strategyName: string;
  direction: "PAR" | "IMPAR" | "WAIT";
  confidenceWeight: number; // 0.0 to 1.0
  evidence: string[];
  counterEvidence: string[];
  limitations: string[];
  invalidation: string;
  isSidewaysMarket: boolean;
  marketStructure: "BULLISH" | "BEARISH" | "RANGING" | "CHOPPY";
}

export interface ModularStrategy {
  name: string;
  evaluate(
    candles: Candle[],
    indicators: TechnicalFeatures,
    lastClosedCandle: Candle,
    formingCandle?: Candle
  ): StrategyResult;
}
