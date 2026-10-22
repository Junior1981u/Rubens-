// ==========================================================
// NEXORA TITAN AI V25 — BENCHMARK DIAGNOSTICS SCRIPT
// Medição real com relógio monotônico (performance.now()) de cada etapa
// ==========================================================

import { performance } from "perf_hooks";
import { MarketDataEngine } from "../../server/engine/marketData.js";
import { CandleEngine } from "../../server/engine/candleEngine.js";
import { FeatureEngine } from "../../server/engine/featureEngine.js";
import { ParityEngine } from "../../server/engine/parityEngine.js";
import { TriggerEngine } from "../../server/engine/triggerEngine.js";
import { SnapshotEngine } from "../../server/engine/snapshot.js";
import { LossGuard } from "../../server/engine/lossGuard.js";
import { AIOrchestrator } from "../../server/ai/orchestrator.js";
import { ConsensusEngine } from "../../server/engine/consensusEngine.js";

async function runDiagnostics() {
  console.log("==========================================================");
  console.log("NEXORA TITAN AI V25 — DIAGNÓSTICO DE LATÊNCIA (MONOTÔNICO)");
  console.log("==========================================================\n");

  const asset = "EUR/USD";
  const timeframe = "1M";

  // 1. Medição: Obtenção de Preços e Ticks
  const t0_price = performance.now();
  const marketEngine = MarketDataEngine.getInstance();
  const lastTick = marketEngine.getLastTick(asset);
  const t1_price = performance.now();
  const priceLatencyMs = Number((t1_price - t0_price).toFixed(3));
  console.log(`[1. Recepção/Acesso a Preços]: ${priceLatencyMs} ms`);

  // 2. Medição: Atualização e Obtenção de Velas M1
  const t0_candle = performance.now();
  const candleEngine = CandleEngine.getInstance();
  const candles = candleEngine.getCandles(timeframe, 50, asset);
  const lastClosedCandle = candleEngine.getLastClosedCandle(timeframe, asset);
  const t1_candle = performance.now();
  const candleLatencyMs = Number((t1_candle - t0_candle).toFixed(3));
  console.log(`[2. Obtenção das Velas M1 (${candles.length} velas)]: ${candleLatencyMs} ms`);

  // 3. Medição: Cálculo de Indicadores (EMA 9/21/50, RSI 14, MACD, ATR, Bollinger)
  const t0_ind = performance.now();
  const indicators = FeatureEngine.calculate(candles);
  const t1_ind = performance.now();
  const indicatorLatencyMs = Number((t1_ind - t0_ind).toFixed(3));
  console.log(`[3. Cálculo dos Indicadores Técnicos]: ${indicatorLatencyMs} ms`);

  // 4. Medição: Cálculo de Paridade e Assimetria Estatística
  const t0_parity = performance.now();
  const parityFeatures = ParityEngine.calculate(candles, "TRENDING");
  const t1_parity = performance.now();
  const parityLatencyMs = Number((t1_parity - t0_parity).toFixed(3));
  console.log(`[4. Cálculo de Paridade / Estatística]: ${parityLatencyMs} ms`);

  // 5. Medição: Criação de Snapshot Imutável
  const t0_snap = performance.now();
  const snapshot = SnapshotEngine.create({
    asset,
    timeframe,
    price: lastTick?.price || 1.11950,
    bid: lastTick?.bid,
    ask: lastTick?.ask,
    candle: lastClosedCandle || candles[candles.length - 1],
    previousCandles: candles.slice(0, -1),
    indicators,
    parityFeatures,
    marketRegime: "TRENDING",
    dataQuality: 98,
    feedLatencyMs: 12,
    isClosedCandle: true,
  });
  const t1_snap = performance.now();
  const snapLatencyMs = Number((t1_snap - t0_snap).toFixed(3));
  console.log(`[5. Criação do Snapshot]: ${snapLatencyMs} ms`);

  // 6. Medição: Trigger Engine & Loss Guard (Análise Técnica Principal Imediata)
  const t0_loss = performance.now();
  const trigger = TriggerEngine.evaluate(snapshot);
  const t1_loss = performance.now();
  const coreDecisionLatencyMs = Number((t1_loss - t0_loss).toFixed(3));
  console.log(`[6. Análise Técnica Principal (Trigger Engine)]: ${coreDecisionLatencyMs} ms`);

  const primaryPipelineLatencyMs = Number(
    (priceLatencyMs + candleLatencyMs + indicatorLatencyMs + parityLatencyMs + snapLatencyMs + coreDecisionLatencyMs).toFixed(3)
  );
  console.log(`\n>>> LATÊNCIA DA ANÁLISE TÉCNICA PRINCIPAL: ${primaryPipelineLatencyMs} ms <<<\n`);

  // 7. Medição: Chamada aos 4 Modelos de IA (Espera por consenso de múltiplos modelos)
  const t0_ai = performance.now();
  const orchestrator = AIOrchestrator.getInstance();
  const fourAIs = await orchestrator.analyzeWithFourAIs(snapshot, 2000);
  const t1_ai = performance.now();
  const aiConsensusLatencyMs = Number((t1_ai - t0_ai).toFixed(3));
  console.log(`[7. Espera pelos 4 Modelos de IA (Orchestrator)]: ${aiConsensusLatencyMs} ms`);
  console.log(`    ↳ Quórum: ${fourAIs.quorumCount}/4 | GPT=${fourAIs.gpt.latencyMs}ms, Claude=${fourAIs.claude.latencyMs}ms, Gemini=${fourAIs.gemini.latencyMs}ms, Grok=${fourAIs.grok.latencyMs}ms`);

  // 8. Medição: Decisão Consolidada Final
  const t0_cons = performance.now();
  const result = ConsensusEngine.buildNexoraCoreDecision(snapshot, fourAIs, trigger.setupName, false);
  const t1_cons = performance.now();
  const finalConsLatencyMs = Number((t1_cons - t0_cons).toFixed(3));
  console.log(`[8. Consolidação do Consenso]: ${finalConsLatencyMs} ms`);

  console.log("\n==========================================================");
  console.log("RESUMO DO DIAGNÓSTICO DE LATÊNCIA:");
  console.log(`- Pipeline Técnico Principal (Dados + Indicadores + Risco): ${primaryPipelineLatencyMs} ms`);
  console.log(`- Pipeline com Espera Bloqueante das 4 IAs: ${Number((primaryPipelineLatencyMs + aiConsensusLatencyMs).toFixed(3))} ms`);
  console.log(`- Diferença de Espera Bloqueante: +${aiConsensusLatencyMs} ms (${Math.round((aiConsensusLatencyMs / (primaryPipelineLatencyMs || 0.1)) * 100)}% mais lento quando bloqueia!)`);
  console.log("==========================================================");

  return {
    priceLatencyMs,
    candleLatencyMs,
    indicatorLatencyMs,
    parityLatencyMs,
    snapLatencyMs,
    coreDecisionLatencyMs,
    primaryPipelineLatencyMs,
    aiConsensusLatencyMs,
    finalConsLatencyMs,
  };
}

runDiagnostics().catch(console.error);
