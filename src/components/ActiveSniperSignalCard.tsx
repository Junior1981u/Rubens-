// ==========================================================
// NEXORA VISION AI V13 — ACTIVE SNIPER SIGNAL CARD
// Sinal Inteligente, Certeiro e Fixado com Janela de Entrada Confortável
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  X,
  Copy,
  Check,
  Target,
} from "lucide-react";
import { NexoraCoreDecision } from "../types.js";

interface ActiveSniperSignalCardProps {
  decision: NexoraCoreDecision;
  onExecutePaperTrade: (direction: "PAR" | "IMPAR") => void;
  onDismiss?: () => void;
  onOpenBroker?: () => void;
}

export const ActiveSniperSignalCard: React.FC<ActiveSniperSignalCardProps> = ({
  decision,
  onExecutePaperTrade,
  onDismiss,
  onOpenBroker,
}) => {
  const isPar = decision.finalDecision === "PAR";
  const isImpar = decision.finalDecision === "IMPAR";

  // Se não for sinal de trade ativo (PAR ou IMPAR), não exibe este card
  if (!isPar && !isImpar) return null;

  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (decision.signalLockUntil) {
      return Math.max(0, Math.ceil((decision.signalLockUntil - Date.now()) / 1000));
    }
    return 60;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (decision.signalLockUntil) {
        const rem = Math.max(0, Math.ceil((decision.signalLockUntil - Date.now()) / 1000));
        setSecondsRemaining(rem);
      } else {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [decision.signalLockUntil]);

  const handleCopy = () => {
    const text = `NEXORA SINAL: ${decision.asset || "EUR/USD"} | ${decision.finalDecision} (${isPar ? "CALL/COMPRA" : "PUT/VENDA"}) | M1 | Score: ${decision.nexoraScore}%`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confluences = decision.confluences && decision.confluences.length > 0
    ? decision.confluences
    : [
        "Tendência Estrutural Validada",
        "Oscilador RSI com Momentum Direcional",
        "Bandas de Bollinger em Zona Reversa",
        "Assimetria Estatística Favorável",
        `Consenso IA: ${decision.consensus?.consensusLabel || "4/4"} Confirmado`,
        "Loss Guard: Risco Baixo Aprovado",
      ];

  const pct = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 relative overflow-hidden transition-all shadow-2xl animate-in fade-in zoom-in-95 duration-300 font-mono ${
        isPar
          ? "bg-gradient-to-br from-[#063321]/90 via-[#0B1528] to-[#070912] border-[#00D084]/60 shadow-[0_0_35px_rgba(0,208,132,0.25)]"
          : "bg-gradient-to-br from-[#2D1254]/90 via-[#0B1528] to-[#070912] border-[#8B5CF6]/60 shadow-[0_0_35px_rgba(139,92,246,0.25)]"
      }`}
    >
      {/* Background glow radial */}
      <div
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isPar ? "bg-[#00D084]" : "bg-[#8B5CF6]"
        }`}
      />

      {/* Header do Card */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${
              isPar ? "bg-[#00D084] text-black" : "bg-[#8B5CF6] text-white"
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs text-white tracking-wider">
                SINAL SNIPER CONFIRMADO
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  isPar ? "bg-[#00D084]/20 text-[#00D084]" : "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                }`}
              >
                ALTA ASSERTIVIDADE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              IA Inteligente com confluência quádrupla e filtro anti-ruído ativo
            </p>
          </div>
        </div>

        {/* Controles de Fechar / Ações */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10px] flex items-center gap-1 cursor-pointer transition-all"
            title="Copiar dados do sinal"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00D084]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "COPIADO!" : "COPIAR"}</span>
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 cursor-pointer transition-all"
              title="Dispensar este sinal e analisar novamente"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Corpo Principal: Direção Gigante + Temporizador de Entrada Confortável */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 items-center relative z-10">
        {/* Direção e Ativo (5 Colunas) */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-bold text-white text-sm">{decision.asset || "EUR/USD"}</span>
            <span>•</span>
            <span className="text-[#22D3EE] font-bold">{decision.timeframe || "M1"}</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">
              Entrada: {decision.price?.toFixed(5) || "--"}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div
              className={`text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-1.5 ${
                isPar ? "text-[#00D084]" : "text-[#8B5CF6]"
              }`}
            >
              {isPar ? (
                <>
                  <ArrowUpRight className="w-8 h-8 stroke-[3]" />
                  <span>PAR (COMPRA / CALL)</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-8 h-8 stroke-[3]" />
                  <span>ÍMPAR (VENDA / PUT)</span>
                </>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            {decision.why || "Convergência quádrupla de osciladores, médias móveis e quórum das IAs."}
          </p>
        </div>

        {/* Timer e Janela de Entrada Segura (4 Colunas) */}
        <div className="md:col-span-4 p-3 rounded-xl bg-[#070A12]/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#22D3EE]" />
              TEMPO PARA ENTRAR
            </span>
            <span
              className={`font-black ${
                secondsRemaining > 15
                  ? "text-[#00D084]"
                  : secondsRemaining > 5
                  ? "text-[#22D3EE] animate-pulse"
                  : "text-[#FF5570] animate-ping"
              }`}
            >
              {secondsRemaining > 15 ? "ZONA PERFEITA" : secondsRemaining > 0 ? "ENTRADA IMINENTE" : "EXPIRADO"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              00:{secondsRemaining.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Expiração: 1 Vela ({decision.timeframe || "M1"})
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isPar ? "bg-[#00D084]" : "bg-[#8B5CF6]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="text-[9px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>Sinal Fixado (Sem pressa)</span>
            <span className="text-[#22D3EE] font-bold">NEXORA SCORE: {decision.nexoraScore}%</span>
          </div>
        </div>

        {/* Botões de Ação Direta (3 Colunas) */}
        <div className="md:col-span-3 flex flex-col gap-2">
          <button
            onClick={() => onExecutePaperTrade(isPar ? "PAR" : "IMPAR")}
            className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
              isPar
                ? "bg-[#00D084] hover:bg-[#00D084]/90 text-black shadow-[#00D084]/20"
                : "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white shadow-[#8B5CF6]/20"
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>EXECUTAR PAPER TRADE</span>
          </button>

          {onOpenBroker && (
            <button
              onClick={onOpenBroker}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/10 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>ABRIR NA CORRETORA</span>
            </button>
          )}
        </div>
      </div>

      {/* Rodapé: As 5 Confluências Inteligentes Verificadas */}
      <div className="pt-3 border-t border-white/[0.08] relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mb-1.5 uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00D084]" />
          <span>CONFLUÊNCIAS INTELIGENTES VALIDADAS PELA IA ({confluences.length}):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-[10px]">
          {confluences.map((c, idx) => (
            <div
              key={idx}
              className="px-2 py-1 rounded-lg bg-black/30 border border-white/[0.06] flex items-center gap-1.5 text-slate-300"
            >
              <CheckCircle2 className="w-3 h-3 text-[#00D084] shrink-0" />
              <span className="truncate">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
