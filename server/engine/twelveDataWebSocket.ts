// ==========================================================
// NEXORA TITAN AI V30 — TWELVE DATA MANAGED WEBSOCKET CLIENT
// Real-time tick streaming for EUR/USD, GBP/USD, USD/JPY, BTC/USD
// Official docs: https://twelvedata.com/docs#websocket
// ==========================================================

import { MarketDataEngine } from "./marketData.js";
import { CandleEngine } from "./candleEngine.js";

export interface TwelveDataWSStatus {
  connected: boolean;
  status: "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "INVALID_KEY" | "PLAN_RESTRICTION" | "DISABLED";
  message: string;
  lastEventTimestamp: number;
  ticksReceived: number;
  subscribedSymbols: string[];
  lastPrice?: number;
  lastSymbol?: string;
  lastError?: string;
  latencyMs: number;
}

export class TwelveDataWebSocketManager {
  private static instance: TwelveDataWebSocketManager | null = null;

  private ws: any = null;
  private symbols: string[] = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD"];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isExplicitlyClosed = false;

  private currentStatus: TwelveDataWSStatus = {
    connected: false,
    status: "DISCONNECTED",
    message: "Twelve Data WebSocket desconectado.",
    lastEventTimestamp: 0,
    ticksReceived: 0,
    subscribedSymbols: [],
    latencyMs: 0,
  };

  public static getInstance(): TwelveDataWebSocketManager {
    if (!TwelveDataWebSocketManager.instance) {
      TwelveDataWebSocketManager.instance = new TwelveDataWebSocketManager();
    }
    return TwelveDataWebSocketManager.instance;
  }

  private constructor() {
    // Inicializa a conexão se a chave estiver configurada
    this.connect();
  }

  private getApiKey(): string | null {
    const rawKey = process.env.TWELVE_DATA_API_KEY?.trim();
    if (!rawKey || rawKey === "" || rawKey.toLowerCase() === "demo" || rawKey.length < 8) {
      return null;
    }
    return rawKey;
  }

  public connect(): void {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      const raw = process.env.TWELVE_DATA_API_KEY?.trim();
      const isDummy = raw && raw.length < 8;
      this.currentStatus = {
        connected: false,
        status: isDummy ? "INVALID_KEY" : "DISABLED",
        message: isDummy
          ? `Chave Twelve Data ('${raw}') é inválida (chave padrão deve conter 32 caracteres). WebSocket desativado.`
          : "TWELVE_DATA_API_KEY não configurada. WebSocket da Twelve Data desativado.",
        lastEventTimestamp: Date.now(),
        ticksReceived: 0,
        subscribedSymbols: [],
        latencyMs: 0,
        lastError: isDummy ? "Chave de formato inválido" : "Chave ausente",
      };
      return;
    }

    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
      return; // Já conectando ou conectado
    }

    this.isExplicitlyClosed = false;
    this.currentStatus.status = "CONNECTING";
    this.currentStatus.message = "Conectando ao Twelve Data WebSocket...";

    const t0 = Date.now();
    const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${encodeURIComponent(apiKey)}`;

    try {
      // Uso do WebSocket nativo do Node.js (Node 22+)
      const WebSocketClass = (globalThis as any).WebSocket;
      if (!WebSocketClass) {
        this.currentStatus.status = "DISABLED";
        this.currentStatus.message = "WebSocket nativo não suportado neste ambiente.";
        return;
      }

      this.ws = new WebSocketClass(wsUrl);

      this.ws.onopen = () => {
        this.currentStatus.connected = true;
        this.currentStatus.status = "CONNECTED";
        this.currentStatus.message = "Conectado ao WebSocket Twelve Data. Inscrevendo ativos...";
        this.currentStatus.latencyMs = Date.now() - t0;
        this.reconnectAttempts = 0;

        // Inscreve nos ativos desejados
        this.subscribe(this.symbols);

        // Heartbeat a cada 30 segundos conforme especificação Twelve Data
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: any) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err: any) => {
        const errorMsg = err?.message || "Erro de conexão WebSocket";
        this.currentStatus.lastError = errorMsg;
        this.currentStatus.latencyMs = Date.now() - t0;

        // Se a chave for rejeitada na autenticação
        if (this.reconnectAttempts === 0) {
          this.currentStatus.status = "INVALID_KEY";
          this.currentStatus.message = `Falha na autenticação Twelve Data WebSocket: ${errorMsg}. Requer chave válida e plano Basic/Pro para pares Forex.`;
        }
      };

      this.ws.onclose = (event: any) => {
        this.stopHeartbeat();
        this.currentStatus.connected = false;

        if (this.isExplicitlyClosed) {
          this.currentStatus.status = "DISCONNECTED";
          this.currentStatus.message = "WebSocket Twelve Data desconectado manualmente.";
          return;
        }

        const reason = event?.reason || "Conexão encerrada";
        const code = event?.code || 1006;

        if (code === 4001 || code === 4003 || this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.currentStatus.status = "PLAN_RESTRICTION";
          this.currentStatus.message = `Twelve Data WebSocket desconectado (${code}: ${reason}). Acesso a Forex WebSocket requer plano Twelve Data Basic/Pro. O sistema continuará com o Feed Interbancário em tempo real.`;
        } else {
          this.currentStatus.status = "DISCONNECTED";
          this.currentStatus.message = `WebSocket desconectado (${code}). Tentando reconexão controlada...`;
          this.scheduleReconnect();
        }
      };
    } catch (err: any) {
      this.currentStatus.connected = false;
      this.currentStatus.status = "INVALID_KEY";
      this.currentStatus.message = `Erro ao inicializar WebSocket: ${err?.message || "Erro desconhecido"}`;
    }
  }

  private subscribe(symbols: string[]): void {
    if (!this.ws || this.ws.readyState !== 1) return;

    try {
      const subscribeMsg = {
        action: "subscribe",
        params: {
          symbols: symbols.join(","),
        },
      };
      this.ws.send(JSON.stringify(subscribeMsg));
      this.currentStatus.subscribedSymbols = symbols;
    } catch (e: any) {
      console.warn("[TwelveDataWS] Falha ao enviar inscrição:", e?.message);
    }
  }

  private handleMessage(rawData: any): void {
    const now = Date.now();
    this.currentStatus.lastEventTimestamp = now;

    try {
      const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;

      // Evento de status de inscrição
      if (data.event === "subscribe-status") {
        if (data.status === "ok") {
          this.currentStatus.status = "CONNECTED";
          this.currentStatus.message = `Inscrição confirmada para: ${(data.success || []).map((s: any) => s.symbol).join(", ")}`;
        } else if (data.status === "error") {
          this.currentStatus.status = "PLAN_RESTRICTION";
          this.currentStatus.message = `Twelve Data WebSocket: ${data.message || "Símbolo restrito no plano atual"}`;
          this.currentStatus.lastError = data.message;
        }
        return;
      }

      // Evento de preço em tempo real: { event: "price", symbol: "EUR/USD", price: 1.11950, timestamp: 1729000000, bid: ..., ask: ... }
      if (data.event === "price" && data.symbol && typeof data.price === "number") {
        const symbol = data.symbol;
        const price = Number(data.price);
        const spread = (typeof data.ask === "number" && typeof data.bid === "number")
          ? Math.max(0.00005, data.ask - data.bid)
          : symbol.includes("BTC") ? 0.5 : symbol.includes("JPY") ? 0.015 : 0.0001;

        this.currentStatus.ticksReceived++;
        this.currentStatus.lastPrice = price;
        this.currentStatus.lastSymbol = symbol;
        this.currentStatus.status = "CONNECTED";
        this.currentStatus.message = `Recebendo ticks em tempo real via WebSocket: ${symbol} = ${price}`;

        // Ingestão no MarketDataEngine e no CandleEngine
        const tickRes = MarketDataEngine.getInstance().recordTick(symbol, price, spread, "TWELVE_DATA_WEBSOCKET");
        if (tickRes.valid && tickRes.tick) {
          CandleEngine.getInstance().ingestTick(tickRes.tick);
        }
        return;
      }

      // Heartbeat
      if (data.event === "heartbeat") {
        return;
      }
    } catch (e: any) {
      console.warn("[TwelveDataWS] Erro ao processar mensagem:", e?.message);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === 1) {
        try {
          this.ws.send(JSON.stringify({ action: "heartbeat" }));
        } catch {}
      }
    }, 30000);

    if (this.heartbeatTimer && (this.heartbeatTimer as any).unref) {
      (this.heartbeatTimer as any).unref();
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempts++;

    // Backoff exponencial: 5s, 10s, 20s, 40s
    const delay = Math.min(40000, 5000 * Math.pow(1.5, this.reconnectAttempts));

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isExplicitlyClosed && this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect();
      }
    }, delay);

    if (this.reconnectTimer && (this.reconnectTimer as any).unref) {
      (this.reconnectTimer as any).unref();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.currentStatus.connected = false;
    this.currentStatus.status = "DISCONNECTED";
    this.currentStatus.message = "Desconectado.";
  }

  public getStatus(): TwelveDataWSStatus {
    return { ...this.currentStatus };
  }
}
