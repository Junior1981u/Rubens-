// ==========================================================
// NEXORA TRADER AI V11 — SNAPSHOT ENGINE
// Generates immutable, unique Market Snapshot for the 4 AI Agents
// ==========================================================

import { MarketSnapshot, Candle, TechnicalFeatures, ParityFeatures, MarketRegimeType } from "../../src/types.js";

export class SnapshotEngine {
  public static create(params: {
    asset: string;
    timeframe: string;
    price: number;
    bid?: number;
    ask?: number;
    candle: Candle;
    previousCandles: Candle[];
    indicators: TechnicalFeatures;
    parityFeatures: ParityFeatures;
    marketRegime: MarketRegimeType;
    dataQuality: number;
    feedLatencyMs?: number;
    isClosedCandle?: boolean;
  }): MarketSnapshot {
    const timestamp = Date.now();
    const cleanAsset = params.asset.replace("/", "");
    const randomHex = Math.random().toString(36).substring(2, 8);
    const snapshotId = `${cleanAsset}-${params.timeframe}-${timestamp}-${randomHex}`;

    const bid = params.bid ?? Number((params.price - 0.00005).toFixed(5));
    const ask = params.ask ?? Number((params.price + 0.00005).toFixed(5));
    const feedLatencyMs = params.feedLatencyMs ?? 20;
    const isClosedCandle = params.isClosedCandle ?? (params.candle ? params.candle.closed : true);

    const snapshot: MarketSnapshot = {
      snapshotId,
      asset: params.asset,
      timeframe: params.timeframe,
      timestamp,
      price: params.price,
      bid,
      ask,
      candle: { ...params.candle },
      previousCandles: params.previousCandles.map((c) => ({ ...c })),
      indicators: { ...params.indicators },
      parityFeatures: { ...params.parityFeatures },
      marketRegime: params.marketRegime,
      dataQuality: params.dataQuality,
      feedLatencyMs,
      isClosedCandle,
    };

    return Object.freeze(snapshot);
  }
}
