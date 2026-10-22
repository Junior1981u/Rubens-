// ==========================================================
// NEXORA VISION AI — TWELVE DATA ROUTES
// Endpoints for /technical_indicators and /time_series audit
// ==========================================================

import { Router } from "express";
import { TwelveDataService } from "../engine/twelveDataService.js";

export const twelveDataRouter = Router();

// GET /api/twelve-data/status — Retorna status real da conexão Twelve Data
twelveDataRouter.get("/twelve-data/status", (_req, res) => {
  const service = TwelveDataService.getInstance();
  const status = service.getStatus();
  res.json({
    success: true,
    twelveData: status,
  });
});

// GET /api/twelve-data/indicators — Consulta endpoint /technical_indicators
twelveDataRouter.get("/twelve-data/indicators", async (_req, res) => {
  try {
    const service = TwelveDataService.getInstance();
    const result = await service.getAvailableTechnicalIndicators();
    res.json({
      success: result.success,
      endpoint: "/technical_indicators",
      count: result.count,
      sample: result.sample,
      status: result.rawStatus,
      error: result.error,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Erro ao consultar indicadores",
    });
  }
});

// POST /api/twelve-data/sync — Força verificação e sync de time_series M1
twelveDataRouter.post("/twelve-data/sync", async (req, res) => {
  try {
    const symbol = (req.body?.symbol as string) || "EUR/USD";
    const interval = (req.body?.interval as string) || "1min";
    const outputsize = Number(req.body?.outputsize) || 30;

    const service = TwelveDataService.getInstance();
    const result = await service.fetchTimeSeries(symbol, interval, outputsize);
    res.json({
      success: result.success,
      status: result.status,
      message: result.message,
      candlesCount: result.candles?.length || 0,
      latencyMs: result.latencyMs,
      testedRealResponse: result.testedRealResponse,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Erro na sincronização Twelve Data",
    });
  }
});

// GET /api/twelve-data/audit — Auditoria rigorosa da integração Twelve Data
twelveDataRouter.get("/twelve-data/audit", (_req, res) => {
  const service = TwelveDataService.getInstance();
  const status = service.getStatus();
  const hasKey = service.getApiKey() !== null;

  res.json({
    success: true,
    audit: {
      endpoints: {
        restTimeSeries: "https://api.twelvedata.com/time_series",
        restIndicators: "https://api.twelvedata.com/technical_indicators",
        webSocket: "wss://ws.twelvedata.com/v1/quotes/price",
      },
      requestedParameters: {
        symbol: status.symbol || "EUR/USD",
        interval: status.interval || "1min",
        outputsize: 30,
        timezone: "UTC",
      },
      apiKeyConfigured: hasKey,
      apiKeyMasked: hasKey ? "****************************" : "NÃO CONFIGURADA",
      connectionState: status.status,
      message: status.message,
      lastCheckTimestamp: status.lastCheckTimestamp,
      lastCandle: {
        timestamp: status.candleOpenTimestamp,
        timestampSP: status.candleOpenTimeSP,
        candlesCount: status.candlesCount,
        closed: true,
      },
      latencyMs: status.latencyMs,
      planAudit: {
        planTier: "Basic/Free Tier",
        rateLimits: "8 requisições/minuto (REST) e 800 créditos/dia",
        webSocketForexAccess: "Requer plano Twelve Data Basic ou Pro para streaming de Forex",
        reconnectionStrategy: "Backoff exponencial gerenciado com heartbeat a cada 30s",
      },
      webSocket: status.webSocket,
      testedRealResponse: status.testedRealResponse,
    },
  });
});
