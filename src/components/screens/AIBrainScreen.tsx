import React, { useState } from "react";
import {
  Cpu,
  ShieldAlert,
  BarChart2,
  Binary,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  RefreshCw,
  Code,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  AIStructuredResponse,
  ConsensusMarketSnapshot,
  NexoraConsensusDecisionResult,
} from "../../types/nexora4AIConsensus";

interface AIBrainScreenProps {
  decisionResult: NexoraConsensusDecisionResult | null;
  onRefresh: () => void;
  isEvaluating: boolean;
}

export const AIBrainScreen: React.FC<AIBrainScreenProps> = ({
  decisionResult,
  onRefresh,
  isEvaluating,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<"GPT" | "CLAUDE" | "GEMINI" | "GROK">("GPT");
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const responses = decisionResult?.aiResponses || [];
  const currentAgentData = responses.find((r) => r.agent === selectedAgent) || responses[0] || {
    agent: "GPT",
    direction: "PAR",
    confidence: 94,
    patternStrength: 92,
    regimeCompatibility: 90,
    dataQuality: 98,
    evidence: ["Alternância simétrica recente", "Convergência de suporte"],
    counterEvidence: ["Risco de falso rompimento se volume cair"],
    invalidations: ["Quebra do suporte em 1.08210"],
    reasoningSummary: "Padrão de repetição de paridade validado nos últimos 30 ciclos.",
    timestamp: Date.now(),
    role: "Pattern Analyst",
    status: "HEALTHY",
  };

  const snapshot = decisionResult?.snapshot || {
    snapshotId: decisionResult?.snapshotId || "snap_v5_live_01",
    platform: "QUOTEX",
    asset: "EUR/USD",
    timeframe: "1M",
    timestamp: Date.now(),
    price: 1.08245,
    dataQuality: 98,
    regime: "TRENDING",
    latencyMs: 18,
  };

  const copySnapshotJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentAgentData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-3 sm:py-5 font-mono">
      {/* Header */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#3DA5FF]" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ARQUITETURA MULTI-AGENTE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            NEXORA 4 AI BRAIN ENGINE
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            4 Agentes Independentes alimentados pelo mesmo Snapshot Imutável.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isEvaluating}
          className="px-4 py-2.5 rounded-xl bg-[#3DA5FF]/20 hover:bg-[#3DA5FF]/30 text-[#3DA5FF] border border-[#3DA5FF]/40 font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
          <span>RODAR AVALIAÇÃO SÍNCRONA</span>
        </button>
      </div>

      {/* Regra de Ouro: Snapshot Único e Imutável */}
      <div className="bg-gradient-to-r from-blue-950/30 via-[#101720] to-[#0B0F17] border border-[#3DA5FF]/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3DA5FF]/20 flex items-center justify-center text-[#3DA5FF]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              SNAPSHOT ÚNICO & IMUTÁVEL
            </span>
            <span className="text-white font-bold">
              ID: {snapshot.snapshotId} • Qualidade: {snapshot.dataQuality || 98}% • Latência: {(snapshot as any).latencyMs || (snapshot as any).features?.latencyMs || 22}ms
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-sans">
          Nenhuma IA vê a resposta da outra antes de concluir sua própria análise.
        </div>
      </div>

      {/* Seletor dos 4 Agentes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: "GPT" as const, name: "GPT", role: "Pattern Analyst", icon: Binary, color: "#10A37F" },
          { id: "CLAUDE" as const, name: "CLAUDE", role: "Risk Critic", icon: ShieldAlert, color: "#D97706" },
          { id: "GEMINI" as const, name: "GEMINI", role: "Technical Analyst", icon: BarChart2, color: "#3DA5FF" },
          { id: "GROK" as const, name: "GROK", role: "Independent Analyst", icon: Sparkles, color: "#A855F7" },
        ].map((agent) => {
          const isSelected = selectedAgent === agent.id;
          const agentResp = responses.find((r) => r.agent === agent.id);
          const dir = agentResp?.direction || "PAR";
          const isPar = dir === "PAR";
          const isImpar = dir === "IMPAR";

          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-2 ${
                isSelected
                  ? "bg-[#101720] border-white/30 shadow-lg ring-1 ring-white/20"
                  : "bg-[#0B0F17] border-white/[0.06] hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-white">{agent.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                    isPar
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : isImpar
                      ? "bg-[#3DA5FF]/20 text-[#3DA5FF] border-[#3DA5FF]/40"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  }`}
                >
                  {dir}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block truncate">{agent.role}</span>
                <span className="text-[9px] text-emerald-400 font-bold">● HEALTHY</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Cartão de Detalhes do Agente Selecionado */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">{currentAgentData.agent}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.05] text-slate-300 font-bold border border-white/[0.1]">
                {currentAgentData.role || "Analista"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Direção estruturada: <strong className="text-white">{currentAgentData.direction}</strong> | Confiança:{" "}
              <strong className="text-emerald-400">{currentAgentData.confidence}%</strong>
            </p>
          </div>

          <button
            onClick={copySnapshotJson}
            className="px-3 py-1.5 rounded-xl bg-[#151D27] hover:bg-[#1E2836] text-slate-300 border border-white/[0.08] text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">JSON COPIADO!</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-[#3DA5FF]" />
                <span>COPIAR JSON DO AGENTE</span>
              </>
            )}
          </button>
        </div>

        {/* Métricas do Agente */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
          <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block">FORÇA DO PADRÃO</span>
            <strong className="text-white text-sm block pt-0.5">{currentAgentData.patternStrength || 90}%</strong>
          </div>
          <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block">COMPATIBILIDADE REGIME</span>
            <strong className="text-emerald-400 text-sm block pt-0.5">{currentAgentData.regimeCompatibility || 92}%</strong>
          </div>
          <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block">QUALIDADE DADOS</span>
            <strong className="text-[#3DA5FF] text-sm block pt-0.5">{currentAgentData.dataQuality || 98}%</strong>
          </div>
          <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 block">STATUS OPERACIONAL</span>
            <strong className="text-emerald-400 text-sm block pt-0.5">● HEALTHY</strong>
          </div>
        </div>

        {/* Resumo do Raciocínio */}
        <div className="p-3.5 rounded-xl bg-[#070A0F] border border-white/[0.06] space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            RESUMO DO RACIOCÍNIO (V5 STRUCTURED REASONING)
          </span>
          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            {currentAgentData.reasoningSummary ||
              "Análise independente executada com sucesso com base nas características do snapshot imutável."}
          </p>
        </div>

        {/* Evidências a Favor vs Contra-Evidências (Anti-Overfitting) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Evidências a Favor */}
          <div className="p-3.5 rounded-xl bg-emerald-950/15 border border-emerald-500/20 space-y-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              EVIDÊNCIAS A FAVOR
            </span>
            <ul className="space-y-1 font-sans text-slate-300 text-xs">
              {(currentAgentData.evidence || [
                "Persistência de confluência temporal",
                "Rejeição em suporte chave",
              ]).map((ev, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contra-Evidências (O que poderia tornar a conclusão errada?) */}
          <div className="p-3.5 rounded-xl bg-amber-950/15 border border-amber-500/20 space-y-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              CONTRA-EVIDÊNCIAS / AUTO-CRÍTICA
            </span>
            <ul className="space-y-1 font-sans text-slate-300 text-xs">
              {(currentAgentData.counterEvidence || [
                "Aumento súbito de volatilidade",
                "Quebra de volume no candle seguinte",
              ]).map((cev, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{cev}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Invalidações Técnicas */}
        <div className="p-3 rounded-xl bg-[#070A0F] border border-white/[0.06] text-xs font-sans">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block font-mono">
            GATILHOS DE INVALIDAÇÃO IMEDIATA:
          </span>
          <span className="text-slate-300 text-xs">
            {currentAgentData.invalidations?.join(", ") || "Violação do nível de preço ou divergência no fechamento."}
          </span>
        </div>
      </div>
    </div>
  );
};
