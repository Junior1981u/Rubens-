// ==========================================================
// NEXORA TRADER AI V11 — FAST CONSENSUS ENGINE (EXPRESS SERVER)
// ==========================================================

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

import { marketRouter } from "./routes/market.js";
import { analyzeRouter } from "./routes/analyze.js";
import { aiHealthRouter } from "./routes/aiHealth.js";
import { signalsRouter } from "./routes/signals.js";
import { paperRouter } from "./routes/paper.js";
import { twelveDataRouter } from "./routes/twelveData.js";
import { youxBrokerRouter } from "./routes/youxBroker.js";
import { globalMarketsRouter } from "./routes/globalMarkets.js";
import { qxBrokerTestRouter } from "./routes/qxBrokerTest.js";
import { olympTradeRouter } from "./routes/olympTrade.js";
import { HealthEngine } from "./engine/health.js";
import { SignalEngine } from "./engine/signalEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// 1. Core Health Route
app.get("/api/health", (_req, res) => {
  const health = HealthEngine.getInstance().getSystemHealth();
  res.json(health);
});

// 2. Mount V11 Core Routers
app.use("/api", aiHealthRouter);
app.use("/api", marketRouter);
app.use("/api", analyzeRouter);
app.use("/api", signalsRouter);
app.use("/api", paperRouter);
app.use("/api", twelveDataRouter);
app.use("/api", youxBrokerRouter);
app.use("/api", globalMarketsRouter);
app.use("/api/qxbroker", qxBrokerTestRouter);
app.use("/api/olymptrade", olympTradeRouter);

// 3. Compatibility routes for smooth continuity
app.get("/api/consensus/status", (_req, res) => {
  const market = HealthEngine.getInstance().getMarketHealth();
  res.json({
    success: true,
    heartbeat: {
      serverOnline: true,
      coreOnline: true,
      autopilotOnline: SignalEngine.getInstance().isScannerActive(),
      feedOnline: market.status === "LIVE" || market.status === "DEMO",
      uptimeSeconds: Math.floor(process.uptime()),
    },
    autopilot: {
      active: SignalEngine.getInstance().isScannerActive(),
      status: SignalEngine.getInstance().isScannerActive() ? "SCANNING" : "STANDBY",
    },
  });
});

app.get("/api/consensus/signals", (req, res) => {
  const limit = Number(req.query.limit) || 20;
  res.json({
    success: true,
    signals: SignalEngine.getInstance().getSignals(limit),
  });
});

app.post("/api/consensus/evaluate", async (req, res, next) => {
  req.url = "/analyze";
  analyzeRouter(req, res, next);
});

// 4. Vite middleware integration for Dev / Production static serve
export async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "../../dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("[Vite Middleware Warning]", e);
    }
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NEXORA V11 FAST CONSENSUS] Server running on port ${PORT}`);
    // Start continuous real-time Auto Scanner on server boot (high-speed 800ms cycles)
    SignalEngine.getInstance().startScanner(800);
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
