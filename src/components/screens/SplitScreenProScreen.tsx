// ==========================================================
// NEXORA VISION AI V12 PRO — MODO TELA DIVIDIDA PRO SCREEN
// Layout Desktop Lado a Lado (Esquerda 65% / Direita 35%)
// + Controles: Tela Dividida, Maximizar Gráfico, Maximizar Nexora, Redefinir Layout
// + Iniciar Modo Tela Dividida Windows Snap
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  Columns2,
  Maximize2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  RefreshCw,
  Clock,
  TrendingUp,
  Activity,
  ChevronDown,
  Layers,
  HelpCircle,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Monitor,
} from "lucide-react";
import { RealCandle } from "../../types/nexora4AIConsensus.js";
import { TradingChart } from "../TradingChart.js";
import {
  PlatformId,
  NexoraCoreDecision,
  MarketHealthStatus,
  PaperTrade,
  SignalItem,
} from "../../types.js";
import { ASSETS_CATALOG, TIMEFRAMES_LIST } from "./DashboardScreen.js";
import { SplitScreenModal } from "../SplitScreenModal.js";

type LayoutMode = "SPLIT" | "MAX_CHART" | "MAX_NEXORA";

interface SplitScreenProScreenProps {
  candles: RealCandle[];
  asset: string;
  setAsset: (a: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  currentPrice: number;
  marketHealth: MarketHealthStatus | null;
  decision: NexoraCoreDecision | null;
  isEvaluating: boolean;
  onRefresh: () => void;
  onDismissSignal?: () => void;
  onExecutePaperTrade: (dir: "PAR" | "IMPAR", durationSec?: number) => void;
  recentSignals?: SignalItem[];
  paperTrades?: PaperTrade[];
  scannerActive?: boolean;
}

export const SplitScreenProScreen: React.FC<SplitScreenProScreenProps> = ({
  candles,
  asset,
  setAsset,
  timeframe,
  setTimeframe,
  currentPrice,
  marketHealth,
  decision,
  isEvaluating,
  onRefresh,
  onDismissSignal,
  onExecutePaperTrade,
  recentSignals = [],
  paperTrades = [],
}) => {
  // Estado do Layout
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("SPLIT");
  const [splitRatio, setSplitRatio] = useState<number>(65); // 65% Gráfico / 35% Nexora
  const [isWindowsSnapModalOpen, setIsWindowsSnapModalOpen] = useState(false);
  const [candleSecondsLeft, setCandleSecondsLeft] = useState<number>(60);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  // Status de conexão
  const isLive = marketHealth?.status === "LIVE" && Boolean(marketHealth?.lastTick);

  // Decisão e Consenso
  const finalDecision = decision?.finalDecision || "WAIT";
  const fourAIs = decision?.fourAIs;
  const consensus = decision?.consensus;

  // Atualização do contador de vela M1 com timestamp real
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const currentSeconds = Math.floor((now / 1000) % 60);
      const remaining = 60 - currentSeconds;
      setCandleSecondsLeft(remaining === 0 ? 60 : remaining);

      const d = new Date(marketHealth?.lastUpdated || now);
      setLastUpdatedTime(d.toLocaleTimeString("pt-BR", { hour12: false }));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [marketHealth?.lastUpdated]);

  // Controles do Layout
  const handleResetLayout = () => {
    setLayoutMode("SPLIT");
    setSplitRatio(65);
  };

  const handleMaximizeChart = () => {
    setLayoutMode("MAX_CHART");
  };

  const handleMaximizeNexora = () => {
    setLayoutMode("MAX_NEXORA");
  };

  const handleSetSplit = () => {
    setLayoutMode("SPLIT");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] font-mono text-xs text-[#F5F7FF] -m-3 sm:-m-5 overflow-hidden">
      {/* ================================================== */}
      {/* 1. BARRA DE CONTROLES DO MODO TELA DIVIDIDA */}
      {/* ================================================== */}
      <div className="bg-[#090D18] border-b border-white/[0.08] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="font-black text-xs sm:text-sm tracking-wider text-white">
              MODO TELA DIVIDIDA <span className="text-[#22D3EE]">PRO</span>
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Botão de Destaque Máximo: Iniciar Modo Tela Dividida Windows Snap */}
          <button
            onClick={() => setIsWindowsSnapModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#22D3EE] via-[#8B5CF6] to-[#00D084] text-black font-black text-[11px] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-[#22D3EE]/20 cursor-pointer animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>INICIAR MODO TELA DIVIDIDA (WINDOWS)</span>
          </button>
        </div>

        {/* Botões Requisitados: TELA DIVIDIDA, MAXIMIZAR GRÁFICO, MAXIMIZAR NEXORA, REDEFINIR */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSetSplit}
            className={`px-2.5 py-1.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
              layoutMode === "SPLIT"
                ? "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/50 shadow-sm shadow-[#22D3EE]/20"
                : "bg-[#0D1220] text-slate-400 border-white/[0.06] hover:text-white"
            }`}
            title="Dividir tela (65% Gráfico / 35% Nexora)"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TELA DIVIDIDA</span>
            <span className="sm:hidden">DIVIDIDA</span>
          </button>

          <button
            onClick={handleMaximizeChart}
            className={`px-2.5 py-1.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
              layoutMode === "MAX_CHART"
                ? "bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/50 shadow-sm shadow-[#22D3EE]/20"
                : "bg-[#0D1220] text-slate-400 border-white/[0.06] hover:text-white"
            }`}
            title="Maximizar área do gráfico (100%)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MAXIMIZAR GRÁFICO</span>
            <span className="md:hidden">GRÁFICO</span>
          </button>

          <button
            onClick={handleMaximizeNexora}
            className={`px-2.5 py-1.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
              layoutMode === "MAX_NEXORA"
                ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/50 shadow-sm shadow-[#8B5CF6]/20"
                : "bg-[#0D1220] text-slate-400 border-white/[0.06] hover:text-white"
            }`}
            title="Maximizar painel NEXORA VISION AI (100%)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MAXIMIZAR PAINEL</span>
            <span className="md:hidden">PAINEL</span>
          </button>

          <button
            onClick={handleResetLayout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#0D1220] text-slate-400 hover:text-white border border-white/[0.06] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            title="Redefinir layout para 65% / 35%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">REDEFINIR LAYOUT</span>
          </button>

          {/* Slider de proporção se no modo split */}
          {layoutMode === "SPLIT" && (
            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
              <span className="text-[9px] text-slate-500 font-bold">PROPORÇÃO:</span>
              <input
                type="range"
                min="45"
                max="80"
                value={splitRatio}
                onChange={(e) => setSplitRatio(Number(e.target.value))}
                className="w-16 accent-[#22D3EE] cursor-pointer"
                title={`Gráfico: ${splitRatio}% | Nexora: ${100 - splitRatio}%`}
              />
              <span className="text-[9px] text-[#22D3EE] font-bold">{splitRatio}% / {100 - splitRatio}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. ÁREAS LADO A LADO (LAYOUT 65% / 35%) */}
      {/* ================================================== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ================================================== */}
        {/* ÁREA ESQUERDA: CORRETORA / GRÁFICO (~65%) */}
        {/* ================================================== */}
        {(layoutMode === "SPLIT" || layoutMode === "MAX_CHART") && (
          <div
            style={{
              width: layoutMode === "MAX_CHART" ? "100%" : `${splitRatio}%`,
            }}
            className="flex-1 md:flex-none flex flex-col border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#070912] overflow-hidden"
          >
            {/* Header da Área do Gráfico */}
            <div className="bg-[#0B0F17] border-b border-white/[0.06] px-3.5 py-2 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">ÁREA DA CORRETORA:</span>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="bg-[#070A0F] border border-white/10 rounded-lg px-2 py-1 text-white font-black text-xs focus:outline-none focus:border-[#22D3EE]"
                >
                  {ASSETS_CATALOG.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} ({a.payout})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-[#070A0F] border border-white/10 rounded-lg p-0.5">
                  {TIMEFRAMES_LIST.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer ${
                        timeframe === tf ? "bg-[#22D3EE] text-black" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-black text-white font-mono">
                    {currentPrice.toFixed(5)}
                  </div>
                  <div className="text-[9px] text-[#00D084] font-bold">
                    PAYOUT 83% • PAPER MODE
                  </div>
                </div>

                <button
                  onClick={() => setIsWindowsSnapModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  title="Abrir corretora real em nova janela com Windows Snap"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">ABRIR CORRETORA</span>
                </button>
              </div>
            </div>

            {/* Canvas do Gráfico Interativo */}
            <div className="flex-1 relative overflow-hidden bg-[#04060A]">
              <TradingChart
                candles={candles}
                assetName={asset}
                currentPrice={currentPrice}
                timeframe={timeframe}
                onExecuteTrade={onExecutePaperTrade}
                showControls={true}
              />
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* ÁREA DIREITA: PAINEL NEXORA VISION AI (~35%) */}
        {/* ================================================== */}
        {(layoutMode === "SPLIT" || layoutMode === "MAX_NEXORA") && (
          <div
            style={{
              width: layoutMode === "MAX_NEXORA" ? "100%" : `${100 - splitRatio}%`,
            }}
            className="flex-1 md:flex-none flex flex-col bg-[#0D1220] overflow-y-auto scrollbar-none"
          >
            {/* Header Compacto NEXORA */}
            <div className="p-3.5 border-b border-white/[0.08] bg-[#090D18] sticky top-0 z-10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#22D3EE] to-[#8B5CF6] p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-[#070912] rounded-[6px] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-xs tracking-wider text-white">
                      NEXORA <span className="text-[#22D3EE]">TITAN AI</span>
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      <span className="text-slate-400 font-bold">{asset}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[#8B5CF6] font-bold">M1</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onRefresh}
                  disabled={isEvaluating}
                  className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/15 hover:bg-[#22D3EE]/25 text-[#22D3EE] border border-[#22D3EE]/30 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isEvaluating ? "animate-spin" : ""}`} />
                  <span>{isEvaluating ? "..." : "SCAN"}</span>
                </button>
              </div>

              {/* Status de Conexão e Última Atualização */}
              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 font-bold">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isLive ? "bg-[#00D084] animate-pulse" : "bg-[#FF5570]"
                    }`}
                  />
                  <span className={isLive ? "text-[#00D084]" : "text-[#FF5570]"}>
                    {isLive ? "FEED LIVE" : "FEED OFFLINE"}
                  </span>
                </div>
                <div className="text-slate-400">
                  Atualizado: <span className="text-white font-mono">{lastUpdatedTime || "Agora"}</span>
                </div>
              </div>
            </div>

            {/* Conteúdo do Painel NEXORA */}
            <div className="p-3.5 space-y-3.5">
              {/* 1. Contador Regressivo da Vela M1 */}
              <div className="p-3 rounded-2xl bg-[#070912] border border-white/[0.08] relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#22D3EE]" />
                    FECHAMENTO DA VELA M1
                  </span>
                  <span className="text-[#22D3EE] font-bold">EXPIRAÇÃO M1</span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    00:{candleSecondsLeft.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {candleSecondsLeft <= 5 ? (
                      <span className="text-[#00D084] font-black animate-pulse">PREPARAR ENTRADA!</span>
                    ) : (
                      <span>Aguardando virada</span>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      candleSecondsLeft <= 5
                        ? "bg-[#00D084]"
                        : candleSecondsLeft <= 15
                        ? "bg-[#22D3EE]"
                        : "bg-[#8B5CF6]"
                    }`}
                    style={{ width: `${(candleSecondsLeft / 60) * 100}%` }}
                  />
                </div>
              </div>

              {/* 2. Decisão e Consenso Validado 4/4 */}
              <div
                className={`p-3.5 rounded-2xl border text-center space-y-2 ${
                  finalDecision === "PAR"
                    ? "bg-[#00D084]/10 border-[#00D084]/40 text-[#00D084]"
                    : finalDecision === "IMPAR"
                    ? "bg-[#FF5570]/10 border-[#FF5570]/40 text-[#FF5570]"
                    : "bg-[#070912] border-white/[0.08] text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                    {finalDecision === "PAR" || finalDecision === "IMPAR" ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
                        <span>🎯 SINAL CERTEIRO FIXADO:</span>
                      </>
                    ) : (
                      <span>RESULTADO DA ANÁLISE:</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        consensus?.unanimous
                          ? "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40"
                          : "bg-white/[0.05] text-slate-400 border border-white/10"
                      }`}
                    >
                      CONSENSO {consensus?.consensusLabel || "4/4"}
                    </span>
                    {(finalDecision === "PAR" || finalDecision === "IMPAR") && onDismissSignal && (
                      <button
                        onClick={onDismissSignal}
                        className="text-[9px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 cursor-pointer"
                        title="Dispensar este sinal e reanalisar"
                      >
                        Dispensar
                      </button>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <div
                    className={`text-2xl font-black tracking-wider ${
                      finalDecision === "PAR"
                        ? "text-[#00D084]"
                        : finalDecision === "IMPAR"
                        ? "text-[#FF5570]"
                        : "text-[#22D3EE]"
                    }`}
                  >
                    {finalDecision === "PAR"
                      ? "PAR (COMPRA / CALL)"
                      : finalDecision === "IMPAR"
                      ? "ÍMPAR (VENDA / PUT)"
                      : "AGUARDAR CONFIRMAÇÃO"}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5 font-sans leading-tight">
                    {decision?.why || "Aguardando sinal com convergência dos osciladores e médias."}
                  </p>
                  {(finalDecision === "PAR" || finalDecision === "IMPAR") && decision?.confluences && (
                    <div className="mt-2 text-[9px] text-slate-400 bg-black/40 p-1.5 rounded-lg border border-white/5 text-left space-y-0.5">
                      <div className="font-bold text-slate-300">Confluências Validadas:</div>
                      {decision.confluences.slice(0, 3).map((c, i) => (
                        <div key={i} className="text-[#00D084] truncate">• {c}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botões Rápidos Paper Trade */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onExecutePaperTrade("PAR", 60)}
                    disabled={!isLive}
                    className="p-2 rounded-xl bg-[#00D084] text-black font-black text-xs hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-[#00D084]/20"
                  >
                    [ PAR ▲ ]
                  </button>
                  <button
                    onClick={() => onExecutePaperTrade("IMPAR", 60)}
                    disabled={!isLive}
                    className="p-2 rounded-xl bg-[#FF5570] text-black font-black text-xs hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-[#FF5570]/20"
                  >
                    [ ÍMPAR ▼ ]
                  </button>
                </div>
              </div>

              {/* 3. Estados Individuais das 4 IAs (GPT, Claude, Gemini, Grok) */}
              <div className="p-3 rounded-2xl bg-[#070912] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">ESTADOS DAS 4 IAS:</span>
                  <span className="text-[9px] text-[#22D3EE] font-bold">PIPELINE INDEPENDENTE</span>
                </div>

                <div className="space-y-1.5">
                  {/* GPT */}
                  {(() => {
                    const gpt = fourAIs?.gpt;
                    const isSuccess = gpt?.status === "SUCCESS";
                    return (
                      <div className="p-2 rounded-xl bg-[#0D1220] border border-white/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-[#10A37F]" : "bg-slate-600"}`} />
                          <span className="font-bold text-white">GPT-4o</span>
                          <span className="text-[9px] text-slate-500">Estrutura</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400">
                            {isSuccess ? `${gpt.confidence}%` : gpt?.status || "OFFLINE"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isSuccess && gpt.direction === "PAR"
                                ? "bg-[#00D084]/20 text-[#00D084]"
                                : isSuccess && gpt.direction === "IMPAR"
                                ? "bg-[#FF5570]/20 text-[#FF5570]"
                                : "bg-white/[0.05] text-slate-400"
                            }`}
                          >
                            {isSuccess ? gpt.direction : "WAIT"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Claude */}
                  {(() => {
                    const claude = fourAIs?.claude;
                    const isSuccess = claude?.status === "SUCCESS";
                    return (
                      <div className="p-2 rounded-xl bg-[#0D1220] border border-white/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-[#D97706]" : "bg-slate-600"}`} />
                          <span className="font-bold text-white">Claude 3.5</span>
                          <span className="text-[9px] text-slate-500">Auditor</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400">
                            {isSuccess ? `${claude.confidence}%` : claude?.status || "OFFLINE"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isSuccess && claude.direction === "PAR"
                                ? "bg-[#00D084]/20 text-[#00D084]"
                                : isSuccess && claude.direction === "IMPAR"
                                ? "bg-[#FF5570]/20 text-[#FF5570]"
                                : "bg-white/[0.05] text-slate-400"
                            }`}
                          >
                            {isSuccess ? claude.direction : "WAIT"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Gemini */}
                  {(() => {
                    const gemini = fourAIs?.gemini;
                    const isSuccess = gemini?.status === "SUCCESS";
                    return (
                      <div className="p-2 rounded-xl bg-[#0D1220] border border-white/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-[#22D3EE]" : "bg-slate-600"}`} />
                          <span className="font-bold text-white">Gemini 2.5</span>
                          <span className="text-[9px] text-slate-500">Técnico</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400">
                            {isSuccess ? `${gemini.confidence}%` : gemini?.status || "OFFLINE"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isSuccess && gemini.direction === "PAR"
                                ? "bg-[#00D084]/20 text-[#00D084]"
                                : isSuccess && gemini.direction === "IMPAR"
                                ? "bg-[#FF5570]/20 text-[#FF5570]"
                                : "bg-white/[0.05] text-slate-400"
                            }`}
                          >
                            {isSuccess ? gemini.direction : "WAIT"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Grok */}
                  {(() => {
                    const grok = fourAIs?.grok;
                    const isSuccess = grok?.status === "SUCCESS";
                    return (
                      <div className="p-2 rounded-xl bg-[#0D1220] border border-white/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-[#8B5CF6]" : "bg-slate-600"}`} />
                          <span className="font-bold text-white">Grok 2</span>
                          <span className="text-[9px] text-slate-500">Quant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400">
                            {isSuccess ? `${grok.confidence}%` : grok?.status || "OFFLINE"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isSuccess && grok.direction === "PAR"
                                ? "bg-[#00D084]/20 text-[#00D084]"
                                : isSuccess && grok.direction === "IMPAR"
                                ? "bg-[#FF5570]/20 text-[#FF5570]"
                                : "bg-white/[0.05] text-slate-400"
                            }`}
                          >
                            {isSuccess ? grok.direction : "WAIT"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 4. Histórico Recente de Análises e Sinais Verificados */}
              <div className="p-3 rounded-2xl bg-[#070912] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">HISTÓRICO VERIFICADO:</span>
                  <span className="text-[9px] text-[#00D084] font-bold">PAPER MODE</span>
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-none">
                  {recentSignals.slice(0, 4).map((sig) => (
                    <div
                      key={sig.id}
                      className="p-2 rounded-xl bg-[#0D1220] border border-white/[0.04] flex items-center justify-between text-[10px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sig.direction === "PAR" ? "bg-[#00D084]" : "bg-[#FF5570]"
                          }`}
                        />
                        <span className="font-bold text-white">{sig.asset}</span>
                        <span className="text-[9px] text-slate-400">{sig.direction}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[9px]">
                          {sig.price?.toFixed(5) || "--"}
                        </span>
                        <span
                          className={`font-black text-[9px] px-1.5 py-0.2 rounded ${
                            sig.result === "WIN"
                              ? "bg-[#00D084]/20 text-[#00D084]"
                              : sig.result === "LOSS"
                              ? "bg-[#FF5570]/20 text-[#FF5570]"
                              : "bg-[#22D3EE]/20 text-[#22D3EE]"
                          }`}
                        >
                          {sig.result || sig.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {recentSignals.length === 0 && (
                    <div className="p-3 text-center text-slate-500 text-[10px]">
                      Nenhum sinal gerado no ciclo recente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal do Recurso INICIAR MODO TELA DIVIDIDA WINDOWS */}
      <SplitScreenModal
        isOpen={isWindowsSnapModalOpen}
        onClose={() => setIsWindowsSnapModalOpen(false)}
        onOpenIntegratedSplit={() => {
          setIsWindowsSnapModalOpen(false);
          setLayoutMode("SPLIT");
          setSplitRatio(65);
        }}
      />
    </div>
  );
};
