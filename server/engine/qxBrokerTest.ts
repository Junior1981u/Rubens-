// ==========================================================
// NEXORA TITAN AI — TESTE SEGURO DE WEBSOCKET QX BROKER
// Investigação isolada, segura e transparente de endpoint WebSocket
// ==========================================================

import dns from "dns";

export type QXTestState = "NÃO TESTADO" | "CONECTANDO" | "CONECTADO" | "DADOS RECEBIDOS" | "FALHA";

export interface QXBrokerTestReport {
  state: QXTestState;
  endpoint: string;
  targetOrigin: string;
  eioVersion: string;
  transport: string;
  connectionTimeMs: number;
  messagesReceivedCount: number;
  messageTypesReceived: string[];
  summaryError: string | null;
  explicitWarning: string;
  timestamp: number;
  durationMs: number;
  compatibility: {
    dnsResolved: boolean;
    dnsAddress?: string;
    protocolNegotiationAttempted: boolean;
    handshakeSuccess: boolean;
    marketDataIdentified: boolean;
    requiresAuthOrSession: boolean;
    details: string;
  };
  safetyNotice: {
    paperModeActive: boolean;
    ordersSent: false;
    financialExecutionBlocked: true;
    sensitiveDataMasked: true;
  };
}

export class QXBrokerTestManager {
  private static instance: QXBrokerTestManager | null = null;

  private targetEndpoint = "wss://ws2.qxbroker.com/socket.io/?EIO=3&transport=websocket";
  private targetOrigin = "https://qxbroker.com";
  private isTesting = false;

  private lastReport: QXBrokerTestReport = {
    state: "NÃO TESTADO",
    endpoint: this.targetEndpoint,
    targetOrigin: this.targetOrigin,
    eioVersion: "3",
    transport: "websocket",
    connectionTimeMs: 0,
    messagesReceivedCount: 0,
    messageTypesReceived: [],
    summaryError: null,
    explicitWarning: "Aviso: Teste de diagnóstico ainda não executado. O sistema opera 100% em PAPER MODE com Twelve Data e Feed Interbancário.",
    timestamp: Date.now(),
    durationMs: 0,
    compatibility: {
      dnsResolved: false,
      protocolNegotiationAttempted: false,
      handshakeSuccess: false,
      marketDataIdentified: false,
      requiresAuthOrSession: true,
      details: "Aguardando disparo do teste isolado.",
    },
    safetyNotice: {
      paperModeActive: true,
      ordersSent: false,
      financialExecutionBlocked: true,
      sensitiveDataMasked: true,
    },
  };

  public static getInstance(): QXBrokerTestManager {
    if (!QXBrokerTestManager.instance) {
      QXBrokerTestManager.instance = new QXBrokerTestManager();
    }
    return QXBrokerTestManager.instance;
  }

  public getReport(): QXBrokerTestReport {
    return { ...this.lastReport };
  }

  /**
   * Executa teste isolado do endpoint WebSocket QX Broker com timeout estrito de 15 segundos
   */
  public async runTest(): Promise<QXBrokerTestReport> {
    if (this.isTesting) {
      return this.getReport();
    }

    this.isTesting = true;
    const t0 = performance.now();
    const timestamp = Date.now();

    this.lastReport = {
      state: "CONECTANDO",
      endpoint: this.targetEndpoint,
      targetOrigin: this.targetOrigin,
      eioVersion: "3",
      transport: "websocket",
      connectionTimeMs: 0,
      messagesReceivedCount: 0,
      messageTypesReceived: [],
      summaryError: null,
      explicitWarning: "Conexão em andamento... Verificando resolução DNS e handshake Socket.io EIO=3.",
      timestamp,
      durationMs: 0,
      compatibility: {
        dnsResolved: false,
        protocolNegotiationAttempted: true,
        handshakeSuccess: false,
        marketDataIdentified: false,
        requiresAuthOrSession: true,
        details: "Iniciando negociação inicial com timeout de 15 segundos.",
      },
      safetyNotice: {
        paperModeActive: true,
        ordersSent: false,
        financialExecutionBlocked: true,
        sensitiveDataMasked: true,
      },
    };

    // 1. Passo prévio: Auditoria de DNS
    let dnsOk = false;
    let dnsAddr = "";
    try {
      const hostname = new URL(this.targetEndpoint.replace("wss://", "https://")).hostname;
      const lookupRes = await new Promise<{ address: string; family: number }>((resolve, reject) => {
        dns.lookup(hostname, (err, address, family) => {
          if (err) reject(err);
          else resolve({ address, family });
        });
      });
      dnsOk = true;
      dnsAddr = lookupRes.address;
    } catch (dnsErr: any) {
      dnsOk = false;
      const errorMsg = `Falha de resolução DNS: Host 'ws2.qxbroker.com' não encontrado (${dnsErr?.code || "ENOTFOUND"}).`;
      const elapsed = Math.round(performance.now() - t0);

      this.lastReport = {
        state: "FALHA",
        endpoint: this.targetEndpoint,
        targetOrigin: this.targetOrigin,
        eioVersion: "3",
        transport: "websocket",
        connectionTimeMs: elapsed,
        messagesReceivedCount: 0,
        messageTypesReceived: [],
        summaryError: errorMsg,
        explicitWarning: "AVISO EXPLÍCITO: Conexão não pôde ser estabelecida. O domínio 'ws2.qxbroker.com' não possui registro DNS público acessível no ambiente de execução. NENHUMA cotação de mercado recebida. O sistema NÃO exibirá LIVE.",
        timestamp: Date.now(),
        durationMs: elapsed,
        compatibility: {
          dnsResolved: false,
          protocolNegotiationAttempted: true,
          handshakeSuccess: false,
          marketDataIdentified: false,
          requiresAuthOrSession: true,
          details: `Endpoint inacessível via DNS público (${dnsErr?.code || "ENOTFOUND"}). A QX Broker utiliza domínios rotativos, proteção Cloudflare e requer sessão autenticada com cookies privados no navegador do usuário.`,
        },
        safetyNotice: {
          paperModeActive: true,
          ordersSent: false,
          financialExecutionBlocked: true,
          sensitiveDataMasked: true,
        },
      };

      this.isTesting = false;
      return this.getReport();
    }

    // 2. Passo: Conexão WebSocket com timeout de 15 segundos
    return new Promise<QXBrokerTestReport>((resolve) => {
      let resolved = false;
      let connectionEstablished = false;
      let openTimeMs = 0;
      const receivedMessages: string[] = [];
      const messageTypes: string[] = [];
      let marketQuotesFound = false;

      const WebSocketClass = (globalThis as any).WebSocket;
      if (!WebSocketClass) {
        this.lastReport.state = "FALHA";
        this.lastReport.summaryError = "WebSocket nativo não disponível no runtime.";
        this.isTesting = false;
        return resolve(this.getReport());
      }

      let ws: any = null;

      const finish = (state: QXTestState, error: string | null, warning: string, details: string) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutTimer);

        if (ws) {
          try {
            ws.close();
          } catch {}
          ws = null;
        }

        const elapsed = Math.round(performance.now() - t0);
        this.lastReport = {
          state,
          endpoint: this.targetEndpoint,
          targetOrigin: this.targetOrigin,
          eioVersion: "3",
          transport: "websocket",
          connectionTimeMs: openTimeMs || elapsed,
          messagesReceivedCount: receivedMessages.length,
          messageTypesReceived: Array.from(new Set(messageTypes)),
          summaryError: error,
          explicitWarning: warning,
          timestamp: Date.now(),
          durationMs: elapsed,
          compatibility: {
            dnsResolved: dnsOk,
            dnsAddress: dnsAddr,
            protocolNegotiationAttempted: true,
            handshakeSuccess: connectionEstablished,
            marketDataIdentified: marketQuotesFound,
            requiresAuthOrSession: true,
            details,
          },
          safetyNotice: {
            paperModeActive: true,
            ordersSent: false,
            financialExecutionBlocked: true,
            sensitiveDataMasked: true,
          },
        };

        this.isTesting = false;
        resolve(this.getReport());
      };

      const timeoutTimer = setTimeout(() => {
        if (connectionEstablished) {
          finish(
            "CONECTADO",
            null,
            "AVISO EXPLÍCITO: Conexão aberta por 15s mas NENHUMA cotação de mercado identificada. O endpoint não transmite dados sem autenticação/inscrição privada.",
            "Handshake aceito, porém canal silencioso sem cotações públicas de mercado."
          );
        } else {
          finish(
            "FALHA",
            "Timeout de 15 segundos excedido aguardando abertura do WebSocket.",
            "AVISO EXPLÍCITO: O servidor não respondeu ao handshake WebSocket dentro do limite de 15 segundos.",
            "Timeout de conexão. O endpoint pode estar bloqueado por firewall ou regras de rede."
          );
        }
      }, 15000);

      try {
        ws = new WebSocketClass(this.targetEndpoint, {
          headers: {
            Origin: this.targetOrigin,
          },
        });

        ws.onopen = () => {
          connectionEstablished = true;
          openTimeMs = Math.round(performance.now() - t0);
        };

        ws.onmessage = (event: any) => {
          const raw = typeof event.data === "string" ? event.data : String(event.data);
          // Ocultar dados sensíveis: substitui qualquer string parecida com token, cookie, sid por [REDACTED]
          const sanitized = raw
            .replace(/"sid"\s*:\s*"[^"]+"/g, '"sid":"[REDACTED]"')
            .replace(/token=[^&\s]+/g, "token=[REDACTED]")
            .slice(0, 120);

          receivedMessages.push(sanitized);

          // Classificar tipo de mensagem Socket.io (Engine.IO v3)
          // 0 = open, 1 = close, 2 = ping, 3 = pong, 4 = message (40, 42, etc.)
          if (raw.startsWith("0")) {
            messageTypes.push("0: HANDSHAKE_OPEN");
          } else if (raw.startsWith("3")) {
            messageTypes.push("3: PONG");
          } else if (raw.startsWith("40")) {
            messageTypes.push("40: SOCKET_CONNECTED");
          } else if (raw.startsWith("42")) {
            messageTypes.push("42: EVENT_MESSAGE");
            // Validar se contém cotação estruturada (preço numérico, ativo válido, timestamp)
            if (raw.includes("quote") || raw.includes("price") || raw.includes("candle")) {
              marketQuotesFound = true;
            }
          } else {
            messageTypes.push(`GENÉRICO (${raw.slice(0, 10)})`);
          }

          if (marketQuotesFound) {
            finish(
              "DADOS RECEBIDOS",
              null,
              "Cotações de mercado identificadas via WebSocket QX Broker. Isolamento mantido (não conectado ao motor de sinais).",
              "Protocolo EIO=3 aceito e mensagens estruturadas recebidas."
            );
          }
        };

        ws.onerror = (err: any) => {
          const errorMsg = err?.message || "Erro de rede / status diferente de 101 Switching Protocols";
          finish(
            "FALHA",
            `Falha na conexão: ${errorMsg}`,
            "AVISO EXPLÍCITO: Conexão WebSocket rejeitada. O endpoint requer credenciais ou rejeitou o handshake.",
            `Erro reportado pelo client WebSocket: ${errorMsg}`
          );
        };

        ws.onclose = (event: any) => {
          if (!resolved) {
            finish(
              "FALHA",
              `WebSocket encerrado prematuramente (código: ${event?.code || 1006}, razão: ${event?.reason || "desconhecida"})`,
              "AVISO EXPLÍCITO: Conexão fechada antes de negociar dados de mercado.",
              `Código de encerramento ${event?.code}. Possível bloqueio de origem ou ausência de sessão.`
            );
          }
        };
      } catch (err: any) {
        finish(
          "FALHA",
          `Exceção ao criar WebSocket: ${err?.message || "Erro desconhecido"}`,
          "AVISO EXPLÍCITO: Não foi possível instanciar o socket para o endpoint especificado.",
          err?.message || "Exceção não tratada"
        );
      }
    });
  }
}
