// ==========================================================
// NEXORA TRADER AI — MARKET DATA & CANDLE ENGINE
// Production Services:
// 1. MarketDataEngine (Connection Status: LIVE, DELAYED, STALE, OFFLINE, DEMO)
// 2. CandleEngine (1M, 5M, 15M, 30M, 1H from real ticks)
// 3. LossGuard (Strict 9-point pre-signal safety gate)
// 4. LearningEngine (training, validation, out-of-sample, paper)
// 5. LossAnalyzer (Automatic autopsy on every LOSS)
// ==========================================================

import {
  RealCandle,
  MarketConnectionStatus,
  MarketDataEngineTelemetry,
  LossGuardResult,
  DetailedLossReport,
  MarketRegimeType,
  ConsensusPlatformId,
} from "../../src/types/nexora4AIConsensus.js";

// =============================================================================
// 1. CANDLE ENGINE
// =============================================================================
export class CandleEngine {
  private candlesByTimeframe: Map<string, RealCandle[]> = new Map();
  private readonly maxCandles = 200;

  constructor() {
    this.candlesByTimeframe.set("1M", []);
    this.candlesByTimeframe.set("5M", []);
    this.candlesByTimeframe.set("15M", []);
    this.candlesByTimeframe.set("30M", []);
    this.candlesByTimeframe.set("1H", []);
  }

  public getTimeframeDurationMs(tf: string): number {
    switch (tf) {
      case "1M":
        return 60 * 1000;
      case "5M":
        return 5 * 60 * 1000;
      case "15M":
        return 15 * 60 * 1000;
      case "30M":
        return 30 * 60 * 1000;
      case "1H":
        return 60 * 60 * 1000;
      default:
        return 60 * 1000;
    }
  }

  // Adiciona tick real e constrói a vela OHLC
  public ingestTick(symbol: string, price: number, timestamp: number, volume: number = 1): RealCandle {
    const timeframes = ["1M", "5M", "15M", "30M", "1H"];
    let primaryCandle: RealCandle | null = null;

    for (const tf of timeframes) {
      const durationMs = this.getTimeframeDurationMs(tf);
      const candleBucketTime = Math.floor(timestamp / durationMs) * durationMs;

      let candleList = this.candlesByTimeframe.get(tf) || [];
      const currentCandle = candleList[candleList.length - 1];

      if (!currentCandle || currentCandle.time !== candleBucketTime) {
        // Marca a vela anterior como fechada
        if (currentCandle) {
          currentCandle.isComplete = true;
        }

        // Inicia nova vela
        const newCandle: RealCandle = {
          time: candleBucketTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume,
          isComplete: false,
        };
        candleList.push(newCandle);

        if (candleList.length > this.maxCandles) {
          candleList = candleList.slice(-this.maxCandles);
        }
        this.candlesByTimeframe.set(tf, candleList);

        if (tf === "1M") primaryCandle = newCandle;
      } else {
        // Atualiza vela aberta
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
        currentCandle.volume = (currentCandle.volume || 0) + volume;
        currentCandle.isComplete = false;

        if (tf === "1M") primaryCandle = currentCandle;
      }
    }

    return primaryCandle || {
      time: Math.floor(timestamp / 60000) * 60000,
      open: price,
      high: price,
      low: price,
      close: price,
      volume,
      isComplete: false,
    };
  }

  public getCandles(timeframe: string = "1M"): RealCandle[] {
    return this.candlesByTimeframe.get(timeframe) || [];
  }

  public getLastCandle(timeframe: string = "1M"): RealCandle | null {
    const list = this.candlesByTimeframe.get(timeframe) || [];
    return list.length > 0 ? list[list.length - 1] : null;
  }
}

// =============================================================================
// 2. MARKET DATA ENGINE
// =============================================================================
export class MarketDataEngine {
  private static instance: MarketDataEngine;

  private connectionStatus: MarketConnectionStatus = "OFFLINE";
  private dataSource: string = "Nenhum feed conectado (Aguardando streaming WebSocket/API oficial)";
  private lastTick: {
    symbol: string;
    price: number;
    bid?: number;
    ask?: number;
    timestamp: number;
    spread: number;
    volume: number;
  } | null = null;

  private latencyMs: number = 0;
  private ticksReceived: number = 0;
  private reconnectCount: number = 0;
  private supportedTimeframes: string[] = ["1M", "5M", "15M", "30M", "1H"];
  private candleEngine: CandleEngine = new CandleEngine();
  private lastHeartbeatMs: number = Date.now();
  private hasLiveFeedAuthorization: boolean = false;

  private constructor() {
    // Inicialização limpa: SEM Math.random() e SEM dados falsos.
  }

  public static getInstance(): MarketDataEngine {
    if (!MarketDataEngine.instance) {
      MarketDataEngine.instance = new MarketDataEngine();
    }
    return MarketDataEngine.instance;
  }

  // Registra tick real recebido de feed externo ou webhook
  public recordTick(
    symbol: string,
    price: number,
    spread: number = 0.0001,
    source: string = "Feed Oficial WebSocket"
  ): RealCandle {
    const now = Date.now();
    this.ticksReceived++;
    this.lastHeartbeatMs = now;
    this.latencyMs = Math.max(5, now - this.lastHeartbeatMs);
    this.dataSource = source;

    const bid = Number((price - spread / 2).toFixed(5));
    const ask = Number((price + spread / 2).toFixed(5));

    this.lastTick = {
      symbol,
      price,
      bid,
      ask,
      timestamp: now,
      spread,
      volume: 1,
    };

    // Atualiza status baseado em autorização
    if (this.hasLiveFeedAuthorization) {
      this.connectionStatus = "LIVE";
    } else {
      this.connectionStatus = "DEMO";
    }

    return this.candleEngine.ingestTick(symbol, price, now, 1);
  }

  // Atualiza estado de conexão
  public setConnectionStatus(status: MarketConnectionStatus, source?: string) {
    if (status === "LIVE" && !this.hasLiveFeedAuthorization) {
      this.connectionStatus = "DEMO";
      if (source) this.dataSource = source;
      return;
    }
    this.connectionStatus = status;
    if (source) this.dataSource = source;
  }

  public setLiveFeedAuthorization(authorized: boolean) {
    this.hasLiveFeedAuthorization = authorized;
    if (authorized && this.ticksReceived > 0) {
      this.connectionStatus = "LIVE";
      this.dataSource = "Feed Autorizado em Tempo Real (WebSocket Ativo)";
    } else if (this.connectionStatus === "LIVE") {
      this.connectionStatus = this.ticksReceived > 0 ? "DEMO" : "OFFLINE";
    }
  }

  public getTelemetry(): MarketDataEngineTelemetry {
    const now = Date.now();
    // Se não houver ticks recebidos, o status é estritamente OFFLINE
    if (this.ticksReceived === 0 || !this.lastTick) {
      this.connectionStatus = "OFFLINE";
      this.dataSource = "Nenhum feed conectado (Aguardando streaming WebSocket/API oficial)";
    } else if (now - this.lastTick.timestamp > 15000 && this.connectionStatus !== "OFFLINE") {
      // Se não receber ticks por mais de 15 segundos, marca como STALE
      this.connectionStatus = "STALE";
    }

    return {
      connectionStatus: this.connectionStatus,
      dataSource: this.dataSource,
      lastTick: this.lastTick,
      lastCandle: this.candleEngine.getLastCandle("1M"),
      latencyMs: this.lastTick ? this.latencyMs : 0,
      ticksReceived: this.ticksReceived,
      reconnectCount: this.reconnectCount,
      supportedTimeframes: this.supportedTimeframes,
      lastUpdated: now,
    };
  }

  public getCandleEngine(): CandleEngine {
    return this.candleEngine;
  }
}

// =============================================================================
// 3. LOSS GUARD (BARREIRA CRÍTICA PRÉ-SINAL)
// =============================================================================
export class LossGuard {
  public static verifySignalConditions(params: {
    dataQuality: number;
    latencyMs: number;
    candleClosed: boolean;
    regime: MarketRegimeType;
    volatilityScore: number;
    hasContradiction: boolean;
    setupWinRate: number;
    consecutiveLosses: number;
    aiHealthStatus: {
      gptOnline: boolean;
      claudeOnline: boolean;
      geminiOnline: boolean;
      grokOnline: boolean;
    };
  }): LossGuardResult {
    const blockReasons: string[] = [];

    // 1. Qualidade dos Dados (>= 80%)
    const dataQualityPass = params.dataQuality >= 80;
    if (!dataQualityPass) {
      blockReasons.push(`Loss Guard: Qualidade do feed degradada (${params.dataQuality}% < 80%).`);
    }

    // 2. Latência (<= 15000ms)
    const latencyPass = params.latencyMs <= 15000;
    if (!latencyPass) {
      blockReasons.push(`Loss Guard: Latência excessiva do feed (${params.latencyMs}ms > 15000ms).`);
    }

    // 3. Candle Fechado
    const candleClosedPass = params.candleClosed === true;
    if (!candleClosedPass) {
      blockReasons.push("Loss Guard: Aguardando fechamento do candle para confirmação de paridade.");
    }

    // 4. Regime de Mercado
    const regimePass = params.regime !== "UNCERTAIN";
    if (!regimePass) {
      blockReasons.push("Loss Guard: Regime de mercado incerto (UNCERTAIN). Veto protetivo.");
    }

    // 5. Volatilidade (<= 85)
    const volatilityPass = params.volatilityScore <= 85;
    if (!volatilityPass) {
      blockReasons.push("Loss Guard: Spike extremo de volatilidade macro. Veto de segurança.");
    }

    // 6. Contradição Adversária
    const contradictionPass = !params.hasContradiction;
    if (!contradictionPass) {
      blockReasons.push("Loss Guard: Contradição crítica detectada entre analistas.");
    }

    // 7. Histórico do Setup (Win Rate >= 50%)
    const setupHistoryPass = params.setupWinRate >= 50;
    if (!setupHistoryPass) {
      blockReasons.push(`Loss Guard: Setup com assertividade histórica abaixo do limiar (${params.setupWinRate}%).`);
    }

    // 8. Sequência de Losses (< 3)
    const lossStreakPass = params.consecutiveLosses < 3;
    if (!lossStreakPass) {
      blockReasons.push(`Loss Guard: Circuit Breaker acionado (${params.consecutiveLosses} perdas consecutivas). Cooldown ativo.`);
    }

    // 9. Saúde das IAs
    const aiHealthPass =
      params.aiHealthStatus.gptOnline ||
      params.aiHealthStatus.claudeOnline ||
      params.aiHealthStatus.geminiOnline ||
      params.aiHealthStatus.grokOnline;
    if (!aiHealthPass) {
      blockReasons.push("Loss Guard: Quórum de IAs indisponível no servidor.");
    }

    const passed =
      dataQualityPass &&
      latencyPass &&
      candleClosedPass &&
      regimePass &&
      volatilityPass &&
      contradictionPass &&
      setupHistoryPass &&
      lossStreakPass &&
      aiHealthPass;

    return {
      passed,
      status: passed ? "PASSED" : "BLOCKED",
      blockReasons,
      checks: {
        dataQuality: dataQualityPass,
        latency: latencyPass,
        candleClosed: candleClosedPass,
        regime: regimePass,
        volatility: volatilityPass,
        contradictions: contradictionPass,
        setupHistory: setupHistoryPass,
        lossStreak: lossStreakPass,
        aiHealth: aiHealthPass,
      },
    };
  }
}

// =============================================================================
// 4. LOSS ANALYZER (AUTÓPSIA AUTOMÁTICA EM PERDAS)
// =============================================================================
export class LossAnalyzerV5 {
  private static reports: DetailedLossReport[] = [];

  public static recordLoss(report: Omit<DetailedLossReport, "id" | "timestamp" | "recordedToLearning">): DetailedLossReport {
    const fullReport: DetailedLossReport = {
      ...report,
      id: `loss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      recordedToLearning: true,
    };

    LossAnalyzerV5.reports.unshift(fullReport);
    if (LossAnalyzerV5.reports.length > 100) {
      LossAnalyzerV5.reports.pop();
    }

    return fullReport;
  }

  public static getReports(limit: number = 20): DetailedLossReport[] {
    return LossAnalyzerV5.reports.slice(0, limit);
  }
}

// =============================================================================
// 5. LEARNING ENGINE (PARTIÇÕES ESTATÍSTICAS SEM VAZAMENTO FUTURO)
// =============================================================================
export class LearningEngineV5 {
  private static partitions = {
    training: [] as any[],
    validation: [] as any[],
    outOfSample: [] as any[],
    paper: [] as any[],
  };

  public static recordCompletedTrade(partition: "training" | "validation" | "outOfSample" | "paper", tradeData: any) {
    // Garante que apenas trades já finalizados e liquidados são gravados
    if (!tradeData.result || tradeData.result === "OPEN") {
      return;
    }

    const record = {
      ...tradeData,
      recordedAt: Date.now(),
    };

    LearningEngineV5.partitions[partition].push(record);
    if (LearningEngineV5.partitions[partition].length > 500) {
      LearningEngineV5.partitions[partition].shift();
    }
  }

  public static getPartitionStats() {
    return {
      trainingCount: LearningEngineV5.partitions.training.length,
      validationCount: LearningEngineV5.partitions.validation.length,
      outOfSampleCount: LearningEngineV5.partitions.outOfSample.length,
      paperCount: LearningEngineV5.partitions.paper.length,
    };
  }
}
