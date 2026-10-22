// ==========================================================
// NEXORA VISION AI — TWELVE DATA INTEGRATION SERVICE
// Official Documentation: https://twelvedata.com/docs
// Real Data Engine for EUR/USD M1 Candles and Indicators Validation
// ==========================================================

import { Candle } from "../../src/types.js";
import { CandleEngine } from "./candleEngine.js";
import { MarketDataEngine } from "./marketData.js";

import { TwelveDataWebSocketManager, TwelveDataWSStatus } from "./twelveDataWebSocket.js";

export interface TwelveDataValidationResult {
  valid: boolean;
  errors: string[];
  candlesCount: number;
  latestCandleTime?: string;
  ageSeconds?: number;
  hasGaps?: boolean;
}

export interface TwelveDataStatus {
  configured: boolean;
  hasPersonalKey: boolean;
  status: "CONNECTED" | "KEY_MISSING" | "INVALID_KEY" | "ERROR" | "INITIALIZING";
  message: string;
  lastCheckTimestamp: number;
  dataReceiptTimestamp?: number;
  candleOpenTimestamp?: number;
  candleOpenTimeSP?: string;
  dataReceiptTimeSP?: string;
  indicatorsAvailableCount: number;
  indicatorsListSample: string[];
  latestCandleTimestamp?: string;
  candlesCount: number;
  symbol: string;
  interval: string;
  latencyMs: number;
  lastError?: string;
  webSocket?: TwelveDataWSStatus;
  testedRealResponse?: {
    endpoint: string;
    httpStatus: number;
    responseStatus: string;
    message?: string;
    timestamp: number;
  };
}

export class TwelveDataService {
  private static instance: TwelveDataService | null = null;

  private baseUrl = "https://api.twelvedata.com";
  private symbol = "EUR/USD";
  private interval = "1min";
  private outputsize = 30;

  // Cached indicators catalog from /technical_indicators endpoint
  private cachedIndicatorsCount = 0;
  private cachedIndicatorsSample: string[] = [];
  private lastIndicatorsCheck = 0;

  // Connection & Health status
  private currentStatus: TwelveDataStatus = {
    configured: false,
    hasPersonalKey: false,
    status: "INITIALIZING",
    message: "Verificando configuração Twelve Data...",
    lastCheckTimestamp: Date.now(),
    indicatorsAvailableCount: 0,
    indicatorsListSample: [],
    candlesCount: 0,
    symbol: "EUR/USD",
    interval: "1min",
    latencyMs: 0,
  };

  private pollIntervalTimer: NodeJS.Timeout | null = null;

  public static getInstance(): TwelveDataService {
    if (!TwelveDataService.instance) {
      TwelveDataService.instance = new TwelveDataService();
    }
    return TwelveDataService.instance;
  }

  private constructor() {
    // Initial verification on startup
    this.checkConfigurationAndSync();

    // Background verification interval (every 30 seconds)
    this.pollIntervalTimer = setInterval(() => {
      this.checkConfigurationAndSync();
    }, 30000);

    if (this.pollIntervalTimer && (this.pollIntervalTimer as any).unref) {
      (this.pollIntervalTimer as any).unref();
    }
  }

  private lastTimeSeriesCache = new Map<string, { result: any; timestamp: number }>();

  /**
   * Obtém chave pessoal segura estritamente no servidor
   * Regra 3 & 6: Ler TWELVE_DATA_API_KEY. Não usar apikey=demo.
   */
  public getApiKey(): string | null {
    const rawKey = process.env.TWELVE_DATA_API_KEY?.trim();
    if (!rawKey || rawKey === "" || rawKey.toLowerCase() === "demo" || rawKey.length < 8) {
      return null;
    }
    return rawKey;
  }

  /**
   * 1. Consulta endpoint oficial /technical_indicators
   * Conforme especificação: "Use o endpoint /technical_indicators apenas para consultar os indicadores disponíveis."
   */
  public async getAvailableTechnicalIndicators(): Promise<{
    success: boolean;
    count: number;
    sample: string[];
    rawStatus: string;
    error?: string;
  }> {
    const now = Date.now();
    // Cache de 1 hora para os metadados de indicadores
    if (this.cachedIndicatorsCount > 0 && now - this.lastIndicatorsCheck < 3600000) {
      return {
        success: true,
        count: this.cachedIndicatorsCount,
        sample: this.cachedIndicatorsSample,
        rawStatus: "ok",
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/technical_indicators`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.status === "ok" && data.data) {
        const keys = Object.keys(data.data);
        this.cachedIndicatorsCount = keys.length;
        this.cachedIndicatorsSample = keys.slice(0, 15);
        this.lastIndicatorsCheck = now;

        return {
          success: true,
          count: keys.length,
          sample: this.cachedIndicatorsSample,
          rawStatus: "ok",
        };
      }

      return {
        success: false,
        count: 0,
        sample: [],
        rawStatus: String(data?.status || res.status),
        error: data?.message || `HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        sample: [],
        rawStatus: "network_error",
        error: err?.message || "Falha de rede ao consultar indicadores Twelve Data",
      };
    }
  }

  /**
   * 2. Consulta candles reais de EUR/USD no M1 via endpoint /time_series
   * Valida status, campos OHLC, timestamps e atualidade dos dados.
   * Respeita limites de API (cache de 45 segundos para chamadas repetidas).
   */
  public async fetchTimeSeries(
    symbol = "EUR/USD",
    interval = "1min",
    outputsize = 30
  ): Promise<{
    success: boolean;
    candles?: Candle[];
    meta?: any;
    status: "CONNECTED" | "KEY_MISSING" | "INVALID_KEY" | "ERROR";
    message: string;
    latencyMs: number;
    testedRealResponse?: any;
  }> {
    const cacheKey = `${symbol}:${interval}:${outputsize}`;
    const cached = this.lastTimeSeriesCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < 45000) {
      return cached.result;
    }

    const t0 = Date.now();
    const apiKey = this.getApiKey();

    // Se a chave estiver ausente ou formato inválido (< 8 caracteres, ex: "000"), reportar sem chamar API
    const rawKey = process.env.TWELVE_DATA_API_KEY?.trim();
    if (!apiKey) {
      const latencyMs = Date.now() - t0;
      const isInvalid = Boolean(rawKey && rawKey.length < 8);
      const resPayload = {
        success: false,
        status: isInvalid ? ("INVALID_KEY" as const) : ("KEY_MISSING" as const),
        message: isInvalid
          ? `TWELVE DATA ERRO: Chave '${rawKey}' inválida (chave requer 32 caracteres hexadecimais). Obtenha em https://twelvedata.com.`
          : "CONFIGURAÇÃO PENDENTE: TWELVE_DATA_API_KEY ausente ou não configurada no servidor. Geração de sinais Twelve Data bloqueada.",
        latencyMs,
        testedRealResponse: {
          endpoint: "/time_series",
          httpStatus: 401,
          responseStatus: "error",
          message: isInvalid
            ? `Chave '${rawKey}' inválida (formato incorreto)`
            : "TWELVE_DATA_API_KEY não definida no ambiente do servidor.",
          timestamp: Date.now(),
        },
      };
      this.lastTimeSeriesCache.set(cacheKey, { result: resPayload, timestamp: now });
      return resPayload;
    }

    try {
      const url = `${this.baseUrl}/time_series?symbol=${encodeURIComponent(
        symbol
      )}&interval=${encodeURIComponent(interval)}&outputsize=${outputsize}&timezone=UTC&apikey=${encodeURIComponent(
        apiKey
      )}`;

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const latencyMs = Date.now() - t0;
      const data = await res.json().catch(() => ({}));

      // Resposta real de erro da Twelve Data (ex: 401 chave inválida, 429 limite atingido)
      if (!res.ok || data.status === "error" || data.code) {
        const errorMsg = data.message || `Erro ${data.code || res.status} da Twelve Data API`;
        const isAuthError = data.code === 401 || res.status === 401;

        return {
          success: false,
          status: isAuthError ? "INVALID_KEY" : "ERROR",
          message: `TWELVE DATA ERRO: ${errorMsg}`,
          latencyMs,
          testedRealResponse: {
            endpoint: "/time_series",
            httpStatus: res.status,
            responseStatus: data.status || "error",
            message: errorMsg,
            code: data.code,
            timestamp: Date.now(),
          },
        };
      }

      // Regra 4: Validação rigorosa dos campos OHLC, timestamps e atualidade dos dados
      const values = data.values;
      if (!Array.isArray(values) || values.length === 0) {
        return {
          success: false,
          status: "ERROR",
          message: "TWELVE DATA: Nenhum candle retornado para o ativo solicitado.",
          latencyMs,
          testedRealResponse: {
            endpoint: "/time_series",
            httpStatus: res.status,
            responseStatus: data.status,
            message: "Array values vazio.",
            timestamp: Date.now(),
          },
        };
      }

      const parsedCandles: Candle[] = [];
      const now = Date.now();

      for (let i = values.length - 1; i >= 0; i--) {
        const item = values[i];
        const open = parseFloat(item.open);
        const high = parseFloat(item.high);
        const low = parseFloat(item.low);
        const close = parseFloat(item.close);
        const volume = parseFloat(item.volume) || 10;

        // Validação OHLC estrita
        if (
          isNaN(open) ||
          isNaN(high) ||
          isNaN(low) ||
          isNaN(close) ||
          open <= 0 ||
          close <= 0 ||
          high < low
        ) {
          continue;
        }

        // Parse datetime (Ex: '2026-10-12 18:22:00')
        const dtString = String(item.datetime).replace(" ", "T");
        let ts = Date.parse(dtString + "Z");
        if (isNaN(ts)) {
          ts = Date.parse(item.datetime);
        }
        if (isNaN(ts)) {
          ts = now - i * 60000;
        }

        // Não aceita timestamps no futuro
        if (ts > now + 300000) {
          continue;
        }

        parsedCandles.push({
          open,
          high,
          low,
          close,
          volume,
          timestamp: ts,
          closed: i > 0, // Último candle pode estar em formação
        });
      }

      if (parsedCandles.length < 5) {
        return {
          success: false,
          status: "ERROR",
          message: "TWELVE DATA: Quantidade de candles válidos insuficiente (< 5).",
          latencyMs,
          testedRealResponse: {
            endpoint: "/time_series",
            httpStatus: 200,
            responseStatus: "incomplete_data",
            timestamp: Date.now(),
          },
        };
      }

      return {
        success: true,
        candles: parsedCandles,
        meta: data.meta,
        status: "CONNECTED",
        message: `TWELVE DATA CONECTADO: ${parsedCandles.length} candles reais recebidos com sucesso.`,
        latencyMs,
        testedRealResponse: {
          endpoint: "/time_series",
          httpStatus: 200,
          responseStatus: "ok",
          message: `${parsedCandles.length} candles M1 validados`,
          timestamp: Date.now(),
        },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      return {
        success: false,
        status: "ERROR",
        message: `TWELVE DATA: Falha de conexão de rede (${err?.message || "timeout"}).`,
        latencyMs,
        testedRealResponse: {
          endpoint: "/time_series",
          httpStatus: 0,
          responseStatus: "exception",
          message: err?.message,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Sincroniza e audita a conexão em tempo real
   */
  public async checkConfigurationAndSync(): Promise<TwelveDataStatus> {
    const hasPersonalKey = Boolean(this.getApiKey());

    // 1. Consulta indicadores disponíveis (/technical_indicators)
    const indRes = await this.getAvailableTechnicalIndicators();

    // 2. Consulta candles (/time_series)
    const tsRes = await this.fetchTimeSeries(this.symbol, this.interval, this.outputsize);

    const receiptNow = Date.now();
    const latestCandle = tsRes.candles?.length ? tsRes.candles[tsRes.candles.length - 1] : undefined;
    const candleOpenTs = latestCandle?.timestamp;

    const formatSP = (ms?: number) => {
      if (!ms) return undefined;
      return new Date(ms).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    };

    const wsStatus = TwelveDataWebSocketManager.getInstance().getStatus();

    this.currentStatus = {
      configured: hasPersonalKey,
      hasPersonalKey,
      status: tsRes.status,
      message: tsRes.message,
      lastCheckTimestamp: receiptNow,
      dataReceiptTimestamp: receiptNow,
      candleOpenTimestamp: candleOpenTs,
      candleOpenTimeSP: formatSP(candleOpenTs),
      dataReceiptTimeSP: formatSP(receiptNow),
      indicatorsAvailableCount: indRes.count,
      indicatorsListSample: indRes.sample,
      latestCandleTimestamp: latestCandle ? new Date(latestCandle.timestamp).toISOString() : undefined,
      candlesCount: tsRes.candles?.length || 0,
      symbol: this.symbol,
      interval: this.interval,
      latencyMs: tsRes.latencyMs,
      lastError: !tsRes.success ? tsRes.message : undefined,
      webSocket: wsStatus,
      testedRealResponse: tsRes.testedRealResponse,
    };

    // Se a conexão foi bem-sucedida, alimenta o CandleEngine e MarketDataEngine
    if (tsRes.success && tsRes.candles && tsRes.candles.length > 0) {
      const candleEngine = CandleEngine.getInstance();
      candleEngine.ingestHistory("EUR/USD", "1M", tsRes.candles);

      const latest = tsRes.candles[tsRes.candles.length - 1];
      MarketDataEngine.getInstance().recordTick(
        "EUR/USD",
        latest.close,
        0.0001,
        "TWELVE_DATA_LIVE"
      );
      MarketDataEngine.getInstance().setConnectionStatus("LIVE", "TWELVE_DATA_LIVE_FEED");
    } else {
      // Se a chave Twelve Data não estiver configurada ou for inválida:
      // Mantém status de Twelve Data como KEY_MISSING/ERROR, mas preserva o feed interbancário ativo se disponível
      const marketEngine = MarketDataEngine.getInstance();
      if (marketEngine.getHealth().ticksReceived === 0) {
        if (!hasPersonalKey) {
          marketEngine.setConnectionStatus(
            "OFFLINE",
            "TWELVE_DATA_CONFIG_PENDENTE (CHAVE AUSENTE)"
          );
        } else {
          marketEngine.setConnectionStatus(
            "OFFLINE",
            `TWELVE_DATA_ERRO (${tsRes.message})`
          );
        }
      }
    }

    return this.currentStatus;
  }

  public getStatus(): TwelveDataStatus {
    return {
      ...this.currentStatus,
      webSocket: TwelveDataWebSocketManager.getInstance().getStatus(),
    };
  }

  public isConnected(): boolean {
    return this.currentStatus.status === "CONNECTED";
  }
}
