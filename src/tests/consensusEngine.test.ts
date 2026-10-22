// ==========================================================
// NEXORA TRADER AI — ULTIMATE INTELLIGENCE CORE V4 TEST SUITE
// Automated verification for all required scenarios:
// 1. 4/4 PAR
// 2. 4/4 IMPAR
// 3. 3/4
// 4. 2/4
// 5. 1/4
// 6. 0/4
// 7. IA OFFLINE
// 8. DATA STALE
// 9. CONTRADICTION
// 10. REGIME UNKNOWN
// 11. RISK BLOCK
// 12. PAPER
// 13. LOSS
// 14. LEARNING
// 15. DRIFT
// ==========================================================

import {
  NexoraConsensusEngine,
  calculateConsensus,
  ContradictionEngine,
  SignalQualityGate,
  evaluateRiskEngine,
  RegimeEngine,
} from "../../server/services/consensusEngine";
import {
  ConsensusMarketSnapshot,
  AIStructuredResponse,
} from "../types/nexora4AIConsensus";

export class ConsensusEngineTestSuite {
  static async runAllTests(): Promise<{ total: number; passed: number; failed: number; results: any[] }> {
    const results: any[] = [];
    const engine = NexoraConsensusEngine.getInstance();

    const record = (name: string, passed: boolean, details?: string) => {
      results.push({ name, passed, details });
    };

    // Helper de base snapshot
    const createBaseSnapshot = (seq: number[] = [3, 7, 1, 5, 9, 3, 1, 7, 5, 9]): ConsensusMarketSnapshot => ({
      snapshotId: `test-${Date.now()}`,
      platform: "IQ_OPTION",
      asset: "EUR/USD",
      timeframe: "1M",
      timestamp: Date.now(),
      price: 1.08245,
      sequence: seq,
      candles: [
        { time: Date.now() - 60000, open: 1.0820, high: 1.0826, low: 1.0819, close: 1.08245, volume: 1500, isComplete: true },
      ],
      features: { regime: "TRENDING", latencyMs: 20 },
      dataQuality: 98,
      candleClosed: true,
    });

    // 1. Teste: 4/4 PAR
    {
      const res = calculateConsensus([
        { agent: "GPT", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GPT", role: "Padrões", status: "HEALTHY" },
        { agent: "CLAUDE", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "CLAUDE", role: "Auditor", status: "HEALTHY" },
        { agent: "GEMINI", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GEMINI", role: "Técnico", status: "HEALTHY" },
        { agent: "GROK", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GROK", role: "Independente", status: "HEALTHY" },
      ]);
      record("1. 4/4 PAR -> Consenso Unânime PAR", res.unanimous && res.decision === "PAR" && res.agreementCount === 4);
    }

    // 2. Teste: 4/4 IMPAR
    {
      const res = calculateConsensus([
        { agent: "GPT", direction: "IMPAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GPT", role: "Padrões", status: "HEALTHY" },
        { agent: "CLAUDE", direction: "IMPAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "CLAUDE", role: "Auditor", status: "HEALTHY" },
        { agent: "GEMINI", direction: "IMPAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GEMINI", role: "Técnico", status: "HEALTHY" },
        { agent: "GROK", direction: "IMPAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GROK", role: "Independente", status: "HEALTHY" },
      ]);
      record("2. 4/4 IMPAR -> Consenso Unânime IMPAR", res.unanimous && res.decision === "IMPAR" && res.agreementCount === 4);
    }

    // 3. Teste: 3/4 Divergência -> WAIT
    {
      const res = calculateConsensus([
        { agent: "GPT", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GPT", role: "Padrões", status: "HEALTHY" },
        { agent: "CLAUDE", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "CLAUDE", role: "Auditor", status: "HEALTHY" },
        { agent: "GEMINI", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GEMINI", role: "Técnico", status: "HEALTHY" },
        { agent: "GROK", direction: "IMPAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GROK", role: "Independente", status: "HEALTHY" },
      ]);
      record("3. 3/4 -> WAIT estrito (não aceita 3/4 como consenso)", !res.unanimous && res.decision === "WAIT" && res.agreementCount === 3);
    }

    // 4. Teste: 2/4 Empate -> WAIT
    {
      const res = calculateConsensus([
        { agent: "GPT", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GPT", role: "Padrões", status: "HEALTHY" },
        { agent: "CLAUDE", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "CLAUDE", role: "Auditor", status: "HEALTHY" },
        { agent: "GEMINI", direction: "IMPAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GEMINI", role: "Técnico", status: "HEALTHY" },
        { agent: "GROK", direction: "IMPAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GROK", role: "Independente", status: "HEALTHY" },
      ]);
      record("4. 2/4 -> WAIT", !res.unanimous && res.decision === "WAIT" && res.agreementCount === 2);
    }

    // 5. Teste: 1/4 -> WAIT
    {
      const res = calculateConsensus([
        { agent: "GPT", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GPT", role: "Padrões", status: "HEALTHY" },
        { agent: "CLAUDE", direction: "WAIT", confidence: 0, patternStrength: 0, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "CLAUDE", role: "Auditor", status: "HEALTHY" },
        { agent: "GEMINI", direction: "WAIT", confidence: 0, patternStrength: 0, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GEMINI", role: "Técnico", status: "HEALTHY" },
        { agent: "GROK", direction: "WAIT", confidence: 0, patternStrength: 0, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GROK", role: "Independente", status: "HEALTHY" },
      ]);
      record("5. 1/4 -> WAIT", !res.unanimous && res.decision === "WAIT" && res.agreementCount === 1);
    }

    // 6. Teste: 0/4 -> WAIT
    {
      const res = calculateConsensus([
        { agent: "GPT", direction: "WAIT", confidence: 0, patternStrength: 0, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GPT", role: "Padrões", status: "HEALTHY" },
        { agent: "CLAUDE", direction: "WAIT", confidence: 0, patternStrength: 0, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "CLAUDE", role: "Auditor", status: "HEALTHY" },
        { agent: "GEMINI", direction: "WAIT", confidence: 0, patternStrength: 0, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GEMINI", role: "Técnico", status: "HEALTHY" },
        { agent: "GROK", direction: "WAIT", confidence: 0, patternStrength: 0, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: [], invalidations: [], timestamp: Date.now(), provider: "GROK", role: "Independente", status: "HEALTHY" },
      ]);
      record("6. 0/4 -> WAIT", !res.unanimous && res.decision === "WAIT" && res.agreementCount === 0);
    }

    // 7. Teste: IA OFFLINE -> Não produz consenso
    {
      engine.setModelHealth("GROK", "OFFLINE");
      const snap = createBaseSnapshot();
      const evalRes = await engine.evaluateSnapshot(snap);
      record("7. IA OFFLINE -> Bloqueio por Quality Gate (NO TRADE)", evalRes.finalDecision === "NO TRADE" && !evalRes.passedQualityGate);
      engine.setModelHealth("GROK", "HEALTHY"); // restaura
    }

    // 8. Teste: DATA STALE -> NO TRADE
    {
      const snap = createBaseSnapshot();
      snap.timestamp = Date.now() - 30000; // 30s atrás (> 15s)
      const evalRes = await engine.evaluateSnapshot(snap);
      record("8. DATA STALE -> Bloqueio por Timestamp (NO TRADE)", evalRes.finalDecision === "NO TRADE");
    }

    // 9. Teste: CONTRADICTION -> Veto de Consenso (WAIT)
    {
      const aiWithContradiction: AIStructuredResponse[] = [
        { agent: "GPT", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: ["Ruptura catastrófica do padrão", "Persistência de anomalia unipolar severa"], invalidations: [], timestamp: Date.now(), provider: "GPT", role: "Padrões", status: "HEALTHY" },
        { agent: "CLAUDE", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: ["Ruptura catastrófica do padrão"], invalidations: [], timestamp: Date.now(), provider: "CLAUDE", role: "Auditor", status: "HEALTHY" },
        { agent: "GEMINI", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: ["Persistência de anomalia unipolar"], invalidations: [], timestamp: Date.now(), provider: "GEMINI", role: "Técnico", status: "HEALTHY" },
        { agent: "GROK", direction: "PAR", confidence: 85, patternStrength: 85, marketRegime: "TRENDING", dataQuality: 98, reasons: [], contradictions: ["Ruptura catastrófica"], invalidations: [], timestamp: Date.now(), provider: "GROK", role: "Independente", status: "HEALTHY" },
      ];
      const consensus = calculateConsensus(aiWithContradiction);
      const contradiction = ContradictionEngine.evaluate(aiWithContradiction, consensus);
      record("9. CONTRADICTION -> Veto adversário acionado", contradiction.hasStrongContradiction && contradiction.vetoTriggered);
    }

    // 10. Teste: REGIME UNKNOWN / UNCERTAIN -> Bloqueio
    {
      const snap = createBaseSnapshot();
      snap.dataQuality = 50; // Feed degradado induz UNCERTAIN
      const regime = RegimeEngine.classify(snap);
      record("10. REGIME UNCERTAIN -> Classificação segura", regime === "UNCERTAIN");
    }

    // 11. Teste: RISK BLOCK -> Drawdown de perdas consecutivas
    {
      const snap = createBaseSnapshot();
      const risk = evaluateRiskEngine({
        snapshot: snap,
        consecutiveLosses: 3,
        cooldownActive: true,
      });
      record("11. RISK BLOCK -> Bloqueio por 3 perdas e cooldown", !risk.allowed && risk.status === "BLOCKED");
    }

    // 12. Teste: PAPER MODE -> Nexora opera em modo seguro
    {
      const snap = createBaseSnapshot();
      const evalRes = await engine.evaluateSnapshot(snap);
      record("12. PAPER MODE -> Flag isPaperMode ativa", evalRes.isPaperMode === true);
    }

    // 13. Teste: LOSS -> Dispara autópsia detalhada
    {
      const saved = engine.recordResult({
        timestamp: Date.now(),
        platform: "IQ_OPTION",
        asset: "EUR/USD",
        timeframe: "1M",
        regime: "TRENDING",
        setup: "DESVIO_DE_PARIDADE",
        decision: "PAR",
        consensusScore: 100,
        gpt: "PAR",
        claude: "PAR",
        gemini: "PAR",
        grok: "PAR",
        result: "LOSS",
        dataQuality: 98,
        latencyMs: 25,
      });
      record("13. LOSS -> Autópsia detalhada gerada", !!saved.lossAutopsy && saved.lossAutopsy.failedAIs.length === 4);
    }

    // 14. Teste: LEARNING -> Registro persistido por plataforma
    {
      const records = engine.getLearningRecords("IQ_OPTION");
      record("14. LEARNING -> Registro indexado por plataforma", records.length > 0);
    }

    // 15. Teste: DRIFT -> Métricas de agente rastreadas
    {
      const metrics = engine.getAgentMetrics();
      record("15. DRIFT -> Métricas dos 4 agentes presentes", !!metrics.GPT && !!metrics.CLAUDE && !!metrics.GEMINI && !!metrics.GROK);
    }

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    return { total, passed, failed, results };
  }
}

// Execução standalone
if (process.argv[1]?.endsWith("consensusEngine.test.ts")) {
  ConsensusEngineTestSuite.runAllTests().then((res) => {
    console.log("=== RESULTADOS DA SUÍTE DE TESTES CORE V4 ===");
    res.results.forEach((r) => {
      console.log(`${r.passed ? "✅" : "❌"} ${r.name}`);
    });
    console.log(`TOTAL: ${res.total} | PASSOU: ${res.passed} | FALHOU: ${res.failed}`);
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
