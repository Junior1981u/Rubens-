// ==========================================================
// NEXORA TRADER AI — COMPONENTE STICKYHEADER (MOBILE & DESKTOP)
// Mantém sempre visíveis o Ativo, Timeframe, Preço e Decisão no topo
// Garantindo que ao rolar a página, a referência nunca seja perdida
// ==========================================================

import React, { useState } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface StickyHeaderProps {
  platform?: { id: string; name: string; badge: string; color: string };
  asset: string;
  timeframe: string;
  price?: number;
  pipDecimals?: number;
  priceDirection?: "UP" | "DOWN";
  activeDecision?: "PAR" | "IMPAR" | "WAIT" | "NO TRADE" | string;
  consensusScore?: string;
  isLive?: boolean;
  onAssetChange?: (newAsset: string) => void;
  onTimeframeChange?: (newTf: string) => void;
  availableAssets?: string[];
  availableTimeframes?: string[];
  modoSinal?: boolean;
  onToggleModoSinal?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  autopilotActive?: boolean;
}

const DEFAULT_ASSETS = ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD"];
const DEFAULT_TIMEFRAMES = ["1M", "5M", "15M", "30M", "1H"];

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  platform,
  asset,
  timeframe,
  price = 1.08245,
  pipDecimals = 5,
  priceDirection = "UP",
  activeDecision = "PAR",
  consensusScore = "4/4",
  isLive = true,
  onAssetChange,
  onTimeframeChange,
  availableAssets = DEFAULT_ASSETS,
  availableTimeframes = DEFAULT_TIMEFRAMES,
  modoSinal = true,
  onToggleModoSinal,
  onRefresh,
  isRefreshing = false,
  autopilotActive = true,
}) => {
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isTfSelectorOpen, setIsTfSelectorOpen] = useState(false);

  const isPar = activeDecision === "PAR";
  const isImpar = activeDecision === "IMPAR" || activeDecision === "ÍMPAR";
  const isWait = activeDecision === "WAIT";

  const formattedPrice = typeof price === "number" ? price.toFixed(pipDecimals) : price;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#070A0F]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/40 px-3 py-2 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Lado Esquerdo: Identificador Nexora + Status LIVE / AUTOPILOT */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#151D27] to-[#101720] border border-white/[0.1] flex items-center justify-center text-[#3DA5FF] shadow-inner">
            <Zap className="w-4 h-4 fill-[#3DA5FF]/20 text-[#3DA5FF]" />
          </div>

          <div className="hidden min-[380px]:block">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black tracking-tight text-white leading-none">
                NEXORA <span className="text-[#22D3EE]">TITAN AI</span>
              </span>
              {autopilotActive ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AUTOPILOT
                </span>
              ) : isLive ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#3DA5FF]/10 text-[#3DA5FF] border border-[#3DA5FF]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DA5FF]"></span>
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  OFFLINE
                </span>
              )}
            </div>
            <span className="text-[8.5px] font-mono text-slate-400 tracking-tight block truncate max-w-[210px]" title="Inteligência que analisa. Tecnologia que evolui.">
              Inteligência que analisa. Tecnologia que evolui.
            </span>
          </div>

          {/* Badge da Plataforma Ativa no StickyHeader */}
          {platform && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border ml-1 shadow-sm"
              style={{
                backgroundColor: `${platform.color}15`,
                borderColor: `${platform.color}40`,
                color: platform.color,
              }}
              title={`Plataforma Selecionada: ${platform.name}`}
            >
              <span>{platform.badge}</span>
              <span className="text-white text-[11px] font-black">{platform.name}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                ATIVA
              </span>
            </div>
          )}
        </div>

        {/* Centro: ATIVO & TIMEFRAME FIXOS (DESTAQUE MÁXIMO) */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {/* Seletor do Ativo */}
          <div className="relative">
            <button
              onClick={() => {
                setIsAssetSelectorOpen(!isAssetSelectorOpen);
                setIsTfSelectorOpen(false);
              }}
              className="bg-[#101720] hover:bg-[#151D27] border border-white/[0.12] hover:border-[#3DA5FF]/50 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-white font-bold transition-all shadow-sm active:scale-95"
              title="Trocar Ativo Operado"
            >
              <span className="text-white tracking-wide text-xs sm:text-sm font-black">
                {asset}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown de Ativos */}
            {isAssetSelectorOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-[#101720] border border-white/[0.12] rounded-xl shadow-2xl p-1 z-50 font-mono text-xs">
                {availableAssets.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      if (onAssetChange) onAssetChange(sym);
                      setIsAssetSelectorOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors ${
                      asset === sym
                        ? "bg-[#3DA5FF] text-white"
                        : "text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{sym}</span>
                    {asset === sym && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seletor de Timeframe */}
          <div className="relative">
            <button
              onClick={() => {
                setIsTfSelectorOpen(!isTfSelectorOpen);
                setIsAssetSelectorOpen(false);
              }}
              className="bg-[#101720] hover:bg-[#151D27] border border-white/[0.12] hover:border-[#3DA5FF]/50 rounded-xl px-2 py-1.5 flex items-center gap-1 text-slate-300 font-bold transition-all active:scale-95"
              title="Trocar Timeframe"
            >
              <span className="text-[#3DA5FF] font-black text-xs">{timeframe}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown de Timeframes */}
            {isTfSelectorOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-24 bg-[#101720] border border-white/[0.12] rounded-xl shadow-2xl p-1 z-50 font-mono text-xs">
                {availableTimeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      if (onTimeframeChange) onTimeframeChange(tf);
                      setIsTfSelectorOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors ${
                      timeframe === tf
                        ? "bg-[#3DA5FF] text-white"
                        : "text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{tf}</span>
                    {timeframe === tf && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preço em tempo real */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#070A0F] border border-white/[0.06]">
            {priceDirection === "UP" ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span
              className={`font-black tracking-tight text-xs ${
                priceDirection === "UP" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formattedPrice}
            </span>
          </div>
        </div>

        {/* Lado Direito: Preview da Decisão Atual + Botão Modo Sinal */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {/* Badge compacta da decisão corrente */}
          <div
            className={`px-2.5 py-1 rounded-xl font-black text-xs border flex items-center gap-1.5 shadow-sm transition-all ${
              isPar
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10"
                : isImpar
                ? "bg-[#3DA5FF]/20 text-[#3DA5FF] border-[#3DA5FF]/40 shadow-[#3DA5FF]/10"
                : isWait
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10"
                : "bg-rose-500/20 text-rose-400 border-rose-500/40"
            }`}
          >
            <span>{activeDecision}</span>
            <span className="text-[10px] opacity-75 font-normal">({consensusScore})</span>
          </div>

          {/* Botão de Toggle do Modo Sinal */}
          {onToggleModoSinal && (
            <button
              onClick={onToggleModoSinal}
              className={`px-2 py-1 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                modoSinal
                  ? "bg-[#3DA5FF] text-white shadow-sm shadow-[#3DA5FF]/30"
                  : "bg-[#101720] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
              title="Alternar Modo Sinal"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden md:inline">MODO SINAL</span>
            </button>
          )}

          {/* Botão de Recarregar/Reavaliar */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl bg-[#101720] hover:bg-[#151D27] text-slate-400 hover:text-[#3DA5FF] border border-white/[0.08] active:scale-95 disabled:opacity-50 transition-all"
              title="Reavaliar Ciclo de Mercado"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
