// ==========================================================
// NEXORA TRADER AI V11 — LOSS GUARD
// Multidimensional Capital Protection: Vetoes Trades on Critical Risks
// ==========================================================

import { MarketSnapshot, FourAIResults, ConsensusResult } from "../../src/types.js";

export class LossGuard {
  private static instance: LossGuard | null = null;

  private consecutiveLosses = 0;
  private cooldownUntilTimestamp = 0;
  private maxConsecutiveLossesAllowed = 4;
  private cooldownDurationMs = 45 * 1000; // 45 seconds protective window

  public static getInstance(): LossGuard {
    if (!LossGuard.instance) {
      LossGuard.instance = new LossGuard();
    }
    return LossGuard.instance;
  }

  public resetCooldown() {
    this.consecutiveLosses = 0;
    this.cooldownUntilTimestamp = 0;
  }

  public recordOutcome(isWin: boolean) {
    if (isWin) {
      this.consecutiveLosses = 0;
    } else {
      this.consecutiveLosses++;
      if (this.consecutiveLosses >= this.maxConsecutiveLossesAllowed) {
        this.cooldownUntilTimestamp = Date.now() + this.cooldownDurationMs;
      }
    }
  }

  public verify(
    snapshot: MarketSnapshot,
    fourAIs: FourAIResults,
    consensus: ConsensusResult,
    requireStrict4_4 = false
  ): {
    passed: boolean;
    blockers: string[];
    riskScore: number;
    cooldownRemainingSec: number;
  } {
    const blockers: string[] = [];
    const now = Date.now();

    // 1. Cooldown check - only active if actually hit max consecutive losses
    const cooldownRemainingSec = this.consecutiveLosses >= this.maxConsecutiveLossesAllowed
      ? Math.max(0, Math.ceil((this.cooldownUntilTimestamp - now) / 1000))
      : 0;
    if (cooldownRemainingSec > 0) {
      blockers.push(`Cooldown ativo: restam ${cooldownRemainingSec}s devido a ${this.consecutiveLosses} losses consecutivos.`);
    }

    // 2. Data Quality check
    if (snapshot.dataQuality < 75) {
      blockers.push(`Qualidade de dados inadequada (${snapshot.dataQuality}% < 75%).`);
    }

    // 3. Latency check
    if (snapshot.feedLatencyMs > 2500) {
      blockers.push(`Latência do feed crítica: ${snapshot.feedLatencyMs}ms.`);
    }
    if (fourAIs.totalLatencyMs > 8500) {
      blockers.push(`Latência do quórum de IA excedeu tolerância: ${fourAIs.totalLatencyMs}ms.`);
    }

    // 4. Sample Size
    if (snapshot.parityFeatures.sampleSize < 10) {
      blockers.push(`Amostra histórica insuficiente (${snapshot.parityFeatures.sampleSize} observações).`);
    }

    // 5. Market Regime
    if (snapshot.marketRegime === "UNCERTAIN" && snapshot.indicators.volatility > 0.03) {
      blockers.push("Regime de mercado caótico / volatilidade extrema.");
    }

    // 6. Volatility Spike
    if (snapshot.indicators.volatility > 0.04) {
      blockers.push(`Pico severo de volatilidade (${(snapshot.indicators.volatility * 100).toFixed(2)}%).`);
    }

    // 7. AI Quorum Health
    if (requireStrict4_4) {
      if (!fourAIs.allSuccess) {
        blockers.push("Modo Estrito 4/4 ativo: Uma ou mais IAs não completaram análise com sucesso.");
      }
    } else {
      if (fourAIs.quorumCount === 0 && !snapshot.indicators) {
        blockers.push("Nenhuma IA conectada com sucesso no momento para auditar o snapshot.");
      }
    }

    // 8. Claude Contradiction Check
    if (fourAIs.claude.contradictions && fourAIs.claude.contradictions.length > 0) {
      const hasCriticalRedFlag = fourAIs.claude.contradictions.some(
        (c) =>
          c.toLowerCase().includes("crítico") ||
          c.toLowerCase().includes("invalidação") ||
          c.toLowerCase().includes("alto risco")
      );
      if (hasCriticalRedFlag) {
        blockers.push(`Auditor de risco (Claude) emitiu veto por contradição: ${fourAIs.claude.contradictions[0]}`);
      }
    }

    // 9. Closed Candle check
    if (!snapshot.candle) {
      blockers.push("Nenhuma vela de mercado válida identificada.");
    }

    // 10. Proactive Anti-Loss Shield (Proteção de Capital & Filtro Anti-Loss Blindado)
    if (consensus.consensus === "PAR" || consensus.consensus === "IMPAR") {
      // 10.1 Filtro de Mercado Lateral / Médias Comprimidas (Evita rompimento falso em consolidação)
      if (snapshot.indicators?.ema9 && snapshot.indicators?.ema21) {
        const emaDelta = Math.abs(snapshot.indicators.ema9 - snapshot.indicators.ema21);
        const emaBase = (snapshot.indicators.ema9 + snapshot.indicators.ema21) / 2;
        if (emaBase > 0 && (emaDelta / emaBase) < 0.00003) {
          blockers.push("Filtro Anti-Loss: Mercado em consolidação lateral (médias comprimidas). Risco elevado de falso rompimento.");
        }
      }

      // 10.2 Filtro de Vela de Indecisão (Doji com corpo < 18% da amplitude total)
      if (snapshot.candle) {
        const range = snapshot.candle.high - snapshot.candle.low;
        const body = Math.abs(snapshot.candle.close - snapshot.candle.open);
        if (range > 0 && (body / range) < 0.15) {
          blockers.push("Filtro Anti-Loss: Vela de indecisão (Doji com corpo < 15%). Entrada bloqueada para evitar reversão aleatória.");
        }

        // 10.3 Filtro de Rejeição Oposta de Pavio
        if (body > 0) {
          const upperWick = snapshot.candle.high - Math.max(snapshot.candle.open, snapshot.candle.close);
          const lowerWick = Math.min(snapshot.candle.open, snapshot.candle.close) - snapshot.candle.low;
          if (consensus.consensus === "PAR" && upperWick > body * 1.8) {
            blockers.push("Filtro Anti-Loss: Rejeição no topo com forte pavio superior. Alto risco de retração para compra.");
          }
          if (consensus.consensus === "IMPAR" && lowerWick > body * 1.8) {
            blockers.push("Filtro Anti-Loss: Rejeição no fundo com forte pavio inferior. Alto risco de repique para venda.");
          }
        }
      }

      // 10.4 Filtro de Contra-Tendência Estrito (Impede compras em queda e vendas em alta)
      if (snapshot.indicators?.ema9 && snapshot.indicators?.ema21) {
        const { ema9, ema21, ema50 } = snapshot.indicators;
        if (consensus.consensus === "PAR" && ema9 < ema21) {
          blockers.push("Filtro Anti-Loss: Proibido COMPRA quando a EMA 9 está abaixo da EMA 21 (tendência de baixa).");
        }
        if (consensus.consensus === "IMPAR" && ema9 > ema21) {
          blockers.push("Filtro Anti-Loss: Proibido VENDA quando a EMA 9 está acima da EMA 21 (tendência de alta).");
        }
        if (ema50) {
          if (consensus.consensus === "PAR" && ema9 < ema50 && ema21 < ema50 && ema9 < ema21) {
            blockers.push("Filtro Anti-Loss: Proibido COMPRA contra a macro-tendência de baixa (todas as médias abaixo da EMA 50).");
          }
          if (consensus.consensus === "IMPAR" && ema9 > ema50 && ema21 > ema50 && ema9 > ema21) {
            blockers.push("Filtro Anti-Loss: Proibido VENDA contra a macro-tendência de alta (todas as médias acima da EMA 50).");
          }
        }
      }

      // 10.5 Filtro de Exaustão de Oscilador RSI
      if (snapshot.indicators?.rsi14 !== undefined) {
        if (consensus.consensus === "PAR" && snapshot.indicators.rsi14 >= 74) {
          blockers.push(`Filtro Anti-Loss: RSI em sobrecompra extrema (${snapshot.indicators.rsi14.toFixed(1)} >= 74). Risco iminente de exaustão compradora.`);
        }
        if (consensus.consensus === "IMPAR" && snapshot.indicators.rsi14 <= 26) {
          blockers.push(`Filtro Anti-Loss: RSI em sobrevenda extrema (${snapshot.indicators.rsi14.toFixed(1)} <= 26). Risco iminente de exaustão vendedora.`);
        }
      }
    }

    const passed = blockers.length === 0;
    const riskScore = passed ? 12 : Math.min(100, 30 + blockers.length * 20);

    return {
      passed,
      blockers,
      riskScore,
      cooldownRemainingSec,
    };
  }

  public getStatus() {
    const now = Date.now();
    const cooldownRemainingSec = Math.max(0, Math.ceil((this.cooldownUntilTimestamp - now) / 1000));
    return {
      active: true,
      consecutiveLosses: this.consecutiveLosses,
      cooldownRemainingSec,
      isBlocked: cooldownRemainingSec > 0,
    };
  }
}
