// ==========================================================
// NEXORA TRADER AI V11 — FEATURE ENGINE
// Technical Indicators: EMA, RSI, MACD, ATR, Bollinger, Candle Geometry
// ==========================================================

import { Candle, TechnicalFeatures } from "../../src/types.js";

export class FeatureEngine {
  private static cache = new Map<string, { features: TechnicalFeatures; expiresAt: number }>();

  public static calculate(candles: Candle[]): TechnicalFeatures {
    if (!candles || candles.length === 0) {
      return this.defaultFeatures();
    }

    const last = candles[candles.length - 1];
    // Cache de alta velocidade O(1) indexado por candle timestamp e preço de fechamento
    const cacheKey = `${candles.length}:${last.timestamp}:${last.close}:${last.high}:${last.low}:${last.volume}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.features;
    }

    const closes = candles.map((c) => c.close);
    const prev = candles.length > 1 ? candles[candles.length - 2] : last;

    // EMAs
    const ema9 = this.calcEMA(closes, 9);
    const ema21 = this.calcEMA(closes, 21);
    const ema50 = this.calcEMA(closes, 50);
    const ema200 = this.calcEMA(closes, 200);

    // RSI 14
    const rsi14 = this.calcRSI(closes, 14);

    // MACD (12, 26, 9)
    const macd = this.calcMACD(closes);

    // ATR 14
    const atr = this.calcATR(candles, 14);

    // Bollinger Bands (20, 2)
    const bollingerBands = this.calcBollinger(closes, 20, 2);

    // Candle geometry
    const candleBody = Math.abs(last.close - last.open);
    const isBullish = last.close >= last.open;
    const upperWick = isBullish ? last.high - last.close : last.high - last.open;
    const lowerWick = isBullish ? last.open - last.low : last.close - last.low;
    const range = Math.max(0.00001, last.high - last.low);

    // Momentum & Volatility
    const momentum = closes.length >= 5 ? last.close - closes[closes.length - 5] : 0;
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const volatility = returns.length > 0 ? this.stdDev(returns) : 0.001;

    // Distance from EMA21
    const distanceFromEma21 = last.close - ema21;

    // Trend strength
    const trendStrength = Math.min(100, Math.round((Math.abs(ema9 - ema21) / (atr || 0.0005)) * 50));

    // Bollinger Position
    let bollingerPosition: TechnicalFeatures["bollingerPosition"] = "MIDDLE";
    if (last.close > bollingerBands.upper) bollingerPosition = "ABOVE_UPPER";
    else if (last.close >= bollingerBands.middle + (bollingerBands.upper - bollingerBands.middle) * 0.5) bollingerPosition = "UPPER_BAND";
    else if (last.close < bollingerBands.lower) bollingerPosition = "BELOW_LOWER";
    else if (last.close <= bollingerBands.middle - (bollingerBands.middle - bollingerBands.lower) * 0.5) bollingerPosition = "LOWER_BAND";

    // Multi-timeframe alignment
    let multiTimeframeAlignment: TechnicalFeatures["multiTimeframeAlignment"] = "NEUTRAL";
    if (ema9 > ema21 && ema21 > ema50) multiTimeframeAlignment = "BULLISH";
    else if (ema9 < ema21 && ema21 < ema50) multiTimeframeAlignment = "BEARISH";
    // Dynamic Support and Resistance (recent 15-candle pivots)
    const recentWindow = candles.slice(-15);
    const supportLevel = Number(Math.min(...recentWindow.map((c) => c.low)).toFixed(5));
    const resistanceLevel = Number(Math.max(...recentWindow.map((c) => c.high)).toFixed(5));

    const features: TechnicalFeatures = {
      ema9,
      ema21,
      ema50,
      ema200,
      rsi14,
      macd,
      atr,
      bollingerBands,
      momentum,
      volatility,
      candleBody,
      upperWick,
      lowerWick,
      range,
      trendStrength,
      distanceFromEma21,
      bollingerPosition,
      multiTimeframeAlignment,
      supportLevel,
      resistanceLevel,
    };

    // Salva no cache com TTL de 30 segundos
    this.cache.set(cacheKey, { features, expiresAt: now + 30000 });
    if (this.cache.size > 200) {
      for (const [k, v] of this.cache.entries()) {
        if (v.expiresAt <= now) this.cache.delete(k);
      }
    }

    return features;
  }

  private static defaultFeatures(): TechnicalFeatures {
    return {
      ema9: 1.0825,
      ema21: 1.0825,
      ema50: 1.0825,
      ema200: 1.0825,
      rsi14: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      atr: 0.0004,
      bollingerBands: { upper: 1.083, middle: 1.0825, lower: 1.082, bandwidth: 0.001, percentB: 0.5 },
      momentum: 0,
      volatility: 0.001,
      candleBody: 0.0001,
      upperWick: 0.00005,
      lowerWick: 0.00005,
      range: 0.0002,
      trendStrength: 50,
      distanceFromEma21: 0,
      bollingerPosition: "MIDDLE",
      multiTimeframeAlignment: "NEUTRAL",
      supportLevel: 1.0820,
      resistanceLevel: 1.0830,
    };
  }

  private static calcEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    if (data.length < period) return data[data.length - 1];

    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return Number(ema.toFixed(5));
  }

  private static calcRSI(closes: number[], period = 14): number {
    if (closes.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Number((100 - 100 / (1 + rs)).toFixed(1));
  }

  private static calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
    if (closes.length < 15) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    // Compute MACD series over recent window to calculate 9-period EMA signal line
    const macdSeries: number[] = [];
    const minLen = Math.min(closes.length, 30);
    for (let i = closes.length - minLen; i < closes.length; i++) {
      const slice = closes.slice(0, i + 1);
      const e12 = this.calcEMA(slice, 12);
      const e26 = this.calcEMA(slice, 26);
      macdSeries.push(e12 - e26);
    }

    const macdVal = macdSeries[macdSeries.length - 1] || 0;
    const signal = macdSeries.length >= 9 ? this.calcEMA(macdSeries, 9) : macdVal * 0.2;
    const histogram = macdVal - signal;

    return {
      macd: Number(macdVal.toFixed(5)),
      signal: Number(signal.toFixed(5)),
      histogram: Number(histogram.toFixed(5)),
    };
  }

  private static calcATR(candles: Candle[], period = 14): number {
    if (candles.length < 2) return 0.0004;

    const trs: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i];
      const prev = candles[i - 1];
      const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
      trs.push(tr);
    }

    const recent = trs.slice(-period);
    const avg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    return Number(avg.toFixed(5));
  }

  private static calcBollinger(closes: number[], period = 20, mult = 2) {
    if (closes.length < period) {
      const p = closes[closes.length - 1] || 1.0825;
      return { upper: p + 0.0005, middle: p, lower: p - 0.0005, bandwidth: 0.001, percentB: 0.5 };
    }

    const window = closes.slice(-period);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const sd = this.stdDev(window);

    const upper = mean + mult * sd;
    const lower = mean - mult * sd;
    const bandwidth = (upper - lower) / mean;
    const last = closes[closes.length - 1];
    const percentB = upper !== lower ? (last - lower) / (upper - lower) : 0.5;

    return {
      upper: Number(upper.toFixed(5)),
      middle: Number(mean.toFixed(5)),
      lower: Number(lower.toFixed(5)),
      bandwidth: Number(bandwidth.toFixed(5)),
      percentB: Number(percentB.toFixed(2)),
    };
  }

  private static stdDev(arr: number[]): number {
    if (arr.length <= 1) return 0.0001;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }
}
