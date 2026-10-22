// ==========================================================
// NEXORA TRADER AI — 4 REAL INDEPENDENT AI ADAPTERS
// 1. GPT Adapter (OpenAI)
// 2. CLAUDE Adapter (Anthropic)
// 3. GEMINI Adapter (Google)
// 4. GROK Adapter (xAI)
//
// STRICT RULES:
// - Never simulate an AI response.
// - Real API calls only.
// - Server-side only (no API keys exposed to frontend).
// - Each adapter receives the EXACT same market snapshot.
// - Returns: { provider, model, snapshotId, direction, confidence, reasons, counterReasons, invalidation, latencyMs, timestamp, status }
// ==========================================================

import { GoogleGenAI } from "@google/genai";
import { ConsensusMarketSnapshot, AIStructuredResponse, NormalizedDirection } from "../../src/types/nexora4AIConsensus.js";

function classifyError(errMsg: string, statusCode?: number | string): string {
  const text = (errMsg || "").toLowerCase();
  const code = String(statusCode || "");

  if (text.includes("api key") || text.includes("api_key") || text.includes("unauthorized") || text.includes("invalid x-api-key") || code === "401" || code === "403") {
    return "AUTH ERROR";
  }
  if (text.includes("quota") || text.includes("rate limit") || text.includes("429") || text.includes("insufficient_quota") || code === "429") {
    return "QUOTA ERROR";
  }
  if (text.includes("timeout") || text.includes("timed out") || text.includes("abort") || code === "ETIMEDOUT") {
    return "TIMEOUT";
  }
  if (text.includes("model") || text.includes("not found") || text.includes("deprecated") || code === "404") {
    return "MODEL ERROR";
  }
  return "OFFLINE";
}

function buildAnalysisPrompt(snapshot: ConsensusMarketSnapshot, agentRole: string): string {
  return `You are ${agentRole} for NEXORA TRADER AI.
Analyze the following market snapshot strictly for Binary Options Parity prediction (PAR = Call / Even parity / Upward candle, IMPAR = Put / Odd parity / Downward candle, or WAIT = no edge/uncertainty).

MARKET SNAPSHOT:
- SnapshotId: ${snapshot.snapshotId}
- Platform: ${snapshot.platform}
- Asset: ${snapshot.asset}
- Timeframe: ${snapshot.timeframe}
- Timestamp: ${new Date(snapshot.timestamp).toISOString()}
- Price: ${snapshot.price}
- Bid: ${snapshot.bid}
- Ask: ${snapshot.ask}
- Last Candle OHLC: ${JSON.stringify(snapshot.candle || (snapshot.candles && snapshot.candles[snapshot.candles.length - 1]) || "N/A")}
- Indicators: ${JSON.stringify(snapshot.indicators || snapshot.features || {})}
- Data Quality: ${snapshot.dataQuality}%

Analyze the snapshot and respond ONLY with a valid JSON object matching this schema:
{
  "direction": "PAR" | "IMPAR" | "WAIT",
  "confidence": number between 0 and 100,
  "reasons": ["primary technical or risk reasons"],
  "counterReasons": ["potential counter arguments or risks"],
  "invalidation": "condition that invalidates this signal"
}`;
}

function parseAIResponse(rawText: string, fallbackSnapshotId: string): {
  direction: NormalizedDirection;
  confidence: number;
  reasons: string[];
  counterReasons: string[];
  invalidation: string;
} {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        direction: "WAIT",
        confidence: 0,
        reasons: ["Falha ao interpretar JSON retornado pelo modelo."],
        counterReasons: ["Formato inválido"],
        invalidation: "JSON malformado",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    let direction: NormalizedDirection = "WAIT";
    const dirUpper = String(parsed.direction || "").trim().toUpperCase();
    if (dirUpper === "PAR") direction = "PAR";
    else if (dirUpper === "IMPAR" || dirUpper === "ÍMPAR") direction = "IMPAR";
    else direction = "WAIT";

    const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || (direction === "WAIT" ? 0 : 70)));
    const reasons = Array.isArray(parsed.reasons) && parsed.reasons.length > 0 ? parsed.reasons : [String(parsed.reasons || "Análise concluída.")];
    const counterReasons = Array.isArray(parsed.counterReasons) ? parsed.counterReasons : [String(parsed.counterReasons || "Sem evidência contrária.")];
    const invalidation = String(parsed.invalidation || "Quebra de volatilidade ou reversão de candle.");

    return { direction, confidence, reasons, counterReasons, invalidation };
  } catch (e: any) {
    return {
      direction: "WAIT",
      confidence: 0,
      reasons: [`Erro de parsing: ${e?.message || e}`],
      counterReasons: ["Resposta inválida"],
      invalidation: "Parsing error",
    };
  }
}

// =============================================================================
// 1. GEMINI ADAPTER (Google)
// =============================================================================
export class GeminiAdapter {
  static readonly provider = "Google";
  static readonly model = "gemini-3.1-flash-lite";

  static async analyze(snapshot: ConsensusMarketSnapshot): Promise<AIStructuredResponse> {
    const t0 = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return {
        agent: "GEMINI",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: ["GEMINI_API_KEY ausente nas variáveis de ambiente do servidor."],
        counterReasons: ["Provedor não configurado."],
        invalidation: "Falta de credenciais.",
        latencyMs: 0,
        timestamp: Date.now(),
        status: "API KEY AUSENTE",
        role: "Technical Analyst",
      };
    }

    try {
      const ai = new GoogleGenAI();
      const prompt = buildAnalysisPrompt(snapshot, "GEMINI (Technical Analyst)");

      const callPromise = (async () => {
        try {
          return await ai.models.generateContent({
            model: this.model,
            contents: prompt,
          });
        } catch (firstErr: any) {
          if (String(firstErr?.message || "").includes("503") || String(firstErr?.message || "").includes("high demand")) {
            await new Promise((r) => setTimeout(r, 600));
            return await ai.models.generateContent({
              model: this.model,
              contents: prompt,
            });
          }
          throw firstErr;
        }
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout aguardando Google Gemini")), 1500);
      });

      const response = await Promise.race([callPromise, timeoutPromise]);

      const latencyMs = Date.now() - t0;
      const text = response?.text || "";
      const parsed = parseAIResponse(text, snapshot.snapshotId);

      return {
        agent: "GEMINI",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: parsed.direction,
        confidence: parsed.confidence,
        reasons: parsed.reasons,
        counterReasons: parsed.counterReasons,
        invalidation: parsed.invalidation,
        latencyMs,
        timestamp: Date.now(),
        status: "SUCCESS",
        role: "Technical Analyst",
      };
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      const errMsg = err?.message || String(err);
      const status = classifyError(errMsg, err?.status || err?.code);

      return {
        agent: "GEMINI",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: [`Falha na chamada ao Google Gemini: ${errMsg}`],
        counterReasons: ["Erro do provedor"],
        invalidation: "Indisponibilidade do modelo",
        latencyMs,
        timestamp: Date.now(),
        status,
        role: "Technical Analyst",
      };
    }
  }
}

// =============================================================================
// 2. GPT ADAPTER (OpenAI)
// =============================================================================
export class GPTAdapter {
  static readonly provider = "OpenAI";
  static readonly model = "gpt-4o-mini";

  static async analyze(snapshot: ConsensusMarketSnapshot): Promise<AIStructuredResponse> {
    const t0 = Date.now();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return {
        agent: "GPT",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: ["OPENAI_API_KEY ausente nas variáveis de ambiente do servidor."],
        counterReasons: ["Provedor não configurado."],
        invalidation: "Falta de credenciais.",
        latencyMs: 0,
        timestamp: Date.now(),
        status: "API KEY AUSENTE",
        role: "Pattern Analyst",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const prompt = buildAnalysisPrompt(snapshot, "GPT (Pattern Analyst)");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - t0;
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.choices && data.choices.length > 0) {
        const text = data.choices[0]?.message?.content || "";
        const parsed = parseAIResponse(text, snapshot.snapshotId);

        return {
          agent: "GPT",
          provider: this.provider,
          model: this.model,
          snapshotId: snapshot.snapshotId,
          direction: parsed.direction,
          confidence: parsed.confidence,
          reasons: parsed.reasons,
          counterReasons: parsed.counterReasons,
          invalidation: parsed.invalidation,
          latencyMs,
          timestamp: Date.now(),
          status: "SUCCESS",
          role: "Pattern Analyst",
        };
      }

      const errMsg = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      const status = classifyError(errMsg, response.status);

      return {
        agent: "GPT",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: [`Falha na chamada à OpenAI: ${errMsg}`],
        counterReasons: ["Erro do provedor"],
        invalidation: "Indisponibilidade do modelo",
        latencyMs,
        timestamp: Date.now(),
        status,
        role: "Pattern Analyst",
      };
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      const errMsg = err?.message || String(err);
      const status = classifyError(errMsg, err?.code || (err?.name === "AbortError" ? "TIMEOUT" : undefined));

      return {
        agent: "GPT",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: [`Erro de conexão OpenAI: ${errMsg}`],
        counterReasons: ["Erro de conexão"],
        invalidation: "Timeout ou falha de rede",
        latencyMs,
        timestamp: Date.now(),
        status,
        role: "Pattern Analyst",
      };
    }
  }
}

// =============================================================================
// 3. CLAUDE ADAPTER (Anthropic)
// =============================================================================
export class ClaudeAdapter {
  static readonly provider = "Anthropic";
  static readonly model = "claude-3-5-haiku-20241022";

  static async analyze(snapshot: ConsensusMarketSnapshot): Promise<AIStructuredResponse> {
    const t0 = Date.now();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return {
        agent: "CLAUDE",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: ["ANTHROPIC_API_KEY ausente nas variáveis de ambiente do servidor."],
        counterReasons: ["Provedor não configurado."],
        invalidation: "Falta de credenciais.",
        latencyMs: 0,
        timestamp: Date.now(),
        status: "API KEY AUSENTE",
        role: "Risk Critic",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const prompt = buildAnalysisPrompt(snapshot, "CLAUDE (Risk Critic)");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - t0;
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.content && data.content.length > 0) {
        const text = data.content[0]?.text || "";
        const parsed = parseAIResponse(text, snapshot.snapshotId);

        return {
          agent: "CLAUDE",
          provider: this.provider,
          model: this.model,
          snapshotId: snapshot.snapshotId,
          direction: parsed.direction,
          confidence: parsed.confidence,
          reasons: parsed.reasons,
          counterReasons: parsed.counterReasons,
          invalidation: parsed.invalidation,
          latencyMs,
          timestamp: Date.now(),
          status: "SUCCESS",
          role: "Risk Critic",
        };
      }

      const errMsg = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      const status = classifyError(errMsg, response.status);

      return {
        agent: "CLAUDE",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: [`Falha na chamada à Anthropic: ${errMsg}`],
        counterReasons: ["Erro do provedor"],
        invalidation: "Indisponibilidade do modelo",
        latencyMs,
        timestamp: Date.now(),
        status,
        role: "Risk Critic",
      };
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      const errMsg = err?.message || String(err);
      const status = classifyError(errMsg, err?.code || (err?.name === "AbortError" ? "TIMEOUT" : undefined));

      return {
        agent: "CLAUDE",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: [`Erro de conexão Anthropic: ${errMsg}`],
        counterReasons: ["Erro de conexão"],
        invalidation: "Timeout ou falha de rede",
        latencyMs,
        timestamp: Date.now(),
        status,
        role: "Risk Critic",
      };
    }
  }
}

// =============================================================================
// 4. GROK ADAPTER (xAI)
// =============================================================================
export class GrokAdapter {
  static readonly provider = "xAI";
  static readonly model = "grok-2-latest";

  static async analyze(snapshot: ConsensusMarketSnapshot): Promise<AIStructuredResponse> {
    const t0 = Date.now();
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return {
        agent: "GROK",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: ["GROK_API_KEY (ou XAI_API_KEY) ausente nas variáveis de ambiente do servidor."],
        counterReasons: ["Provedor não configurado."],
        invalidation: "Falta de credenciais.",
        latencyMs: 0,
        timestamp: Date.now(),
        status: "API KEY AUSENTE",
        role: "Independent Analyst",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const prompt = buildAnalysisPrompt(snapshot, "GROK (Independent Analyst)");
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - t0;
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.choices && data.choices.length > 0) {
        const text = data.choices[0]?.message?.content || "";
        const parsed = parseAIResponse(text, snapshot.snapshotId);

        return {
          agent: "GROK",
          provider: this.provider,
          model: this.model,
          snapshotId: snapshot.snapshotId,
          direction: parsed.direction,
          confidence: parsed.confidence,
          reasons: parsed.reasons,
          counterReasons: parsed.counterReasons,
          invalidation: parsed.invalidation,
          latencyMs,
          timestamp: Date.now(),
          status: "SUCCESS",
          role: "Independent Analyst",
        };
      }

      const errMsg = data?.error || data?.message || `HTTP ${response.status} ${response.statusText}`;
      const status = classifyError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), response.status);

      return {
        agent: "GROK",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: [`Falha na chamada à xAI: ${typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg)}`],
        counterReasons: ["Erro do provedor"],
        invalidation: "Indisponibilidade do modelo",
        latencyMs,
        timestamp: Date.now(),
        status,
        role: "Independent Analyst",
      };
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      const errMsg = err?.message || String(err);
      const status = classifyError(errMsg, err?.code || (err?.name === "AbortError" ? "TIMEOUT" : undefined));

      return {
        agent: "GROK",
        provider: this.provider,
        model: this.model,
        snapshotId: snapshot.snapshotId,
        direction: "WAIT",
        confidence: 0,
        reasons: [`Erro de conexão xAI: ${errMsg}`],
        counterReasons: ["Erro de conexão"],
        invalidation: "Timeout ou falha de rede",
        latencyMs,
        timestamp: Date.now(),
        status,
        role: "Independent Analyst",
      };
    }
  }
}
