// ==========================================================
// NEXORA TITAN AI V33 — GLOBAL MARKETS & ASSET DISCOVERY ROUTER
// ==========================================================

import { Router } from "express";
import { GlobalAssetUniverse } from "../engine/globalAssetUniverse.js";
import { BrokerConnectorsManager } from "../engine/brokerConnectors.js";

export const globalMarketsRouter = Router();

// GET /api/global-markets/assets — Search & filter assets
globalMarketsRouter.get("/global-markets/assets", (req, res) => {
  try {
    const universe = GlobalAssetUniverse.getInstance();
    const query = (req.query.q as string) || "";
    const category = (req.query.category as string) || "ALL";
    const availability = (req.query.availability as string) || "ALL";
    const broker = (req.query.broker as string) || "ALL";
    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;

    const result = universe.queryAssets({
      query,
      category,
      availability,
      broker,
      limit,
      offset,
    });

    res.json({
      success: true,
      ...result,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Erro ao consultar mercado global." });
  }
});

// GET /api/global-markets/assets/:symbol — Get single asset metadata
globalMarketsRouter.get("/global-markets/assets/:symbol", (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const universe = GlobalAssetUniverse.getInstance();
    const asset = universe.getAsset(symbol);

    if (!asset) {
      return res.status(404).json({ success: false, error: `Ativo '${symbol}' não encontrado no catálogo global.` });
    }

    res.json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// GET /api/global-markets/brokers — List broker connectors and honest statuses
globalMarketsRouter.get("/global-markets/brokers", (_req, res) => {
  try {
    const brokers = BrokerConnectorsManager.getInstance().getAllConnectors();
    res.json({
      success: true,
      brokers,
      total: brokers.length,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// POST /api/global-markets/sync — Synchronize with Twelve Data
globalMarketsRouter.post("/global-markets/sync", async (_req, res) => {
  try {
    const universe = GlobalAssetUniverse.getInstance();
    const result = await universe.syncWithTwelveData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
