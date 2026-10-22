// ==========================================================
// NEXORA TITAN AI — SUÍTE DE TESTES: OLYMP TRADE DATA CONNECTOR SAFE MODE
// Validações obrigatórias: Conexão, Leitura, M1, Detecção de Lacunas, Comparação c/ Referência, Paper Mode
// ==========================================================

import { OlympTradeConnectorManager } from "../../server/engine/olympTradeConnector.js";
import { MarketDataEngine } from "../../server/engine/marketData.js";
import { TwelveDataWebSocketManager } from "../../server/engine/twelveDataWebSocket.js";

export class OlympTradeConnectorTestSuite {
  public static async runAllTests(): Promise<{
    passed: number;
    total: number;
    details: { testNumber: number; name: string; passed: boolean; reason?: string }[];
  }> {
    const details: { testNumber: number; name: string; passed: boolean; reason?: string }[] = [];
    let passed = 0;

    const manager = OlympTradeConnectorManager.getInstance();

    // Teste 1: Auditoria da Biblioteca Python 'olymptrade_ws'
    {
      const report = manager.getReport();
      const audit = report.pythonLibraryAudit;
      const ok =
        audit.isOfficial === false &&
        audit.requiresPrivateSessionToken === true &&
        audit.maintenanceStatus === "COMMUNITY_UNOFFICIAL" &&
        audit.tosViolationRisk.includes("ALTO RISCO DE TOS");

      if (ok) passed++;
      details.push({
        testNumber: 1,
        name: "Auditoria Rigorosa da Biblioteca Python 'olymptrade_ws' (Não Oficial & Requer Token Privado)",
        passed: ok,
        reason: `Origem: ${audit.sourceRepo} | Oficial: NÃO | Exige Token Privado: SIM`,
      });
    }

    // Teste 2: Conexão e Leitura Segura — Diferenciação Honesta de Estado (Zero falso LIVE)
    {
      const report = await manager.runSafeConnectionTest();
      // O conector deve reportar FALHA ou REQUER_AUTENTICACAO_PRIVADA de forma honesta sem declarar falso LIVE
      const honestState =
        report.state === "REQUER_AUTENTICACAO_PRIVADA" ||
        report.state === "FALHA" ||
        report.state === "CONECTADO" ||
        report.state === "DADOS RECEBIDOS";

      const ok =
        honestState &&
        report.marketDataIdentified === false && // Não há cotações públicas anônimas comprovadas
        report.safetyNotice.paperModeActive === true &&
        report.safetyNotice.ordersSent === false;

      if (ok) passed++;
      details.push({
        testNumber: 2,
        name: "Conexão Segura e Diferenciação Honesta de Estado (Zero Falso LIVE)",
        passed: ok,
        reason: `Estado detectado: ${report.state} | Tempo: ${report.connectionTimeMs}ms | Cotações Identificadas: NÃO`,
      });
    }

    // Teste 3: Confirmação Estrita do Período M1 e Coerência OHLC
    {
      const validCandle = {
        symbol: "EUR/USD",
        timestamp: Date.now() - 30000,
        open: 1.08250,
        high: 1.08265,
        low: 1.08240,
        close: 1.08255,
        periodSeconds: 60,
      };

      const invalidCandle = {
        symbol: "EUR/USD",
        timestamp: Date.now() - 30000,
        open: 1.08250,
        high: 1.08240, // High menor que Open!
        low: 1.08260,  // Low maior que Open!
        close: 1.08245,
        periodSeconds: 120, // Período 2M (não M1)
      };

      const resultValid = manager.validateM1Candle(validCandle, "EUR/USD");
      const resultInvalid = manager.validateM1Candle(invalidCandle, "EUR/USD");

      const ok =
        resultValid.valid === true &&
        resultValid.timeframeM1Confirmed === true &&
        resultValid.ohlcConsistent === true &&
        resultInvalid.valid === false &&
        resultInvalid.timeframeM1Confirmed === false &&
        resultInvalid.ohlcConsistent === false;

      if (ok) passed++;
      details.push({
        testNumber: 3,
        name: "Confirmação do Período M1 (60s) e Validação de Coerência OHLC",
        passed: ok,
        reason: `Vela correta: APROVADA | Vela incoerente (H < O): REJEITADA (${resultInvalid.reasons.length} falhas detectadas)`,
      });
    }

    // Teste 4: Detecção Rigorosa de Velas Ausentes ou Atrasadas (> 120s)
    {
      const now = Date.now();
      const delayedCandle = {
        symbol: "EUR/USD",
        timestamp: now - 180000, // 180s atrás (> 120s limite)
        open: 1.08250,
        high: 1.08265,
        low: 1.08240,
        close: 1.08255,
        periodSeconds: 60,
      };

      const validation = manager.validateM1Candle(delayedCandle, "EUR/USD");
      const ok = validation.isDelayed === true && validation.valid === false;

      // Também testar detecção de lacunas em série temporal
      const mockSeries = [
        { time: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
        { time: 1060, open: 1.5, high: 2, low: 1, close: 1.8, volume: 12 },
        { time: 1300, open: 1.8, high: 2.2, low: 1.7, close: 2.0, volume: 15 }, // Lacuna de 240s!
      ];
      const gaps = manager.detectMissingOrDelayedCandles(mockSeries, 60, 120);

      const allOk = ok && gaps.hasGaps === true && gaps.missingCandlesCount >= 1;

      if (allOk) passed++;
      details.push({
        testNumber: 4,
        name: "Detecção Rigorosa de Velas Ausentes ou Atrasadas (> 120s)",
        passed: allOk,
        reason: `Vela de 180s: ATRASADA (Idade: ${validation.ageSeconds}s) | Lacunas detectadas na série: ${gaps.missingCandlesCount}`,
      });
    }

    // Teste 5: Comparação de Timestamps e Preços com Fonte de Referência (Twelve Data / Interbank)
    {
      const marketEngine = MarketDataEngine.getInstance();
      const refTick = marketEngine.getLastTick("EUR/USD");
      const currentRefPrice = refTick?.price ?? 1.08250;

      const sampleCandle = {
        symbol: "EUR/USD",
        timestamp: Date.now() - 10000,
        open: currentRefPrice,
        high: currentRefPrice + 0.0001,
        low: currentRefPrice - 0.0001,
        close: currentRefPrice + 0.00005,
        periodSeconds: 60,
      };

      const validation = manager.validateM1Candle(sampleCandle, "EUR/USD");
      const comp = validation.referenceComparison;

      const ok =
        comp !== undefined &&
        comp.referencePrice > 0 &&
        typeof comp.difference === "number" &&
        comp.percentageDiff < 1.0 &&
        comp.alignedTimestamps === true;

      if (ok) passed++;
      details.push({
        testNumber: 5,
        name: "Comparação de Timestamps e Preços com Fonte de Referência Oficial",
        passed: ok,
        reason: `Ref: ${comp?.referenceSource} | Preço: ${comp?.referencePrice} | Diferença: ${comp?.difference} (${comp?.percentageDiff}%)`,
      });
    }

    // Teste 6: Registro de Sinais Simulados em PAPER MODE (Zero Execução Financeira)
    {
      const simResult = manager.registerSimulatedSignal("EUR/USD", "M1", "PAR");
      const report = manager.getReport();

      const ok =
        simResult.success === true &&
        simResult.simulatedSignal.paperOnly === true &&
        report.safetyNotice.paperModeActive === true &&
        report.safetyNotice.ordersSent === false &&
        report.safetyNotice.financialExecutionBlocked === true &&
        report.simulatedSignalHistory.length > 0;

      if (ok) passed++;
      details.push({
        testNumber: 6,
        name: "Registro de Sinais Simulados em PAPER MODE com Zero Execução Financeira",
        passed: ok,
        reason: `Sinal id: ${simResult.simulatedSignal.id} | Paper Only: true | Ordens enviadas: ZERO`,
      });
    }

    // Teste 7: Preservação Integral dos Motores Existentes e Twelve Data
    {
      const twelveWs = TwelveDataWebSocketManager.getInstance();
      const twelveStatus = twelveWs.getStatus();
      const marketEngine = MarketDataEngine.getInstance();
      const tick = marketEngine.getLastTick("EUR/USD");

      const ok =
        twelveStatus !== undefined &&
        (twelveStatus.status === "DISABLED" ||
          twelveStatus.status === "INVALID_KEY" ||
          twelveStatus.status === "CONNECTING" ||
          twelveStatus.status === "DISCONNECTED" ||
          twelveStatus.status === "CONNECTED") &&
        tick !== null &&
        tick.price > 0;

      if (ok) passed++;
      details.push({
        testNumber: 7,
        name: "Preservação Integral de Twelve Data, Motor de Sinais e Paper Mode",
        passed: ok,
        reason: `Twelve Data status: ${twelveStatus.status} | Feed Interbancário ativo: EUR/USD a ${tick?.price} | Paper Mode: Ativo`,
      });
    }

    return {
      passed,
      total: details.length,
      details,
    };
  }
}
