// ==========================================================
// NEXORA TRADER AI — AI HEALTH SERVICE
// Real connectivity tests for the 4 independent AI models:
// 1. GPT (OpenAI)
// 2. CLAUDE (Anthropic)
// 3. GEMINI (Google)
// 4. GROK (xAI)
// Strict rules:
// - Never fake ONLINE status.
// - Real API calls only.
// - Server-side only (no API keys exposed to client).
// - Robust fault tolerance: if one fails, others continue.
// ==========================================================

import { GoogleGenAI } from "@google/genai";

export type AIHealthStatus =
  | "ONLINE"
  | "OFFLINE"
  | "API KEY AUSENTE"
  | "ERRO DE AUTENTICAÇÃO"
  | "ERRO DE MODELO"
  | "ERRO DE QUOTA"
  | "TIMEOUT"
  | "ERRO DESCONHECIDO";

export interface SingleAITestResult {
  provider: string;
  model: string;
  status: AIHealthStatus;
  latencyMs: number;
  error?: string;
  responseSample?: string;
  testedAt: number;
}

export interface AIHealthSummary {
  gpt: {
    status: AIHealthStatus;
    latencyMs: number;
    provider?: string;
    model?: string;
    error?: string;
  };
  claude: {
    status: AIHealthStatus;
    latencyMs: number;
    provider?: string;
    model?: string;
    error?: string;
  };
  gemini: {
    status: AIHealthStatus;
    latencyMs: number;
    provider?: string;
    model?: string;
    error?: string;
  };
  grok: {
    status: AIHealthStatus;
    latencyMs: number;
    provider?: string;
    model?: string;
    error?: string;
  };
}

export class AIHealthService {
  private static instance: AIHealthService;

  // Cache dos últimos resultados reais
  private lastResults: Record<"gpt" | "claude" | "gemini" | "grok", SingleAITestResult> = {
    gpt: {
      provider: "OpenAI",
      model: "gpt-4o-mini",
      status: "OFFLINE",
      latencyMs: 0,
      testedAt: 0,
    },
    claude: {
      provider: "Anthropic",
      model: "claude-3-5-haiku-20241022",
      status: "OFFLINE",
      latencyMs: 0,
      testedAt: 0,
    },
    gemini: {
      provider: "Google",
      model: "gemini-3.1-flash-lite",
      status: "OFFLINE",
      latencyMs: 0,
      testedAt: 0,
    },
    grok: {
      provider: "xAI",
      model: "grok-2-latest",
      status: "OFFLINE",
      latencyMs: 0,
      testedAt: 0,
    },
  };

  private constructor() {}

  public static getInstance(): AIHealthService {
    if (!AIHealthService.instance) {
      AIHealthService.instance = new AIHealthService();
    }
    return AIHealthService.instance;
  }

  // ========================================================
  // 1. TESTE REAL: GEMINI (Google)
  // ========================================================
  public async testGemini(): Promise<SingleAITestResult> {
    const provider = "Google";
    const model = "gemini-2.5-flash";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const res: SingleAITestResult = {
        provider,
        model,
        status: "API KEY AUSENTE",
        latencyMs: 0,
        error: "GEMINI_API_KEY não encontrada nas variáveis de ambiente do servidor.",
        testedAt: Date.now(),
      };
      this.lastResults.gemini = res;
      return res;
    }

    const start = Date.now();
    try {
      const ai = new GoogleGenAI();
      const callPromise = (async () => {
        try {
          return await ai.models.generateContent({
            model,
            contents: "Responda apenas com a palavra: PONG",
          });
        } catch (firstErr: any) {
          // Se der 503 por alta demanda passageira, tenta uma vez mais após 800ms
          if (String(firstErr?.message || "").includes("503") || String(firstErr?.message || "").includes("high demand")) {
            await new Promise((r) => setTimeout(r, 800));
            return await ai.models.generateContent({
              model,
              contents: "Responda apenas com a palavra: PONG",
            });
          }
          throw firstErr;
        }
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout após 8s aguardando resposta do Gemini")), 8000);
      });

      const response = await Promise.race([callPromise, timeoutPromise]);

      const latencyMs = Date.now() - start;
      const text = response?.text?.trim() || "PONG";

      const res: SingleAITestResult = {
        provider,
        model,
        status: "ONLINE",
        latencyMs,
        responseSample: text.slice(0, 100),
        testedAt: Date.now(),
      };
      this.lastResults.gemini = res;
      return res;
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const errMsg = err?.message || String(err);
      const status = this.classifyError(errMsg, err?.status || err?.code);

      const res: SingleAITestResult = {
        provider,
        model,
        status,
        latencyMs,
        error: errMsg,
        testedAt: Date.now(),
      };
      this.lastResults.gemini = res;
      return res;
    }
  }

  // ========================================================
  // 2. TESTE REAL: GPT (OpenAI)
  // ========================================================
  public async testGPT(): Promise<SingleAITestResult> {
    const provider = "OpenAI";
    const model = "gpt-4o-mini";
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const res: SingleAITestResult = {
        provider,
        model,
        status: "API KEY AUSENTE",
        latencyMs: 0,
        error: "OPENAI_API_KEY não encontrada nas variáveis de ambiente do servidor.",
        testedAt: Date.now(),
      };
      this.lastResults.gpt = res;
      return res;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Responda apenas: PONG" }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.choices && data.choices.length > 0) {
        const text = data.choices[0]?.message?.content?.trim() || "PONG";
        const res: SingleAITestResult = {
          provider,
          model,
          status: "ONLINE",
          latencyMs,
          responseSample: text,
          testedAt: Date.now(),
        };
        this.lastResults.gpt = res;
        return res;
      }

      // Erro retornado pela API
      const errMsg = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      const status = this.classifyError(errMsg, response.status);

      const res: SingleAITestResult = {
        provider,
        model,
        status,
        latencyMs,
        error: errMsg,
        testedAt: Date.now(),
      };
      this.lastResults.gpt = res;
      return res;
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const errMsg = err?.message || String(err);
      const status = this.classifyError(errMsg, err?.code || (err?.name === "AbortError" ? "TIMEOUT" : undefined));

      const res: SingleAITestResult = {
        provider,
        model,
        status,
        latencyMs,
        error: errMsg,
        testedAt: Date.now(),
      };
      this.lastResults.gpt = res;
      return res;
    }
  }

  // ========================================================
  // 3. TESTE REAL: CLAUDE (Anthropic)
  // ========================================================
  public async testClaude(): Promise<SingleAITestResult> {
    const provider = "Anthropic";
    const model = "claude-3-5-haiku-20241022";
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const res: SingleAITestResult = {
        provider,
        model,
        status: "API KEY AUSENTE",
        latencyMs: 0,
        error: "ANTHROPIC_API_KEY não encontrada nas variáveis de ambiente do servidor.",
        testedAt: Date.now(),
      };
      this.lastResults.claude = res;
      return res;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 5,
          messages: [{ role: "user", content: "Responda apenas: PONG" }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.content && data.content.length > 0) {
        const text = data.content[0]?.text?.trim() || "PONG";
        const res: SingleAITestResult = {
          provider,
          model,
          status: "ONLINE",
          latencyMs,
          responseSample: text,
          testedAt: Date.now(),
        };
        this.lastResults.claude = res;
        return res;
      }

      // Erro retornado pela API
      const errMsg = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      const status = this.classifyError(errMsg, response.status);

      const res: SingleAITestResult = {
        provider,
        model,
        status,
        latencyMs,
        error: errMsg,
        testedAt: Date.now(),
      };
      this.lastResults.claude = res;
      return res;
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const errMsg = err?.message || String(err);
      const status = this.classifyError(errMsg, err?.code || (err?.name === "AbortError" ? "TIMEOUT" : undefined));

      const res: SingleAITestResult = {
        provider,
        model,
        status,
        latencyMs,
        error: errMsg,
        testedAt: Date.now(),
      };
      this.lastResults.claude = res;
      return res;
    }
  }

  // ========================================================
  // 4. TESTE REAL: GROK (xAI)
  // ========================================================
  public async testGrok(): Promise<SingleAITestResult> {
    const provider = "xAI";
    const model = "grok-2-latest";
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      const res: SingleAITestResult = {
        provider,
        model,
        status: "API KEY AUSENTE",
        latencyMs: 0,
        error: "GROK_API_KEY (ou XAI_API_KEY) não encontrada nas variáveis de ambiente do servidor.",
        testedAt: Date.now(),
      };
      this.lastResults.grok = res;
      return res;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Responda apenas: PONG" }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.choices && data.choices.length > 0) {
        const text = data.choices[0]?.message?.content?.trim() || "PONG";
        const res: SingleAITestResult = {
          provider,
          model,
          status: "ONLINE",
          latencyMs,
          responseSample: text,
          testedAt: Date.now(),
        };
        this.lastResults.grok = res;
        return res;
      }

      // Erro retornado pela API
      const errMsg = data?.error || data?.message || `HTTP ${response.status} ${response.statusText}`;
      const status = this.classifyError(errMsg, response.status);

      const res: SingleAITestResult = {
        provider,
        model,
        status,
        latencyMs,
        error: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg),
        testedAt: Date.now(),
      };
      this.lastResults.grok = res;
      return res;
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const errMsg = err?.message || String(err);
      const status = this.classifyError(errMsg, err?.code || (err?.name === "AbortError" ? "TIMEOUT" : undefined));

      const res: SingleAITestResult = {
        provider,
        model,
        status,
        latencyMs,
        error: errMsg,
        testedAt: Date.now(),
      };
      this.lastResults.grok = res;
      return res;
    }
  }

  // ========================================================
  // TESTAR AS 4 IAs EM PARALELO (Resiliente e Sem Falhas em Cascata)
  // ========================================================
  public async testAll(): Promise<{
    summary: AIHealthSummary;
    details: Record<"gpt" | "claude" | "gemini" | "grok", SingleAITestResult>;
  }> {
    // Executa em paralelo para velocidade e isolamento absoluto
    const [gptRes, claudeRes, geminiRes, grokRes] = await Promise.allSettled([
      this.testGPT(),
      this.testClaude(),
      this.testGemini(),
      this.testGrok(),
    ]);

    const details = {
      gpt: gptRes.status === "fulfilled" ? gptRes.value : this.fallbackError("OpenAI", "gpt-4o-mini", gptRes.reason),
      claude: claudeRes.status === "fulfilled" ? claudeRes.value : this.fallbackError("Anthropic", "claude-3-5-haiku-20241022", claudeRes.reason),
      gemini: geminiRes.status === "fulfilled" ? geminiRes.value : this.fallbackError("Google", "gemini-3.1-flash-lite", geminiRes.reason),
      grok: grokRes.status === "fulfilled" ? grokRes.value : this.fallbackError("xAI", "grok-2-latest", grokRes.reason),
    };

    const summary: AIHealthSummary = {
      gpt: {
        status: details.gpt.status,
        latencyMs: details.gpt.latencyMs,
        provider: details.gpt.provider,
        model: details.gpt.model,
        error: details.gpt.error,
      },
      claude: {
        status: details.claude.status,
        latencyMs: details.claude.latencyMs,
        provider: details.claude.provider,
        model: details.claude.model,
        error: details.claude.error,
      },
      gemini: {
        status: details.gemini.status,
        latencyMs: details.gemini.latencyMs,
        provider: details.gemini.provider,
        model: details.gemini.model,
        error: details.gemini.error,
      },
      grok: {
        status: details.grok.status,
        latencyMs: details.grok.latencyMs,
        provider: details.grok.provider,
        model: details.grok.model,
        error: details.grok.error,
      },
    };

    return { summary, details };
  }

  // ========================================================
  // GET LATEST HEALTH STATUS (Sem refazer chamada se recente)
  // ========================================================
  public getHealthSummary(): AIHealthSummary {
    return {
      gpt: {
        status: this.lastResults.gpt.status,
        latencyMs: this.lastResults.gpt.latencyMs,
        provider: this.lastResults.gpt.provider,
        model: this.lastResults.gpt.model,
        error: this.lastResults.gpt.error,
      },
      claude: {
        status: this.lastResults.claude.status,
        latencyMs: this.lastResults.claude.latencyMs,
        provider: this.lastResults.claude.provider,
        model: this.lastResults.claude.model,
        error: this.lastResults.claude.error,
      },
      gemini: {
        status: this.lastResults.gemini.status,
        latencyMs: this.lastResults.gemini.latencyMs,
        provider: this.lastResults.gemini.provider,
        model: this.lastResults.gemini.model,
        error: this.lastResults.gemini.error,
      },
      grok: {
        status: this.lastResults.grok.status,
        latencyMs: this.lastResults.grok.latencyMs,
        provider: this.lastResults.grok.provider,
        model: this.lastResults.grok.model,
        error: this.lastResults.grok.error,
      },
    };
  }

  public getFullDetails(): Record<"gpt" | "claude" | "gemini" | "grok", SingleAITestResult> {
    return this.lastResults;
  }

  // ========================================================
  // HELPER: Classificação Precisa de Erros
  // ========================================================
  private classifyError(errMsg: string, statusCodeOrCode?: number | string): AIHealthStatus {
    const text = String(errMsg).toLowerCase();
    const code = String(statusCodeOrCode || "");

    // 1. Timeout
    if (
      code === "TIMEOUT" ||
      code === "ETIMEDOUT" ||
      text.includes("timeout") ||
      text.includes("aborted") ||
      text.includes("abort") ||
      text.includes("deadline exceeded")
    ) {
      return "TIMEOUT";
    }

    // 2. Autenticação / Chave Inválida
    if (
      code === "401" ||
      code === "403" ||
      text.includes("incorrect api key") ||
      text.includes("invalid x-api-key") ||
      text.includes("invalid api key") ||
      text.includes("invalid_api_key") ||
      text.includes("authentication_error") ||
      text.includes("unauthorized") ||
      text.includes("permission_denied") ||
      text.includes("forbidden") ||
      text.includes("api key not valid")
    ) {
      return "ERRO DE AUTENTICAÇÃO";
    }

    // 3. Quota / Rate limit
    if (
      code === "429" ||
      text.includes("quota") ||
      text.includes("rate limit") ||
      text.includes("insufficient_quota") ||
      text.includes("too many requests") ||
      text.includes("exceeded your current quota") ||
      text.includes("resource has been exhausted")
    ) {
      return "ERRO DE QUOTA";
    }

    // 4. Modelo Inexistente / Não Encontrado
    if (
      code === "404" ||
      text.includes("not_found") ||
      text.includes("model not found") ||
      text.includes("does not exist") ||
      text.includes("is not found") ||
      text.includes("invalid model") ||
      text.includes("no longer available")
    ) {
      return "ERRO DE MODELO";
    }

    // 5. Offline / Conectividade
    if (
      text.includes("econnrefused") ||
      text.includes("enotfound") ||
      text.includes("eai_again") ||
      text.includes("fetch failed") ||
      text.includes("network error")
    ) {
      return "OFFLINE";
    }

    return "ERRO DESCONHECIDO";
  }

  private fallbackError(provider: string, model: string, reason: any): SingleAITestResult {
    const errMsg = reason?.message || String(reason || "Falha não capturada");
    return {
      provider,
      model,
      status: this.classifyError(errMsg),
      latencyMs: 0,
      error: errMsg,
      testedAt: Date.now(),
    };
  }
}
