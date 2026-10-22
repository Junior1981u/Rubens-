// ==========================================================
// NEXORA TRADER AI V11 — SIGNALS ROUTES
// ==========================================================

import { Router } from "express";
import { SignalEngine } from "../engine/signalEngine.js";

export const signalsRouter = Router();

// GET /api/signals
signalsRouter.get("/signals", (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const signals = SignalEngine.getInstance().getSignals(limit);
  res.json({
    success: true,
    signals,
    scannerActive: SignalEngine.getInstance().isScannerActive(),
  });
});
