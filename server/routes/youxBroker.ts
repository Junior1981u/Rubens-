// ==========================================================
// NEXORA VISION AI V22 — YOUXBROKER ASSET DISCOVERY & VALIDATION ROUTES
// Endpoints for Dynamic Catalog, Real-Time Verification and Connector Audit
// ==========================================================

import { Router } from "express";
import { YouXAssetDiscoveryEngine } from "../engine/youxAssetDiscovery.js";

export const youxBrokerRouter = Router();

// GET /api/youxbroker/status - Retorna status de compliance e configuração do conector
youxBrokerRouter.get("/youxbroker/status", (_req, res) => {
  const engine = YouXAssetDiscoveryEngine.getInstance();
  const status = engine.getConnectorStatus();
  res.json({
    success: true,
    connector: status,
  });
});

// GET /api/youxbroker/assets - Retorna catálogo dinâmico de ativos com filtros
youxBrokerRouter.get("/youxbroker/assets", (req, res) => {
  const engine = YouXAssetDiscoveryEngine.getInstance();
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const availability = typeof req.query.availability === "string" ? req.query.availability : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  const assets = engine.getAssets({ category, availability, search });
  const connector = engine.getConnectorStatus();

  res.json({
    success: true,
    count: assets.length,
    total: connector.totalAssetsCount,
    confirmedCount: connector.confirmedAssetsCount,
    connector,
    assets,
  });
});

// POST /api/youxbroker/sync - Solicita atualização do catálogo com proteção de rate limit
youxBrokerRouter.post("/youxbroker/sync", (req, res) => {
  const engine = YouXAssetDiscoveryEngine.getInstance();
  const force = Boolean(req.body?.force);
  const result = engine.syncCatalog(force);

  if (result.rateLimited) {
    return res.status(429).json({
      success: false,
      rateLimited: true,
      message: `Limite de taxa respeitado: aguarde ${result.cooldownRemainingSec}s para uma nova varredura de catálogo.`,
      cooldownRemainingSec: result.cooldownRemainingSec,
      connector: result.connector,
      assets: result.assets,
    });
  }

  res.json({
    success: true,
    rateLimited: false,
    message: "Catálogo YouXBroker sincronizado e verificado com sucesso.",
    connector: result.connector,
    count: result.assets.length,
    assets: result.assets,
  });
});

// GET /api/youxbroker/asset/:symbol - Retorna detalhes e cotação verificada de um ativo específico
youxBrokerRouter.get("/youxbroker/asset/:symbol", (req, res) => {
  const engine = YouXAssetDiscoveryEngine.getInstance();
  const symbol = req.params.symbol;
  const asset = engine.getAsset(symbol);

  if (!asset) {
    return res.status(404).json({
      success: false,
      error: `Ativo '${symbol}' não encontrado no catálogo da YouXBroker.`,
    });
  }

  res.json({
    success: true,
    asset,
  });
});
