// ==========================================================
// NEXORA VISION AI V12 PRO — TIMEZONE & M1 COUNTDOWN ENGINE
// Strict Compliance with IANA America/Sao_Paulo & M1 Candle Math
// ==========================================================

export const IANA_TIMEZONE_BR = "America/Sao_Paulo";

/**
 * Formata qualquer timestamp ou Date para o horário oficial brasileiro
 * IANA: America/Sao_Paulo no padrão 24 horas: HH:mm:ss
 */
export function formatSaoPauloTime(timestampOrDate?: number | Date | string | null): string {
  if (!timestampOrDate) return "--:--:--";
  
  const d = typeof timestampOrDate === "number" || typeof timestampOrDate === "string" 
    ? new Date(timestampOrDate) 
    : timestampOrDate;

  if (isNaN(d.getTime())) return "--:--:--";

  return d.toLocaleTimeString("pt-BR", {
    timeZone: IANA_TIMEZONE_BR,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Formata data e hora completas para America/Sao_Paulo
 * DD/MM/AAAA HH:mm:ss
 */
export function formatSaoPauloDateTime(timestampOrDate?: number | Date | string | null): string {
  if (!timestampOrDate) return "--/--/---- --:--:--";
  
  const d = typeof timestampOrDate === "number" || typeof timestampOrDate === "string" 
    ? new Date(timestampOrDate) 
    : timestampOrDate;

  if (isNaN(d.getTime())) return "--/--/---- --:--:--";

  return d.toLocaleString("pt-BR", {
    timeZone: IANA_TIMEZONE_BR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export interface M1CountdownCalculation {
  nowMs: number;
  startIntervalMs: number;
  nextBoundaryMs: number;
  secondsRemaining: number; // 0..60
  formattedCountdown: string; // "MM:SS"
  percentElapsed: number; // 0..100
  candleState: "ABERTA" | "FECHADA";
}

/**
 * REGRAS DE CÁLCULO OBRIGATÓRIAS DO CONTADOR M1:
 * 1. Usar o instante atual em milissegundos, obtido por Date.now() (ou nowMs fornecido).
 * 2. Para velas M1 alinhadas ao minuto UTC:
 *    startIntervalMs = Math.floor(nowMs / 60000) * 60000
 *    nextBoundaryMs = startIntervalMs + 60000
 * 3. Segundos restantes com ceil((nextBoundaryMs - nowMs) / 1000), limitado a 0..60.
 * 4. Não usar setInterval como fonte de tempo — recalcular sempre do relógio.
 */
export function calculateM1CandleCountdown(nowMs: number = Date.now()): M1CountdownCalculation {
  const bucketMs = 60000;
  const startIntervalMs = Math.floor(nowMs / bucketMs) * bucketMs;
  const nextBoundaryMs = startIntervalMs + bucketMs;
  
  const diffMs = nextBoundaryMs - nowMs;
  const rawSec = Math.ceil(diffMs / 1000);
  const secondsRemaining = Math.min(60, Math.max(0, rawSec));

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const elapsedMs = Math.min(bucketMs, Math.max(0, nowMs - startIntervalMs));
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / bucketMs) * 100));

  const candleState: "ABERTA" | "FECHADA" = secondsRemaining <= 1 ? "FECHADA" : "ABERTA";

  return {
    nowMs,
    startIntervalMs,
    nextBoundaryMs,
    secondsRemaining,
    formattedCountdown,
    percentElapsed,
    candleState,
  };
}

/**
 * Parsing rigoroso de timestamps do Twelve Data:
 * Distingue UTC, offsets e unix epoch.
 * Documentação Twelve Data: datetime vem como "YYYY-MM-DD HH:MM:SS" em UTC (quando timezone=UTC).
 */
export function parseTwelveDataDatetime(
  datetimeStr: string | undefined | null,
  timezoneDoc: string = "UTC",
  unixTimestamp?: number
): number {
  if (unixTimestamp && typeof unixTimestamp === "number" && !isNaN(unixTimestamp) && unixTimestamp > 0) {
    // Se for em segundos (10 dígitos)
    return unixTimestamp > 1e11 ? unixTimestamp : unixTimestamp * 1000;
  }

  if (!datetimeStr || typeof datetimeStr !== "string") {
    return Date.now();
  }

  const clean = datetimeStr.trim();

  // Caso contenha 'Z' ou offset explícito (+HH:MM / -HH:MM)
  if (clean.includes("Z") || /[+-]\d{2}:\d{2}$/.test(clean)) {
    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) return parsed;
  }

  // Twelve Data formato padrão: "YYYY-MM-DD HH:MM:SS"
  // Quando timezone doc for "UTC" ou omitido, deve ser interpretado como UTC
  if (timezoneDoc.toUpperCase() === "UTC") {
    const isoUtc = clean.replace(" ", "T") + "Z";
    const parsed = Date.parse(isoUtc);
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback padrão
  const directParse = Date.parse(clean);
  if (!isNaN(directParse)) return directParse;

  return Date.now();
}

/**
 * Validação de atualidade do candle (Age check)
 * Se os dados estiverem atrasados (> 120s para M1), bloquear.
 */
export function validateCandleFreshness(
  candleTimestampMs: number,
  receiptTimestampMs: number = Date.now(),
  maxToleranceMs: number = 120000
): {
  isValid: boolean;
  ageSeconds: number;
  statusLabel: "DADOS ATUALIZADOS" | "DADOS DESATUALIZADOS" | "CONTADOR NÃO VALIDADO";
} {
  if (!candleTimestampMs || isNaN(candleTimestampMs) || candleTimestampMs <= 0) {
    return {
      isValid: false,
      ageSeconds: Infinity,
      statusLabel: "CONTADOR NÃO VALIDADO",
    };
  }

  const ageMs = Math.abs(receiptTimestampMs - candleTimestampMs);
  const ageSeconds = Math.round(ageMs / 1000);

  if (ageMs > maxToleranceMs) {
    return {
      isValid: false,
      ageSeconds,
      statusLabel: "DADOS DESATUALIZADOS",
    };
  }

  return {
    isValid: true,
    ageSeconds,
    statusLabel: "DADOS ATUALIZADOS",
  };
}

export interface EntryWindowInfo {
  nowMs: number;
  entryTimestampMs: number;
  expiryTimestampMs: number;
  entryTimeStr: string;
  expiryTimeStr: string;
  secondsUntilEntry: number;
  isPreAlert7s: boolean; // Faltam 7 segundos para a virada
  isEnteringNow: boolean; // Segundo :00 ou nos primeiros 8 segundos
  isPast: boolean;
}

/**
 * Calcula precisamente a janela de entrada do sinal para M1 ou M5
 * garantindo que a entrada esteja alinhada ao segundo :00 da virada
 */
export function calculateEntryWindow(
  nowMs: number = Date.now(),
  timeframe: string = "M1",
  providedEntryTs?: number
): EntryWindowInfo {
  const tfMs = timeframe === "M5" || timeframe === "5M" ? 300000 : 60000;
  const currentBoundary = Math.floor(nowMs / tfMs) * tfMs;
  const nextBoundary = Math.ceil(nowMs / tfMs) * tfMs;
  const elapsedInCandle = Math.floor((nowMs - currentBoundary) / 1000);

  let entryTs = providedEntryTs;
  // Se não foi fornecido ou se o horário fornecido já expirou há mais de 10s
  if (!entryTs || entryTs < nowMs - 10000) {
    entryTs = elapsedInCandle <= 8 ? currentBoundary : nextBoundary;
  }

  const expiryTs = entryTs + tfMs;
  const diffSec = Math.ceil((entryTs - nowMs) / 1000);
  const secondsUntilEntry = Math.max(0, diffSec);

  // Pre-alerta exato aos 7 segundos (ou contagem entre 1 e 7 segundos)
  const isPreAlert7s = diffSec > 0 && diffSec <= 7;
  // Entrada imediata: quando diffSec <= 0 e ainda está dentro dos primeiros 8s da vela
  const isEnteringNow = diffSec <= 0 && Math.floor((nowMs - entryTs) / 1000) <= 8;
  const isPast = Math.floor((nowMs - entryTs) / 1000) > 8;

  return {
    nowMs,
    entryTimestampMs: entryTs,
    expiryTimestampMs: expiryTs,
    entryTimeStr: formatSaoPauloTime(entryTs),
    expiryTimeStr: formatSaoPauloTime(expiryTs),
    secondsUntilEntry,
    isPreAlert7s,
    isEnteringNow,
    isPast,
  };
}

/**
 * Converte um horário de relógio (ex: "07:00:00" ou "07:00") no próximo timestamp
 * em milissegundos correspondente no fuso America/Sao_Paulo
 */
export function parseTargetClockToTimestamp(
  targetClock: string, // ex: "07:00:00" ou "07:00"
  nowMs: number = Date.now()
): {
  targetTimestampMs: number;
  formattedTargetTime: string;
  diffSeconds: number;
  isDueNow: boolean;
} {
  const parts = targetClock.split(":").map((p) => parseInt(p, 10) || 0);
  const targetHour = parts[0] ?? 7;
  const targetMin = parts[1] ?? 0;
  const targetSec = parts[2] ?? 0;

  // Cria objeto Date no fuso de São Paulo
  const nowSpStr = new Intl.DateTimeFormat("en-US", {
    timeZone: IANA_TIMEZONE_BR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(nowMs));

  // nowSpStr: "MM/DD/YYYY, HH:mm:ss"
  const [datePart] = nowSpStr.split(",");
  const [month, day, year] = datePart.trim().split("/").map(Number);

  // Calcula o offset atual de São Paulo
  // Formato ISO para montar
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoDate = `${year}-${pad(month)}-${pad(day)}T${pad(targetHour)}:${pad(targetMin)}:${pad(targetSec)}-03:00`;
  let targetMs = Date.parse(isoDate);

  // Se já passou do horário hoje por mais de 10 segundos, agenda para o dia seguinte
  if (nowMs - targetMs > 10000) {
    targetMs += 86400000; // +24h
  }

  const diffSeconds = Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
  const isDueNow = Math.abs(nowMs - targetMs) <= 4000;

  return {
    targetTimestampMs: targetMs,
    formattedTargetTime: `${pad(targetHour)}:${pad(targetMin)}:${pad(targetSec)}`,
    diffSeconds,
    isDueNow,
  };
}
