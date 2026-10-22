// ==========================================================
// NEXORA TRADER AI V11 — PAPER TRADING ROUTES
// Enforces Strict Simulated Execution (Zero Broker API Connection)
// ==========================================================

import { Router } from "express";
import { SignalEngine } from "../engine/signalEngine.js";
import { LearningEngine } from "../engine/learningEngine.js";
import { LossGuard } from "../engine/lossGuard.js";
import { MarketDataEngine } from "../engine/marketData.js";

export const paperRouter = Router();

let paperAccount = {
  balance: 10000.0,
  initialBalance: 10000.0,
  currency: "USD",
  mode: "PAPER_TRADING",
};

// GET /api/paper
paperRouter.get("/paper", (_req, res) => {
  const signalEngine = SignalEngine.getInstance();
  const trades = signalEngine.getPaperTrades(50);
  const activeOrders = trades.filter((t) => t.status === "OPEN");
  const settledOrders = trades.filter((t) => t.status === "SETTLED");

  const wins = settledOrders.filter((t) => t.result === "WIN").length;
  const losses = settledOrders.filter((t) => t.result === "LOSS").length;
  const winRate = settledOrders.length > 0 ? Math.round((wins / settledOrders.length) * 1000) / 10 : 0;
  const totalProfit = settledOrders.reduce((acc, t) => acc + (t.profit || 0), 0);

  res.json({
    success: true,
    account: {
      ...paperAccount,
      balance: Number((paperAccount.initialBalance + totalProfit).toFixed(2)),
      totalTrades: settledOrders.length,
      wins,
      losses,
      winRate,
      totalProfit: Number(totalProfit.toFixed(2)),
    },
    activeOrders,
    orderHistory: settledOrders,
    learning: LearningEngine.getInstance().getStats(),
    lossGuard: LossGuard.getInstance().getStatus(),
  });
});

// POST /api/paper - Execute simulated Paper Trade
paperRouter.post("/paper", (req, res) => {
  try {
    const { asset = "EUR/USD", timeframe = "1M", direction = "PAR", stake = 50, durationSec = 60 } = req.body;
    const signalEngine = SignalEngine.getInstance();
    const marketEngine = MarketDataEngine.getInstance();
    const lastTick = marketEngine.getLastTick(asset);
    const entryPrice = lastTick?.price ?? 1.08250;
    
    const simulatedSignal = {
      id: `sig-manual-${Date.now()}`,
      snapshotId: `${asset.replace("/", "")}-${timeframe}-manual-${Date.now()}`,
      timestamp: Date.now(),
      asset,
      timeframe,
      platform: "QUOTEX" as const,
      direction: direction as "PAR" | "IMPAR",
      price: entryPrice,
      nexoraScore: 92,
      consensusScore: "4/4",
      status: "ACTIVE" as const,
      reason: "Ordem simulada aberta manualmente pelo usuário no Paper Mode.",
    };

    const simulatedDecision = {
      decisionId: `dec-manual-${Date.now()}`,
      snapshotId: simulatedSignal.snapshotId,
      asset,
      timeframe,
      price: entryPrice,
      timestamp: Date.now(),
      finalDecision: direction as "PAR" | "IMPAR",
      consensus: {
        consensus: direction as "PAR" | "IMPAR",
        agreementCount: 4,
        unanimous: true,
        directions: { gpt: direction, claude: direction, gemini: direction, grok: direction },
        reasons: ["Ordem manual em modo Paper"],
        snapshotId: simulatedSignal.snapshotId,
      },
      nexoraScore: 92,
      scores: {
        dataQualityScore: 98,
        technicalScore: 90,
        parityScore: 85,
        agreementScore: 100,
        regimeScore: 90,
        historicalSetupScore: 88,
        latencyScore: 95,
      },
      lossGuard: { passed: true, blockers: [], riskScore: 15, cooldownRemainingSec: 0 },
      marketRegime: "TRENDING" as const,
      dataQuality: 98,
      latencyMs: 12,
      setup: "PAPER_MANUAL",
      why: "Execução simulada manual",
      invalidation: "Vencimento de tempo",
      fourAIs: {} as any,
      isPaperMode: true,
    };

    signalEngine.openPaperTrade(simulatedSignal, simulatedDecision, Number(stake) || 50, Number(durationSec) || 60);

    res.json({
      success: true,
      message: "Operação simulada aberta com sucesso no Paper Mode.",
      trade: simulatedSignal,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Erro ao abrir paper trade." });
  }
});

// GET /api/history - Full history of trades and signals
paperRouter.get("/history", (_req, res) => {
  const signalEngine = SignalEngine.getInstance();
  const trades = signalEngine.getPaperTrades(100);
  const signals = signalEngine.getSignals(100);

  res.json({
    success: true,
    trades,
    signals,
    learning: LearningEngine.getInstance().getStats(),
  });
});

// GET /api/learning - Learning Engine & Loss Analyzer data
paperRouter.get("/learning", (_req, res) => {
  const learningStats = LearningEngine.getInstance().getStats();
  const lossGuardStatus = LossGuard.getInstance().getStatus();
  res.json({
    success: true,
    learning: learningStats,
    lossGuard: lossGuardStatus,
  });
});

// POST /api/paper/reset
paperRouter.post("/paper/reset", (_req, res) => {
  paperAccount.balance = paperAccount.initialBalance;
  LossGuard.getInstance().resetCooldown();
  res.json({ success: true, message: "Conta paper reiniciada para $10,000.00." });
});

// POST /api/loss-guard/reset
paperRouter.post("/loss-guard/reset", (_req, res) => {
  LossGuard.getInstance().resetCooldown();
  res.json({ success: true, message: "Loss Guard resetado com sucesso." });
});
