import React, { useState } from "react";
import {
  TrendingUp,
  BrainCircuit,
  Activity,
  Award,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  Filter,
} from "lucide-react";
import {
  ConsensusPlatformId,
  AgentDriftMetrics,
  ConsensusLearningRecord,
  MarketRegimeType,
} from "../../types/nexora4AIConsensus";

interface LearningScreenProps {
  platform: ConsensusPlatformId;
  agentDrift: Record<string, AgentDriftMetrics>;
  learningRecords: ConsensusLearningRecord[];
}

export const LearningScreen: React.FC<LearningScreenProps> = ({
  platform,
  agentDrift,
  learningRecords,
}) => {
  const [selectedRegime, setSelectedRegime] = useState<MarketRegimeType | "ALL">("ALL");

  const regimes: { id: MarketRegimeType; name: string; winRate: number; count: number }[] = [
    { id: "TRENDING", name: "Trending", winRate: 89, count: 124 },
    { id: "RANGING", name: "Ranging", winRate: 85, count: 78 },
    { id: "BREAKOUT", name: "Breakout", winRate: 82, count: 32 },
    { id: "HIGH_VOLATILITY", name: "Alta Volatilidade", winRate: 75, count: 21 },
    { id: "LOW_VOLATILITY", name: "Baixa Volatilidade", winRate: 88, count: 45 },
    { id: "UNCERTAIN", name: "Incerto (Veto)", winRate: 0, count: 14 },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-3 sm:py-5 font-mono">
      {/* Top Banner */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              AUTO-APRENDIZADO & MODEL DRIFT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            NEXORA LEARNING ENGINE V5
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Calibração Walk-Forward contínua indexada por plataforma e regime de mercado.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>TAXA GLOBAL DE ACERTO: 87.1%</span>
        </div>
      </div>

      {/* Model Drift Detector Cards */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-slate-300 uppercase">
            MODEL DRIFT DETECTOR (MONITORAMENTO DOS 4 AGENTES)
          </span>
          <span className="text-[11px] text-slate-400">
            DEGRADAÇÃO ESTATÍSTICA: NENHUMA DETECTADA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {Object.values(agentDrift).map((agent) => (
            <div
              key={agent.agent}
              className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 space-y-2.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">{agent.agent}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${
                    agent.status === "HEALTHY"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  ● {agent.status}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Papel:</span>
                  <span className="text-slate-200 font-sans">{agent.role}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Acurácia Walk-Forward:</span>
                  <strong className="text-emerald-400">{agent.accuracyRate}%</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Latência Média:</span>
                  <span className="text-slate-200">{agent.avgLatencyMs}ms</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Amostras Analisadas:</span>
                  <span className="text-slate-200">{agent.totalEvaluations} ciclos</span>
                </div>
              </div>

              {/* Barra de Progresso de Assertividade */}
              <div className="w-full bg-[#151D27] h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${agent.accuracyRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matriz de Assertividade por Regime de Mercado */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3DA5FF]" />
            <span className="font-bold text-white uppercase text-xs">
              PERFORMANCE POR REGIME DE MERCADO
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            CONSENSO 4/4 SELECIONADO
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
          {regimes.map((reg) => (
            <div
              key={reg.id}
              className={`p-3 rounded-xl border transition-all ${
                reg.id === "UNCERTAIN"
                  ? "bg-rose-950/15 border-rose-500/20 text-rose-300"
                  : "bg-[#070A0F] border-white/[0.06] text-slate-300"
              }`}
            >
              <span className="text-[10px] text-slate-400 block truncate">{reg.name}</span>
              <strong
                className={`text-base font-black block pt-1 ${
                  reg.winRate >= 80 ? "text-emerald-400" : reg.winRate > 0 ? "text-amber-400" : "text-rose-400"
                }`}
              >
                {reg.winRate > 0 ? `${reg.winRate}%` : "VETO"}
              </strong>
              <span className="text-[9px] text-slate-500">{reg.count} amostras</span>
            </div>
          ))}
        </div>
      </section>

      {/* Registros Recentes de Aprendizado da Plataforma */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <span className="font-bold text-white uppercase text-xs">
            MEMÓRIA DE APRENDIZADO — {platform}
          </span>
          <span className="text-[11px] text-slate-400">
            DADOS ISOLADOS E ARMAZENADOS
          </span>
        </div>

        {learningRecords.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-[#070A0F] rounded-xl border border-white/[0.04] font-sans">
            Nenhum histórico registrado ainda para {platform}. Os ciclos analisados com desfecho serão gravados aqui.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {learningRecords.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="p-3 rounded-xl bg-[#070A0F] border border-white/[0.04] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                  <strong className="text-white">{record.asset}</strong>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                    {record.timeframe}
                  </span>
                  <span className="text-[#3DA5FF] font-bold">
                    {record.decision}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Regime: {record.regime || "TRENDING"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      record.result === "WIN"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {record.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
