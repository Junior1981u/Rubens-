// ==========================================================
// NEXORA TITAN AI — OLYMP TRADE DATA CONNECTOR SAFE MODE ROUTER
// Rotas isoladas para auditoria, diagnóstico de conectividade, validação M1 e simulação Paper Mode
// ==========================================================

import { Router } from "express";
import { OlympTradeConnectorManager } from "../engine/olympTradeConnector.js";
import { MarketDataEngine } from "../engine/marketData.js";
import { CandleEngine } from "../engine/candleEngine.js";

export const olympTradeRouter = Router();

// GET /api/olymptrade/diagnostic — Consulta relatório de auditoria e status
olympTradeRouter.get("/diagnostic", (_req, res) => {
  const manager = OlympTradeConnectorManager.getInstance();
  const report = manager.getReport();
  res.json({
    success: true,
    report,
  });
});

// POST /api/olymptrade/test-connection — Executa teste isolado de conectividade
olympTradeRouter.post("/test-connection", async (_req, res) => {
  try {
    const manager = OlympTradeConnectorManager.getInstance();
    const report = await manager.runSafeConnectionTest();
    res.json({
      success: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Erro ao executar teste seguro de conexão.",
    });
  }
});

// POST /api/olymptrade/validate-candle — Valida integridade e coerência de candle M1
olympTradeRouter.post("/validate-candle", (req, res) => {
  try {
    const {
      symbol = "EUR/USD",
      timestamp = Date.now(),
      open = 1.0825,
      high = 1.0827,
      low = 1.0823,
      close = 1.0826,
      periodSeconds = 60,
    } = req.body || {};

    const manager = OlympTradeConnectorManager.getInstance();
    const validation = manager.validateM1Candle(
      {
        symbol,
        timestamp,
        open,
        high,
        low,
        close,
        periodSeconds,
      },
      symbol
    );

    res.json({
      success: true,
      validation,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Erro na validação do candle M1.",
    });
  }
});

// POST /api/olymptrade/detect-gaps — Valida integridade de série temporal
olympTradeRouter.post("/detect-gaps", (req, res) => {
  try {
    const { asset = "EUR/USD", timeframe = "M1" } = req.body || {};
    const candleEngine = CandleEngine.getInstance();
    const candles = candleEngine.getCandles(timeframe, 30, asset);
    const manager = OlympTradeConnectorManager.getInstance();

    const result = manager.detectMissingOrDelayedCandles(candles, 60, 120);

    res.json({
      success: true,
      asset,
      timeframe,
      candlesAudited: candles.length,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Erro ao detectar lacunas na série temporal.",
    });
  }
});

// POST /api/olymptrade/simulate-signal — Registra sinal em Paper Mode
olympTradeRouter.post("/simulate-signal", (req, res) => {
  try {
    const { asset = "EUR/USD", timeframe = "M1", direction = "PAR" } = req.body || {};
    const manager = OlympTradeConnectorManager.getInstance();
    const result = manager.registerSimulatedSignal(asset, timeframe, direction);

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || "Erro ao simular sinal em Paper Mode.",
    });
  }
});
