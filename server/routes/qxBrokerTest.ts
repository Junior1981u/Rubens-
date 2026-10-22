// ==========================================================
// NEXORA TITAN AI — QX BROKER WEBSOCKET DIAGNOSTIC ROUTER
// Rotas isoladas para execução e consulta de telemetria QX Broker
// ==========================================================

import { Router } from "express";
import { QXBrokerTestManager } from "../engine/qxBrokerTest.js";

export const qxBrokerTestRouter = Router();

// GET /api/qxbroker/test — Consulta estado atual do teste
qxBrokerTestRouter.get("/test", (_req, res) => {
  const report = QXBrokerTestManager.getInstance().getReport();
  res.json({
    success: true,
    report,
  });
});

// POST /api/qxbroker/test — Dispara teste isolado seguro
qxBrokerTestRouter.post("/test", async (_req, res) => {
  try {
    const report = await QXBrokerTestManager.getInstance().runTest();
    res.json({
      success: true,
      report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || "Erro ao executar teste isolado QX Broker.",
    });
  }
});
