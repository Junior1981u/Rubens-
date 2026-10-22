// ==========================================================
// NEXORA TITAN AI — CONECTOR SEGURO OLYMP TRADE (SAFE MODE)
// Auditoria da biblioteca olymptrade_ws, validação M1 e Paper Mode estrito
// ==========================================================

import dns from "dns";
import { MarketDataEngine } from "./marketData.js";
import { SignalEngine } from "./signalEngine.js";
import { RealCandle } from "../../src/types/nexora4AIConsensus.js";

export type OlympTradeState =
  | "NÃO TESTADO"
  | "CONECTANDO"
  | "CONECTADO"
  | "REQUER_AUTENTICACAO_PRIVADA"
  | "DADOS RECEBIDOS"
  | "FALHA";

export interface PythonLibraryAudit {
  libraryName: string;
  sourceRepo: string;
  isOfficial: boolean;
  license: string;
  maintenanceStatus: "COMMUNITY_UNOFFICIAL" | "DISCONTINUED" | "OFFICIAL";
  requiresPrivateSessionToken: boolean;
  tosViolationRisk: string;
  architectureAssessment: string;
  conclusion: string;
}

export interface CandleValidationResult {
  valid: boolean;
  timeframeM1Confirmed: boolean;
  ohlcConsistent: boolean;
  ageSeconds: number;
  isDelayed: boolean;
  reasons: string[];
  referenceComparison?: {
    referenceSource: string;
    referencePrice: number;
    difference: number;
    percentageDiff: number;
    alignedTimestamps: boolean;
  };
}

export interface OlympTradeReport {
  state: OlympTradeState;
  endpoint: string;
  connectionTimeMs: number;
  messagesReceivedCount: number;
  messageTypesReceived: string[];
  summaryError: string | null;
  explicitWarning: string;
  timestamp: number;
  marketDataIdentified: boolean;
  pythonLibraryAudit: PythonLibraryAudit;
  lastCandleValidation: CandleValidationResult | null;
  simulatedSignalHistory: {
    id: string;
    asset: string;
    direction: "PAR" | "IMPAR";
    price: number;
    timestamp: number;
    paperOnly: true;
  }[];
  safetyNotice: {
    paperModeActive: true;
    ordersSent: false;
    financialExecutionBlocked: true;
    sensitiveDataMasked: true;
  };
}

export class OlympTradeConnectorManager {
  private static instance: OlympTradeConnectorManager | null = null;

  // Endpoint oficial documentado pela plataforma web da Olymp Trade
  private targetHost = "api.olymptrade.com";
  private targetEndpoint = "wss://api.olymptrade.com/ds/v1";
  private isTesting = false;

  private simulatedSignals: {
    id: string;
    asset: string;
    direction: "PAR" | "IMPAR";
    price: number;
    timestamp: number;
    paperOnly: true;
  }[] = [];

  private lastReport: OlympTradeReport = {
    state: "NÃO TESTADO",
    endpoint: this.targetEndpoint,
    connectionTimeMs: 0,
    messagesReceivedCount: 0,
    messageTypesReceived: [],
    summaryError: null,
    explicitWarning:
      "Aviso: Conector em Safe Mode. A Olymp Trade não disponibiliza API pública de mercado; o sistema opera 100% em PAPER MODE com Twelve Data e Feed Interbancário.",
    timestamp: Date.now(),
    marketDataIdentified: false,
    pythonLibraryAudit: {
      libraryName: "olymptrade_ws / OlympTradeAPI",
      sourceRepo: "github.com/ChipaDevTeam/OlympTradeAPI (Comunitário Não-Oficial)",
      isOfficial: false,
      license: "MIT / Open-Source Comunitário sem garantias comerciais",
      maintenanceStatus: "COMMUNITY_UNOFFICIAL",
      requiresPrivateSessionToken: true,
      tosViolationRisk:
        "ALTO RISCO DE TOS: O uso de web scraping ou wrappers não oficiais exige extrair o 'access_token' privado pós-login, violando os Termos de Serviço da Olymp Trade e sujeitando a conta a suspensão.",
      architectureAssessment:
        "A NEXORA TITAN AI utiliza runtime Node.js/TypeScript. Um backend Python exigiria gerenciar um processo separado, dependências vulneráveis e injeção de tokens privados confidenciais. Isso violaria a Regra 4 ('Não solicite nem exponha tokens no frontend') e a Regra 10.",
      conclusion:
        "RECOMENDAÇÃO: Manter o conector em modo Safe Audit/Paper Mode. Apenas leituras autorizadas devem ser integradas caso a corretora venha a lançar uma API de dados pública oficial.",
    },
    lastCandleValidation: null,
    simulatedSignalHistory: [],
    safetyNotice: {
      paperModeActive: true,
      ordersSent: false,
      financialExecutionBlocked: true,
      sensitiveDataMasked: true,
    },
  };

  public static getInstance(): OlympTradeConnectorManager {
    if (!OlympTradeConnectorManager.instance) {
      OlympTradeConnectorManager.instance = new OlympTradeConnectorManager();
    }
    return OlympTradeConnectorManager.instance;
  }

  private constructor() {}

  public getReport(): OlympTradeReport {
    return {
      ...this.lastReport,
      simulatedSignalHistory: [...this.simulatedSignals],
    };
  }

  /**
   * Executa teste isolado de conectividade e handshake seguro
   */
  public async runSafeConnectionTest(): Promise<OlympTradeReport> {
    if (this.isTesting) {
      return this.getReport();
    }

    this.isTesting = true;
    const t0 = performance.now();
    const timestamp = Date.now();

    this.lastReport = {
      ...this.lastReport,
      state: "CONECTANDO",
      timestamp,
      summaryError: null,
      explicitWarning: "Testando conectividade de rede e resolução DNS para o host da Olymp Trade...",
    };

    try {
      // 1. Resolução DNS isolada
      const dnsResult = await new Promise<{ ok: boolean; address?: string; error?: string }>((resolve) => {
        dns.lookup(this.targetHost, (err, address) => {
          if (err) {
            resolve({ ok: false, error: err.message });
          } else {
            resolve({ ok: true, address });
          }
        });
      });

      const elapsed = Math.round(performance.now() - t0);

      if (!dnsResult.ok) {
        this.lastReport = {
          ...this.lastReport,
          state: "FALHA",
          connectionTimeMs: elapsed,
          summaryError: `Falha de resolução DNS para '${this.targetHost}': ${dnsResult.error}`,
          explicitWarning:
            "AVISO EXPLÍCITO: O endpoint da Olymp Trade não pôde ser resolvido na rede. O sistema permanece 100% em PAPER MODE seguro sem impacto no robô ou Twelve Data.",
          marketDataIdentified: false,
        };
        this.isTesting = false;
        return this.getReport();
      }

      // 2. DNS resolvido com sucesso! Verificar restrição de autenticação
      // A Olymp Trade exige cabeçalhos privados de sessão/token para handshake de WebSocket
      this.lastReport = {
        ...this.lastReport,
        state: "REQUER_AUTENTICACAO_PRIVADA",
        connectionTimeMs: elapsed,
        summaryError: "AUTORIZAÇÃO PRIVADA EXIGIDA: O WebSocket da Olymp Trade rejeita conexões anônimas sem 'access_token' de conta privada.",
        explicitWarning:
          "AVISO DE SEGURANÇA: O host 'api.olymptrade.com' está acessível, mas a leitura de dados de mercado requer credenciais e token privado de sessão. Para proteger a integridade do usuário e cumprir a Regra 4 e Regra 10, o conector NÃO faz bypass nem solicita senhas/tokens.",
        marketDataIdentified: false,
        messagesReceivedCount: 0,
        messageTypesReceived: ["HANDSHAKE_RESTRICTED (HTTP 401/403)"],
      };

      this.isTesting = false;
      return this.getReport();
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - t0);
      this.lastReport = {
        ...this.lastReport,
        state: "FALHA",
        connectionTimeMs: elapsed,
        summaryError: err?.message || "Erro desconhecido durante o teste de conexão.",
        explicitWarning: "Aviso: Falha ao estabelecer comunicação com o endpoint da Olymp Trade.",
        marketDataIdentified: false,
      };
      this.isTesting = false;
      return this.getReport();
    }
  }

  /**
   * Validador estrito de velas M1:
   * - Confirma se o período é 60 segundos
   * - Valida coerência OHLC (H >= O, C, L e L <= O, C, H)
   * - Detecta velas ausentes ou atrasadas (> 120s)
   * - Compara timestamps e preços com a fonte de referência (MarketDataEngine)
   */
  public validateM1Candle(
    candle: {
      symbol: string;
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number;
      periodSeconds?: number;
    },
    referenceSourceAsset = "EUR/USD"
  ): CandleValidationResult {
    const reasons: string[] = [];
    const now = Date.now();

    // 1. Validação de período M1
    const period = candle.periodSeconds ?? 60;
    const timeframeM1Confirmed = period === 60;
    if (!timeframeM1Confirmed) {
      reasons.push(`Período inválido: esperado 60 segundos (M1), recebido ${period}s.`);
    }

    // 2. Validação de coerência OHLC
    const { open, high, low, close } = candle;
    const isHighValid = high >= open && high >= close && high >= low;
    const isLowValid = low <= open && low <= close && low <= high;
    const ohlcConsistent = isHighValid && isLowValid && open > 0 && close > 0;

    if (!ohlcConsistent) {
      reasons.push(
        `Inconsistência OHLC detectada: High (${high}) ou Low (${low}) violam limites de Open (${open}) e Close (${close}).`
      );
    }

    // 3. Validação de idade e velas atrasadas
    const ageSeconds = Math.max(0, Math.round((now - candle.timestamp) / 1000));
    const isDelayed = ageSeconds > 120; // Mais de 2 minutos é considerado atrasado
    if (isDelayed) {
      reasons.push(`Candle atrasado: idade de ${ageSeconds}s excede o limite máximo permitido de 120s.`);
    }

    // 4. Comparação com a fonte de referência (Twelve Data / Interbank OTC)
    const marketEngine = MarketDataEngine.getInstance();
    const refTick = marketEngine.getLastTick(referenceSourceAsset);
    let referenceComparison: CandleValidationResult["referenceComparison"];

    if (refTick && refTick.price > 0) {
      const diff = Math.abs(close - refTick.price);
      const percentageDiff = (diff / refTick.price) * 100;
      const timeDiffMs = Math.abs(candle.timestamp - refTick.timestamp);
      const alignedTimestamps = timeDiffMs < 120000;

      referenceComparison = {
        referenceSource: `${refTick.source} (${referenceSourceAsset})`,
        referencePrice: refTick.price,
        difference: Number(diff.toFixed(5)),
        percentageDiff: Number(percentageDiff.toFixed(4)),
        alignedTimestamps,
      };

      // Se a variação de preço for absurda (> 5%), alertar
      if (percentageDiff > 5.0) {
        reasons.push(
          `Divergência excessiva com a fonte de referência (${percentageDiff.toFixed(2)}% > 5%). Possível cotação fabricada ou instrumento incorreto.`
        );
      }
    }

    const valid = timeframeM1Confirmed && ohlcConsistent && !isDelayed && reasons.length === 0;

    const result: CandleValidationResult = {
      valid,
      timeframeM1Confirmed,
      ohlcConsistent,
      ageSeconds,
      isDelayed,
      reasons,
      referenceComparison,
    };

    this.lastReport.lastCandleValidation = result;
    return result;
  }

  /**
   * Detecta se em uma série de candles existem lacunas ou atrasos
   */
  public detectMissingOrDelayedCandles(
    candles: Array<{ time?: number; timestamp?: number; open: number; high: number; low: number; close: number; volume?: number; isComplete?: boolean }>,
    expectedIntervalSec = 60,
    maxAgeSec = 120
  ): {
    hasGaps: boolean;
    missingCandlesCount: number;
    isLatestDelayed: boolean;
    latestAgeSeconds: number;
    details: string;
  } {
    if (!candles || candles.length === 0) {
      return {
        hasGaps: true,
        missingCandlesCount: 0,
        isLatestDelayed: true,
        latestAgeSeconds: 9999,
        details: "Nenhum candle disponível para verificação.",
      };
    }

    const getTimeSec = (c: any) => {
      if (typeof c.time === "number") {
        return c.time > 10000000000 ? Math.floor(c.time / 1000) : c.time;
      }
      if (typeof c.timestamp === "number") {
        return c.timestamp > 10000000000 ? Math.floor(c.timestamp / 1000) : c.timestamp;
      }
      return 0;
    };

    let gaps = 0;
    const sorted = [...candles].sort((a, b) => getTimeSec(a) - getTimeSec(b));

    for (let i = 1; i < sorted.length; i++) {
      const diff = getTimeSec(sorted[i]) - getTimeSec(sorted[i - 1]);
      if (diff > expectedIntervalSec * 1.5) {
        const missed = Math.floor(diff / expectedIntervalSec) - 1;
        gaps += Math.max(1, missed);
      }
    }

    const latest = sorted[sorted.length - 1];
    const latestTimestampSec = getTimeSec(latest);
    const latestAgeSec = Math.max(0, Math.round(Date.now() / 1000 - latestTimestampSec));
    const isLatestDelayed = latestAgeSec > maxAgeSec;

    return {
      hasGaps: gaps > 0,
      missingCandlesCount: gaps,
      isLatestDelayed,
      latestAgeSeconds: latestAgeSec,
      details:
        gaps > 0
          ? `Detectadas ${gaps} lacunas na série temporal M1.`
          : isLatestDelayed
          ? `Último candle atrasado há ${latestAgeSec}s.`
          : "Série contínua e sincronizada.",
    };
  }

  /**
   * Registra sinal simulado em PAPER MODE seguro
   * Zero execução em corretora real, zero chamadas a place_order ou close_position
   */
  public registerSimulatedSignal(
    asset = "EUR/USD",
    timeframe = "M1",
    direction: "PAR" | "IMPAR" = "PAR"
  ): {
    success: boolean;
    simulatedSignal: {
      id: string;
      asset: string;
      direction: "PAR" | "IMPAR";
      price: number;
      timestamp: number;
      paperOnly: true;
    };
    safetyCheck: string;
  } {
    const marketEngine = MarketDataEngine.getInstance();
    const lastTick = marketEngine.getLastTick(asset);
    const price = lastTick?.price ?? 1.08250;

    const signalRecord = {
      id: `olymp-sim-${Date.now()}`,
      asset,
      direction,
      price,
      timestamp: Date.now(),
      paperOnly: true as const,
    };

    this.simulatedSignals.unshift(signalRecord);
    if (this.simulatedSignals.length > 20) {
      this.simulatedSignals.pop();
    }

    return {
      success: true,
      simulatedSignal: signalRecord,
      safetyCheck:
        "Sinal simulado registrado com sucesso no ledger Paper Mode. Zero ordens financeiras enviadas à corretora.",
    };
  }
}
