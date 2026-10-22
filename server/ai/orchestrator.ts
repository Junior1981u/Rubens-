// ==========================================================
// NEXORA TRADER AI V11 — AI ORCHESTRATOR
// Parallel Execution via Promise.allSettled with 4000ms Timeout & Snapshot Cache
// ==========================================================

import { MarketSnapshot, FourAIResults, AIResponse } from "./types.js";
import { OpenAIAdapter } from "./openai.js";
import { AnthropicAdapter } from "./anthropic.js";
import { GeminiAdapter } from "./gemini.js";
import { GrokAdapter } from "./grok.js";

export class AIOrchestrator {
  private static instance: AIOrchestrator | null = null;

  private gpt = new OpenAIAdapter();
  private claude = new AnthropicAdapter();
  private gemini = new GeminiAdapter();
  private grok = new GrokAdapter();

  // Snapshot analysis cache to avoid analyzing same snapshotId twice
  private analyzedSnapshots = new Map<string, { result: FourAIResults; expiresAt: number }>();
  // Deduplicação de requisições concorrentes idênticas (In-Flight Promise Sharing)
  private inFlightAnalyses = new Map<string, Promise<FourAIResults>>();

  public static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator();
    }
    return AIOrchestrator.instance;
  }

  public async analyzeWithFourAIs(snapshot: MarketSnapshot, timeoutMs = 250): Promise<FourAIResults> {
    const now = Date.now();

    // Rejeitar snapshot expirado (> 60s)
    if (now - snapshot.timestamp > 60000) {
      throw new Error("SINAL EXPIRADO — AGUARDAR NOVA VELA");
    }

    // Não analisar o mesmo snapshotId duas vezes
    const existing = this.analyzedSnapshots.get(snapshot.snapshotId);
    if (existing) {
      return existing.result;
    }

    // Se já houver uma análise em andamento para este snapshot, compartilha a mesma Promise
    const inFlight = this.inFlightAnalyses.get(snapshot.snapshotId);
    if (inFlight) {
      return inFlight;
    }

    const analysisPromise = this.executeParallelFourAIs(snapshot, timeoutMs);
    this.inFlightAnalyses.set(snapshot.snapshotId, analysisPromise);

    try {
      const result = await analysisPromise;
      return result;
    } finally {
      this.inFlightAnalyses.delete(snapshot.snapshotId);
    }
  }

  private async executeParallelFourAIs(snapshot: MarketSnapshot, timeoutMs: number): Promise<FourAIResults> {
    const now = Date.now();
    const t0 = Date.now();

    // STRICT RULE: All 4 models run in parallel with Promise.allSettled
    const [gptSettled, claudeSettled, geminiSettled, grokSettled] = await Promise.allSettled([
      this.gpt.analyze(snapshot, timeoutMs),
      this.claude.analyze(snapshot, timeoutMs),
      this.gemini.analyze(snapshot, timeoutMs),
      this.grok.analyze(snapshot, timeoutMs),
    ]);

    const resolveResponse = (settled: PromiseSettledResult<AIResponse>, provider: string, agent: any, model: string): AIResponse => {
      if (settled.status === "fulfilled") {
        const val = settled.value;
        // Rejeitar respostas de snapshots diferentes
        if (!val || val.snapshotId !== snapshot.snapshotId) {
          return {
            provider: provider as any,
            agent,
            model,
            status: "MODEL ERROR",
            snapshotId: snapshot.snapshotId,
            direction: "WAIT",
            confidence: 0,
            evidence: ["SnapshotId incompatível rejeitado"],
            counterEvidence: ["Invalidação de correlação"],
            invalidation: "ID divergente",
            latencyMs: Date.now() - t0,
            timestamp: Date.now(),
          };
        }
        return val;
      }
      return {
        provider: provider as any,
        agent,
        model,
        status: "MODEL ERROR",
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        evidence: [`Falha na execução: ${settled.reason?.message || settled.reason}`],
        counterEvidence: ["Exceção no adaptador"],
        invalidation: "Exceção não tratada",
        latencyMs: Date.now() - t0,
        timestamp: Date.now(),
      };
    };

    const gptRes = resolveResponse(gptSettled, "OpenAI", "GPT", this.gpt.model);
    const claudeRes = resolveResponse(claudeSettled, "Anthropic", "CLAUDE", this.claude.model);
    const geminiRes = resolveResponse(geminiSettled, "Google", "GEMINI", this.gemini.model);
    const grokRes = resolveResponse(grokSettled, "xAI", "GROK", this.grok.model);

    const totalLatencyMs = Date.now() - t0;
    const allSuccess =
      gptRes.status === "SUCCESS" &&
      claudeRes.status === "SUCCESS" &&
      geminiRes.status === "SUCCESS" &&
      grokRes.status === "SUCCESS";

    const quorumCount = [gptRes, claudeRes, geminiRes, grokRes].filter((r) => r.status === "SUCCESS").length;

    const fourResults: FourAIResults = {
      gpt: gptRes,
      claude: claudeRes,
      gemini: geminiRes,
      grok: grokRes,
      totalLatencyMs,
      allSuccess,
      quorumCount,
    };

    // Store in analyzed snapshots map (TTL: 60s matching M1 candle lifetime)
    this.analyzedSnapshots.set(snapshot.snapshotId, {
      result: fourResults,
      expiresAt: now + 60000,
    });

    // Clean expired cache items
    if (this.analyzedSnapshots.size > 100) {
      for (const [k, v] of this.analyzedSnapshots.entries()) {
        if (v.expiresAt <= now) this.analyzedSnapshots.delete(k);
      }
    }

    return fourResults;
  }

  public async pingAll(timeoutMs = 4000) {
    const [gpt, claude, gemini, grok] = await Promise.allSettled([
      this.gpt.ping(timeoutMs),
      this.claude.ping(timeoutMs),
      this.gemini.ping(timeoutMs),
      this.grok.ping(timeoutMs),
    ]);

    return {
      gpt: gpt.status === "fulfilled" ? gpt.value : { status: "OFFLINE", latencyMs: 0, error: String(gpt.reason) },
      claude: claude.status === "fulfilled" ? claude.value : { status: "OFFLINE", latencyMs: 0, error: String(claude.reason) },
      gemini: gemini.status === "fulfilled" ? gemini.value : { status: "OFFLINE", latencyMs: 0, error: String(gemini.reason) },
      grok: grok.status === "fulfilled" ? grok.value : { status: "OFFLINE", latencyMs: 0, error: String(grok.reason) },
    };
  }
}
