// ==========================================================
// NEXORA TRADER AI V11 — LEARNING ENGINE & DRIFT DETECTOR
// Post-Outcome Calibration, Adaptive Weights & Statistical Drift Detector
// ==========================================================

import {
  LearningRecord,
  ModelWeightStats,
  AIAgentName,
  FinalDecision,
  MarketRegimeType,
} from "../../src/types.js";
import { LossGuard } from "./lossGuard.js";

const MIN_SAMPLES_FOR_WEIGHT_ADJUSTMENT = 10;

export class LearningEngine {
  private static instance: LearningEngine | null = null;

  private records: LearningRecord[] = [];
  private weights: Record<AIAgentName, ModelWeightStats> = {
    GPT: { agent: "GPT", weight: 0.25, totalSamples: 0, wins: 0, losses: 0, winRate: 50, status: "HEALTHY", recentWinRate: 50 },
    CLAUDE: { agent: "CLAUDE", weight: 0.25, totalSamples: 0, wins: 0, losses: 0, winRate: 50, status: "HEALTHY", recentWinRate: 50 },
    GEMINI: { agent: "GEMINI", weight: 0.25, totalSamples: 0, wins: 0, losses: 0, winRate: 50, status: "HEALTHY", recentWinRate: 50 },
    GROK: { agent: "GROK", weight: 0.25, totalSamples: 0, wins: 0, losses: 0, winRate: 50, status: "HEALTHY", recentWinRate: 50 },
  };

  private driftDetected = false;
  private driftReason = "Distribuição estável";

  public static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance = new LearningEngine();
    }
    return LearningEngine.instance;
  }

  // STRICT RULE: Only called AFTER trade outcome is finalized
  public recordCompletedTrade(params: {
    asset: string;
    timeframe: string;
    setup: string;
    regime: MarketRegimeType;
    parityBias: number;
    fourAIConsensus: string;
    scores: Record<string, number>;
    decision: FinalDecision;
    result: "WIN" | "LOSS" | "DRAW" | "INVALID";
    aiDecisions: {
      gpt: any;
      claude: any;
      gemini: any;
      grok: any;
    };
  }): LearningRecord {
    const record: LearningRecord = {
      id: `lrn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      asset: params.asset,
      timeframe: params.timeframe,
      setup: params.setup,
      regime: params.regime,
      parityBias: params.parityBias,
      fourAIConsensus: params.fourAIConsensus,
      scores: params.scores,
      decision: params.decision,
      result: params.result,
      aiDecisions: params.aiDecisions,
    };

    this.records.unshift(record);
    if (this.records.length > 500) this.records.pop();

    // Inform LossGuard
    if (params.result === "WIN") {
      LossGuard.getInstance().recordOutcome(true);
    } else if (params.result === "LOSS") {
      LossGuard.getInstance().recordOutcome(false);
    }

    // Update agent individual scores
    this.updateAgentStats("GPT", params.aiDecisions.gpt, params.decision, params.result);
    this.updateAgentStats("CLAUDE", params.aiDecisions.claude, params.decision, params.result);
    this.updateAgentStats("GEMINI", params.aiDecisions.gemini, params.decision, params.result);
    this.updateAgentStats("GROK", params.aiDecisions.grok, params.decision, params.result);

    // Run drift check
    this.evaluateDrift();

    return record;
  }

  private updateAgentStats(
    agent: AIAgentName,
    aiDirection: string,
    finalDecision: string,
    result: "WIN" | "LOSS" | "DRAW" | "INVALID"
  ) {
    if (result === "DRAW" || result === "INVALID") return;

    const stats = this.weights[agent];
    stats.totalSamples++;

    const isWin = result === "WIN";
    // Check if this AI supported the winning decision
    const supportedCorrect = isWin ? aiDirection === finalDecision : aiDirection !== finalDecision;

    if (supportedCorrect) {
      stats.wins++;
    } else {
      stats.losses++;
    }

    stats.winRate = Math.round((stats.wins / stats.totalSamples) * 100);

    // Compute recent win rate over last 10 records where this agent had an input
    const recentRecords = this.records.slice(0, 15).filter((r) => r.result === "WIN" || r.result === "LOSS");
    if (recentRecords.length >= 5) {
      const recentCorrect = recentRecords.filter((r) => {
        const d = r.aiDecisions[agent.toLowerCase() as "gpt" | "claude" | "gemini" | "grok"];
        return r.result === "WIN" ? d === r.decision : d !== r.decision;
      }).length;
      stats.recentWinRate = Math.round((recentCorrect / recentRecords.length) * 100);
    } else {
      stats.recentWinRate = stats.winRate;
    }

    // Adapt weight only after sufficient samples
    if (stats.totalSamples >= MIN_SAMPLES_FOR_WEIGHT_ADJUSTMENT) {
      if (stats.recentWinRate < 45) {
        stats.status = "OBSERVATION";
        stats.weight = 0.15;
      } else if (stats.recentWinRate < 55) {
        stats.status = "DEGRADED";
        stats.weight = 0.20;
      } else {
        stats.status = "HEALTHY";
        stats.weight = 0.25;
      }
    }
  }

  private evaluateDrift() {
    const recent = this.records.slice(0, 10).filter((r) => r.result === "WIN" || r.result === "LOSS");
    if (recent.length < 6) {
      this.driftDetected = false;
      this.driftReason = "Amostra inicial em formação";
      return;
    }

    const losses = recent.filter((r) => r.result === "LOSS").length;
    const lossRate = losses / recent.length;

    if (lossRate >= 0.6) {
      this.driftDetected = true;
      this.driftReason = `Aumento súbito de perdas (${Math.round(lossRate * 100)}% nas últimas ${recent.length} operações).`;
    } else {
      this.driftDetected = false;
      this.driftReason = "Parâmetros normais de assertividade";
    }
  }

  public getStats() {
    const total = this.records.length;
    const wins = this.records.filter((r) => r.result === "WIN").length;
    const losses = this.records.filter((r) => r.result === "LOSS").length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return {
      totalRecords: total,
      wins,
      losses,
      winRate,
      weights: this.weights,
      drift: {
        detected: this.driftDetected,
        reason: this.driftReason,
      },
      recentHistory: this.records.slice(0, 30),
    };
  }
}
