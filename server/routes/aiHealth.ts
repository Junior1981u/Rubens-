// ==========================================================
// NEXORA TRADER AI V11 — AI HEALTH ROUTES
// Real Connectivity Diagnostics for GPT, Claude, Gemini, Grok
// ==========================================================

import { Router } from "express";
import { HealthEngine } from "../engine/health.js";
import { OpenAIAdapter } from "../ai/openai.js";
import { AnthropicAdapter } from "../ai/anthropic.js";
import { GeminiAdapter } from "../ai/gemini.js";
import { GrokAdapter } from "../ai/grok.js";

export const aiHealthRouter = Router();

// GET /api/ai-health
aiHealthRouter.get("/ai-health", async (_req, res) => {
  try {
    const health = await HealthEngine.getInstance().getAIHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Erro ao consultar saúde das IAs." });
  }
});

// POST /api/ai-health/test
aiHealthRouter.post("/ai-health/test", async (_req, res) => {
  try {
    const health = await HealthEngine.getInstance().getAIHealth();
    res.json({ success: true, summary: health, details: health });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Erro no teste das 4 IAs." });
  }
});

// POST /api/ai-health/test/:agent
aiHealthRouter.post("/ai-health/test/:agent", async (req, res) => {
  const agent = req.params.agent.toLowerCase();
  let result;

  try {
    if (agent === "gpt") result = await new OpenAIAdapter().ping();
    else if (agent === "claude") result = await new AnthropicAdapter().ping();
    else if (agent === "gemini") result = await new GeminiAdapter().ping();
    else if (agent === "grok") result = await new GrokAdapter().ping();
    else return res.status(400).json({ success: false, error: "Agente desconhecido." });

    res.json({ success: true, agent, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Falha no teste." });
  }
});
