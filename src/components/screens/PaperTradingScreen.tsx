import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  PaperAccount,
  PaperTradeOrder,
  ConsensusPlatformId,
} from "../../types/nexora4AIConsensus";

interface PaperTradingScreenProps {
  paperAccount: PaperAccount;
  platform: ConsensusPlatformId;
  asset: string;
  timeframe: string;
  currentPrice: number;
  onExecuteTrade: (direction: "PAR" | "IMPAR", stake: number) => void;
  onResetAccount: () => void;
}

export const PaperTradingScreen: React.FC<PaperTradingScreenProps> = ({
  paperAccount,
  platform,
  asset,
  timeframe,
  currentPrice,
  onExecuteTrade,
  onResetAccount,
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(50);

  const stakes = [10, 25, 50, 100, 250];

  const balance = Number(paperAccount?.balance ?? 10000) || 10000;
  const totalProfit = Number(paperAccount?.totalProfit ?? 0) || 0;
  const winRate = Number(paperAccount?.winRate ?? 0) || 0;
  const wins = Number(paperAccount?.wins ?? 0) || 0;
  const losses = Number(paperAccount?.losses ?? 0) || 0;
  const totalTrades = Number(paperAccount?.totalTrades ?? 0) || 0;
  const maxDrawdown = Number(paperAccount?.maxDrawdown ?? 0) || 0;
  const activeOrders = Array.isArray(paperAccount?.activeOrders) ? paperAccount.activeOrders : [];
  const orderHistory = Array.isArray(paperAccount?.orderHistory) ? paperAccount.orderHistory : [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-3 sm:py-5 font-mono">
      {/* Top Banner */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              SIMULADOR DE ALTA PRECISÃO
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            NEXORA PAPER TRADING
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Ambiente 100% virtual para validar o motor de confluência sem risco de capital.
          </p>
        </div>

        <button
          onClick={onResetAccount}
          className="px-3.5 py-2 rounded-xl bg-[#151D27] hover:bg-[#1E2836] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>REINICIAR SALDO ($10,000)</span>
        </button>
      </div>

      {/* Cartões de Telemetria Financeira Paper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Saldo Virtual */}
        <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            SALDO VIRTUAL
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Inicial: $10,000.00</span>
        </div>

        {/* Lucro / Prejuízo Líquido (PnL) */}
        <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            LUCRO LÍQUIDO (PNL)
          </span>
          <div
            className={`text-xl sm:text-2xl font-black ${
              totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {totalProfit >= 0 ? "+" : ""}$
            {totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Retorno acumulado</span>
        </div>

        {/* Taxa de Acerto (Win Rate) */}
        <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            WIN RATE VIRTUAL
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#3DA5FF]">
            {winRate}%
          </div>
          <span className="text-[10px] text-slate-500">
            {wins}W / {losses}L
          </span>
        </div>

        {/* Total de Ordens */}
        <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            TOTAL ORDENS
          </span>
          <div className="text-xl sm:text-2xl font-black text-purple-400">
            {totalTrades}
          </div>
          <span className="text-[10px] text-slate-500">Drawdown: {maxDrawdown}%</span>
        </div>
      </div>

      {/* Terminal de Envio de Ordem Paper */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white uppercase text-xs">
              TERMINAL DE EXECUÇÃO PAPER ({platform})
            </span>
          </div>
          <span className="text-slate-400">
            Preço Spot: <strong className="text-white">{currentPrice.toFixed(5)}</strong> ({asset})
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            VALOR DA ORDEM SIMULADA (STAKE USD):
          </span>
          <div className="flex flex-wrap gap-2">
            {stakes.map((val) => (
              <button
                key={val}
                onClick={() => setStakeAmount(val)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stakeAmount === val
                    ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                    : "bg-[#101720] text-slate-300 hover:text-white border border-white/[0.06]"
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Botões de Abertura PAR vs ÍMPAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onExecuteTrade("PAR", stakeAmount)}
            className="h-13 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>ENTRAR PAR (${stakeAmount})</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded text-black font-bold">
              PAYOUT +85%
            </span>
          </button>

          <button
            onClick={() => onExecuteTrade("IMPAR", stakeAmount)}
            className="h-13 rounded-xl bg-gradient-to-r from-[#3DA5FF] to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#3DA5FF]/20 transition-all"
          >
            <span>ENTRAR ÍMPAR (${stakeAmount})</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded text-white font-bold">
              PAYOUT +85%
            </span>
          </button>
        </div>
      </section>

      {/* Ordens em Andamento / Abertas */}
      {activeOrders.length > 0 && (
        <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="font-bold text-white uppercase text-xs">
              POSIÇÕES SIMULADAS EM ABERTO ({activeOrders.length})
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              AGUARDANDO EXPIRAÇÃO
            </span>
          </div>

          <div className="space-y-2">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-xl bg-[#070A0F] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-black text-xs border ${
                      order.direction === "PAR"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-[#3DA5FF]/20 text-[#3DA5FF] border-[#3DA5FF]/40"
                    }`}
                  >
                    {order.direction}
                  </span>
                  <div>
                    <strong className="text-white text-xs">{order.asset}</strong>
                    <span className="text-[10px] text-slate-400 ml-2">
                      Entrada: {Number(order.entryPrice ?? order.entry ?? currentPrice).toFixed(5)} • Stake: ${order.stakeAmount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-bold">EXPIRANDO EM BREVE</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Histórico de Ordens Liquidadas */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <span className="font-bold text-white uppercase text-xs">
            HISTÓRICO DE ORDENS SIMULADAS ({orderHistory.length})
          </span>
          <span className="text-[11px] text-slate-400">
            AUDITORIA PAPER TRADING
          </span>
        </div>

        {orderHistory.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-[#070A0F] rounded-xl border border-white/[0.04] font-sans">
            Nenhuma ordem liquidada ainda. Execute uma ordem simulada acima para testar.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orderHistory.map((order) => {
              const isWin = order.result === "WIN";
              const isLoss = order.result === "LOSS";
              const isDraw = order.result === "DRAW";
              const isInvalid = order.result === "INVALID";
              const entryVal = Number(order.entry ?? order.entryPrice ?? currentPrice);
              const decisionVal = order.decision || order.direction;

              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-[#070A0F] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md"
                >
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-4 gap-y-1 sm:gap-3">
                    {/* Timestamp */}
                    <span className="text-slate-500 text-[10px] font-mono">
                      {new Date(order.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                    </span>

                    {/* Platform */}
                    <span className="text-purple-400 font-bold text-[11px]">
                      {order.platform || platform}
                    </span>

                    {/* Asset & Timeframe */}
                    <div className="flex items-center gap-1.5">
                      <strong className="text-white">{order.asset}</strong>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.05] text-slate-400">
                        {order.timeframe || timeframe}
                      </span>
                    </div>

                    {/* Entry Price */}
                    <div className="text-[11px] text-slate-300">
                      <span className="text-slate-500 text-[10px]">Entrada: </span>
                      <strong>{entryVal.toFixed(5)}</strong>
                    </div>

                    {/* Decision */}
                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded border ${
                        decisionVal === "PAR"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-[#3DA5FF]/15 text-[#3DA5FF] border-[#3DA5FF]/30"
                      }`}
                    >
                      {decisionVal}
                    </span>

                    {/* 4 AI Consensus */}
                    <span className="text-[10px] text-slate-400 bg-[#101720] px-2 py-0.5 rounded border border-white/[0.06]">
                      {order.consensusScore || "4/4"} UNÂNIME
                    </span>
                  </div>

                  {/* Stake, PnL & Result */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                    <span className="text-slate-400 text-[11px]">
                      Stake: ${order.stakeAmount}
                    </span>

                    <span
                      className={`font-black ${
                        isWin
                          ? "text-emerald-400"
                          : isLoss
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {isWin
                        ? `+$${(order.profit || 0).toFixed(2)}`
                        : isLoss
                        ? `-$${order.stakeAmount.toFixed(2)}`
                        : "$0.00"}
                    </span>

                    {/* Result: WIN / LOSS / DRAW / INVALID */}
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider border ${
                        isWin
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : isLoss
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                          : isDraw
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-slate-700 text-slate-300 border-slate-600"
                      }`}
                    >
                      {order.result || "SETTLED"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
