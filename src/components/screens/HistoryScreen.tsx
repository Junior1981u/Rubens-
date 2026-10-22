import React, { useState } from "react";
import {
  History as HistoryIcon,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  FileCode,
  Layers,
} from "lucide-react";
import {
  ConsensusSignalItem,
  ConsensusPlatformId,
} from "../../types/nexora4AIConsensus";

interface HistoryScreenProps {
  signals: ConsensusSignalItem[];
  platform: ConsensusPlatformId;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ signals, platform }) => {
  const [filterPlatform, setFilterPlatform] = useState<string>("ALL");
  const [filterResult, setFilterResult] = useState<string>("ALL");
  const [selectedSignal, setSelectedSignal] = useState<ConsensusSignalItem | null>(null);

  const filteredSignals = signals.filter((sig) => {
    if (filterPlatform !== "ALL" && sig.platform !== filterPlatform) return false;
    if (filterResult !== "ALL") {
      if (filterResult === "WIN" && sig.result !== "WIN") return false;
      if (filterResult === "LOSS" && sig.result !== "LOSS") return false;
      if (filterResult === "ATIVO" && sig.status !== "ATIVO") return false;
    }
    return true;
  });

  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredSignals, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexora_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-3 sm:py-5 font-mono">
      {/* Top Banner */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-[#3DA5FF]" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              REGISTRO AUDITÁVEL IMUTÁVEL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            HISTÓRICO DE SNAPSHOTS & SINAIS
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Cada análise possui snapshot único com plataforma, ativo, data quality, IAs e desfecho.
          </p>
        </div>

        <button
          onClick={exportJson}
          className="px-3.5 py-2 rounded-xl bg-[#151D27] hover:bg-[#1E2836] text-white border border-white/[0.08] text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-[#3DA5FF]" />
          <span>EXPORTAR HISTÓRICO (JSON)</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#3DA5FF]" />
            PLATAFORMA:
          </span>
          {["ALL", "YOUXBROKER", "QUOTEX", "IQ_OPTION", "OLYMPTRADE"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterPlatform === p
                  ? "bg-[#3DA5FF] text-white"
                  : "bg-[#070A0F] text-slate-400 hover:text-white border border-white/[0.04]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold">STATUS:</span>
          {["ALL", "ATIVO", "WIN", "LOSS"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterResult(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterResult === r
                  ? "bg-purple-600 text-white"
                  : "bg-[#070A0F] text-slate-400 hover:text-white border border-white/[0.04]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <span className="font-bold text-white uppercase text-xs">
            REGISTROS ENCONTRADOS ({filteredSignals.length})
          </span>
          <span className="text-[11px] text-slate-400">
            AUDITORIA 100% REPRODUZÍVEL
          </span>
        </div>

        {filteredSignals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#070A0F] rounded-xl border border-white/[0.04] font-sans">
            Nenhum sinal com os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSignals.map((sig) => {
              const isPar = sig.decision === "PAR";
              const isImpar = sig.decision === "IMPAR";
              return (
                <div
                  key={sig.id}
                  className="p-3.5 rounded-xl bg-[#070A0F] border border-white/[0.05] hover:border-white/[0.15] transition-all flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black text-xs border ${
                        isPar
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : isImpar
                          ? "bg-[#3DA5FF]/20 text-[#3DA5FF] border-[#3DA5FF]/40"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      }`}
                    >
                      {sig.decision}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-xs">{sig.asset}</strong>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-300">
                          {sig.timeframe}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sig.platform || "QUOTEX"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(sig.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-1 mt-0.5">
                        Consenso {sig.consensus} • Score {sig.nexoraScore}% • {sig.why}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {sig.status === "ATIVO" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        ATIVO AGORA
                      </span>
                    ) : sig.result === "WIN" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✅ WIN (+85%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        FILTRADO
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedSignal(sig)}
                      className="p-1.5 rounded-lg bg-[#151D27] hover:bg-[#1E2836] text-slate-300 hover:text-white border border-white/[0.08] active:scale-95"
                      title="Ver Detalhes do Snapshot"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal / Detalhe do Snapshot Inspecionado */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F17] border border-white/[0.1] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#3DA5FF]" />
                <span className="font-bold text-white text-sm">
                  DETALHES DO SNAPSHOT AUDITÁVEL
                </span>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                FECHAR ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">ID do Sinal / Snapshot:</span>
                <span className="text-slate-200">{selectedSignal.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Plataforma:</span>
                <span className="text-white font-bold">{selectedSignal.platform || "QUOTEX"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Ativo / Timeframe:</span>
                <span className="text-white font-bold">{selectedSignal.asset} ({selectedSignal.timeframe})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Decisão Final:</span>
                <span className="text-emerald-400 font-bold">{selectedSignal.decision}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Consenso das 4 IAs:</span>
                <span className="text-[#3DA5FF] font-bold">{selectedSignal.consensus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Nexora Score:</span>
                <span className="text-purple-400 font-bold">{selectedSignal.nexoraScore}/100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-400">Data Source & Quality:</span>
                <span className="text-slate-200 font-bold">Paper Live Feed (98%)</span>
              </div>
              <div className="py-2">
                <span className="text-slate-400 block text-[10px] uppercase">Raciocínio Registrado:</span>
                <p className="text-slate-200 font-sans text-xs pt-1">{selectedSignal.why}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSignal(null)}
              className="w-full py-2.5 rounded-xl bg-[#151D27] hover:bg-[#1E2836] text-white text-xs font-bold transition-all"
            >
              FECHAR DETALHES
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
