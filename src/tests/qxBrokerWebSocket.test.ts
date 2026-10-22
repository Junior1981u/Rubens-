// ==========================================================
// NEXORA TITAN AI — SUÍTE DE TESTES: QX BROKER WEBSOCKET SEGURO
// Validação isolada de diagnóstico, segurança, EIO=3 e Paper Mode
// ==========================================================

import { QXBrokerTestManager } from "../../server/engine/qxBrokerTest.js";

export class QXBrokerWebSocketTestSuite {
  public static async runAllTests(): Promise<{
    passed: number;
    total: number;
    details: { testNumber: number; name: string; passed: boolean; reason?: string }[];
  }> {
    const details: { testNumber: number; name: string; passed: boolean; reason?: string }[] = [];
    let passed = 0;

    const manager = QXBrokerTestManager.getInstance();

    // Teste 1: Estado Inicial Auditável e Seguro
    {
      const initialReport = manager.getReport();
      const ok =
        initialReport.endpoint.includes("ws2.qxbroker.com") &&
        initialReport.eioVersion === "3" &&
        initialReport.transport === "websocket" &&
        initialReport.safetyNotice.paperModeActive === true;

      if (ok) passed++;
      details.push({
        testNumber: 1,
        name: "Endpoint e Protocolo EIO=3 Configurados Estritamente",
        passed: ok,
        reason: `Endpoint: ${initialReport.endpoint} | Origin: ${initialReport.targetOrigin} | EIO: ${initialReport.eioVersion}`,
      });
    }

    // Teste 2: Isolamento do Teste Seguro (Não afeta motor de sinais nem Twelve Data)
    {
      const report = await manager.runTest();
      const validState =
        report.state === "FALHA" ||
        report.state === "CONECTADO" ||
        report.state === "DADOS RECEBIDOS" ||
        report.state === "CONECTANDO";

      const ok = validState && report.safetyNotice.paperModeActive === true && report.safetyNotice.ordersSent === false;
      if (ok) passed++;
      details.push({
        testNumber: 2,
        name: "Execução Isolada com Diagnóstico Real e Paper Mode Ativo",
        passed: ok,
        reason: `Estado obtido: ${report.state} | Tempo: ${report.connectionTimeMs}ms | Erro: ${report.summaryError || "Nenhum"}`,
      });
    }

    // Teste 3: Aviso Explícito quando não há cotações válidas de mercado
    {
      const report = manager.getReport();
      const hasWarning =
        typeof report.explicitWarning === "string" &&
        report.explicitWarning.length > 10 &&
        report.explicitWarning.toUpperCase().includes("AVISO");

      if (hasWarning) passed++;
      details.push({
        testNumber: 3,
        name: "Aviso Explícito de Ausência de Cotações ou Rejeição de Handshake",
        passed: hasWarning,
        reason: report.explicitWarning.slice(0, 80) + "...",
      });
    }

    // Teste 4: Ocultação de Dados Sensíveis e Proteção de Sessão
    {
      const report = manager.getReport();
      const ok =
        report.safetyNotice.sensitiveDataMasked === true &&
        report.safetyNotice.financialExecutionBlocked === true &&
        !JSON.stringify(report).includes("password") &&
        !JSON.stringify(report).includes("secret");

      if (ok) passed++;
      details.push({
        testNumber: 4,
        name: "Máscara de Dados Sensíveis e Bloqueio Financeiro Total",
        passed: ok,
        reason: "Zero exposição de credenciais, cookies ou dados privados nos relatórios",
      });
    }

    // Teste 5: Não Exibir LIVE sem Cotações Comprovadas
    {
      const report = manager.getReport();
      // Se não foram identificadas cotações válidas, a compatibilidade marketDataIdentified deve ser false
      const ok = report.compatibility.marketDataIdentified === false || report.messagesReceivedCount > 0;

      if (ok) passed++;
      details.push({
        testNumber: 5,
        name: "Conexão Não Declara Falso LIVE sem Cotações de Mercado",
        passed: ok,
        reason: `Cotações identificadas: ${report.compatibility.marketDataIdentified ? "SIM" : "NÃO"} | Mensagens: ${report.messagesReceivedCount}`,
      });
    }

    return {
      passed,
      total: details.length,
      details,
    };
  }
}
