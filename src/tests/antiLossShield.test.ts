// ==========================================================
// NEXORA VISION AI V16 — ANTI-LOSS SHIELD TEST SUITE
// Testes de Validação do Filtro Anti-Loss Blindado
// Garante que entradas de alto risco / baixa probabilidade são bloqueadas
// ==========================================================

import { LossGuard } from "../../server/engine/lossGuard.js";
import { SnapshotEngine } from "../../server/engine/snapshot.js";
import { FeatureEngine } from "../../server/engine/featureEngine.js";
import { ParityEngine } from "../../server/engine/parityEngine.js";
import { MarketSnapshot, FourAIResults, ConsensusResult } from "../../src/types.js";

export class AntiLossShieldTestSuite {
  public static async runAllTests(): Promise<{ total: number; passed: number; failed: number; results: any[] }> {
    const results: any[] = [];
    const lossGuard = LossGuard.getInstance();

    const record = (name: string, passed: boolean, details?: string) => {
      results.push({ name, passed, details });
    };

    const mockFourAIs: FourAIResults = {
      gpt: { provider: "OpenAI", agent: "GPT", model: "m", status: "SUCCESS", snapshotId: "s", direction: "PAR", confidence: 90, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 10, timestamp: Date.now() },
      claude: { provider: "Anthropic", agent: "CLAUDE", model: "m", status: "SUCCESS", snapshotId: "s", direction: "PAR", confidence: 90, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 10, timestamp: Date.now() },
      gemini: { provider: "Google", agent: "GEMINI", model: "m", status: "SUCCESS", snapshotId: "s", direction: "PAR", confidence: 90, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 10, timestamp: Date.now() },
      grok: { provider: "xAI", agent: "GROK", model: "m", status: "SUCCESS", snapshotId: "s", direction: "PAR", confidence: 90, evidence: [], counterEvidence: [], invalidation: "", latencyMs: 10, timestamp: Date.now() },
      totalLatencyMs: 10,
      allSuccess: true,
      quorumCount: 4,
    };

    const mockConsensusPAR: ConsensusResult = {
      consensus: "PAR",
      agreementCount: 4,
      unanimous: true,
      consensusLabel: "4/4 PAR",
      onlineQuorumRatio: "4/4",
      isStrict4_4: true,
      directions: { gpt: "PAR", claude: "PAR", gemini: "PAR", grok: "PAR" },
      reasons: [],
      snapshotId: "s",
    };

    const mockConsensusIMPAR: ConsensusResult = {
      consensus: "IMPAR",
      agreementCount: 4,
      unanimous: true,
      consensusLabel: "4/4 IMPAR",
      onlineQuorumRatio: "4/4",
      isStrict4_4: true,
      directions: { gpt: "IMPAR", claude: "IMPAR", gemini: "IMPAR", grok: "IMPAR" },
      reasons: [],
      snapshotId: "s",
    };

    // 1. Teste: Mercado Lateral / Médias comprimidas -> VETO
    {
      const snapshot = SnapshotEngine.create({
        asset: "EUR/USD",
        timeframe: "1M",
        price: 1.08250,
        bid: 1.08249,
        ask: 1.08251,
        candle: { open: 1.08240, high: 1.08260, low: 1.08235, close: 1.08250, volume: 10, timestamp: Date.now(), closed: true },
        previousCandles: [],
        indicators: {
          ...FeatureEngine.calculate([]),
          ema9: 1.082500,
          ema21: 1.082502, // Diferença menor que 0.00008 (mercado comprimido)
        },
        parityFeatures: ParityEngine.calculate([], "TRENDING"),
        marketRegime: "TRENDING",
        dataQuality: 98,
        feedLatencyMs: 15,
        isClosedCandle: true,
      });

      const check = lossGuard.verify(snapshot, mockFourAIs, mockConsensusPAR);
      const isVetoed = !check.passed && check.blockers.some((b) => b.includes("consolidação lateral"));
      record("1. Mercado lateral comprimido -> Bloqueio pelo Filtro Anti-Loss", isVetoed, check.blockers[0]);
    }

    // 2. Teste: Vela de Indecisão / Doji -> VETO
    {
      const snapshot = SnapshotEngine.create({
        asset: "EUR/USD",
        timeframe: "1M",
        price: 1.08250,
        bid: 1.08249,
        ask: 1.08251,
        candle: { open: 1.08250, high: 1.08290, low: 1.08210, close: 1.08251, volume: 10, timestamp: Date.now(), closed: true }, // Range: 0.00080, corpo: 0.00001
        previousCandles: [],
        indicators: {
          ...FeatureEngine.calculate([]),
          ema9: 1.08300,
          ema21: 1.08200,
        },
        parityFeatures: ParityEngine.calculate([], "TRENDING"),
        marketRegime: "TRENDING",
        dataQuality: 98,
        feedLatencyMs: 15,
        isClosedCandle: true,
      });

      const check = lossGuard.verify(snapshot, mockFourAIs, mockConsensusPAR);
      const isVetoed = !check.passed && check.blockers.some((b) => b.includes("Doji"));
      record("2. Vela de indecisão (Doji) -> Bloqueio pelo Filtro Anti-Loss", isVetoed, check.blockers[0]);
    }

    // 3. Teste: Rejeição severa no topo para COMPRA -> VETO
    {
      const snapshot = SnapshotEngine.create({
        asset: "EUR/USD",
        timeframe: "1M",
        price: 1.08220,
        bid: 1.08219,
        ask: 1.08221,
        candle: { open: 1.08210, high: 1.08280, low: 1.08205, close: 1.08220, volume: 10, timestamp: Date.now(), closed: true }, // Corpo: 0.00010, pavio superior: 0.00060 (6x o corpo)
        previousCandles: [],
        indicators: {
          ...FeatureEngine.calculate([]),
          ema9: 1.08300,
          ema21: 1.08200,
        },
        parityFeatures: ParityEngine.calculate([], "TRENDING"),
        marketRegime: "TRENDING",
        dataQuality: 98,
        feedLatencyMs: 15,
        isClosedCandle: true,
      });

      const check = lossGuard.verify(snapshot, mockFourAIs, mockConsensusPAR);
      const isVetoed = !check.passed && check.blockers.some((b) => b.includes("pavio superior"));
      record("3. Rejeição com pavio superior dominante -> Bloqueio de Compra", isVetoed, check.blockers[0]);
    }

    // 4. Teste: Rejeição severa no fundo para VENDA -> VETO
    {
      const snapshot = SnapshotEngine.create({
        asset: "EUR/USD",
        timeframe: "1M",
        price: 1.08250,
        bid: 1.08249,
        ask: 1.08251,
        candle: { open: 1.08260, high: 1.08265, low: 1.08190, close: 1.08250, volume: 10, timestamp: Date.now(), closed: true }, // Corpo: 0.00010, pavio inferior: 0.00060
        previousCandles: [],
        indicators: {
          ...FeatureEngine.calculate([]),
          ema9: 1.08200,
          ema21: 1.08300,
        },
        parityFeatures: ParityEngine.calculate([], "TRENDING"),
        marketRegime: "TRENDING",
        dataQuality: 98,
        feedLatencyMs: 15,
        isClosedCandle: true,
      });

      const check = lossGuard.verify(snapshot, mockFourAIs, mockConsensusIMPAR);
      const isVetoed = !check.passed && check.blockers.some((b) => b.includes("pavio inferior"));
      record("4. Rejeição com pavio inferior dominante -> Bloqueio de Venda", isVetoed, check.blockers[0]);
    }

    // 5. Teste: Tentativa de COMPRA em tendência de baixa (EMA9 < EMA21) -> VETO
    {
      const snapshot = SnapshotEngine.create({
        asset: "EUR/USD",
        timeframe: "1M",
        price: 1.08200,
        bid: 1.08199,
        ask: 1.08201,
        candle: { open: 1.08190, high: 1.08215, low: 1.08185, close: 1.08205, volume: 10, timestamp: Date.now(), closed: true },
        previousCandles: [],
        indicators: {
          ...FeatureEngine.calculate([]),
          ema9: 1.08150,
          ema21: 1.08280, // EMA9 bem abaixo da EMA21
        },
        parityFeatures: ParityEngine.calculate([], "TRENDING"),
        marketRegime: "TRENDING",
        dataQuality: 98,
        feedLatencyMs: 15,
        isClosedCandle: true,
      });

      const check = lossGuard.verify(snapshot, mockFourAIs, mockConsensusPAR);
      const isVetoed = !check.passed && check.blockers.some((b) => b.includes("tendência de baixa"));
      record("5. Proibido COMPRA contra médias de baixa -> Bloqueio pelo Filtro Anti-Loss", isVetoed, check.blockers[0]);
    }

    const passed = results.filter((r) => r.passed).length;
    return {
      total: results.length,
      passed,
      failed: results.length - passed,
      results,
    };
  }
}
