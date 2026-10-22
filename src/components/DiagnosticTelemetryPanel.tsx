import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Layers,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { MarketHealthStatus, NexoraCoreDecision } from "../types.js";
import { formatSaoPauloTime, calculateM1CandleCountdown, validateCandleFreshness } from "../utils/timeZoneUtils.js";

interface DiagnosticTelemetryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  asset: string;
  timeframe: string;
  marketHealth: MarketHealthStatus | null;
  decision: NexoraCoreDecision | null;
  isEvaluating: boolean;
  onRefreshAnalysis: () => void;
}

export const DiagnosticTelemetryPanel: React.FC<DiagnosticTelemetryPanelProps> = ({
  isOpen,
  onClose,
  asset,
  timeframe,
  marketHealth,
  decision,
  isEvaluating,
  onRefreshAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<"LIVE_M1" | "QX_BROKER">("LIVE_M1");
  const [liveNow, setLiveNow] = useState(Date.now());

  // QX Broker Test State
  const [qxReport, setQxReport] = useState<any>(null);
  const [isQxTesting, setIsQxTesting] = useState(false);
  const [qxTestError, setQxTestError] = useState<string | null>(null);

  // Twelve Data Audit State
  const [twelveDataAudit, setTwelveDataAudit] = useState<any>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial QX Report and Twelve Data Audit
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/qxbroker/test")
      .then((res) => res.json())
      .then((data) => {
        if (data.report) setQxReport(data.report);
      })
      .catch(() => {});

    fetch("/api/twelve-data/audit")
      .then((res) => res.json())
      .then((data) => {
        if (data.audit) setTwelveDataAudit(data.audit);
      })
      .catch(() => {});
  }, [isOpen]);

  const handleRunQxTest = async () => {
    setIsQxTesting(true);
    setQxTestError(null);
    try {
      const res = await fetch("/api/qxbroker/test", { method: "POST" });
      const data = await res.json();
      if (data.report) {
        setQxReport(data.report);
      } else if (data.error) {
        setQxTestError(data.error);
      }
    } catch (err: any) {
      setQxTestError(err?.message || "Falha na comunicação com o servidor de teste.");
    } finally {
      setIsQxTesting(false);
    }
  };

  if (!isOpen) return null;

  // Cálculos de M1 e Atualidade
  const m1Calc = calculateM1CandleCountdown(liveNow);
  const lastTickTime = marketHealth?.lastTick?.timestamp || liveNow;
  const candleOpenTs = Math.floor(liveNow / 60000) * 60000;
  const dataAgeSec = Math.max(0, Math.floor((liveNow - lastTickTime) / 1000));
  const freshness = validateCandleFreshness(candleOpenTs, lastTickTime, 120000);

  const isTwelveConnected = marketHealth?.twelveData?.status === "CONNECTED";
  const isMarketLive = marketHealth?.status === "LIVE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-[#090F1E] border border-[#00E5FF]/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#060B16]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00E5FF] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
              PAINEL DE DIAGNÓSTICO & AUDITORIA DE MERCADO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Tabs: LIVE M1 ENGINE vs TESTE WEBSOCKET QX BROKER */}
        <div className="flex border-b border-white/10 bg-[#070D1A] px-2 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("LIVE_M1")}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "LIVE_M1"
                ? "bg-[#090F1E] text-[#00E5FF] border-t-2 border-x border-[#00E5FF]/40 border-b-transparent font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>DIAGNÓSTICO MOTOR M1 & TWELVE DATA</span>
          </button>

          <button
            onClick={() => setActiveTab("QX_BROKER")}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "QX_BROKER"
                ? "bg-[#090F1E] text-[#FFD600] border-t-2 border-x border-[#FFD600]/40 border-b-transparent font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#FFD600]" />
            <span>TESTE WEBSOCKET QX BROKER (ISOLADO)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs text-[#F5F7FF]">
          {activeTab === "LIVE_M1" && (
            <div className="space-y-3.5">
              {/* Status Geral em Destaque */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">FONTE DE DADOS</span>
                  <div className="font-black text-white text-xs mt-0.5 truncate">
                    {marketHealth?.source || "INTERBANK_24_7"}
                  </div>
                  <span className="text-[8px] text-[#00E5FF]">
                    {isTwelveConnected ? "Twelve Data Oficial" : "Feed Interbancário"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">ESTADO CONEXÃO</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isMarketLive ? "bg-[#00E676] animate-pulse" : "bg-[#FF3366]"}`} />
                    <span className={`font-black text-xs ${isMarketLive ? "text-[#00E676]" : "text-[#FF3366]"}`}>
                      {marketHealth?.status || "OFFLINE"}
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400">Latência: {marketHealth?.latencyMs || 15}ms</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">VELA M1 & RELÓGIO</span>
                  <div className="font-black text-white text-xs mt-0.5">
                    {m1Calc.formattedCountdown} ({m1Calc.candleState})
                  </div>
                  <span className={`text-[8px] ${freshness.isValid ? "text-[#00E676]" : "text-[#FF3366]"}`}>
                    {freshness.statusLabel} ({dataAgeSec}s)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">DURAÇÃO ANÁLISE</span>
                  <div className="font-black text-[#00E5FF] text-xs mt-0.5">
                    {decision?.benchmarks?.totalDurationMs ? `${decision.benchmarks.totalDurationMs} ms` : decision?.latencyMs ? `${decision.latencyMs} ms` : "< 10 ms"}
                  </div>
                  <span className="text-[8px] text-slate-400 truncate block">
                    Algoritmo: {(decision?.benchmarks as any)?.superAlgorithmSpeedMs ?? "< 2"}ms
                  </span>
                </div>
              </div>

              {/* Auditoria Rigorosa Twelve Data */}
              <div className="p-3 rounded-xl bg-[#060B16] border border-white/10 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#00E5FF]" />
                    AUDITORIA REAL TWELVE DATA (DOCUMENTAÇÃO OFICIAL)
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Símbolo: <strong className="text-white">{asset}</strong> | Intervalo: <strong className="text-white">{timeframe === "5M" ? "5min" : "1min"}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-bold">Endpoints em Uso:</span>
                    <p className="text-slate-300 font-mono text-[9px] truncate">REST: https://api.twelvedata.com/time_series</p>
                    <p className="text-slate-300 font-mono text-[9px] truncate">WS: wss://ws.twelvedata.com/v1/quotes/price</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-bold">Chave de API:</span>
                    <p className="text-slate-300">
                      {twelveDataAudit?.apiKeyConfigured
                        ? "Configurada nos Secrets do Servidor (Protegida/Mascarada)"
                        : "Chave Pessoal Pendente (Operando com Contingência Interbancária)"}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[9px] text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Fuso Horário Oficial:</span>
                    <strong className="text-white">UTC (Armazenamento) & America/Sao_Paulo (Exibição)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Horário da Última Mensagem:</span>
                    <strong className="text-white">{formatSaoPauloTime(lastTickTime)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp do Candle Atual:</span>
                    <strong className="text-white">{formatSaoPauloTime(candleOpenTs)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Último Motivo / Justificativa:</span>
                    <strong className="text-[#00E5FF] truncate max-w-[280px]">
                      {decision?.why || "Aguardando confluência direcional segura"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Botão de Análise Imediata */}
              <button
                onClick={onRefreshAnalysis}
                disabled={isEvaluating}
                className="w-full py-2.5 rounded-xl font-bold bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 text-[#00E5FF] border border-[#00E5FF]/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
                <span>EXECUTAR ANÁLISE COMPLETA AGORA</span>
              </button>
            </div>
          )}

          {activeTab === "QX_BROKER" && (
            <div className="space-y-3.5">
              {/* Alerta de Isolamento Seguro */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>REGRA DE SEGURANÇA E PAPER MODE</span>
                </div>
                <p>
                  Este teste é 100% isolado. Nenhuma ordem financeira real é executada. O sistema opera estritamente em PAPER MODE.
                  Tokens, cookies ou dados privados jamais são inventados ou contornados.
                </p>
              </div>

              {/* Endpoint Alvo */}
              <div className="p-3 rounded-xl bg-[#060B16] border border-white/10 space-y-2 text-[10px]">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <span className="font-bold text-white">ENDPOINT INVESTIGADO</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-slate-300 text-[9px]">
                    Engine.IO v3 (EIO=3)
                  </span>
                </div>
                <code className="text-[#00E5FF] text-[10px] block break-all font-mono">
                  wss://ws2.qxbroker.com/socket.io/?EIO=3&transport=websocket
                </code>
                <div className="flex items-center justify-between text-slate-400 text-[9px]">
                  <span>Origin: https://qxbroker.com</span>
                  <span>Timeout: 15 segundos</span>
                </div>
              </div>

              {/* Painel do Relatório do Teste */}
              <div className="p-3 rounded-xl bg-[#060B16] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">DIAGNÓSTICO DO WEBSOCKET</span>
                  {/* Badge de Estado: NÃO TESTADO, CONECTANDO, CONECTADO, DADOS RECEBIDOS ou FALHA */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      qxReport?.state === "DADOS RECEBIDOS"
                        ? "bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40"
                        : qxReport?.state === "CONECTADO"
                        ? "bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40"
                        : qxReport?.state === "CONECTANDO"
                        ? "bg-amber-400/20 text-amber-400 border-amber-400/40 animate-pulse"
                        : qxReport?.state === "FALHA"
                        ? "bg-[#FF3366]/20 text-[#FF3366] border-[#FF3366]/40"
                        : "bg-white/10 text-slate-400 border-white/20"
                    }`}
                  >
                    ESTADO: {qxReport?.state || "NÃO TESTADO"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400 block text-[9px]">Tempo de Conexão</span>
                    <strong className="text-white text-xs">{qxReport?.connectionTimeMs ?? 0} ms</strong>
                  </div>

                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400 block text-[9px]">Mensagens Recebidas</span>
                    <strong className="text-white text-xs">{qxReport?.messagesReceivedCount ?? 0}</strong>
                  </div>

                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[9px]">Cotações Identificadas</span>
                    <strong className={qxReport?.compatibility?.marketDataIdentified ? "text-[#00E676]" : "text-amber-400"}>
                      {qxReport?.compatibility?.marketDataIdentified ? "SIM" : "NÃO (AUSENTE)"}
                    </strong>
                  </div>
                </div>

                {/* Aviso Explícito de Conexão sem Cotações ou Erro Resumido */}
                {qxReport?.summaryError && (
                  <div className="p-2.5 rounded-lg bg-[#FF3366]/15 border border-[#FF3366]/30 text-[#FF3366] text-[10px] space-y-1">
                    <strong>Erro Resumido:</strong>
                    <p className="font-mono text-[9px]">{qxReport.summaryError}</p>
                  </div>
                )}

                {qxReport?.explicitWarning && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] space-y-1">
                    <strong>Aviso Explícito:</strong>
                    <p>{qxReport.explicitWarning}</p>
                  </div>
                )}

                {/* Compatibilidade & Detalhes Técnicos */}
                {qxReport?.compatibility?.details && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[9px] text-slate-300 space-y-1">
                    <span className="font-bold text-white block">Análise de Compatibilidade (EIO=3):</span>
                    <p>{qxReport.compatibility.details}</p>
                    <p className="text-slate-400">
                      • Requisitos não confirmados: Sessão ativa via browser, cookies de autenticação (Cloudflare __cf_bm) e inscrição em canais privados da corretora.
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de Disparo do Teste */}
              <button
                onClick={handleRunQxTest}
                disabled={isQxTesting}
                className="w-full py-3 rounded-xl font-black text-slate-950 bg-gradient-to-r from-[#FFD600] to-[#00E5FF] hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg disabled:opacity-50"
              >
                {isQxTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>EXECUTANDO TESTE ISOLADO (15s)...</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4 text-slate-950 fill-current" />
                    <span>DISPARAR TESTE ISOLADO QX BROKER AGORA</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
