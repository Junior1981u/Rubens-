import React, { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Key,
  ShieldAlert,
  WifiOff,
  Sparkles,
  Server,
  Zap,
  Info,
} from "lucide-react";

export type AIStatusType =
  | "ONLINE"
  | "OFFLINE"
  | "API KEY AUSENTE"
  | "ERRO DE AUTENTICAÇÃO"
  | "ERRO DE MODELO"
  | "ERRO DE QUOTA"
  | "TIMEOUT"
  | "ERRO DESCONHECIDO"
  | "PENDENTE";

export interface IAHealthDetail {
  id: "gpt" | "claude" | "gemini" | "grok";
  name: string;
  provider: string;
  model: string;
  status: AIStatusType;
  latencyMs: number;
  error?: string;
  responseSample?: string;
  testedAt?: number;
  role: string;
}

export const AIHealthScreen: React.FC = () => {
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [testingIndividual, setTestingIndividual] = useState<string | null>(null);
  const [lastTestTimestamp, setLastTestTimestamp] = useState<number | null>(null);

  const [aiData, setAiData] = useState<Record<"gpt" | "claude" | "gemini" | "grok", IAHealthDetail>>({
    gpt: {
      id: "gpt",
      name: "GPT",
      provider: "OpenAI",
      model: "gpt-4o-mini",
      status: "PENDENTE",
      latencyMs: 0,
      role: "Pattern Analyst",
    },
    claude: {
      id: "claude",
      name: "CLAUDE",
      provider: "Anthropic",
      model: "claude-3-5-haiku-20241022",
      status: "PENDENTE",
      latencyMs: 0,
      role: "Risk Critic",
    },
    gemini: {
      id: "gemini",
      name: "GEMINI",
      provider: "Google",
      model: "gemini-3.1-flash-lite",
      status: "PENDENTE",
      latencyMs: 0,
      role: "Technical Analyst",
    },
    grok: {
      id: "grok",
      name: "GROK",
      provider: "xAI",
      model: "grok-2-latest",
      status: "PENDENTE",
      latencyMs: 0,
      role: "Independent Analyst",
    },
  });

  // Função para executar teste nas 4 IAs em paralelo via chamada real
  const handleTestAll = async () => {
    setIsTestingAll(true);
    try {
      const res = await fetch("/api/ai-health/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.details) {
          setAiData((prev) => ({
            gpt: { ...prev.gpt, ...json.details.gpt },
            claude: { ...prev.claude, ...json.details.claude },
            gemini: { ...prev.gemini, ...json.details.gemini },
            grok: { ...prev.grok, ...json.details.grok },
          }));
          setLastTestTimestamp(Date.now());
        }
      }
    } catch (err: any) {
      console.error("Falha ao testar 4 IAs:", err);
    } finally {
      setIsTestingAll(false);
    }
  };

  // Função para testar uma IA individualmente
  const handleTestSingle = async (agent: "gpt" | "claude" | "gemini" | "grok") => {
    setTestingIndividual(agent);
    try {
      const res = await fetch(`/api/ai-health/test/${agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          setAiData((prev) => ({
            ...prev,
            [agent]: { ...prev[agent], ...json.result },
          }));
        }
      }
    } catch (err: any) {
      console.error(`Falha ao testar ${agent}:`, err);
    } finally {
      setTestingIndividual(null);
    }
  };

  // Busca inicial do diagnóstico do backend ao carregar
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/ai-health");
        if (res.ok) {
          const summary = await res.json();
          setAiData((prev) => ({
            gpt: { ...prev.gpt, ...summary.gpt },
            claude: { ...prev.claude, ...summary.claude },
            gemini: { ...prev.gemini, ...summary.gemini },
            grok: { ...prev.grok, ...summary.grok },
          }));
        }
      } catch (err) {
        // Silencioso
      }
    };
    fetchInitial();
  }, []);

  // Helper para renderizar badge de status estrito
  const renderStatusBadge = (status: AIStatusType) => {
    switch (status) {
      case "ONLINE":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ONLINE
          </span>
        );
      case "API KEY AUSENTE":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            API KEY AUSENTE
          </span>
        );
      case "ERRO DE AUTENTICAÇÃO":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            ERRO DE AUTENTICAÇÃO
          </span>
        );
      case "ERRO DE MODELO":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            ERRO DE MODELO
          </span>
        );
      case "ERRO DE QUOTA":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            ERRO DE QUOTA
          </span>
        );
      case "TIMEOUT":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            TIMEOUT
          </span>
        );
      case "OFFLINE":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5" />
            OFFLINE
          </span>
        );
      case "PENDENTE":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            PENDENTE DE TESTE
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-500/30 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            ERRO DESCONHECIDO
          </span>
        );
    }
  };

  const onlineCount = Object.values(aiData).filter((a) => a.status === "ONLINE").length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-3 sm:py-5 font-mono">
      {/* 1. Header Principal: AI HEALTH */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3DA5FF]" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                DIAGNÓSTICO REAL DE CONECTIVIDADE
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              AI HEALTH — 4 IAs NEXORA TRADER
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-2xl">
              Teste individual e em paralelo das quatro inteligências artificiais. Chamadas reais ao servidor sem dados simulados.
            </p>
          </div>

          {/* Botão Master: TESTAR AS 4 IAs */}
          <button
            onClick={handleTestAll}
            disabled={isTestingAll}
            className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all active:scale-95 shadow-xl font-sans ${
              isTestingAll
                ? "bg-slate-800 text-slate-400 cursor-wait border border-white/[0.08]"
                : "bg-gradient-to-r from-emerald-500 to-[#3DA5FF] text-white hover:brightness-110 shadow-emerald-500/25 ring-1 ring-white/20"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isTestingAll ? "animate-spin" : ""}`} />
            <span>{isTestingAll ? "TESTANDO AS 4 IAs..." : "TESTAR AS 4 IAs"}</span>
          </button>
        </div>

        {/* Resumo Rápido da Conexão */}
        <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold">STATUS DO QUÓRUM:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                onlineCount === 4
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : onlineCount > 0
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {onlineCount} / 4 IAs ONLINE
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            {lastTestTimestamp
              ? `Último teste concluído às ${new Date(lastTestTimestamp).toLocaleTimeString()}`
              : "Clique em 'TESTAR AS 4 IAs' para disparar diagnóstico em tempo real"}
          </div>
        </div>
      </div>

      {/* 2. Aviso de Integridade: Respostas 100% Reais */}
      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-[#3DA5FF]/30 flex items-center justify-between gap-3 text-xs text-slate-300 font-sans">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#3DA5FF] flex-shrink-0" />
          <span>
            <strong>Conexão Segura & Isolada:</strong> As chaves são protegidas no servidor. Se uma IA estiver ausente ou falhar, as outras três continuam operando de forma autônoma sem travar o sistema.
          </span>
        </div>
      </div>

      {/* 3. Cards Individuais das 4 IAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["gpt", "claude", "gemini", "grok"] as const).map((agentKey) => {
          const ai = aiData[agentKey];
          const isTestingThis = testingIndividual === agentKey || isTestingAll;
          const isOnline = ai.status === "ONLINE";

          return (
            <div
              key={ai.id}
              className={`bg-[#0B0F17] rounded-2xl p-5 border transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden ${
                isOnline
                  ? "border-emerald-500/40 ring-1 ring-emerald-500/20 bg-gradient-to-b from-[#0B0F17] to-emerald-950/10"
                  : ai.status === "PENDENTE"
                  ? "border-white/[0.08]"
                  : "border-rose-500/30 bg-gradient-to-b from-[#0B0F17] to-rose-950/10"
              }`}
            >
              {/* Header do Card */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border ${
                        isOnline
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-[#101720] border-white/[0.08] text-slate-300"
                      }`}
                    >
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        <span>{ai.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-white/[0.06] text-slate-400 font-bold">
                          {ai.role}
                        </span>
                      </h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                        <span>Provedor: <strong className="text-slate-200">{ai.provider}</strong></span>
                        <span>•</span>
                        <span>Modelo: <strong className="text-slate-200">{ai.model}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>{renderStatusBadge(ai.status)}</div>
                </div>

                {/* Métricas: Tempo de Resposta / Latência */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-xs">
                  <div className="p-2.5 rounded-xl bg-[#070A0F] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 block uppercase">TEMPO DE RESPOSTA</span>
                    <strong
                      className={`text-sm block pt-0.5 ${
                        ai.latencyMs > 0 ? (ai.latencyMs < 500 ? "text-emerald-400" : "text-amber-400") : "text-slate-400"
                      }`}
                    >
                      {ai.latencyMs > 0 ? `${ai.latencyMs}ms` : "—"}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#070A0F] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 block uppercase">ÚLTIMO TESTE</span>
                    <span className="text-xs text-slate-300 block pt-0.5">
                      {ai.testedAt ? new Date(ai.testedAt).toLocaleTimeString() : "Não testado"}
                    </span>
                  </div>
                </div>

                {/* Resposta do Provedor (Se Online) */}
                {ai.responseSample && (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs font-sans space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono block">
                      RESPOSTA CONFIRMADA DO SERVIDOR:
                    </span>
                    <p className="text-slate-200 text-xs italic line-clamp-2">
                      &quot;{ai.responseSample}&quot;
                    </p>
                  </div>
                )}

                {/* Mensagem de Erro (Se Houver) */}
                {ai.error && (
                  <div className="p-3 rounded-xl bg-rose-950/25 border border-rose-500/30 text-xs font-sans space-y-1">
                    <span className="text-[10px] text-rose-400 font-bold uppercase font-mono block">
                      DIAGNÓSTICO DO ERRO:
                    </span>
                    <p className="text-rose-200 text-xs leading-relaxed line-clamp-3 font-mono">
                      {ai.error}
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de Teste Individual */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTestSingle(agentKey)}
                  disabled={isTestingThis}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-sans ${
                    isTestingThis
                      ? "bg-slate-800 text-slate-400 cursor-wait"
                      : "bg-[#151D27] hover:bg-[#1E2836] text-white border border-white/[0.08] hover:border-white/[0.2]"
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingThis ? "animate-spin text-[#3DA5FF]" : ""}`} />
                  <span>{isTestingThis ? `TESTANDO ${ai.name}...` : `TESTAR ${ai.name} INDIVIDUALMENTE`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Resumo de Endpoint da API para Desenvolvedores / Verificação */}
      <div className="p-4 rounded-2xl bg-[#0B0F17] border border-white/[0.08] space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
          <span className="text-slate-400 font-bold">API ENDPOINT: GET /api/ai-health</span>
          <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
        </div>
        <p className="text-[11px] text-slate-400 font-sans">
          Endpoint REST disponível para integração de monitoramento. Retorna a latência exata e o status de cada IA individualmente em formato JSON estruturado.
        </p>
      </div>
    </div>
  );
};
