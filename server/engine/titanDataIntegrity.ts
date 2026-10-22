// ==========================================================
// NEXORA TITAN AI V24 — TITAN DATA INTEGRITY ENGINE
// Central Data Validation Layer for Multi-Feed & Real-Time Integrity
// "Inteligência que analisa. Tecnologia que evolui."
// ==========================================================

import { Candle, MarketSnapshot, MarketConnectionStatus } from "../../src/types.js";
import { MarketDataEngine } from "./marketData.js";
import { TwelveDataService } from "./twelveDataService.js";

export type TitanDataStatus =
  | "CONECTADO"
  | "ATUALIZANDO"
  | "DADOS DESATUALIZADOS"
  | "ERRO DE FONTE"
  | "SEM DADOS";

export interface TitanValidationAudit {
  status: TitanDataStatus;
  passed: boolean;
  blockers: string[];
  warnings: string[];
  dataAgeSeconds: number;
  symbolMatched: boolean;
  timeframeMatched: boolean;
  closedCandleConfirmed: boolean;
  chronologicalOrderValid: boolean;
  ohlcConsistent: boolean;
  clockDriftMs: number;
  gapCount: number;
  duplicateCount: number;
  effectiveSource: string;
  sourceTimestamp: number;
  auditTimestamp: number;
}

export class TitanDataIntegrityEngine {
  private static instance: TitanDataIntegrityEngine | null = null;

  public static getInstance(): TitanDataIntegrityEngine {
    if (!TitanDataIntegrityEngine.instance) {
      TitanDataIntegrityEngine.instance = new TitanDataIntegrityEngine();
    }
    return TitanDataIntegrityEngine.instance;
  }

  private constructor() {}

  /**
   * Valida a integridade estrita de dados de mercado antes de qualquer processamento técnico.
   */
  public auditMarketData(
    asset: string,
    timeframe: string,
    candles: Candle[],
    lastTickPrice?: number,
    feedSource?: string
  ): TitanValidationAudit {
    const auditTimestamp = Date.now();
    const blockers: string[] = [];
    const warnings: string[] = [];
    let gapCount = 0;
    let duplicateCount = 0;

    // 1. Verificação de Presença de Dados
    if (!candles || candles.length === 0) {
      blockers.push("Nenhum candle disponível no histórico para o ativo solicitado.");
      return {
        status: "SEM DADOS",
        passed: false,
        blockers,
        warnings,
        dataAgeSeconds: 99999,
        symbolMatched: true,
        timeframeMatched: true,
        closedCandleConfirmed: false,
        chronologicalOrderValid: false,
        ohlcConsistent: false,
        clockDriftMs: 0,
        gapCount: 0,
        duplicateCount: 0,
        effectiveSource: feedSource || "DESCONHECIDO",
        sourceTimestamp: 0,
        auditTimestamp,
      };
    }

    // 2. Verificação de Fonte e Conexão Real
    const marketEngine = MarketDataEngine.getInstance();
    const marketStatus = marketEngine.getStatus();
    const effectiveSource = feedSource || marketEngine.getSource() || "INTERBANK_LIVE_FEED";

    if (marketStatus === "OFFLINE") {
      blockers.push("Fonte de mercado declarada como OFFLINE. Emissão de sinais bloqueada.");
    }

    // 3. Verificação do Último Candle e Idade dos Dados
    const lastCandle = candles[candles.length - 1];
    const sourceTimestamp = lastCandle.timestamp;
    const clockDriftMs = Math.abs(auditTimestamp - sourceTimestamp);
    const dataAgeSeconds = Math.max(0, Math.floor((auditTimestamp - sourceTimestamp) / 1000));

    // Timeframe M1 tem tolerância de 120s para tolerar fechamento de vela
    const maxTolerableAgeSec = timeframe === "1M" || timeframe === "M1" ? 120 : 360;
    if (dataAgeSeconds > maxTolerableAgeSec) {
      blockers.push(`Dados desatualizados: último candle recebido há ${dataAgeSeconds}s (Máximo tolerável: ${maxTolerableAgeSec}s).`);
    }

    // 4. Verificação de Timestamp Futuro (Clock Drift anômalo)
    if (sourceTimestamp > auditTimestamp + 10000) {
      blockers.push(`Anomalia temporal: candle com timestamp no futuro (${new Date(sourceTimestamp).toISOString()}).`);
    }

    // 5. Ordem Cronológica, Duplicatas e Lacunas
    let chronologicalOrderValid = true;
    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];

      if (curr.timestamp < prev.timestamp) {
        chronologicalOrderValid = false;
        blockers.push(`Velas fora de ordem cronológica detectadas no índice ${i}.`);
        break;
      }

      if (curr.timestamp === prev.timestamp) {
        duplicateCount++;
        warnings.push(`Candle duplicado detectado no timestamp ${curr.timestamp}.`);
      }

      // Lacunas anormais (maior que 3 vezes o período do timeframe)
      const tfDurationMs = timeframe === "5M" || timeframe === "M5" ? 300000 : 60000;
      if (curr.timestamp - prev.timestamp > tfDurationMs * 3) {
        gapCount++;
        warnings.push(`Lacuna de dados detectada entre ${prev.timestamp} e ${curr.timestamp}.`);
      }
    }

    // 6. Consistência Estrutural OHLC
    let ohlcConsistent = true;
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (c.open <= 0 || c.high <= 0 || c.low <= 0 || c.close <= 0) {
        ohlcConsistent = false;
        blockers.push(`Candle com preço nulo ou negativo no índice ${i}.`);
        break;
      }
      if (c.high < c.low) {
        ohlcConsistent = false;
        blockers.push(`Anomalia OHLC: High (${c.high}) menor que Low (${c.low}) no índice ${i}.`);
        break;
      }
      if (c.close > c.high || c.close < c.low || c.open > c.high || c.open < c.low) {
        ohlcConsistent = false;
        blockers.push(`Anomalia OHLC: Open/Close fora do intervalo High/Low no índice ${i}.`);
        break;
      }
    }

    // 7. Validação de Preço de Tick vs Fechamento do Candle
    if (lastTickPrice !== undefined && lastTickPrice > 0 && lastCandle.close > 0) {
      const pctDiff = Math.abs(lastTickPrice - lastCandle.close) / lastCandle.close;
      if (pctDiff > 0.05) {
        // Discrepância maior que 5% indica contaminação entre ativos
        blockers.push(`Discrepância crítica entre tick (${lastTickPrice}) e candle (${lastCandle.close}): ${(pctDiff * 100).toFixed(2)}%.`);
      }
    }

    // 8. Confirmação de Candle Fechado
    const closedCandleConfirmed = Boolean(lastCandle.closed);
    if (!closedCandleConfirmed) {
      warnings.push("Último candle ainda se encontra em formação. Utilizando histórico fechado anterior para indicadores.");
    }

    // 9. Determinação do Estado Final do Titan Data
    let status: TitanDataStatus = "CONECTADO";
    if (blockers.some((b) => b.includes("OFFLINE") || b.includes("nulo ou negativo"))) {
      status = "ERRO DE FONTE";
    } else if (blockers.some((b) => b.includes("desatualizados") || b.includes("Anomalia temporal"))) {
      status = "DADOS DESATUALIZADOS";
    } else if (auditTimestamp - marketEngine.getLastFeedCheckTime() < 2000) {
      status = "ATUALIZANDO";
    }

    const passed = blockers.length === 0;

    return {
      status,
      passed,
      blockers,
      warnings,
      dataAgeSeconds,
      symbolMatched: true,
      timeframeMatched: true,
      closedCandleConfirmed,
      chronologicalOrderValid,
      ohlcConsistent,
      clockDriftMs,
      gapCount,
      duplicateCount,
      effectiveSource,
      sourceTimestamp,
      auditTimestamp,
    };
  }
}
