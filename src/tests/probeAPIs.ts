import { TwelveDataService } from "../../server/engine/twelveDataService.js";
import { AIOrchestrator } from "../../server/ai/orchestrator.js";
import { SnapshotEngine } from "../../server/engine/snapshot.js";
import { FeatureEngine } from "../../server/engine/featureEngine.js";
import { ParityEngine } from "../../server/engine/parityEngine.js";
import { CandleEngine } from "../../server/engine/candleEngine.js";

async function probe() {
  console.log("--- PROBING TWELVE DATA ---");
  const twelveData = TwelveDataService.getInstance();
  const tdRes = await twelveData.fetchTimeSeries("EUR/USD", "1min", 15);
  console.log("Twelve Data Result:", {
    success: tdRes.success,
    status: tdRes.status,
    message: tdRes.message,
    candlesCount: tdRes.candles?.length,
    latest: tdRes.candles?.[tdRes.candles.length - 1],
  });

  console.log("--- PROBING 4 AIS ---");
  const candleEngine = CandleEngine.getInstance();
  const candles = candleEngine.getCandles("1M", 30, "EUR/USD");
  const lastClosed = candleEngine.getLastClosedCandle("1M", "EUR/USD") || candles[candles.length - 1];

  const snapshot = SnapshotEngine.create({
    asset: "EUR/USD",
    timeframe: "1M",
    price: lastClosed?.close || 1.0825,
    bid: (lastClosed?.close || 1.0825) - 0.00005,
    ask: (lastClosed?.close || 1.0825) + 0.00005,
    candle: lastClosed!,
    previousCandles: candles.slice(0, -1),
    indicators: FeatureEngine.calculate(candles),
    parityFeatures: ParityEngine.calculate(candles, "TRENDING"),
    marketRegime: "TRENDING",
    dataQuality: 98,
    feedLatencyMs: 25,
    isClosedCandle: true,
  });

  const orchestrator = AIOrchestrator.getInstance();
  const four = await orchestrator.analyzeWithFourAIs(snapshot, 3500);
  console.log("4 AIs Real Analysis:", {
    gpt: { status: four.gpt.status, model: four.gpt.model, dir: four.gpt.direction, conf: four.gpt.confidence },
    claude: { status: four.claude.status, model: four.claude.model, dir: four.claude.direction, conf: four.claude.confidence },
    gemini: { status: four.gemini.status, model: four.gemini.model, dir: four.gemini.direction, conf: four.gemini.confidence },
    grok: { status: four.grok.status, model: four.grok.model, dir: four.grok.direction, conf: four.grok.confidence },
  });
}

probe().catch(console.error);
