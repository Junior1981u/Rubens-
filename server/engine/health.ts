// ==========================================================
// NEXORA TRADER AI V11 — HEALTH AGGREGATOR
// Diagnostics for Server, Market Data and 4 Real AI Models
// ==========================================================

import { AIHealthItem } from "../../src/types.js";
import { AIOrchestrator } from "../ai/orchestrator.js";
import { MarketDataEngine } from "./marketData.js";

import { TwelveDataService } from "./twelveDataService.js";

export class HealthEngine {
  private static instance: HealthEngine | null = null;

  public static getInstance(): HealthEngine {
    if (!HealthEngine.instance) {
      HealthEngine.instance = new HealthEngine();
    }
    return HealthEngine.instance;
  }

  public async getAIHealth(): Promise<Record<string, AIHealthItem>> {
    const orchestrator = AIOrchestrator.getInstance();
    const pings = await orchestrator.pingAll(4000);

    return {
      gpt: {
        provider: "OpenAI",
        model: "gpt-4o-mini",
        status: pings.gpt.status as any,
        latencyMs: pings.gpt.latencyMs,
        error: pings.gpt.error,
        testedAt: Date.now(),
        configured: Boolean(process.env.OPENAI_API_KEY),
      },
      claude: {
        provider: "Anthropic",
        model: "claude-3-5-haiku-20241022",
        status: pings.claude.status as any,
        latencyMs: pings.claude.latencyMs,
        error: pings.claude.error,
        testedAt: Date.now(),
        configured: Boolean(process.env.ANTHROPIC_API_KEY),
      },
      gemini: {
        provider: "Google",
        model: "gemini-3.1-flash-lite",
        status: pings.gemini.status as any,
        latencyMs: pings.gemini.latencyMs,
        error: pings.gemini.error,
        testedAt: Date.now(),
        configured: Boolean(process.env.GEMINI_API_KEY),
      },
      grok: {
        provider: "xAI",
        model: "grok-2-latest",
        status: pings.grok.status as any,
        latencyMs: pings.grok.latencyMs,
        error: pings.grok.error,
        testedAt: Date.now(),
        configured: Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
      },
    };
  }

  public getMarketHealth(asset?: string) {
    const market = MarketDataEngine.getInstance().getHealth(asset);
    const twelveData = TwelveDataService.getInstance().getStatus();
    return {
      ...market,
      twelveData,
    };
  }

  public getSystemHealth() {
    return {
      status: "online",
      serverStatus: "online",
      ok: true,
      timestamp: Date.now(),
      version: "NEXORA VISION AI V12",
      server: "ONLINE",
      core: "ONLINE",
      marketData: this.getMarketHealth(),
    };
  }
}
