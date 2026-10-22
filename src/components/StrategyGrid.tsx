import React from "react";
import { Zap } from "lucide-react";

export interface StrategyItem {
  id: string;
  label: string;
  fullName: string;
  active: boolean;
}

export const DEFAULT_STRATEGIES: StrategyItem[] = [
  { id: "rsi", label: "RSI", fullName: "Relative Strength Index (14)", active: false },
  { id: "macd", label: "MACD", fullName: "Moving Average Convergence Divergence", active: false },
  { id: "ema", label: "EMA", fullName: "Exponential Moving Averages", active: true },
  { id: "bbands", label: "BBANDS", fullName: "Bollinger Bands", active: false },
  { id: "stoch", label: "STOCH", fullName: "Stochastic Oscillator", active: false },
  { id: "pa", label: "PA", fullName: "Price Action & Formações de Candlestick", active: false },
  { id: "sr", label: "S/R", fullName: "Suporte e Resistência Dinâmicos", active: false },
  { id: "vol", label: "VOL", fullName: "Volume Spread Analysis", active: false },
  { id: "mhi2", label: "MHI2", fullName: "Padrão Probabilístico MHI 2", active: false },
];

interface StrategyGridProps {
  strategies: StrategyItem[];
  onToggleStrategy: (id: string) => void;
}

export const StrategyGrid: React.FC<StrategyGridProps> = ({
  strategies,
  onToggleStrategy,
}) => {
  const activeCount = strategies.filter((s) => s.active).length;

  const getStrat = (id: string) =>
    strategies.find((s) => s.id === id) || {
      id,
      label: id.toUpperCase(),
      fullName: id,
      active: id === "ema",
    };

  const row1 = [getStrat("rsi"), getStrat("macd"), getStrat("ema"), getStrat("bbands")];
  const row2 = [getStrat("stoch"), getStrat("pa"), getStrat("sr"), getStrat("vol")];
  const mhi2 = getStrat("mhi2");

  return (
    <div className="w-full space-y-1.5 font-mono text-xs select-none">
      {/* Header: ⚡ ESTRATÉGIAS (Esquerda) e 1/9 (Direita) */}
      <div className="flex items-center justify-between text-[11px] font-bold pb-0.5">
        <div className="flex items-center gap-1.5 text-slate-300 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-[#A78BFA] fill-current" />
          <span>ESTRATÉGIAS</span>
        </div>
        <span className="text-[#A78BFA] text-[10px] font-mono">
          {activeCount}/9
        </span>
      </div>

      {/* Grid Exato da Foto:
          Linha 1: RSI | MACD | EMA | BBANDS
          Linha 2: STOCH | PA | S/R | VOL
          Linha 3: MHI2
      */}
      <div className="space-y-1.5 text-[11px]">
        {/* Linha 1 */}
        <div className="grid grid-cols-4 gap-1.5">
          {row1.map((strat) => (
            <button
              key={strat.id}
              onClick={() => onToggleStrategy(strat.id)}
              className={`py-2 px-1 rounded-xl font-bold uppercase tracking-wider text-center transition-all active:scale-95 border cursor-pointer ${
                strat.active
                  ? "bg-[#6D28D9] border-[#8B5CF6] text-white shadow-md shadow-[#6D28D9]/40"
                  : "bg-[#18162E] border-white/5 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <span className="truncate block">{strat.label}</span>
            </button>
          ))}
        </div>

        {/* Linha 2 */}
        <div className="grid grid-cols-4 gap-1.5">
          {row2.map((strat) => (
            <button
              key={strat.id}
              onClick={() => onToggleStrategy(strat.id)}
              className={`py-2 px-1 rounded-xl font-bold uppercase tracking-wider text-center transition-all active:scale-95 border cursor-pointer ${
                strat.active
                  ? "bg-[#6D28D9] border-[#8B5CF6] text-white shadow-md shadow-[#6D28D9]/40"
                  : "bg-[#18162E] border-white/5 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <span className="truncate block">{strat.label}</span>
            </button>
          ))}
        </div>

        {/* Linha 3: MHI2 (1 coluna de 4) */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onToggleStrategy(mhi2.id)}
            className={`py-2 px-1 rounded-xl font-bold uppercase tracking-wider text-center transition-all active:scale-95 border cursor-pointer ${
              mhi2.active
                ? "bg-[#6D28D9] border-[#8B5CF6] text-white shadow-md shadow-[#6D28D9]/40"
                : "bg-[#18162E] border-white/5 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            <span className="truncate block">{mhi2.label}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
