// ==========================================================
// NEXORA TRADER AI V15 PRO — MODULAR STRATEGY RUNNER
// Enforces Multi-Confirmation Discipline, Non-Additive Correlations & Selective Filters
// ==========================================================

import { Candle, TechnicalFeatures, StrategySummaryItem } from "../../../src/types.js";
import { TrendStructureStrategy } from "./trendStrategy.js";
import { MomentumOscillatorStrategy } from "./momentumStrategy.js";
import { VolatilityBreakoutStrategy } from "./volatilityStrategy.js";
import { SupportResistanceStrategy } from "./supportResistanceStrategy.js";
import { ModularStrategy, StrategyResult } from "./types.js";

export interface StrategySuiteOutcome {
  direction: "PAR" | "IMPAR" | "WAIT";
  confidenceScore: number; // 0 - 100
  agreementCount: number; // How many agreed
  isSidewaysMarket: boolean;
  divergenceDetected: boolean;
  reasons: string[];
  invalidation: string;
  strategyDetails: StrategySummaryItem[];
}

export class ModularStrategyRunner {
  private static instance: ModularStrategyRunner | null = null;
  private strategies: ModularStrategy[] = [];

  public static getInstance(): ModularStrategyRunner {
    if (!ModularStrategyRunner.instance) {
      ModularStrategyRunner.instance = new ModularStrategyRunner();
    }
    return ModularStrategyRunner.instance;
  }

  private constructor() {
    this.strategies = [
      new TrendStructureStrategy(),
      new MomentumOscillatorStrategy(),
      new VolatilityBreakoutStrategy(),
      new SupportResistanceStrategy(),
    ];
  }

  public runAll(
    candles: Candle[],
    indicators: TechnicalFeatures,
    lastClosedCandle: Candle,
    formingCandle?: Candle
  ): StrategySuiteOutcome {
    const results: StrategyResult[] = [];
    const strategyDetails: StrategySummaryItem[] = [];

    for (const strat of this.strategies) {
      const res = strat.evaluate(candles, indicators, lastClosedCandle, formingCandle);
      results.push(res);
      strategyDetails.push({
        name: res.strategyName,
        direction: res.direction,
        evidence: res.evidence,
        counterEvidence: res.counterEvidence,
        limitations: res.limitations,
        invalidation: res.invalidation,
      });
    }

    const parVotes = results.filter((r) => r.direction === "PAR");
    const imparVotes = results.filter((r) => r.direction === "IMPAR");
    const sidewaysVotes = results.filter((r) => r.isSidewaysMarket);

    const isSidewaysMarket = sidewaysVotes.length >= 2 || results[0].isSidewaysMarket;
    const divergenceDetected = parVotes.length > 0 && imparVotes.length > 0;

    const reasons: string[] = [];

    // Selective Rule 1: Sideways market protection
    if (isSidewaysMarket) {
      reasons.push("Mercado em consolidação lateral/squeeze sem tendência definida. Aguardar expansão.");
      return {
        direction: "WAIT",
        confidenceScore: 35,
        agreementCount: 0,
        isSidewaysMarket: true,
        divergenceDetected: false,
        reasons,
        invalidation: "Expansão de bandas e rompimento com candle de força.",
        strategyDetails,
      };
    }

    // Selective Rule 2: Conflicting strategies veto
    if (divergenceDetected) {
      reasons.push(`Divergência entre estratégias (${parVotes.length} COMPRA vs ${imparVotes.length} VENDA). Entrada bloqueada por segurança.`);
      return {
        direction: "WAIT",
        confidenceScore: 40,
        agreementCount: 0,
        isSidewaysMarket: false,
        divergenceDetected: true,
        reasons,
        invalidation: "Alinhamento direcional unânime das estratégias.",
        strategyDetails,
      };
    }

    // Selective Rule 3: Minimum 2 non-correlated confirmations required
    if (parVotes.length >= 2) {
      reasons.push(`Confluência técnica de alta validada por ${parVotes.length} estratégias modulares independentes.`);
      const allEv = parVotes.flatMap((v) => v.evidence);
      return {
        direction: "PAR",
        confidenceScore: 82,
        agreementCount: parVotes.length,
        isSidewaysMarket: false,
        divergenceDetected: false,
        reasons: [reasons[0], ...allEv],
        invalidation: parVotes[0].invalidation,
        strategyDetails,
      };
    }

    if (imparVotes.length >= 2) {
      reasons.push(`Confluência técnica de baixa validada por ${imparVotes.length} estratégias modulares independentes.`);
      const allEv = imparVotes.flatMap((v) => v.evidence);
      return {
        direction: "IMPAR",
        confidenceScore: 82,
        agreementCount: imparVotes.length,
        isSidewaysMarket: false,
        divergenceDetected: false,
        reasons: [reasons[0], ...allEv],
        invalidation: imparVotes[0].invalidation,
        strategyDetails,
      };
    }

    // Default: Insufficient confluences
    reasons.push("Condições técnicas insuficientes para confluência mínima (menos de 2 confirmações alinhadas).");
    return {
      direction: "WAIT",
      confidenceScore: 50,
      agreementCount: Math.max(parVotes.length, imparVotes.length),
      isSidewaysMarket: false,
      divergenceDetected: false,
      reasons,
      invalidation: "Aguardar formação de setup com confluência clara.",
      strategyDetails,
    };
  }
}
