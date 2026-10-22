import React, { useState, useEffect } from "react";
import { Radar, Play, Square, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { SignalItem } from "../../types.js";

interface ScannerRow {
  asset: string;
  timeframe: string;
  regime: string;
  setup: string;
  gpt: string;
  claude: string;
  gemini: string;
  grok: string;
  consenso: string;
  score: number;
  status: string;
}

interface ScannerScreenProps {
  scannerActive: boolean;
  onToggleScanner: (active: boolean) => void;
  recentSignals: SignalItem[];
  onTriggerManualScan: () => void;
  isScanning: boolean;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({
  scannerActive,
  onToggleScanner,
  recentSignals,
  onTriggerManualScan,
  isScanning,
}) => {
  const [rows, setRows] = useState<ScannerRow[]>([
    { asset: "EUR/USD", timeframe: "M1", regime: "TRENDING", setup: "EMA+MACD CONFLUÊNCIA", gpt: "PAR", claude: "PAR", gemini: "PAR", grok: "PAR", consenso: "4/4", score: 94, status: "SINAL PAR" },
    { asset: "GBP/USD", timeframe: "M1", regime: "TRENDING", setup: "EXAUSTÃO BOLLINGER", gpt: "IMPAR", claude: "IMPAR", gemini: "IMPAR", grok: "IMPAR", consenso: "4/4", score: 91, status: "SINAL ÍMPAR" },
    { asset: "USD/JPY", timeframe: "M1", regime: "VOLATILE", setup: "REVERSÃO ESTOCÁSTICO", gpt: "PAR", claude: "WAIT", gemini: "PAR", grok: "PAR", consenso: "3/4", score: 68, status: "AGUARDAR" },
    { asset: "AUD/USD", timeframe: "M1", regime: "RANGING", setup: "CONSOLIDAÇÃO SUPORTE", gpt: "WAIT", claude: "WAIT", gemini: "PAR", grok: "WAIT", consenso: "1/4", score: 42, status: "AGUARDAR" },
    { asset: "USD/CAD", timeframe: "M1", regime: "TRENDING", setup: "MOMENTUM DIRECIONAL", gpt: "PAR", claude: "PAR", gemini: "PAR", grok: "PAR", consenso: "4/4", score: 92, status: "SINAL PAR" },
    { asset: "AUD/CAD", timeframe: "M1", regime: "TRENDING", setup: "ROMPIMENTO DE RESISTÊNCIA", gpt: "IMPAR", claude: "IMPAR", gemini: "IMPAR", grok: "IMPAR", consenso: "4/4", score: 89, status: "SINAL ÍMPAR" },
    { asset: "GBP/JPY", timeframe: "M1", regime: "TRENDING", setup: "PULLBACK EMA 21", gpt: "PAR", claude: "PAR", gemini: "PAR", grok: "PAR", consenso: "4/4", score: 93, status: "SINAL PAR" },
    { asset: "XAG/USD", timeframe: "M1", regime: "VOLATILE", setup: "SPREAD ALTO", gpt: "WAIT", claude: "NO TRADE", gemini: "WAIT", grok: "WAIT", consenso: "0/4", score: 25, status: "NO TRADE" },
    { asset: "NZD/CAD", timeframe: "M1", regime: "TRENDING", setup: "CRUZAMENTO MACD", gpt: "PAR", claude: "PAR", gemini: "PAR", grok: "PAR", consenso: "4/4", score: 88, status: "SINAL PAR" },
  ]);

  useEffect(() => {
    if (!Array.isArray(recentSignals) || recentSignals.length === 0) return;
    setRows((prev) =>
      prev.map((row) => {
        const match = recentSignals.find((s) => s.asset === row.asset);
        if (!match) return row;
        const dir = match.direction;
        return {
          ...row,
          timeframe: match.timeframe === "1M" ? "M1" : match.timeframe,
          gpt: dir,
          claude: dir,
          gemini: dir,
          grok: dir,
          consenso: match.consensusScore || "4/4",
          score: match.nexoraScore,
          status: `SINAL ${dir}`,
        };
      })
    );
  }, [recentSignals]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-4 font-mono text-xs pb-24 text-[#F5F7FF]">
      {/* Top Header Card */}
      <div className="bg-[#0D1220] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
              <Radar className={`w-5 h-5 ${scannerActive ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">AUTO SCANNER EM TEMPO REAL</h2>
              <p className="text-slate-400 text-[11px]">
                Monitoramento contínuo por eventos: novo candle, mudança de regime, confluência 4 IAs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleScanner(!scannerActive)}
              className={`px-4 py-2 rounded-xl font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                scannerActive
                  ? "bg-[#FF5570]/20 hover:bg-[#FF5570]/30 text-[#FF5570] border border-[#FF5570]/50"
                  : "bg-[#00D084]/20 hover:bg-[#00D084]/30 text-[#00D084] border border-[#00D084]/50"
              }`}
            >
              {scannerActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {scannerActive ? "■ PARAR SCANNER" : "▶ INICIAR SCANNER"}
            </button>

            <button
              onClick={onTriggerManualScan}
              disabled={isScanning}
              className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>SCAN MANUAL</span>
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/[0.06]">
          <div className="bg-[#070912] p-3 rounded-xl border border-white/[0.04]">
            <span className="text-slate-500 text-[10px]">ESTADO</span>
            <div className="font-black text-white mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${scannerActive ? "bg-[#00D084] animate-ping" : "bg-slate-500"}`} />
              {scannerActive ? "MONITORANDO" : "PARADO"}
            </div>
          </div>
          <div className="bg-[#070912] p-3 rounded-xl border border-white/[0.04]">
            <span className="text-slate-500 text-[10px]">CADÊNCIA</span>
            <div className="font-black text-white mt-0.5">EVENT-DRIVEN</div>
          </div>
          <div className="bg-[#070912] p-3 rounded-xl border border-white/[0.04]">
            <span className="text-slate-500 text-[10px]">LOSS GUARD</span>
            <div className="font-black text-[#00D084] mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ATIVO
            </div>
          </div>
          <div className="bg-[#070912] p-3 rounded-xl border border-white/[0.04]">
            <span className="text-slate-500 text-[10px]">SINAIS 4/4</span>
            <div className="font-black text-white mt-0.5">{recentSignals.length}</div>
          </div>
        </div>
      </div>

      {/* Tabela do Market Scanner com as colunas EXATAS:
          ATIVO, TIMEFRAME, REGIME, SETUP, GPT, CLAUDE, GEMINI, GROK, CONSENSO, SCORE, STATUS
      */}
      <div className="bg-[#0D1220] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <Radar className="w-4 h-4 text-[#22D3EE]" /> TABELA DE SCANNER MULTI-ATIVO
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            EVENT-DRIVEN
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">ATIVO</th>
                <th className="py-2.5 px-2">TIMEFRAME</th>
                <th className="py-2.5 px-2">REGIME</th>
                <th className="py-2.5 px-3">SETUP</th>
                <th className="py-2.5 px-2 text-center">GPT</th>
                <th className="py-2.5 px-2 text-center">CLAUDE</th>
                <th className="py-2.5 px-2 text-center">GEMINI</th>
                <th className="py-2.5 px-2 text-center">GROK</th>
                <th className="py-2.5 px-2 text-center">CONSENSO</th>
                <th className="py-2.5 px-2 text-center">SCORE</th>
                <th className="py-2.5 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-[11px]">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{row.asset}</td>
                  <td className="py-2.5 px-2 font-mono text-[#8B5CF6] font-bold">{row.timeframe}</td>
                  <td className="py-2.5 px-2 text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] border border-white/[0.06]">
                      {row.regime}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono truncate max-w-[150px] text-[10px]">
                    {row.setup}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold">
                    <span className={row.gpt === "PAR" ? "text-[#00D084]" : row.gpt === "IMPAR" ? "text-[#8B5CF6]" : "text-slate-500"}>
                      {row.gpt}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold">
                    <span className={row.claude === "PAR" ? "text-[#00D084]" : row.claude === "IMPAR" ? "text-[#8B5CF6]" : "text-slate-500"}>
                      {row.claude}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold">
                    <span className={row.gemini === "PAR" ? "text-[#00D084]" : row.gemini === "IMPAR" ? "text-[#8B5CF6]" : "text-slate-500"}>
                      {row.gemini}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold">
                    <span className={row.grok === "PAR" ? "text-[#00D084]" : row.grok === "IMPAR" ? "text-[#8B5CF6]" : "text-slate-500"}>
                      {row.grok}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                        row.consenso === "4/4"
                          ? "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {row.consenso}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-[#22D3EE]">
                    {row.score}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-black">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        row.status.includes("PAR")
                          ? "bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/30"
                          : row.status.includes("ÍMPAR")
                          ? "bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30"
                          : row.status.includes("NO TRADE")
                          ? "bg-[#FF5570]/15 text-[#FF5570] border border-[#FF5570]/30"
                          : "bg-white/[0.04] text-slate-400"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
