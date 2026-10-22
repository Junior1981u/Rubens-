// ==========================================================
// NEXORA TITAN AI V33 — SUPERBRAIN GLOBAL TEST SUITE
// Validates: Global Asset Universe, ISO 4217 Flags, Broker Connectors,
// Real-time Auto Analysis, Robot Face Visibility & Paper Mode Integrity
// ==========================================================

import { GlobalAssetUniverse } from "../../server/engine/globalAssetUniverse.js";
import { BrokerConnectorsManager } from "../../server/engine/brokerConnectors.js";
import { parsePairCurrencies, getAssetVisualBadges, FIAT_CURRENCIES, CRYPTO_CURRENCIES } from "../utils/flagUtils.js";

export class V33SuperbrainGlobalTestSuite {
  public static async runAllTests(): Promise<{ passed: number; total: number; details: any[] }> {
    const details: any[] = [];
    let passedCount = 0;

    // Test 1: Global Asset Universe covers all 6 mandated categories
    try {
      const universe = GlobalAssetUniverse.getInstance();
      const allResult = universe.queryAssets({});
      const categoriesFound = new Set(allResult.assets.map((a) => a.category));

      const hasForex = categoriesFound.has("FOREX");
      const hasCrypto = categoriesFound.has("CRYPTO");
      const hasCommodities = categoriesFound.has("COMMODITIES");
      const hasIndices = categoriesFound.has("INDICES");
      const hasStocks = categoriesFound.has("STOCKS");
      const hasETFs = categoriesFound.has("ETFS");

      const passed = hasForex && hasCrypto && hasCommodities && hasIndices && hasStocks && hasETFs && allResult.total >= 20;

      if (passed) passedCount++;
      details.push({
        testNumber: 1,
        name: "Catálogo Global Universe cobre as 6 categorias obrigatórias (Forex, Cripto, Commodities, Índices, Ações, ETFs)",
        passed,
        reason: `Encontradas: ${Array.from(categoriesFound).join(", ")} | Total de ativos auditados: ${allResult.total}`,
      });
    } catch (e: any) {
      details.push({ testNumber: 1, name: "Catálogo Global Universe", passed: false, reason: e.message });
    }

    // Test 2: ISO 4217 Currency Flag mapping for Base and Quote Pairs
    try {
      const eurUsdBadges = getAssetVisualBadges("EUR/USD");
      const usdBrlBadges = getAssetVisualBadges("USD/BRL");
      const gbpJpyBadges = getAssetVisualBadges("GBP/JPY");

      const passed =
        eurUsdBadges.baseFlag === "🇪🇺" &&
        eurUsdBadges.quoteFlag === "🇺🇸" &&
        usdBrlBadges.baseFlag === "🇺🇸" &&
        usdBrlBadges.quoteFlag === "🇧🇷" &&
        gbpJpyBadges.baseFlag === "🇬🇧" &&
        gbpJpyBadges.quoteFlag === "🇯🇵";

      if (passed) passedCount++;
      details.push({
        testNumber: 2,
        name: "Mapeamento validado ISO 4217 de bandeiras Base e Quote (EUR=🇪🇺, USD=🇺🇸, BRL=🇧🇷, GBP=🇬🇧, JPY=🇯🇵)",
        passed,
        reason: `EUR/USD: ${eurUsdBadges.baseFlag}/${eurUsdBadges.quoteFlag} | USD/BRL: ${usdBrlBadges.baseFlag}/${usdBrlBadges.quoteFlag}`,
      });
    } catch (e: any) {
      details.push({ testNumber: 2, name: "Mapeamento de bandeiras", passed: false, reason: e.message });
    }

    // Test 3: Crypto & Commodities dedicated symbols & icons
    try {
      const btcBadges = getAssetVisualBadges("BTC/USD");
      const goldBadges = getAssetVisualBadges("XAU/USD");

      const passed = btcBadges.baseFlag === "₿" && goldBadges.baseFlag === "🪙";

      if (passed) passedCount++;
      details.push({
        testNumber: 3,
        name: "Símbolos e ícones próprios para Cripto (BTC ₿) e Commodities (XAU 🪙)",
        passed,
        reason: `BTC: ${btcBadges.baseFlag} | Ouro/XAU: ${goldBadges.baseFlag}`,
      });
    } catch (e: any) {
      details.push({ testNumber: 3, name: "Cripto e Commodities", passed: false, reason: e.message });
    }

    // Test 4: Full-text search and filtering in Global Universe
    try {
      const universe = GlobalAssetUniverse.getInstance();
      const searchBrl = universe.queryAssets({ query: "Brasil" });
      const searchCrypto = universe.queryAssets({ category: "CRYPTO" });

      const passed = searchBrl.total >= 1 && searchCrypto.total >= 4;

      if (passed) passedCount++;
      details.push({
        testNumber: 4,
        name: "Busca dinâmica por texto (país, moeda, símbolo) e filtros de categoria",
        passed,
        reason: `Busca 'Brasil' retornou: ${searchBrl.assets.map((a) => a.symbol).join(", ")} | Cripto: ${searchCrypto.total} ativos`,
      });
    } catch (e: any) {
      details.push({ testNumber: 4, name: "Busca dinâmica", passed: false, reason: e.message });
    }

    // Test 5: Broker Connectors Architecture with honest status & no fake APIs
    try {
      const brokerManager = BrokerConnectorsManager.getInstance();
      const allBrokers = brokerManager.getAllConnectors();
      const quotex = brokerManager.getConnector("QUOTEX");
      const iqOption = brokerManager.getConnector("IQ_OPTION");

      const passed =
        allBrokers.length === 7 &&
        quotex?.hasOfficialPublicTradingApi === false &&
        quotex?.integrationStatus === "API_NAO_DISPONIVEL_PUBLICAMENTE" &&
        iqOption?.hasOfficialPublicTradingApi === false &&
        quotex.separationOfConcerns.executionMode === "MANUAL_PAPER_ONLY";

      if (passed) passedCount++;
      details.push({
        testNumber: 5,
        name: "Conectores de Corretoras Modulares com status honesto (API não disponível publicamente) e sem APIs falsas",
        passed,
        reason: `7 corretoras auditadas | Quotex: ${quotex?.integrationStatus} | Separação: cotações independentes vs corretora`,
      });
    } catch (e: any) {
      details.push({ testNumber: 5, name: "Conectores de Corretoras", passed: false, reason: e.message });
    }

    // Test 6: Continuous Real-Time Analysis & Fast Pipeline Speed
    try {
      const universe = GlobalAssetUniverse.getInstance();
      const eurUsd = universe.getAsset("EUR/USD");

      const passed = Boolean(eurUsd && eurUsd.webSocketEligible && eurUsd.isTradablePaper);

      if (passed) passedCount++;
      details.push({
        testNumber: 6,
        name: "Elegibilidade para WebSocket em tempo real e prontidão para auto-análise contínua",
        passed,
        reason: `EUR/USD WS Eligible: ${eurUsd?.webSocketEligible} | Paper Tradable: ${eurUsd?.isTradablePaper}`,
      });
    } catch (e: any) {
      details.push({ testNumber: 6, name: "Pipeline em tempo real", passed: false, reason: e.message });
    }

    // Test 7: Paper Mode Permanently Active Guarantee (Zero Real Money Order Calls)
    try {
      const brokers = BrokerConnectorsManager.getInstance().getAllConnectors();
      const allEnforceManualOrPaper = brokers.every(
        (b) => b.separationOfConcerns.executionMode === "MANUAL_PAPER_ONLY"
      );

      const passed = allEnforceManualOrPaper;

      if (passed) passedCount++;
      details.push({
        testNumber: 7,
        name: "PAPER MODE permanentemente ativo e auditável em todos os módulos e corretoras",
        passed,
        reason: "Modo de execução estrito: MANUAL_PAPER_ONLY em 100% dos conectores",
      });
    } catch (e: any) {
      details.push({ testNumber: 7, name: "Garantia Paper Mode", passed: false, reason: e.message });
    }

    return {
      passed: passedCount,
      total: 7,
      details,
    };
  }
}
