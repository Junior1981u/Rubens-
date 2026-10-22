// ==========================================================
// TESTE DE CONECTIVIDADE E DIAGNÓSTICO: AI HEALTH
// Valida os testes reais e classificação estrita de status
// ==========================================================

import { AIHealthService } from "../../server/services/aiHealthService.js";

export async function runAIHealthTests() {
  console.log("=== INICIANDO TESTES DO AI HEALTH SERVICE ===");
  const service = AIHealthService.getInstance();

  let passed = 0;
  let failed = 0;

  // 1. Teste de formato do summary
  try {
    const summary = service.getHealthSummary();
    if (summary.gpt && summary.claude && summary.gemini && summary.grok) {
      console.log("✅ 1. Estrutura do summary das 4 IAs íntegra");
      passed++;
    } else {
      console.log("❌ 1. Falha na estrutura do summary");
      failed++;
    }
  } catch (e) {
    console.log("❌ 1. Erro:", e);
    failed++;
  }

  // 2. Teste do Gemini
  try {
    const geminiRes = await service.testGemini();
    if (geminiRes.provider === "Google" && geminiRes.status) {
      console.log(`✅ 2. Gemini testado com sucesso (Status: ${geminiRes.status}, Latência: ${geminiRes.latencyMs}ms)`);
      passed++;
    } else {
      console.log("❌ 2. Gemini retorno inesperado:", geminiRes);
      failed++;
    }
  } catch (e) {
    console.log("❌ 2. Erro Gemini:", e);
    failed++;
  }

  // 3. Teste do GPT (OpenAI)
  try {
    const gptRes = await service.testGPT();
    if (gptRes.provider === "OpenAI" && gptRes.status) {
      console.log(`✅ 3. GPT testado com sucesso (Status: ${gptRes.status})`);
      passed++;
    } else {
      console.log("❌ 3. GPT retorno inesperado:", gptRes);
      failed++;
    }
  } catch (e) {
    console.log("❌ 3. Erro GPT:", e);
    failed++;
  }

  // 4. Teste do Claude (Anthropic)
  try {
    const claudeRes = await service.testClaude();
    if (claudeRes.provider === "Anthropic" && claudeRes.status) {
      console.log(`✅ 4. Claude testado com sucesso (Status: ${claudeRes.status})`);
      passed++;
    } else {
      console.log("❌ 4. Claude retorno inesperado:", claudeRes);
      failed++;
    }
  } catch (e) {
    console.log("❌ 4. Erro Claude:", e);
    failed++;
  }

  // 5. Teste do Grok (xAI)
  try {
    const grokRes = await service.testGrok();
    if (grokRes.provider === "xAI" && grokRes.status) {
      console.log(`✅ 5. Grok testado com sucesso (Status: ${grokRes.status})`);
      passed++;
    } else {
      console.log("❌ 5. Grok retorno inesperado:", grokRes);
      failed++;
    }
  } catch (e) {
    console.log("❌ 5. Erro Grok:", e);
    failed++;
  }

  console.log(`=== RESULTADOS: PASSOU: ${passed} | FALHOU: ${failed} ===`);
}

runAIHealthTests().catch(console.error);
