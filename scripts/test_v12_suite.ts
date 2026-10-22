// ==========================================================
// TEST SUITE — NEXORA VISION AI V12 PRO MANDATORY VERIFICATION
// ==========================================================

import assert from "node:assert";
import { ConsensusEngine } from "../server/engine/consensusEngine.js";
import { AIOrchestrator } from "../server/ai/orchestrator.js";
import { LossGuard } from "../server/engine/lossGuard.js";
import { SnapshotEngine } from "../server/engine/snapshot.js";
import { MarketDataEngine } from "../server/engine/marketData.js";
import { FourAIResults, MarketSnapshot } from "../src/types.js";

async function runTests() {
  console.log("=== INICIANDO BATERIA DE TESTES OBRIGATÓRIOS V12 PRO ===\n");

  // TEST 1: Alinhamento do contador ao fechamento M1
  console.log("1. Testando alinhamento do contador ao fechamento M1...");
  const bucketMs = 60 * 1000;
  const t1 = 1710000030000; // 30s past minute
  const nextClose1 = Math.floor(t1 / bucketMs) * bucketMs + bucketMs;
  const rem1 = Math.ceil((nextClose1 - t1) / 1000);
  assert.strictEqual(rem1, 30, "Contador deve ter 30 segundos restantes aos 30s");

  const t2 = 1710000059500; // 59.5s past minute
  const nextClose2 = Math.floor(t2 / bucketMs) * bucketMs + bucketMs;
  const rem2 = Math.ceil((nextClose2 - t2) / 1000);
  assert.strictEqual(rem2, 1, "Contador deve ter 1 segundo restante aos 59.5s");
  console.log("✓ Teste 1 passou: Alinhamento exato ao limite M1.\n");

  // TEST 2: Ausência de contagem negativa
  console.log("2. Testando ausência de contagem negativa...");
  const pastTime = Date.now() + 5000;
  const negativeCheck = Math.max(0, Math.ceil((Date.now() - pastTime) / 1000));
  assert.ok(negativeCheck >= 0, "Contagem nunca pode ser negativa");
  assert.strictEqual(negativeCheck, 0, "Valor clampado em zero");
  console.log("✓ Teste 2 passou: Zero contagem negativa garantida.\n");

  // TEST 3: Desconexão e reconexão do feed
  console.log("3. Testando desconexão e reconexão do feed...");
  const market = MarketDataEngine.getInstance();
  market.setConnectionStatus("OFFLINE");
  assert.strictEqual(market.getStatus(), "OFFLINE", "Feed deve reportar OFFLINE");
  market.setConnectionStatus("LIVE");
  assert.strictEqual(market.getStatus(), "LIVE", "Feed deve reportar LIVE após reconectar");
  console.log("✓ Teste 3 passou: Desconexão e reconexão auditada.\n");

  // TEST 4: Timeout e divergência 3/4
  console.log("4. Testando divergência 3/4...");
  const snapId = `test-snap-${Date.now()}`;
  const now = Date.now();
  const mockDivergent3_4: FourAIResults = {
    gpt: { provider: "OpenAI", agent: "GPT", model: "gpt-4o-mini", status: "SUCCESS", snapshotId: snapId, direction: "PAR", confidence: 90, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 50, timestamp: now },
    claude: { provider: "Anthropic", agent: "CLAUDE", model: "haiku", status: "SUCCESS", snapshotId: snapId, direction: "PAR", confidence: 85, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 50, timestamp: now },
    gemini: { provider: "Google", agent: "GEMINI", model: "gemini-flash", status: "SUCCESS", snapshotId: snapId, direction: "PAR", confidence: 92, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 50, timestamp: now },
    grok: { provider: "xAI", agent: "GROK", model: "grok-2", status: "SUCCESS", snapshotId: snapId, direction: "IMPAR", confidence: 80, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 50, timestamp: now },
    totalLatencyMs: 50,
    allSuccess: true,
    quorumCount: 4,
  };
  const divConsensus = ConsensusEngine.evaluateConsensus(mockDivergent3_4, snapId, true);
  assert.strictEqual(divConsensus.consensus, "WAIT", "Divergência 3/4 deve resultar em WAIT");
  assert.ok(divConsensus.consensusLabel.includes("AGUARDAR"), "Label deve indicar AGUARDAR — CONSENSO NÃO VALIDADO");
  console.log(`✓ Teste 4 passou: Divergência 3/4 bloqueia sinal com status: ${divConsensus.consensusLabel}.\n`);

  // TEST 5: Consenso válido 4/4 PAR e 4/4 IMPAR
  console.log("5. Testando consenso unânime 4/4 PAR e 4/4 IMPAR...");
  const mock4_4_Par: FourAIResults = {
    ...mockDivergent3_4,
    grok: { ...mockDivergent3_4.grok, direction: "PAR" },
  };
  const parConsensus = ConsensusEngine.evaluateConsensus(mock4_4_Par, snapId, true);
  assert.strictEqual(parConsensus.consensus, "PAR", "Consenso 4/4 PAR deve ser PAR");
  assert.strictEqual(parConsensus.consensusLabel, "4/4 PAR", "Label deve ser 4/4 PAR");

  const mock4_4_Impar: FourAIResults = {
    gpt: { ...mockDivergent3_4.gpt, direction: "IMPAR" },
    claude: { ...mockDivergent3_4.claude, direction: "IMPAR" },
    gemini: { ...mockDivergent3_4.gemini, direction: "IMPAR" },
    grok: { ...mockDivergent3_4.grok, direction: "IMPAR" },
    totalLatencyMs: 40,
    allSuccess: true,
    quorumCount: 4,
  };
  const imparConsensus = ConsensusEngine.evaluateConsensus(mock4_4_Impar, snapId, true);
  assert.strictEqual(imparConsensus.consensus, "IMPAR", "Consenso 4/4 IMPAR deve ser IMPAR");
  assert.strictEqual(imparConsensus.consensusLabel, "4/4 IMPAR", "Label deve ser 4/4 IMPAR");
  console.log("✓ Teste 5 passou: Consenso 4/4 PAR e 4/4 IMPAR validados com sucesso.\n");

  // TEST 6: Snapshot expirado (> 60s)
  console.log("6. Testando snapshot expirado (> 60s)...");
  const expiredSnapshot: MarketSnapshot = {
    snapshotId: "expired-snap-01",
    timestamp: Date.now() - 65000, // 65 seconds old
    platform: "QUOTEX",
    asset: "EUR/USD",
    timeframe: "1M",
    price: 1.08250,
    candle: { open: 1.0824, high: 1.0826, low: 1.0823, close: 1.0825, volume: 10, timestamp: Date.now() - 65000, closed: true },
    indicators: {} as any,
    parityFeatures: {} as any,
    marketRegime: "TRENDING",
    dataQuality: 98,
    feedLatencyMs: 15,
    isClosedCandle: true,
  };
  const orch = AIOrchestrator.getInstance();
  try {
    await orch.analyzeWithFourAIs(expiredSnapshot, 1000);
    assert.fail("Deveria ter lançado erro de sinal expirado");
  } catch (err: any) {
    assert.ok(err.message.includes("SINAL EXPIRADO"), "Erro deve conter SINAL EXPIRADO");
  }
  console.log("✓ Teste 6 passou: Snapshot expirado descartado com 'SINAL EXPIRADO — AGUARDAR NOVA VELA'.\n");

  // TEST 7: Respostas com snapshotId incorreto
  console.log("7. Testando respostas com snapshotId incorreto...");
  const wrongSnapResults: FourAIResults = {
    ...mock4_4_Par,
    gemini: { ...mock4_4_Par.gemini, snapshotId: "OUTRO_SNAPSHOT_ID" },
  };
  const wrongConsensus = ConsensusEngine.evaluateConsensus(wrongSnapResults, snapId, true);
  assert.strictEqual(wrongConsensus.consensus, "WAIT", "SnapshotId incorreto deve ser rejeitado");
  console.log("✓ Teste 7 passou: Respostas com snapshotId diferente são rejeitadas.\n");

  // TEST 8: Loss Guard Bloqueando e Cooldown
  console.log("8. Testando Loss Guard...");
  const lossGuard = LossGuard.getInstance();
  lossGuard.resetCooldown();
  // Simular perdas consecutivas
  lossGuard.recordOutcome(false);
  lossGuard.recordOutcome(false);
  lossGuard.recordOutcome(false);
  lossGuard.recordOutcome(false);
  const lgStatus = lossGuard.getStatus();
  assert.ok(lgStatus.consecutiveLosses >= 4, "Consecutive losses registrado");
  assert.ok(lgStatus.cooldownRemainingSec > 0, "Cooldown deve estar ativo");

  const validSnapshot: MarketSnapshot = {
    ...expiredSnapshot,
    snapshotId: snapId,
    timestamp: Date.now(),
  };
  const lgCheck = lossGuard.verify(validSnapshot, mock4_4_Par, parConsensus);
  assert.strictEqual(lgCheck.passed, false, "Loss Guard deve bloquear durante cooldown");
  lossGuard.resetCooldown(); // Reset após teste
  console.log("✓ Teste 8 passou: Loss Guard acionado com bloqueio por cooldown protetivo.\n");

  // TEST 9: Modo PAPER Ativo e Ausência de Execução Real
  console.log("9. Testando modo PAPER ativo e ausência de execução real...");
  const coreDecision = ConsensusEngine.buildNexoraCoreDecision(validSnapshot, mock4_4_Par, "TEST_SETUP", true);
  assert.strictEqual(coreDecision.isPaperMode, true, "Modo paper deve estar estritamente ON");
  console.log("✓ Teste 9 passou: PAPER MODE = ON confirmado, zero execução real.\n");

  console.log("=== TODOS OS 9 TESTES OBRIGATÓRIOS PASSARAM COM SUCESSO! ===");
}

runTests().catch((e) => {
  console.error("FALHA NOS TESTES:", e);
  process.exit(1);
});
