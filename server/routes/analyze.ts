// ==========================================================
// NEXORA TRADER AI V11 — ANALYZE & SCANNER ROUTES
// ==========================================================

import { Router } from "express";
import { CandleEngine } from "../engine/candleEngine.js";
import { FeatureEngine } from "../engine/featureEngine.js";
import { ParityEngine } from "../engine/parityEngine.js";
import { TriggerEngine } from "../engine/triggerEngine.js";
import { SnapshotEngine } from "../engine/snapshot.js";
import { AIOrchestrator } from "../ai/orchestrator.js";
import { ConsensusEngine } from "../engine/consensusEngine.js";
import { SignalEngine } from "../engine/signalEngine.js";
import { MarketDataEngine } from "../engine/marketData.js";
import { SuperAlgorithmEngine } from "../engine/superAlgorithm.js";
import { MarketSnapshot } from "../../src/types.js";

export const analyzeRouter = Router();

// In-flight analysis deduplication cache
const inFlightAnalyses = new Map<string, Promise<any>>();

// POST /api/analyze
analyzeRouter.post("/analyze", async (req, res) => {
  const t0 = performance.now();
  const asset = (req.body?.asset as string) || "EUR/USD";
  const timeframe = (req.body?.timeframe as string) || "1M";
  const requireStrict4_4 = Boolean(req.body?.requireStrictConsensus);
  const lockKey = `${asset}:${timeframe}:${requireStrict4_4}`;

  // Se já houver análise em andamento para o mesmo ativo há menos de 500ms, reutiliza
  if (inFlightAnalyses.has(lockKey)) {
    try {
      const cachedResult = await inFlightAnalyses.get(lockKey);
      return res.json(cachedResult);
    } catch {}
  }

  const analysisPromise = (async () => {
    let snapshot: MarketSnapshot;
    const tDataStart = performance.now();

    const candleEngine = CandleEngine.getInstance();
    const candles = candleEngine.getCandles(timeframe, 50, asset);
    const lastClosedCandle = candleEngine.getLastClosedCandle(timeframe, asset) || candleEngine.getCurrentCandle(timeframe, asset);

    const marketEngine = MarketDataEngine.getInstance();
    const lastTick = marketEngine.getLastTick(asset);
    const currentPrice = lastTick?.price ?? (lastClosedCandle ? lastClosedCandle.close : 1.08250);
    const tDataMs = Math.round(performance.now() - tDataStart);

    const tCalcStart = performance.now();
    const indicators = FeatureEngine.calculate(candles);
    const parityFeatures = ParityEngine.calculate(candles, "TRENDING");

    const candleAgeSec = lastClosedCandle ? Math.floor((Date.now() - lastClosedCandle.timestamp) / 1000) : 0;
    const candleState = lastClosedCandle?.closed ? "FECHADA" : "EM FORMAÇÃO";

    if (req.body?.snapshot) {
      snapshot = req.body.snapshot;
    } else {
      snapshot = SnapshotEngine.create({
        asset,
        timeframe,
        price: currentPrice,
        bid: lastTick?.bid,
        ask: lastTick?.ask,
        candle: lastClosedCandle || { open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice, volume: 1, timestamp: Date.now(), closed: true },
        previousCandles: candles.slice(0, -1),
        indicators,
        parityFeatures,
        marketRegime: "TRENDING",
        dataQuality: marketEngine.getStatus() === "OFFLINE" ? 0 : 98,
        feedLatencyMs: lastTick?.latencyMs || 20,
        isClosedCandle: Boolean(lastClosedCandle?.closed),
      });
    }

    // 1. Fast Trigger Pre-Filter (< 1ms)
    const trigger = TriggerEngine.evaluate(snapshot);
    const tCalcMs = Math.round(performance.now() - tCalcStart);

    if (!trigger.allowed) {
      const totalMs = Math.round(performance.now() - t0);
      return {
        success: true,
        triggered: false,
        reason: trigger.reason,
        blockers: trigger.blockers,
        benchmarks: {
          dataReceiptMs: tDataMs,
          calculationMs: tCalcMs,
          aiLatencyMs: 0,
          totalDurationMs: totalMs,
          dataAgeSec: candleAgeSec,
          candleState,
          source: lastTick?.source || marketEngine.getStatus(),
          connectionStatus: marketEngine.getStatus(),
        },
        snapshot,
        result: {
          decisionId: `dec-wait-${Date.now()}`,
          snapshotId: snapshot.snapshotId,
          timestamp: Date.now(),
          finalDecision: "WAIT",
          consensus: {
            consensus: "WAIT",
            agreementCount: 0,
            unanimous: false,
            directions: { gpt: "WAIT", claude: "WAIT", gemini: "WAIT", grok: "WAIT" },
            reasons: [trigger.reason],
            snapshotId: snapshot.snapshotId,
          },
          nexoraScore: 50,
          scores: {
            dataQualityScore: snapshot.dataQuality,
            technicalScore: 50,
            parityScore: 50,
            agreementScore: 0,
            regimeScore: 50,
            historicalSetupScore: 50,
            latencyScore: 90,
          },
          lossGuard: { passed: false, blockers: trigger.blockers, riskScore: 80, cooldownRemainingSec: 0 },
          marketRegime: snapshot.marketRegime,
          dataQuality: snapshot.dataQuality,
          latencyMs: totalMs,
          benchmarks: {
            dataReceiptMs: tDataMs,
            calculationMs: tCalcMs,
            aiLatencyMs: 0,
            totalDurationMs: totalMs,
            dataAgeSec: candleAgeSec,
            candleState,
            source: lastTick?.source || marketEngine.getStatus(),
            connectionStatus: marketEngine.getStatus(),
          },
          setup: trigger.setupName,
          why: trigger.reason,
          invalidation: "Pré-filtro não autorizou chamada das 4 IAs.",
          fourAIs: {
            gpt: { provider: "OpenAI", agent: "GPT", model: "gpt-4o-mini", status: "OFFLINE", snapshotId: snapshot.snapshotId, direction: "WAIT", confidence: 0, evidence: ["Filtro prévio bloqueou envio."], counterEvidence: [], invalidation: "", latencyMs: 0, timestamp: Date.now() },
            claude: { provider: "Anthropic", agent: "CLAUDE", model: "claude-3-5-haiku-20241022", status: "OFFLINE", snapshotId: snapshot.snapshotId, direction: "WAIT", confidence: 0, evidence: ["Filtro prévio bloqueou envio."], counterEvidence: [], invalidation: "", latencyMs: 0, timestamp: Date.now() },
            gemini: { provider: "Google", agent: "GEMINI", model: "gemini-3.1-flash-lite", status: "OFFLINE", snapshotId: snapshot.snapshotId, direction: "WAIT", confidence: 0, evidence: ["Filtro prévio bloqueou envio."], counterEvidence: [], invalidation: "", latencyMs: 0, timestamp: Date.now() },
            grok: { provider: "xAI", agent: "GROK", model: "grok-2-latest", status: "OFFLINE", snapshotId: snapshot.snapshotId, direction: "WAIT", confidence: 0, evidence: ["Filtro prévio bloqueou envio."], counterEvidence: [], invalidation: "", latencyMs: 0, timestamp: Date.now() },
            totalLatencyMs: 0,
            allSuccess: false,
            quorumCount: 0,
          },
          isPaperMode: true,
        },
      };
    }

    // 2. Parallel 4 AIs Execution (Max 1200ms para evitar espera desnecessária)
    const tAiStart = performance.now();
    const orchestrator = AIOrchestrator.getInstance();
    const fourAIs = await orchestrator.analyzeWithFourAIs(snapshot, 1200);
    const tAiMs = Math.round(performance.now() - tAiStart);

    // 3. Super Algoritmo Quantum Titan V34 (Microsecond Quantitative Confluence Engine)
    const superAlgorithmResult = SuperAlgorithmEngine.getInstance().evaluate(snapshot, candles);

    // 4. NEXORA CORE consensus & loss guard verification
    const result = ConsensusEngine.buildNexoraCoreDecision(snapshot, fourAIs, trigger.setupName, requireStrict4_4);

    // Se o consenso principal ficou em WAIT mas o Super Algoritmo encontrou confluência exata (> 75%) no modo não-estrito:
    if (result.finalDecision === "WAIT" && !requireStrict4_4 && superAlgorithmResult.exactSignalDetected) {
      result.finalDecision = superAlgorithmResult.finalDecision;
      result.why = superAlgorithmResult.reason;
      result.nexoraScore = Math.max(result.nexoraScore, superAlgorithmResult.quantumScore);
      result.setup = superAlgorithmResult.setupName;
    }

    const totalMs = Math.round(performance.now() - t0);
    result.latencyMs = totalMs;
    (result as any).superAlgorithm = superAlgorithmResult;
    (result as any).benchmarks = {
      dataReceiptMs: tDataMs,
      calculationMs: tCalcMs,
      aiLatencyMs: tAiMs,
      superAlgorithmSpeedMs: superAlgorithmResult.executionSpeedMs,
      totalDurationMs: totalMs,
      dataAgeSec: candleAgeSec,
      candleState,
      source: lastTick?.source || marketEngine.getStatus(),
      connectionStatus: marketEngine.getStatus(),
    };

    // Se sinal de compra ou venda válido, registra no feed de sinais Paper
    if (result.finalDecision === "PAR" || result.finalDecision === "IMPAR") {
      SignalEngine.getInstance().registerSignalFromDecision(result);
    }

    return {
      success: true,
      triggered: true,
      superAlgorithm: superAlgorithmResult,
      benchmarks: {
        dataReceiptMs: tDataMs,
        calculationMs: tCalcMs,
        aiLatencyMs: tAiMs,
        superAlgorithmSpeedMs: superAlgorithmResult.executionSpeedMs,
        totalDurationMs: totalMs,
        dataAgeSec: candleAgeSec,
        candleState,
        source: lastTick?.source || marketEngine.getStatus(),
        connectionStatus: marketEngine.getStatus(),
      },
      snapshot,
      result,
    };
  })();

  inFlightAnalyses.set(lockKey, analysisPromise);
  setTimeout(() => inFlightAnalyses.delete(lockKey), 500);

  try {
    const finalPayload = await analysisPromise;
    res.json(finalPayload);
  } catch (error: any) {
    console.error("[POST /api/analyze]", error);
    res.status(500).json({ success: false, error: error?.message || "Erro na análise." });
  }
});

// POST /api/scanner/scan-now — Instantaneous parallel multi-pair sweep
analyzeRouter.post("/scanner/scan-now", async (req, res) => {
  try {
    const timeframe = req.body?.timeframe || "1M";
    const requireStrict = Boolean(req.body?.requireStrictConsensus);
    const newSignals = await SignalEngine.getInstance().scanAllAssets(timeframe, requireStrict);
    const allSignals = SignalEngine.getInstance().getSignals(30);

    res.json({
      success: true,
      count: newSignals.length,
      newSignals,
      signals: allSignals,
    });
  } catch (error: any) {
    console.error("[POST /api/scanner/scan-now]", error);
    res.status(500).json({ success: false, error: error?.message || "Erro no scan instantâneo." });
  }
});

// POST /api/scanner/start
analyzeRouter.post("/scanner/start", (req, res) => {
  const interval = Number(req.body?.intervalMs) || 800;
  SignalEngine.getInstance().startScanner(interval);
  res.json({ success: true, scannerActive: true, intervalMs: interval });
});

// POST /api/scanner/stop
analyzeRouter.post("/scanner/stop", (_req, res) => {
  SignalEngine.getInstance().stopScanner();
  res.json({ success: true, scannerActive: false });
});

// POST /api/super-algorithm/evaluate — Sub-5ms Instant Quantum Evaluation
analyzeRouter.post("/super-algorithm/evaluate", (req, res) => {
  const t0 = performance.now();
  const asset = (req.body?.asset as string) || "EUR/USD";
  const timeframe = (req.body?.timeframe as string) || "1M";

  const candleEngine = CandleEngine.getInstance();
  const candles = candleEngine.getCandles(timeframe, 50, asset);
  const lastClosedCandle = candleEngine.getLastClosedCandle(timeframe, asset) || candleEngine.getCurrentCandle(timeframe, asset);

  const marketEngine = MarketDataEngine.getInstance();
  const lastTick = marketEngine.getLastTick(asset);
  const currentPrice = lastTick?.price ?? (lastClosedCandle ? lastClosedCandle.close : 1.08250);

  const indicators = FeatureEngine.calculate(candles);
  const parityFeatures = ParityEngine.calculate(candles, "TRENDING");

  const snapshot = SnapshotEngine.create({
    asset,
    timeframe,
    price: currentPrice,
    bid: lastTick?.bid,
    ask: lastTick?.ask,
    candle: lastClosedCandle || { open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice, volume: 1, timestamp: Date.now(), closed: true },
    previousCandles: candles.slice(0, -1),
    indicators,
    parityFeatures,
    marketRegime: "TRENDING",
    dataQuality: marketEngine.getStatus() === "OFFLINE" ? 0 : 98,
    feedLatencyMs: lastTick?.latencyMs || 15,
    isClosedCandle: Boolean(lastClosedCandle?.closed),
  });

  const superResult = SuperAlgorithmEngine.getInstance().evaluate(snapshot, candles);
  const totalMs = Number((performance.now() - t0).toFixed(2));

  res.json({
    success: true,
    superAlgorithm: superResult,
    snapshot,
    latencyMs: totalMs,
  });
});
