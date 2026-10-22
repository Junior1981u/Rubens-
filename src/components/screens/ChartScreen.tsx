import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Maximize2,
  Activity,
  Shield,
  Zap,
} from "lucide-react";
import { RealCandle } from "../../types/nexora4AIConsensus.js";
import { TradingChart } from "../TradingChart.js";
import { SignalItem, PaperTrade } from "../../types.js";
import { ASSETS_CATALOG } from "./DashboardScreen.js";

interface ChartScreenProps {
  candles: RealCandle[];
  asset: string;
  setAsset: (a: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  currentPrice: number;
  onExecutePaperTrade: (dir: "PAR" | "IMPAR", stake?: number) => void;
  recentSignals?: SignalItem[];
  paperTrades?: PaperTrade[];
  isLiveFeed?: boolean;
}

export const ChartScreen: React.FC<ChartScreenProps> = ({
  candles,
  asset,
  setAsset,
  timeframe,
  setTimeframe,
  currentPrice,
  onExecutePaperTrade,
  recentSignals = [],
  paperTrades = [],
  isLiveFeed = true,
}) => {
  const [stake, setStake] = useState<number>(50);
  const [candleCountdown, setCandleCountdown] = useState<number>(45);

  useEffect(() => {
    const timer = setInterval(() => {
      setCandleCountdown((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const assetMeta = ASSETS_CATALOG.find((a) => a.symbol === asset) || ASSETS_CATALOG[0];

  const recentCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const priceChange = prevCandle ? currentPrice - prevCandle.close : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-3 sm:px-4 py-3 font-mono text-xs pb-20">
      {/* Top Header Controls */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Asset Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">ATIVO:</span>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="bg-[#070A0F] border border-white/10 rounded-xl px-3 py-1.5 text-white font-black text-sm focus:outline-none focus:border-cyan-400"
            >
              {ASSETS_CATALOG.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol} ({a.payout})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/[0.08]">
            <span className="text-slate-400 text-[10px]">PREÇO:</span>
            <span className={`text-sm font-black ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {currentPrice.toFixed(assetMeta.pipDecimals || 5)}
            </span>
            <span className={`text-[10px] font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? "+" : ""}{priceChange.toFixed(5)}
            </span>
          </div>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">TIMEFRAME:</span>
          <div className="flex items-center gap-1 bg-[#070A0F] p-1 rounded-xl border border-white/10">
            {["M1", "M5", "M15", "M30", "H1"].map((tf) => {
              const currentMapped =
                timeframe === "1M"
                  ? "M1"
                  : timeframe === "5M"
                  ? "M5"
                  : timeframe === "15M"
                  ? "M15"
                  : timeframe === "30M"
                  ? "M30"
                  : timeframe === "1H"
                  ? "H1"
                  : timeframe;
              const isSelected = currentMapped === tf;
              return (
                <button
                  key={tf}
                  onClick={() =>
                    setTimeframe(
                      tf === "M1"
                        ? "1M"
                        : tf === "M5"
                        ? "5M"
                        : tf === "M15"
                        ? "15M"
                        : tf === "M30"
                        ? "30M"
                        : "1H"
                    )
                  }
                  className={`px-3 py-1 rounded-lg font-black text-xs transition-all ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          {/* Candle countdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#070A0F] border border-white/10 text-amber-400 text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>00:{candleCountdown.toString().padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* Main Candlestick Chart */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-3 sm:p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm">{asset}</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/30">
              VELAS REAIS • {timeframe}
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              EMA 9 • EMA 21 • BOLLINGER • S/R
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isLiveFeed ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
            <span>{isLiveFeed ? "FEED ATIVO" : "OFFLINE"}</span>
          </div>
        </div>

        {/* The canvas trading chart */}
        <TradingChart
          candles={candles}
          assetName={asset}
          currentPrice={currentPrice}
          timeframe={timeframe}
          onExecuteTrade={onExecutePaperTrade}
          showControls={false}
        />

        {/* Bottom Chart Order Controls (Paper Trading) */}
        <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] font-bold">STAKE (PAPER):</span>
            <div className="flex items-center gap-1">
              {[25, 50, 100, 250].map((val) => (
                <button
                  key={val}
                  onClick={() => setStake(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    stake === val
                      ? "bg-cyan-500 text-slate-950 font-black"
                      : "bg-[#070A0F] text-slate-400 border border-white/10 hover:text-white"
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Paper Execution Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecutePaperTrade("PAR", stake)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>PAR • CALL (+85%)</span>
            </button>

            <button
              onClick={() => onExecutePaperTrade("IMPAR", stake)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 active:scale-95 transition-all"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>ÍMPAR • PUT (+85%)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Paper Orders on this Asset */}
      {paperTrades.filter((t) => t.status === "OPEN").length > 0 && (
        <div className="bg-[#0B0F17] border border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
            <Activity className="w-4 h-4 animate-spin" />
            <span>ORDENS PAPER EM ANDAMENTO NESTE GRÁFICO</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {paperTrades
              .filter((t) => t.status === "OPEN")
              .map((t) => (
                <div
                  key={t.signalId}
                  className="bg-[#070A0F] p-3 rounded-xl border border-white/[0.08] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-white">{t.asset}</span>
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-black ${
                        t.direction === "PAR" ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {t.direction}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Entrada: {t.entryPrice.toFixed(5)} • Stake: ${t.stake}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 font-bold animate-pulse">EXPIRANDO EM 60s</span>
                    <div className="text-[9px] text-slate-500">{t.fourAIConsensus}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
