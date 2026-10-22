import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  ChevronDown,
  Columns2,
  ShieldCheck,
} from "lucide-react";
import {
  PlatformId,
  NexoraCoreDecision,
  MarketHealthStatus,
  PaperTrade,
  SignalItem,
} from "../../types.js";
import { VisionOrb, NucleusPhase } from "../VisionOrb.js";
import { SignalSummaryCard } from "../SignalSummaryCard.js";
import { AIEntryTimeNotifier } from "../AIEntryTimeNotifier.js";
import { SplitScreenModal } from "../SplitScreenModal.js";
import { DiagnosticTelemetryPanel } from "../DiagnosticTelemetryPanel.js";
import { formatSaoPauloTime } from "../../utils/timeZoneUtils.js";

import { Globe, Radio, Activity } from "lucide-react";
import { getAssetVisualBadges } from "../../utils/flagUtils.js";

export const ASSETS_CATALOG = [
  { symbol: "EUR/USD", payout: "85%", category: "FOREX", basePrice: 1.08250, pipDecimals: 5 },
  { symbol: "GBP/USD", payout: "83%", category: "FOREX", basePrice: 1.29850, pipDecimals: 5 },
  { symbol: "USD/JPY", payout: "82%", category: "FOREX", basePrice: 149.850, pipDecimals: 3 },
  { symbol: "AUD/USD", payout: "80%", category: "FOREX", basePrice: 0.66850, pipDecimals: 5 },
  { symbol: "USD/CAD", payout: "81%", category: "FOREX", basePrice: 1.37850, pipDecimals: 5 },
  { symbol: "BTC/USD", payout: "85%", category: "CRYPTO", basePrice: 68450.0, pipDecimals: 1 },
  { symbol: "ETH/USD", payout: "83%", category: "CRYPTO", basePrice: 2680.0, pipDecimals: 2 },
  { symbol: "XAU/USD", payout: "85%", category: "COMMODITIES", basePrice: 2682.40, pipDecimals: 2 },
  { symbol: "USD/BRL", payout: "77%", category: "FOREX", basePrice: 5.6820, pipDecimals: 4 },
  { symbol: "AUD/CAD", payout: "83%", category: "FOREX", basePrice: 0.90180, pipDecimals: 5 },
  { symbol: "GBP/JPY", payout: "84%", category: "FOREX", basePrice: 194.500, pipDecimals: 3 },
  { symbol: "NZD/CAD", payout: "81%", category: "FOREX", basePrice: 0.81250, pipDecimals: 5 },
];

export const TIMEFRAMES_LIST = ["M1", "M5", "M15"];

interface DashboardScreenProps {
  platform: PlatformId;
  setPlatform: (p: PlatformId) => void;
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
  activeOrders?: PaperTrade[];
  signals?: SignalItem[];
  scannerActive?: boolean;
  onToggleScanner?: (active: boolean) => void;
  requireStrictConsensus?: boolean;
  onToggleStrictConsensus?: (strict: boolean) => void;
  onTriggerManualScan?: () => void;
  onResetPaperAccount?: () => void;
  paperAccount?: any;
  onNavigateToSplit?: () => void;
  onNavigateToGlobalMarkets?: () => void;
  autoRealTime?: boolean;
  onToggleAutoRealTime?: (val: boolean) => void;
  superTurboMode?: boolean;
  onToggleSuperTurboMode?: (val: boolean) => void;
  analysisError?: string | null;
  lastAnalysisTime?: number | null;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  asset,
  setAsset,
  timeframe,
  setTimeframe,
  marketHealth,
  decision,
  isEvaluating,
  onRefresh,
  onExecutePaperTrade,
  onTriggerManualScan,
  onNavigateToSplit,
  onNavigateToGlobalMarkets,
  autoRealTime = true,
  onToggleAutoRealTime,
  superTurboMode = true,
  onToggleSuperTurboMode,
  analysisError,
  lastAnalysisTime,
}) => {
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  // Status de conexão real
  const isLive = marketHealth?.status === "LIVE" && Boolean(marketHealth?.lastTick);
  const isOffline = marketHealth?.status === "OFFLINE";

  // Badges visuais do ativo atual (Bandeiras base/quote para Forex ou ícones)
  const currentBadges = getAssetVisualBadges(asset);

  // Direção da decisão
  const finalDecision = isOffline ? "WAIT" : decision?.finalDecision || null;

  // Fase do núcleo da bola
  const nucleusPhase: NucleusPhase = isEvaluating
    ? "ANALISANDO"
    : finalDecision === "PAR"
    ? "SINAL"
    : finalDecision === "IMPAR"
    ? "SINAL"
    : finalDecision === "NO TRADE"
    ? "NO TRADE"
    : finalDecision === "WAIT" && decision
    ? "AGUARDAR"
    : "AGUARDANDO";

  return (
    <div className="w-full flex flex-col items-center justify-start max-w-xl mx-auto px-3 sm:px-4 py-2 font-mono text-xs pb-28 sm:pb-16 text-[#F5F7FF] select-none">
      {/* ================================================== */}
      {/* 1. TÍTULO CENTRALIZADO: NEXORA TITAN AI + SUPER CÉREBRO EM AZUL NEON */}
      {/* ================================================== */}
      <div className="w-full flex flex-col items-center justify-center text-center pt-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          NEXORA <span className="text-[#00E5FF] drop-shadow-[0_0_20px_rgba(0,229,255,0.8)]">TITAN AI</span>
        </h1>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
          <span className="text-xs sm:text-sm font-black tracking-[0.3em] text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.9)] uppercase">
            SUPER CÉREBRO
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
        </div>

        {/* 2. CONTROLES MÍNIMOS E SIMÉTRICOS (ATIVO, PERÍODO & STATUS) */}
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          {/* Seletor Discreto de Ativo com Bandeiras Base/Quote */}
          <div className="relative">
            <button
              onClick={() => setIsAssetDropdownOpen((p) => !p)}
              className="px-3 py-1 rounded-xl bg-[#090F1E] border border-white/10 hover:border-[#00E5FF]/50 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <span className="text-[12px]">
                {currentBadges.isPair ? `${currentBadges.baseFlag} ${currentBadges.quoteFlag}` : currentBadges.baseFlag}
              </span>
              <span>{asset}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isAssetDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isAssetDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 bg-[#090F1E] border border-[#00E5FF]/30 rounded-xl p-1.5 shadow-2xl max-h-56 w-52 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-100">
                {ASSETS_CATALOG.map((cat) => {
                  const b = getAssetVisualBadges(cat.symbol, cat.category);
                  return (
                    <button
                      key={cat.symbol}
                      onClick={() => {
                        setAsset(cat.symbol);
                        setIsAssetDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all cursor-pointer ${
                        asset === cat.symbol
                          ? "bg-[#00E5FF]/20 text-[#00E5FF] font-black border border-[#00E5FF]/40"
                          : "text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">{b.isPair ? `${b.baseFlag}${b.quoteFlag}` : b.baseFlag}</span>
                        <span className="font-bold">{cat.symbol}</span>
                      </div>
                      <span className="text-[#00E676] font-black text-[10px]">{cat.payout}</span>
                    </button>
                  );
                })}

                {/* Atalho Catálogo Global */}
                {onNavigateToGlobalMarkets && (
                  <button
                    onClick={() => {
                      setIsAssetDropdownOpen(false);
                      onNavigateToGlobalMarkets();
                    }}
                    className="w-full px-2 py-2 mt-1 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] text-[10px] font-black flex items-center justify-center gap-1 border border-[#00E5FF]/30 cursor-pointer"
                  >
                    <Globe className="w-3 h-3" />
                    <span>VER TODOS OS 40+ ATIVOS</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Atalho Catálogo Global */}
          {onNavigateToGlobalMarkets && (
            <button
              onClick={onNavigateToGlobalMarkets}
              className="px-2.5 py-1 rounded-xl bg-[#090F1E] border border-white/10 hover:border-[#00E5FF]/50 text-slate-300 hover:text-[#00E5FF] font-black text-[10px] flex items-center gap-1 transition-all cursor-pointer"
              title="Abrir Catálogo Global de Ativos"
            >
              <Globe className="w-3 h-3 text-[#00E5FF]" />
              <span className="hidden sm:inline">GLOBAIS</span>
            </button>
          )}

          {/* Modo Auto Real-Time */}
          {onToggleAutoRealTime && (
            <button
              onClick={() => onToggleAutoRealTime(!autoRealTime)}
              className={`px-2.5 py-1 rounded-xl border font-black text-[10px] flex items-center gap-1.5 transition-all cursor-pointer ${
                autoRealTime
                  ? "bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF]"
                  : "bg-[#090F1E] border-white/10 text-slate-400"
              }`}
              title={autoRealTime ? "Auto-análise em tempo real ativa" : "Ativar auto-análise em tempo real"}
            >
              <Radio className={`w-3 h-3 ${autoRealTime ? "animate-pulse text-[#00E5FF]" : ""}`} />
              <span>{autoRealTime ? "TEMPO REAL" : "MANUAL"}</span>
            </button>
          )}

          {/* Modo Super Turbo (2s) */}
          {onToggleSuperTurboMode && (
            <button
              onClick={() => onToggleSuperTurboMode(!superTurboMode)}
              className={`px-2.5 py-1 rounded-xl border font-black text-[10px] flex items-center gap-1.5 transition-all cursor-pointer ${
                superTurboMode
                  ? "bg-[#00E676]/20 border-[#00E676] text-[#00E676] shadow-sm shadow-[#00E676]/30"
                  : "bg-[#090F1E] border-white/10 text-slate-400"
              }`}
              title={superTurboMode ? "Super Algoritmo Turbo Ativo (2s)" : "Ativar modo Turbo (2s)"}
            >
              <Zap className={`w-3 h-3 ${superTurboMode ? "fill-current text-[#00E676] animate-pulse" : ""}`} />
              <span>{superTurboMode ? "TURBO 2s" : "TURBO OFF"}</span>
            </button>
          )}

          {/* Seletor Discreto de Período */}
          <div className="flex items-center gap-1 bg-[#090F1E] p-0.5 rounded-xl border border-white/10">
            {TIMEFRAMES_LIST.map((tf) => {
              const isSelected =
                timeframe === tf ||
                (tf === "M1" && timeframe === "1M") ||
                (tf === "M5" && timeframe === "5M") ||
                (tf === "M15" && timeframe === "15M");

              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf === "M1" ? "1M" : tf === "M5" ? "5M" : "15M")}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#00E5FF] text-slate-950 shadow-sm shadow-[#00E5FF]/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          {/* Status Discreto da Conexão e Paper Mode */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#090F1E] border border-white/10 text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-[#FF3366]" : "bg-[#00E676] animate-pulse"}`} />
            <span className={isOffline ? "text-[#FF3366] font-bold" : "text-[#00E676] font-bold"}>
              {isOffline ? "OFFLINE" : "LIVE"}
            </span>
          </div>

          {/* Botão Tela Dividida */}
          <button
            onClick={() => setIsSplitModalOpen(true)}
            className="p-1 rounded-xl bg-[#090F1E] hover:bg-white/10 text-slate-300 hover:text-[#00E5FF] border border-white/10 transition-all cursor-pointer"
            title="Dividir tela com corretora"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>

          {/* Botão Diagnóstico & Teste QX Broker */}
          <button
            onClick={() => setIsDiagnosticOpen(true)}
            className="p-1 rounded-xl bg-[#090F1E] hover:bg-[#00E5FF]/20 text-slate-300 hover:text-[#00E5FF] border border-white/10 hover:border-[#00E5FF]/40 transition-all cursor-pointer"
            title="Diagnóstico em Tempo Real & Teste QX Broker"
          >
            <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
          </button>
        </div>

        {/* Banner do Super Algoritmo em Tempo Real */}
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00E5FF]/10 via-[#00E676]/10 to-[#00E5FF]/10 border border-[#00E5FF]/25 flex items-center justify-between text-[10px] gap-2 max-w-md w-full">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping shrink-0" />
            <span className="font-black text-white tracking-wide truncate">
              ⚡ SUPER ALGORITMO QUANTUM: {superTurboMode ? "RADAR TURBO (2s) ATIVO" : "MONITORAMENTO CONTÍNUO"}
            </span>
          </div>
          <span className="text-[#00E5FF] font-mono font-black text-[9px] shrink-0">
            LATÊNCIA &lt; 5ms
          </span>
        </div>
      </div>

      {/* ================================================== */}
      {/* 3. A GRANDE ESFERA CENTRALIZADA COM O ROSTO DO ROBÔ METÁLICO */}
      {/* ================================================== */}
      <div className="w-full flex items-center justify-center my-0 sm:my-1">
        <VisionOrb
          isAnalyzing={isEvaluating}
          phase={nucleusPhase}
          onAnalyze={onRefresh}
          decisionDirection={finalDecision}
          asset={asset}
          timeframe={timeframe}
          isDataStale={Boolean(marketHealth?.lastTick && (Date.now() - marketHealth.lastTick.timestamp > 60000))}
          isConnectionOffline={isOffline}
        />
      </div>

      {/* ================================================== */}
      {/* 3.1 BOTÃO ANALISAR BEM VISÍVEL LOGO ABAIXO DA ESFERA */}
      {/* ================================================== */}
      <div className="w-full flex flex-col items-center justify-center my-2 sm:my-3 px-1 gap-2">
        <button
          onClick={onRefresh}
          disabled={isEvaluating}
          className={`w-full max-w-md py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-2xl relative overflow-hidden ${
            isEvaluating
              ? "bg-[#0A1A35] border-2 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.4)]"
              : "bg-gradient-to-r from-[#00E5FF] via-[#00B4D8] to-[#00E676] hover:brightness-110 text-slate-950 shadow-[0_0_28px_rgba(0,229,255,0.5)] border-2 border-[#00E5FF]"
          }`}
          title="Clique para realizar a análise completa do mercado"
        >
          {isEvaluating ? (
            <>
              <Sparkles className="w-4 h-4 text-[#00E5FF] animate-spin shrink-0" />
              <span className="tracking-wider uppercase">ANALISANDO MERCADO (M1)…</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current shrink-0" />
              <span className="tracking-wider uppercase">ANALISAR MERCADO AGORA ({asset})</span>
            </>
          )}
        </button>

        {/* Botão Secundário: Varredura Quantum Multi-Ativos */}
        {onTriggerManualScan && (
          <button
            onClick={onTriggerManualScan}
            disabled={isEvaluating}
            className="w-full max-w-md py-2 px-4 rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all bg-[#090F1E] hover:bg-[#00E5FF]/10 text-slate-300 hover:text-[#00E5FF] border border-white/10 hover:border-[#00E5FF]/40"
          >
            <Globe className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>VARRER TODOS OS PARES (SCAN MULTI-ATIVO INSTANTÂNEO)</span>
          </button>
        )}
      </div>

      {/* ================================================== */}
      {/* 4. CARTÃO DE SINAL IMEDIATAMENTE ABAIXO DO BOTÃO */}
      {/* ================================================== */}
      <div className="w-full">
        <SignalSummaryCard
          decision={decision}
          asset={asset}
          timeframe={timeframe}
          marketHealth={marketHealth}
          isEvaluating={isEvaluating}
          onExecutePaperTrade={(dir) => onExecutePaperTrade(dir, 60)}
          onOpenBroker={() => setIsSplitModalOpen(true)}
          error={analysisError}
          lastAnalysisTime={lastAnalysisTime}
          lastCandleTimestamp={marketHealth?.lastTick?.timestamp || Date.now()}
        />
      </div>

      {/* Modal Tela Dividida (Discreto e funcional) */}
      <SplitScreenModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        onOpenIntegratedSplit={onNavigateToSplit}
      />

      {/* Painel de Diagnóstico em Tempo Real & Teste QX Broker */}
      <DiagnosticTelemetryPanel
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        asset={asset}
        timeframe={timeframe}
        marketHealth={marketHealth}
        decision={decision}
        isEvaluating={isEvaluating}
        onRefreshAnalysis={onRefresh}
      />

      {/* Worker de Áudio e Notificação do Horário 7 (Mantido ativo em segundo plano) */}
      <div className="hidden" aria-hidden="true">
        <AIEntryTimeNotifier
          asset={asset}
          timeframe={timeframe}
          direction={decision?.finalDecision}
          entryTimeStr={decision?.entryTime}
          onExecuteTrade={() => onExecutePaperTrade(decision?.finalDecision === "IMPAR" ? "IMPAR" : "PAR", 60)}
        />
      </div>
    </div>
  );
};
