// ==========================================================
// NEXORA VISION AI V13 — CONSOLIDATED TEST RUNNER
// Executa todos os testes automatizados das 3 suítes:
// 1. Mission2VerificationTestSuite (10 Requisitos Obrigatórios)
// 2. ConsensusEngineTestSuite (15 Cenários de Consenso e Quórum)
// 3. PlatformHubTestSuite (9 Testes de Corretoras e Presets)
// ==========================================================

import { Mission2VerificationTestSuite } from "./mission2Verification.test.js";
import { ConsensusEngineTestSuite } from "./consensusEngine.test.js";
import { PlatformHubTestSuite } from "./platformHub.test.js";
import { AIAndTimingVerificationTestSuite } from "./aiAndTimingVerification.test.js";
import { TimingAndM1CountdownTestSuite } from "./timingAndM1Countdown.test.js";
import { AntiLossShieldTestSuite } from "./antiLossShield.test.js";
import { runYouXAssetDiscoveryTests } from "./youxAssetDiscovery.test.js";
import { InterfaceAndSignalsVerificationTestSuite } from "./interfaceAndSignalsVerification.test.js";
import { V30SpeedAndSignalEngineTestSuite } from "./v30SpeedAndSignalEngine.test.js";
import { V33SuperbrainGlobalTestSuite } from "./v33SuperbrainGlobal.test.js";
import { TitanOmegaVerificationTestSuite } from "./titanOmegaVerification.test.js";
import { SuperAlgorithmTestSuite } from "./superAlgorithm.test.js";
import { QXBrokerWebSocketTestSuite } from "./qxBrokerWebSocket.test.js";
import { LiveM1EngineFixTestSuite } from "./liveM1EngineFix.test.js";
import { OlympTradeConnectorTestSuite } from "./olympTradeConnector.test.js";

async function run() {
  console.log("==========================================================");
  console.log("NEXORA VISION AI V22 — SUÍTE DE TESTES AUTOMATIZADA");
  console.log("==========================================================\n");

  // SUÍTE 1: 10 Requisitos Obrigatórios da Missão 1 e Missão 2
  console.log(">>> SUÍTE 1: 10 REQUISITOS OBRIGATÓRIOS ESPECÍFICOS <<<");
  const s1 = await Mission2VerificationTestSuite.runAll();
  s1.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s1.passed}/${s1.total} aprovados\n`);

  // SUÍTE 2: Consensus Engine Core V4
  console.log(">>> SUÍTE 2: NÚCLEO DE CONSENSO 4/4 & QUÓRUM <<<");
  const s2 = await ConsensusEngineTestSuite.runAllTests();
  s2.results.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} ${d.name}`);
  });
  console.log(`  Subtotal: ${s2.passed}/${s2.total} aprovados\n`);

  // SUÍTE 3: Plataformas & Corretoras
  console.log(">>> SUÍTE 3: PLATFORM HUB & CORRETORAS HOMOLOGADAS <<<");
  const s3 = await PlatformHubTestSuite.runAllTests();
  s3.results.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} ${d.name}`);
  });
  console.log(`  Subtotal: ${s3.passed}/${s3.total} aprovados\n`);

  // SUÍTE 4: 4 IAs & Horários do Sinal
  console.log(">>> SUÍTE 4: 4 IAS OPERACIONAIS & HORÁRIOS PRECISOS DO SINAL <<<");
  const s4 = await AIAndTimingVerificationTestSuite.runAllTests();
  s4.results.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s4.passed}/${s4.total} aprovados\n`);

  // SUÍTE 5: Fuso Horário America/Sao_Paulo & Contador M1 Rigoroso
  console.log(">>> SUÍTE 5: FUSO AMERICA/SAO_PAULO & CONTADOR DE VELAS M1 <<<");
  const s5 = await TimingAndM1CountdownTestSuite.runAllTests();
  s5.results.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s5.passed}/${s5.total} aprovados\n`);

  // SUÍTE 6: Escudo Anti-Loss Blindado & Proteção de Capital
  console.log(">>> SUÍTE 6: ESCUDO ANTI-LOSS BLINDADO & PROTEÇÃO DE BANCA <<<");
  const s6 = await AntiLossShieldTestSuite.runAllTests();
  s6.results.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} ${d.name}`);
    if (d.details) console.log(`     ↳ Veto: ${d.details}`);
  });
  console.log(`  Subtotal: ${s6.passed}/${s6.total} aprovados\n`);

  // SUÍTE 7: YouXBroker Asset Discovery & Validation (11 Testes Obrigatórios)
  const s7 = await runYouXAssetDiscoveryTests();
  console.log(`  Subtotal: ${s7.passed}/${s7.total} aprovados\n`);

  // SUÍTE 8: 6 Testes de Interface & Sinais da Missão Atual
  console.log(">>> SUÍTE 8: INTERFACE RESPONSIVA & CARTÃO DE SINAIS (6 TESTES OBRIGATÓRIOS) <<<");
  const s8 = await InterfaceAndSignalsVerificationTestSuite.runAllTests();
  s8.results.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s8.passed}/${s8.total} aprovados\n`);

  // SUÍTE 9: V30 Auditoria de Velocidade & Motor de Sinais
  console.log(">>> SUÍTE 9: V30 AUDITORIA DE VELOCIDADE & MOTOR DE SINAIS (6 TESTES) <<<");
  const s9 = await V30SpeedAndSignalEngineTestSuite.runAllTests();
  s9.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s9.passed}/${s9.total} aprovados\n`);

  // SUÍTE 10: V33 Superbrain Global Intelligence & Discovery (7 Testes)
  console.log(">>> SUÍTE 10: V33 SUPERBRAIN GLOBAL INTELLIGENCE (7 TESTES) <<<");
  const s10 = await V33SuperbrainGlobalTestSuite.runAllTests();
  s10.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s10.passed}/${s10.total} aprovados\n`);

  // SUÍTE 11: Titan Omega Evolução Final (7 Testes)
  console.log(">>> SUÍTE 11: TITAN OMEGA EVOLUÇÃO FINAL (7 TESTES) <<<");
  const s11 = await TitanOmegaVerificationTestSuite.runAllTests();
  s11.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s11.passed}/${s11.total} aprovados\n`);

  // SUÍTE 12: Super Algoritmo Quantum V34 (5 Testes)
  console.log(">>> SUÍTE 12: SUPER ALGORITMO QUANTUM & VELOCIDADE (5 TESTES) <<<");
  const s12 = await SuperAlgorithmTestSuite.runAllTests();
  s12.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s12.passed}/${s12.total} aprovados\n`);

  // SUÍTE 13: Teste Seguro de WebSocket QX Broker (5 Testes)
  console.log(">>> SUÍTE 13: TESTE SEGURO DE WEBSOCKET QX BROKER (5 TESTES) <<<");
  const s13 = await QXBrokerWebSocketTestSuite.runAllTests();
  s13.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s13.passed}/${s13.total} aprovados\n`);

  // SUÍTE 14: Live M1 Engine Fix & 10 Validações Obrigatórias (10 Testes)
  console.log(">>> SUÍTE 14: LIVE M1 ENGINE FIX & AUDITORIA TWELVE DATA (10 TESTES) <<<");
  const s14 = await LiveM1EngineFixTestSuite.runAllTests();
  s14.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s14.passed}/${s14.total} aprovados\n`);

  // SUÍTE 15: Olymp Trade Data Connector Safe Mode & Validações (7 Testes)
  console.log(">>> SUÍTE 15: OLYMP TRADE DATA CONNECTOR SAFE MODE (7 TESTES) <<<");
  const s15 = await OlympTradeConnectorTestSuite.runAllTests();
  s15.details.forEach((d) => {
    console.log(`  ${d.passed ? "✅" : "❌"} [Teste ${d.testNumber}] ${d.name}`);
    if (d.reason) console.log(`     ↳ ${d.reason}`);
  });
  console.log(`  Subtotal: ${s15.passed}/${s15.total} aprovados\n`);

  const total =
    s1.total +
    s2.total +
    s3.total +
    s4.total +
    s5.total +
    s6.total +
    s7.total +
    s8.total +
    s9.total +
    s10.total +
    s11.total +
    s12.total +
    s13.total +
    s14.total +
    s15.total;
  const passed =
    s1.passed +
    s2.passed +
    s3.passed +
    s4.passed +
    s5.passed +
    s6.passed +
    s7.passed +
    s8.passed +
    s9.passed +
    s10.passed +
    s11.passed +
    s12.passed +
    s13.passed +
    s14.passed +
    s15.passed;
  const failed = total - passed;

  console.log("==========================================================");
  console.log(`TOTAL GERAL: ${passed}/${total} APROVADOS (${Math.round((passed / total) * 100)}%)`);
  if (failed === 0) {
    console.log(`STATUS: TODAS AS ${total} VALIDAÇÕES PASSARAM COM SUCESSO (100% OK)`);
  } else {
    console.log(`STATUS: ${failed} TESTES FALHARAM`);
  }
  console.log("==========================================================");

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Erro fatal ao rodar testes:", err);
  process.exit(1);
});
