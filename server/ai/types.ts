// ==========================================================
// NEXORA TRADER AI V11 — AI INTERFACE TYPES
// ==========================================================

import type {
  AIProviderName,
  AIAgentName,
  MarketSnapshot,
  AIResponse,
  FourAIResults,
  NormalizedDirection,
} from "../../src/types.js";

export type {
  AIProviderName,
  AIAgentName,
  MarketSnapshot,
  AIResponse,
  FourAIResults,
  NormalizedDirection,
};

export interface AIAdapter {
  provider: AIProviderName;
  agent: AIAgentName;
  model: string;
  analyze(snapshot: MarketSnapshot, timeoutMs?: number): Promise<AIResponse>;
  ping(timeoutMs?: number): Promise<{ status: string; latencyMs: number; error?: string }>;
}
