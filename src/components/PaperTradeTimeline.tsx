import React, { useMemo } from "react";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  PaperTradeOrder,
  ConsensusPlatformId,
} from "../types/nexora4AIConsensus";

interface PaperTradeTimelineProps {
  activeOrder: PaperTradeOrder | null;
  currentPrice: number;
  pipDecimals?: number;
  onExecuteNewTrade?: (direction: "PAR" | "IMPAR") => void;
  canExecute?: boolean;
  recommendedDirection?: "PAR" | "IMPAR" | string;
}

export const PaperTradeTimeline: React.FC<PaperTradeTimelineProps> = ({
  activeOrder,
  currentPrice,
  pipDecimals = 5,
  onExecuteNewTrade,
  canExecute = false,
  recommendedDirection = "PAR",
}) => {
  // Se não houver ordem ativa, renderiza estado standby premium
  if (!activeOrder) {
    return (
      <div className="bg-[#0B0F17] border border-white/[0.08] hover:border-white/[0.15] transition-all rounded-2xl p-4 sm:p-5 font-mono shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#3DA5FF]" />
            <span className="font-bold text-white uppercase text-xs">
              TIMELINE DA OPERAÇÃO EM TEMPO REAL (PAPER)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase font-bold px-2 py-0.5 rounded bg-white/[0.04]">
            ● AGUARDANDO ORDEM
          </span>
        </div>

        <div className="py-4 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#101720] border border-white/[0.08] flex items-center justify-center text-slate-400">
            <Clock className="w-5 h-5 text-[#3DA5FF]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-300">
              Nenhuma Posição Ativa no Momento
            </h4>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto pt-0.5">
              Execute uma ordem simulada através do botão da Decisão ou utilize os atalhos abaixo para acompanhar a evolução em tempo real.
            </p>
          </div>

          {onExecuteNewTrade && canExecute && (
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onExecuteNewTrade(recommendedDirection === "IMPAR" ? "IMPAR" : "PAR")
                }
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-[#3DA5FF] text-white hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2 font-sans"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>INICIAR PAPER TRADE ({recommendedDirection})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Cálculos da Ordem Ativa
  const now = Date.now();
  const startTime = activeOrder.timestamp;
  const endTime = activeOrder.expiresAt;
  const totalDurationMs = Math.max(1000, endTime - startTime);
  const elapsedMs = Math.max(0, Math.min(totalDurationMs, now - startTime));
  const remainingSeconds = Math.max(0, Math.ceil((endTime - now) / 1000));
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  // Delta de Preço e In-The-Money / Out-of-The-Money
  const entryPrice = activeOrder.entryPrice;
  const priceDelta = currentPrice - entryPrice;
  const pipsMultiplier = Math.pow(10, pipDecimals === 3 ? 2 : 4);
  const deltaPips = (priceDelta * pipsMultiplier).toFixed(1);

  // Lógica de Ganho:
  // Se PAR: ganha se o preço atual mantiver ou subir (ou lógica paridade do último dígito)
  // Calculamos status dinâmico para feedback visual
  const isWinning =
    activeOrder.direction === "PAR" ? currentPrice >= entryPrice : currentPrice <= entryPrice;

  const estimatedProfit = isWinning ? activeOrder.stakeAmount * activeOrder.payoutRate : -activeOrder.stakeAmount;

  return (
    <div className="bg-[#0B0F17] border border-white/[0.08] hover:border-emerald-500/30 transition-all rounded-2xl p-4 sm:p-5 font-mono shadow-2xl space-y-4 relative overflow-hidden">
      {/* Background glow sutil baseado no status */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isWinning ? "bg-emerald-500/10" : "bg-rose-500/10"
        }`}
      ></div>

      {/* 1. Header da Operação Ativa */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block animate-ping absolute"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block relative"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-xs sm:text-sm tracking-wide">
                OPERAÇÃO EM ANDAMENTO
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                  activeOrder.direction === "PAR"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-[#3DA5FF]/20 text-[#3DA5FF] border-[#3DA5FF]/40"
                }`}
              >
                {activeOrder.direction}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300 font-bold">
                {activeOrder.asset} ({activeOrder.timeframe})
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block pt-0.5">
              Plataforma: <strong className="text-slate-200">{activeOrder.platform}</strong> • Stake:{" "}
              <strong className="text-white">${activeOrder.stakeAmount.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Badge Dinâmico de Lucro / Prejuízo em Tempo Real */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
              isWinning
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10"
                : "bg-rose-950/40 border-rose-500/40 text-rose-400 shadow-rose-500/10"
            }`}
          >
            {isWinning ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>
              {isWinning
                ? `IN THE MONEY (+$${estimatedProfit.toFixed(2)})`
                : `OUT OF THE MONEY (-$${activeOrder.stakeAmount.toFixed(2)})`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Medidor Comparativo de Preços (Entrada vs Atual vs Delta) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
        {/* Preço de Entrada */}
        <div className="p-3 rounded-xl bg-[#070A0F] border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            PREÇO DE ENTRADA
          </span>
          <div className="pt-1 flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-black text-slate-200 font-mono">
              {entryPrice.toFixed(pipDecimals)}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">Trava de Entrada</span>
          </div>
        </div>

        {/* Preço Atual em Tempo Real */}
        <div className="p-3 rounded-xl bg-[#070A0F] border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>PREÇO ATUAL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </span>
          <div className="pt-1 flex items-baseline justify-between">
            <span
              className={`text-base sm:text-lg font-black font-mono transition-colors ${
                isWinning ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {currentPrice.toFixed(pipDecimals)}
            </span>
            <span
              className={`text-[11px] font-bold ${
                priceDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {priceDelta >= 0 ? "▲" : "▼"} {priceDelta >= 0 ? "+" : ""}
              {priceDelta.toFixed(pipDecimals)}
            </span>
          </div>
        </div>

        {/* Variação em Pips / Score */}
        <div className="p-3 rounded-xl bg-[#070A0F] border border-white/[0.06] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            VARIAÇÃO / DISTÂNCIA
          </span>
          <div className="pt-1 flex items-baseline justify-between">
            <span
              className={`text-base sm:text-lg font-black font-mono ${
                isWinning ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {Number(deltaPips) >= 0 ? `+${deltaPips}` : deltaPips} pips
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 font-bold">
              Payout: +85%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Progresso Visual da Linha do Tempo (Visual Timeline) */}
      <div className="space-y-2 pt-1">
        {/* Cabeçalho da Linha do Tempo com Cronômetro */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#3DA5FF]" />
            <span className="font-bold uppercase text-[11px]">
              DURAÇÃO DA OPERAÇÃO: {Math.floor(elapsedMs / 1000)}s / {Math.round(totalDurationMs / 1000)}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">EXPIRAÇÃO EM:</span>
            <span
              className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs ${
                remainingSeconds <= 5
                  ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              00:{remainingSeconds.toString().padStart(2, "0")}s
            </span>
          </div>
        </div>

        {/* Trilho e Barra de Progresso Animada */}
        <div className="relative w-full h-3 bg-[#070A0F] rounded-full overflow-hidden border border-white/[0.08] shadow-inner p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 relative shadow-lg ${
              isWinning
                ? "bg-gradient-to-r from-emerald-600 via-emerald-400 to-[#3DA5FF] shadow-emerald-500/40"
                : "bg-gradient-to-r from-rose-600 via-amber-500 to-rose-400 shadow-rose-500/40"
            }`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Efeito de brilho na ponta da barra */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff] opacity-80 animate-pulse"></div>
          </div>
        </div>

        {/* Marcadores Temporais (Stepper Markers na Linha do Tempo) */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-0.5 pt-0.5">
          <div className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Entrada (00:00)</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span>Meio ({Math.round(totalDurationMs / 2000)}s)</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Liquidação ({Math.round(totalDurationMs / 1000)}s)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
