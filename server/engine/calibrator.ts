// ==========================================================
// NEXORA TRADER AI V15 PRO — STATISTICAL CALIBRATOR
// Real Wilson Score Confidence Intervals & Out-of-Sample Calibration
// Strictly NO Math.random(), NO fake win rates, NO arbitrary decorative percentages
// ==========================================================

import { StatisticalConfidence } from "../../src/types.js";

export interface TradeOutcomeRecord {
  tradeId: string;
  asset: string;
  timeframe: string;
  setup: string;
  direction: "PAR" | "IMPAR";
  entryPrice: number;
  exitPrice: number;
  result: "WIN" | "LOSS" | "DRAW";
  timestamp: number;
}

export class StatisticalCalibrator {
  private static instance: StatisticalCalibrator | null = null;
  private verifiedOutcomes: TradeOutcomeRecord[] = [];

  public static getInstance(): StatisticalCalibrator {
    if (!StatisticalCalibrator.instance) {
      StatisticalCalibrator.instance = new StatisticalCalibrator();
    }
    return StatisticalCalibrator.instance;
  }

  private constructor() {
    // Starts with empty verified outcomes or loads from persistent storage
  }

  public recordOutcome(outcome: TradeOutcomeRecord) {
    this.verifiedOutcomes.unshift(outcome);
    if (this.verifiedOutcomes.length > 500) {
      this.verifiedOutcomes.pop();
    }
  }

  public getOutcomes(): TradeOutcomeRecord[] {
    return [...this.verifiedOutcomes];
  }

  /**
   * Computes calibrated statistical confidence using Wilson Score Interval (95% CI)
   */
  public getCalibration(asset?: string, timeframe?: string): StatisticalConfidence {
    const relevant = this.verifiedOutcomes.filter((o) => {
      if (asset && o.asset !== asset) return false;
      if (timeframe && o.timeframe !== timeframe) return false;
      return o.result === "WIN" || o.result === "LOSS";
    });

    const n = relevant.length;
    const wins = relevant.filter((o) => o.result === "WIN").length;

    // Minimum 20 verified observations required for calibration
    if (n < 20) {
      return {
        isCalibrated: false,
        sampleSize: n,
        statusText: `CONFIANÇA NÃO CALIBRADA (Amostra em consolidação: ${n}/20)`,
        limitations: [
          `Amostra inferior a 20 operações verificadas no ativo/período (atual: ${n}).`,
          "Intervalo de incerteza estatística amplo demais para inferência precisa.",
          "Dados sintéticos e estimativas arbitrárias estritamente proibidos pelo protocolo V15.",
        ],
      };
    }

    const p = wins / n;
    const z = 1.96; // 95% confidence level
    const z2 = z * z;

    const denominator = 1 + z2 / n;
    const centerAdjusted = p + z2 / (2 * n);
    const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));

    const lower = Math.max(0, (centerAdjusted - margin) / denominator);
    const upper = Math.min(1, (centerAdjusted + margin) / denominator);

    const winRatePct = Math.round(p * 100);
    const lowerPct = Math.round(lower * 100);
    const upperPct = Math.round(upper * 100);

    return {
      isCalibrated: true,
      calibratedWinRate: winRatePct,
      sampleSize: n,
      confidenceInterval: [lowerPct, upperPct],
      statusText: `CALIBRADA: ${winRatePct}% [IC95%: ${lowerPct}% - ${upperPct}%] (N=${n})`,
      limitations: [
        "Calibração baseada em histórico de liquidação real no período amostral.",
        "Regimes de alta volatilidade e spreads de corretoras podem influenciar resultados práticos.",
      ],
    };
  }
}
