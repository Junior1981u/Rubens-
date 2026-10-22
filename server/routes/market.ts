// ==========================================================
// NEXORA TRADER AI V11 — MARKET ROUTES
// ==========================================================

import { Router } from "express";
import { MarketDataEngine } from "../engine/marketData.js";
import { CandleEngine } from "../engine/candleEngine.js";
import { FeatureEngine } from "../engine/featureEngine.js";
import { ParityEngine } from "../engine/parityEngine.js";
import { SnapshotEngine } from "../engine/snapshot.js";
import { HealthEngine } from "../engine/health.js";

export const marketRouter = Router();

// GET /api/market-health
marketRouter.get("/market-health", (req, res) => {
  const asset = (req.query.asset as string) || undefined;
  const health = HealthEngine.getInstance().getMarketHealth(asset);
  res.json({ success: true, ...health });
});

// GET /api/candles
marketRouter.get("/candles", (req, res) => {
  const asset = (req.query.asset as string) || "EUR/USD";
  const timeframe = (req.query.timeframe as string) || "1M";
  const limit = Number(req.query.limit) || 50;
  const candles = CandleEngine.getInstance().getCandles(timeframe, limit, asset);
  res.json({ success: true, asset, timeframe, candles });
});

// GET /api/latest-snapshot
marketRouter.get("/latest-snapshot", (req, res) => {
  const asset = (req.query.asset as string) || "EUR/USD";
  const timeframe = (req.query.timeframe as string) || "1M";

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
    feedLatencyMs: lastTick?.latencyMs || 20,
    isClosedCandle: Boolean(lastClosedCandle?.closed),
  });

  res.json({ success: true, snapshot });
});

// POST /api/market/tick
marketRouter.post("/market/tick", (req, res) => {
  const { asset = "EUR/USD", price, spread = 0.0001, source = "FEED" } = req.body;
  if (typeof price !== "number") {
    return res.status(400).json({ success: false, error: "Preço inválido." });
  }

  const result = MarketDataEngine.getInstance().recordTick(asset, price, spread, source);
  if (!result.valid) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({ success: true, tick: result.tick });
});

// GET /api/stream/market (Server-Sent Events for instant zero-lag real-time price streaming)
marketRouter.get("/stream/market", (req, res) => {
  const requestedAsset = (req.query.asset as string) || "EUR/USD";
  const timeframe = (req.query.timeframe as string) || "1M";

  // Configuração SSE compatível com navegadores, proxies e iframes
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  const marketEngine = MarketDataEngine.getInstance();
  const candleEngine = CandleEngine.getInstance();

  // 1. Enviar estado inicial imediatamente para conexão instantânea
  const initialTick = marketEngine.getLastTick(requestedAsset);
  const initialCandle = candleEngine.getLastClosedCandle(timeframe, requestedAsset) || candleEngine.getCurrentCandle(timeframe, requestedAsset);
  const health = HealthEngine.getInstance().getMarketHealth();

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      asset: requestedAsset,
      timeframe,
      status: "STREAMING_ACTIVE",
      health,
      tick: initialTick,
      candle: initialCandle,
      timestamp: Date.now(),
    })}\n\n`
  );

  // 2. Listener persistente de ticks filtrado pelo ativo inscrito
  const tickHandler = (tick: any) => {
    if (!tick || (tick.asset !== requestedAsset && requestedAsset !== "ALL")) return;
    try {
      res.write(`event: tick\ndata: ${JSON.stringify(tick)}\n\n`);
    } catch {
      // Stream fechado pelo cliente
      cleanup();
    }
  };

  marketEngine.onTick(tickHandler);

  // 3. Heartbeat periódico a cada 12 segundos para manter viva a conexão
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      cleanup();
    }
  }, 12000);

  const cleanup = () => {
    clearInterval(heartbeatTimer);
    marketEngine.removeTickListener(tickHandler);
  };

  req.on("close", cleanup);
  req.on("end", cleanup);
});
