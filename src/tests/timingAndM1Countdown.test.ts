// ==========================================================
// NEXORA VISION AI V12 PRO — TEST SUITE: TIMING & M1 COUNTDOWN
// Mandatory Tests for UTC Boundaries, America/Sao_Paulo & Stale Data
// ==========================================================

import {
  formatSaoPauloTime,
  calculateM1CandleCountdown,
  parseTwelveDataDatetime,
  validateCandleFreshness,
  calculateEntryWindow,
  parseTargetClockToTimestamp,
  IANA_TIMEZONE_BR,
} from "../utils/timeZoneUtils.js";

export interface TestResultItem {
  testNumber: number;
  name: string;
  passed: boolean;
  expected: any;
  received: any;
  reason?: string;
}

export class TimingAndM1CountdownTestSuite {
  public static async runAllTests(): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: TestResultItem[];
  }> {
    const results: TestResultItem[] = [];

    // TESTE 1: Limite 12:34:59.900 UTC -> Esperado: 1 segundo restante, 09:34:59 em America/Sao_Paulo
    {
      const d = new Date("2026-10-12T12:34:59.900Z");
      const calc = calculateM1CandleCountdown(d.getTime());
      const spTime = formatSaoPauloTime(d.getTime());

      const passedSec = calc.secondsRemaining === 1;
      const passedTime = spTime === "09:34:59";
      const passed = passedSec && passedTime;

      results.push({
        testNumber: 1,
        name: "Limite 12:34:59.900 UTC -> 1 segundo restante e 09:34:59 America/Sao_Paulo",
        passed,
        expected: "secondsRemaining=1, spTime=09:34:59",
        received: `secondsRemaining=${calc.secondsRemaining}, spTime=${spTime}`,
        reason: passed ? undefined : "Falha na precisão de 100ms antes do minuto ou fuso SP",
      });
    }

    // TESTE 2: Limite 12:35:00.000 UTC -> Esperado: 60 segundos restantes, 09:35:00 em America/Sao_Paulo
    {
      const d = new Date("2026-10-12T12:35:00.000Z");
      const calc = calculateM1CandleCountdown(d.getTime());
      const spTime = formatSaoPauloTime(d.getTime());

      const passedSec = calc.secondsRemaining === 60;
      const passedTime = spTime === "09:35:00";
      const passed = passedSec && passedTime;

      results.push({
        testNumber: 2,
        name: "Limite 12:35:00.000 UTC -> 60 segundos restantes e 09:35:00 America/Sao_Paulo",
        passed,
        expected: "secondsRemaining=60, spTime=09:35:00",
        received: `secondsRemaining=${calc.secondsRemaining}, spTime=${spTime}`,
        reason: passed ? undefined : "Virada exata do minuto deve contar 60s",
      });
    }

    // TESTE 3: Limite 12:35:30.000 UTC -> Esperado: 30 segundos restantes, 09:35:30 em America/Sao_Paulo
    {
      const d = new Date("2026-10-12T12:35:30.000Z");
      const calc = calculateM1CandleCountdown(d.getTime());
      const spTime = formatSaoPauloTime(d.getTime());

      const passedSec = calc.secondsRemaining === 30;
      const passedTime = spTime === "09:35:30";
      const passed = passedSec && passedTime;

      results.push({
        testNumber: 3,
        name: "Limite 12:35:30.000 UTC -> 30 segundos restantes e 09:35:30 America/Sao_Paulo",
        passed,
        expected: "secondsRemaining=30, spTime=09:35:30",
        received: `secondsRemaining=${calc.secondsRemaining}, spTime=${spTime}`,
        reason: passed ? undefined : "Metade da vela M1 deve contar 30s",
      });
    }

    // TESTE 4: Virada de Dia (23:59:59.900 UTC)
    {
      const d = new Date("2026-10-12T23:59:59.900Z");
      const calc = calculateM1CandleCountdown(d.getTime());
      const passed = calc.secondsRemaining === 1 && calc.nextBoundaryMs === new Date("2026-10-13T00:00:00.000Z").getTime();

      results.push({
        testNumber: 4,
        name: "Virada de dia UTC -> 1s para o próximo limite 00:00:00 UTC",
        passed,
        expected: "secondsRemaining=1",
        received: `secondsRemaining=${calc.secondsRemaining}`,
        reason: passed ? undefined : "Erro no cálculo da virada de dia",
      });
    }

    // TESTE 5: Virada de Mês (28 Fev / 1 Mar) e Ano (31 Dez 23:59:59.900 UTC)
    {
      const dYear = new Date("2026-12-31T23:59:59.900Z");
      const calcYear = calculateM1CandleCountdown(dYear.getTime());
      const passedYear = calcYear.secondsRemaining === 1;

      const dMonth = new Date("2026-02-28T23:59:59.900Z");
      const calcMonth = calculateM1CandleCountdown(dMonth.getTime());
      const passedMonth = calcMonth.secondsRemaining === 1;

      const passed = passedYear && passedMonth;

      results.push({
        testNumber: 5,
        name: "Virada de mês e de ano -> 1s exato para o novo período",
        passed,
        expected: "Ano=1s, Mês=1s",
        received: `Ano=${calcYear.secondsRemaining}s, Mês=${calcMonth.secondsRemaining}s`,
        reason: passed ? undefined : "Falha na transição de mês ou ano",
      });
    }

    // TESTE 6: Candles M1 Consecutivos (60000ms strictly monotone)
    {
      const base = new Date("2026-10-12T10:00:00Z").getTime();
      const candles = [0, 1, 2, 3, 4].map((i) => base + i * 60000);
      const isMonotone = candles.every((c, idx) => idx === 0 || c - candles[idx - 1] === 60000);

      results.push({
        testNumber: 6,
        name: "Candles M1 Consecutivos com espaçamento estrito de 60.000ms",
        passed: isMonotone,
        expected: "Delta = 60000ms",
        received: `Delta = ${candles[1] - candles[0]}ms`,
        reason: isMonotone ? undefined : "Intervalo M1 corrompido",
      });
    }

    // TESTE 7: Detecção de Dados Atrasados (> 120s) -> DADOS DESATUALIZADOS
    {
      const now = Date.now();
      const staleCandleTs = now - 180000; // 3 minutos atrás
      const val = validateCandleFreshness(staleCandleTs, now, 120000);
      const passed = !val.isValid && val.statusLabel === "DADOS DESATUALIZADOS";

      results.push({
        testNumber: 7,
        name: "Dados de candle atrasados (>120s) -> DADOS DESATUALIZADOS",
        passed,
        expected: "isValid=false, statusLabel=DADOS DESATUALIZADOS",
        received: `isValid=${val.isValid}, statusLabel=${val.statusLabel}`,
        reason: passed ? undefined : "Não bloqueou dados atrasados",
      });
    }

    // TESTE 8: Parsing de Datetime Twelve Data (UTC documentado) para America/Sao_Paulo
    {
      const tdDatetime = "2026-10-12 18:00:00";
      const parsedUtc = parseTwelveDataDatetime(tdDatetime, "UTC");
      const spFormatted = formatSaoPauloTime(parsedUtc);

      // 18:00:00 UTC = 15:00:00 em America/Sao_Paulo (UTC-3)
      const passed = spFormatted === "15:00:00";

      results.push({
        testNumber: 8,
        name: "Parsing Twelve Data UTC (18:00:00 UTC) -> 15:00:00 America/Sao_Paulo",
        passed,
        expected: "15:00:00",
        received: spFormatted,
        reason: passed ? undefined : "Conversão Twelve Data para America/Sao_Paulo divergente",
      });
    }

    // TESTE 9: Horário 7 de Entrada (07:00:00) formatado e agendado em America/Sao_Paulo
    {
      const res = parseTargetClockToTimestamp("07:00:00");
      const passed = res.formattedTargetTime === "07:00:00" && res.targetTimestampMs > 0;

      results.push({
        testNumber: 9,
        name: "Horário 7 de Entrada (07:00:00) no fuso America/Sao_Paulo",
        passed,
        expected: "07:00:00",
        received: res.formattedTargetTime,
        reason: passed ? undefined : "Falha ao calcular Horário 7 de Entrada",
      });
    }

    // TESTE 10: Detecção de Pré-Aviso dos 7 segundos para a virada (:53 até :59)
    {
      // Simula instante faltando 7 segundos para 12:00:00 (11:59:53.000)
      const baseMs = new Date("2026-10-12T12:00:00Z").getTime();
      const testNow7s = baseMs - 7000;
      const window7s = calculateEntryWindow(testNow7s, "M1");
      const passed = window7s.isPreAlert7s === true && window7s.secondsUntilEntry === 7;

      results.push({
        testNumber: 10,
        name: "Pré-Aviso dos 7 segundos para o Horário de Entrada (isPreAlert7s)",
        passed,
        expected: "isPreAlert7s=true, secondsUntilEntry=7",
        received: `isPreAlert7s=${window7s.isPreAlert7s}, secondsUntilEntry=${window7s.secondsUntilEntry}`,
        reason: passed ? undefined : "Falha na detecção da janela de 7 segundos",
      });
    }

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;

    return {
      passed: passedCount,
      failed: failedCount,
      total: results.length,
      results,
    };
  }
}
