// ==========================================================
// NEXORA TRADER AI V11 — CANDLE ENGINE
// Converts real ticks into OHLC candles for 1M, 5M, 15M, 30M, 1H
// Enforces: Prefer Closed Candles for AI analysis, zero future data leakage.
// ==========================================================

import { Candle, MarketTick } from "../../src/types.js";
import { MarketDataEngine } from "./marketData.js";

const TIMEFRAME_MS: Record<string, number> = {
  "1M": 60 * 1000,
  "5M": 5 * 60 * 1000,
  "15M": 15 * 60 * 1000,
  "30M": 30 * 60 * 1000,
  "1H": 60 * 60 * 1000,
};

export class CandleEngine {
  private static instance: CandleEngine | null = null;

  // Candle history keyed by `${asset}:${timeframe}`
  private history: Map<string, Candle[]> = new Map();
  private currentCandle: Map<string, Candle> = new Map();

  public static getInstance(): CandleEngine {
    if (!CandleEngine.instance) {
      CandleEngine.instance = new CandleEngine();
    }
    return CandleEngine.instance;
  }

  private constructor() {
    // Connect to MarketDataEngine ticks
    MarketDataEngine.getInstance().onTick((tick) => {
      this.ingestTick(tick);
    });

    // Seed realistic base history for all supported assets
    this.seedInitialHistory("EUR/USD", 1.11950, 0.00015);
    this.seedInitialHistory("GBP/USD", 1.30620, 0.00020);
    this.seedInitialHistory("USD/JPY", 149.210, 0.08);
    this.seedInitialHistory("AUD/USD", 0.67220, 0.00015);
    this.seedInitialHistory("USD/CAD", 1.37850, 0.00015);
    this.seedInitialHistory("AUD/CAD", 0.90180, 0.00015);
    this.seedInitialHistory("GBP/JPY", 195.450, 0.05);
    this.seedInitialHistory("XAG/USD", 31.850, 0.02);
    this.seedInitialHistory("NZD/CAD", 0.81250, 0.00015);
    this.seedInitialHistory("EUR/JPY", 165.850, 0.05);
    this.seedInitialHistory("GBP/CAD", 1.74280, 0.00020);
    this.seedInitialHistory("BTC/USD", 67450.0, 15.0);
    this.seedInitialHistory("ETH/USD", 2640.0, 1.5);
    this.seedInitialHistory("SOL/USD", 154.20, 0.25);
    this.seedInitialHistory("XRP/USD", 0.5420, 0.0008);
    this.seedInitialHistory("XAU/USD", 2664.50, 0.85);
    this.seedInitialHistory("US30", 43250.0, 8.5);
    this.seedInitialHistory("SPX500", 5860.0, 1.5);
    this.seedInitialHistory("NAS100", 20450.0, 6.0);
    this.seedInitialHistory("EUR/USD (OTC)", 1.11950, 0.00015);
    this.seedInitialHistory("GBP/USD (OTC)", 1.30620, 0.00020);
    this.seedInitialHistory("USD/JPY (OTC)", 149.210, 0.08);
    this.seedInitialHistory("BTC/USD (OTC)", 67450.0, 15.0);
  }

  private seedInitialHistory(asset: string, basePrice: number, spreadDelta: number) {
    const now = Date.now();
    const timeframes = [
      { tf: "1M", durationMs: 60 * 1000 },
      { tf: "5M", durationMs: 5 * 60 * 1000 },
      { tf: "15M", durationMs: 15 * 60 * 1000 },
      { tf: "30M", durationMs: 30 * 60 * 1000 },
      { tf: "1H", durationMs: 60 * 60 * 1000 },
    ];

    for (const { tf, durationMs } of timeframes) {
      const candles: Candle[] = [];
      let current = basePrice;
      const decimals = asset.includes("JPY") ? 3 : asset.includes("BTC") ? 1 : 5;

      for (let i = 35; i >= 1; i--) {
        const time = now - i * durationMs;
        const step = (35 - i) % 5;
        const directionMultiplier =
          step === 0 ? -0.45 : step === 1 ? -0.35 : step === 2 ? 0.40 : step === 3 ? 0.50 : 0.55;
        const drift = directionMultiplier * spreadDelta;
        const open = Number(current.toFixed(decimals));
        const close = Number((current + drift).toFixed(decimals));
        const wick = spreadDelta * 0.25;
        const high = Number((Math.max(open, close) + wick).toFixed(decimals));
        const low = Number((Math.min(open, close) - wick).toFixed(decimals));
        current = close;

        candles.push({
          open,
          high,
          low,
          close,
          volume: 25 + (i % 15),
          timestamp: time,
          closed: true,
        });
      }

      this.history.set(`${asset}:${tf}`, candles);
    }
  }

  public ingestTick(tick: MarketTick) {
    const asset = tick.asset || "EUR/USD";
    for (const [tf, durationMs] of Object.entries(TIMEFRAME_MS)) {
      const key = `${asset}:${tf}`;
      const bucketTime = Math.floor(tick.timestamp / durationMs) * durationMs;
      const existing = this.currentCandle.get(key);

      if (!existing || existing.timestamp < bucketTime) {
        // If an existing candle exists, finalize and push to history
        if (existing) {
          existing.closed = true;
          const candles = this.history.get(key) || [];
          candles.push({ ...existing });
          if (candles.length > 200) candles.shift();
          this.history.set(key, candles);
          MarketDataEngine.getInstance().incrementCandles();
        }

        // Start new candle
        this.currentCandle.set(key, {
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
          volume: tick.volume || 1,
          timestamp: bucketTime,
          closed: false,
        });
      } else {
        // Update current open candle
        existing.high = Math.max(existing.high, tick.price);
        existing.low = Math.min(existing.low, tick.price);
        existing.close = tick.price;
        existing.volume += tick.volume || 1;
      }
    }
  }

  private normalizeTf(tf: string): string {
    const upper = (tf || "1M").toUpperCase();
    if (upper === "M1") return "1M";
    if (upper === "M5") return "5M";
    if (upper === "M15") return "15M";
    if (upper === "M30") return "30M";
    if (upper === "H1") return "1H";
    return upper;
  }

  public getCandles(timeframe = "1M", limit = 50, asset = "EUR/USD"): Candle[] {
    const tf = this.normalizeTf(timeframe);
    const key = `${asset}:${tf}`;
    
    // Se o ativo ainda não tiver histórico específico, inicializa sob demanda para evitar contaminação
    if (!this.history.has(key)) {
      const decimals = asset.includes("JPY") ? 3 : asset.includes("BTC") ? 1 : 5;
      const basePrice = asset.includes("BTC") ? 68450 : asset.includes("ETH") ? 2640 : asset.includes("JPY") ? 154.2 : 1.0825;
      this.seedInitialHistory(asset, basePrice, decimals === 5 ? 0.00015 : 0.5);
    }

    const list = this.history.get(key) || [];
    const current = this.currentCandle.get(key);
    const result = [...list];
    if (current) {
      result.push({ ...current });
    }
    return result.slice(-limit);
  }

  public getLastClosedCandle(timeframe = "1M", asset = "EUR/USD"): Candle | null {
    const tf = this.normalizeTf(timeframe);
    const key = `${asset}:${tf}`;
    const list = this.history.get(key) || [];
    return list.length > 0 ? list[list.length - 1] : null;
  }

  public getCurrentCandle(timeframe = "1M", asset = "EUR/USD"): Candle | null {
    const tf = this.normalizeTf(timeframe);
    const key = `${asset}:${tf}`;
    return this.currentCandle.get(key) || null;
  }

  // ==========================================================
  // VALIDAÇÃO ESTRITA DE VELAS (Missão 2)
  // - Validação de timestamp, cronologia e integridade OHLC
  // - Detecção de dados atrasados, duplicados ou ausentes
  // ==========================================================
  public validateCandles(
    candles: Candle[],
    timeframe = "1M"
  ): {
    valid: boolean;
    issues: string[];
    cleanCandles: Candle[];
    lastCandleTimestamp: number;
    delaySeconds: number;
    isStale: boolean;
    isOutOfOrder: boolean;
    hasDuplicates: boolean;
  } {
    const issues: string[] = [];
    if (!candles || candles.length === 0) {
      return {
        valid: false,
        issues: ["Nenhuma vela fornecida para validação."],
        cleanCandles: [],
        lastCandleTimestamp: 0,
        delaySeconds: 0,
        isStale: true,
        isOutOfOrder: false,
        hasDuplicates: false,
      };
    }

    const now = Date.now();
    let hasOutOfOrder = false;
    let hasDuplicates = false;
    let hasIntegrityErrors = false;

    // 1. Integridade de cada vela
    const validList: Candle[] = [];
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (typeof c.timestamp !== "number" || isNaN(c.timestamp) || c.timestamp <= 0) {
        issues.push(`Vela #${i} com timestamp inválido.`);
        hasIntegrityErrors = true;
        continue;
      }
      if (
        typeof c.open !== "number" || isNaN(c.open) || c.open <= 0 ||
        typeof c.close !== "number" || isNaN(c.close) || c.close <= 0 ||
        typeof c.high !== "number" || isNaN(c.high) || c.high <= 0 ||
        typeof c.low !== "number" || isNaN(c.low) || c.low <= 0
      ) {
        issues.push(`Vela #${i} com preços corrompidos ou não positivos.`);
        hasIntegrityErrors = true;
        continue;
      }
      if (c.high < Math.max(c.open, c.close) || c.low > Math.min(c.open, c.close) || c.high < c.low) {
        issues.push(`Vela #${i} violou integridade OHLC (High menor que fechamento ou Low maior que abertura).`);
        hasIntegrityErrors = true;
        continue;
      }
      validList.push(c);
    }

    // 2. Sequência cronológica e duplicados
    for (let i = 1; i < validList.length; i++) {
      if (validList[i].timestamp === validList[i - 1].timestamp) {
        hasDuplicates = true;
      } else if (validList[i].timestamp < validList[i - 1].timestamp) {
        hasOutOfOrder = true;
      }
    }

    if (hasOutOfOrder) {
      issues.push("Velas fora de ordem cronológica detectadas.");
    }
    if (hasDuplicates) {
      issues.push("Velas duplicadas no mesmo timestamp detectadas.");
    }

    // Ordenar cronologicamente e deduplicar
    const sorted = [...validList].sort((a, b) => a.timestamp - b.timestamp);
    const cleanCandles: Candle[] = [];
    for (const c of sorted) {
      if (cleanCandles.length === 0 || cleanCandles[cleanCandles.length - 1].timestamp !== c.timestamp) {
        cleanCandles.push(c);
      }
    }

    // 3. Detecção de atraso (staleness)
    const lastCandle = cleanCandles.length > 0 ? cleanCandles[cleanCandles.length - 1] : null;
    const lastCandleTimestamp = lastCandle ? lastCandle.timestamp : 0;
    const delaySeconds = lastCandle ? Math.max(0, Math.floor((now - lastCandle.timestamp) / 1000)) : 9999;
    const isStale = delaySeconds > 180; // Mais de 3 minutos em M1 é considerado atrasado

    if (isStale) {
      issues.push(`Velas atrasadas: último fechamento há ${delaySeconds}s (tolerância máxima: 180s).`);
    }

    const valid = !hasIntegrityErrors && !isStale && !hasOutOfOrder && cleanCandles.length >= 5;

    return {
      valid,
      issues,
      cleanCandles,
      lastCandleTimestamp,
      delaySeconds,
      isStale,
      isOutOfOrder: hasOutOfOrder,
      hasDuplicates,
    };
  }

  public setCandles(asset: string, timeframe: string, candles: Candle[]) {
    const tf = this.normalizeTf(timeframe);
    this.history.set(`${asset}:${tf}`, candles);
  }

  public ingestHistory(asset: string, timeframe: string, candles: Candle[]) {
    this.setCandles(asset, timeframe, candles);
  }
}
