// ==========================================================
// NEXORA VISION AI V12 PRO — ENTRY TIMER M1 + CONSENSO 4/4
// Real-time M1 Candle Closure Countdown & 4-AI Consensus Gate
// ==========================================================

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Activity,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
} from "lucide-react";
import { NexoraCoreDecision, MarketHealthStatus } from "../types.js";
import { formatSaoPauloTime, calculateM1CandleCountdown } from "../utils/timeZoneUtils.js";

export interface EntryTimerM1Props {
  asset: string;
  timeframe: string;
  marketHealth: MarketHealthStatus | null;
  decision: NexoraCoreDecision | null;
  isEvaluating: boolean;
  onTriggerAnalysis?: () => void;
  onExecutePaperTrade?: (direction: "PAR" | "IMPAR") => void;
}

export type CandleState = "ABERTA" | "FECHADA" | "DADOS INDISPONÍVEIS";

export const EntryTimerM1: React.FC<EntryTimerM1Props> = ({
  asset,
  timeframe,
  marketHealth,
  decision,
  isEvaluating,
  onTriggerAnalysis,
  onExecutePaperTrade,
}) => {
  // Feed status & validation: NEVER fake LIVE!
  const hasTick = Boolean(marketHealth?.lastTick?.timestamp);
  const isFeedLive = marketHealth?.status === "LIVE" && hasTick;
  const feedTimestamp = marketHealth?.lastTick?.timestamp;
  const nowMs = Date.now();
  const isFeedDelayed = Boolean(feedTimestamp && Math.abs(nowMs - feedTimestamp) > 60000);

  // Time state updated every second strictly from Date.now() clock
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return calculateM1CandleCountdown().secondsRemaining;
  });
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => formatSaoPauloTime());
  const [nextCloseStr, setNextCloseStr] = useState<string>("");
  const [candleState, setCandleState] = useState<CandleState>("ABERTA");

  // Track the last candle timestamp analyzed to prevent duplicate runs
  const lastAnalyzedCandleBucketRef = useRef<number>(0);
  const onTriggerRef = useRef(onTriggerAnalysis);
  useEffect(() => {
    onTriggerRef.current = onTriggerAnalysis;
  }, [onTriggerAnalysis]);

  useEffect(() => {
    // 1-second interval timer recalculated strictly from real clock
    const updateTimer = () => {
      const currentNow = Date.now();

      // Check feed availability and freshness
      if (!isFeedLive || isFeedDelayed || !feedTimestamp) {
        setCandleState("DADOS INDISPONÍVEIS");
        setCurrentTimeStr("CONTADOR NÃO VALIDADO");
        setNextCloseStr("--:--:--");
        setSecondsRemaining(0);
        return;
      }

      // Exact M1 candle calculation: strictly 60 seconds per bucket aligned to UTC minute
      const calc = calculateM1CandleCountdown(currentNow);
      setSecondsRemaining(calc.secondsRemaining);
      setCandleState(calc.candleState);

      // Formatted times strictly in America/Sao_Paulo (24h HH:mm:ss)
      setCurrentTimeStr(formatSaoPauloTime(currentNow));
      setNextCloseStr(formatSaoPauloTime(calc.nextBoundaryMs));

      // On confirmed candle close, trigger analysis once per candle bucket
      if (calc.secondsRemaining <= 1) {
        if (
          calc.startIntervalMs !== lastAnalyzedCandleBucketRef.current &&
          !isEvaluating &&
          onTriggerRef.current
        ) {
          lastAnalyzedCandleBucketRef.current = calc.startIntervalMs;
          onTriggerRef.current();
        }
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [isFeedLive, isFeedDelayed, feedTimestamp, isEvaluating]);

  // Format MM:SS strictly
  const formatCountdown = (totalSec: number) => {
    const clamped = Math.max(0, Math.min(60, totalSec));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 4 AI Responses Status
  const fourAIs = decision?.fourAIs;
  const resolveAgentDirection = (agentData: any): "aguardando" | "PAR" | "IMPAR" | "ERRO" => {
    if (isEvaluating) return "aguardando";
    if (!agentData) return "aguardando";
    if (agentData.status === "ERROR" || agentData.status === "MODEL ERROR" || agentData.status === "TIMEOUT") {
      return "ERRO";
    }
    if (agentData.direction === "PAR") return "PAR";
    if (agentData.direction === "IMPAR") return "IMPAR";
    if (agentData.direction === "WAIT") return "aguardando";
    return "aguardando";
  };

  const gptStatus = resolveAgentDirection(fourAIs?.gpt);
  const claudeStatus = resolveAgentDirection(fourAIs?.claude);
  const geminiStatus = resolveAgentDirection(fourAIs?.gemini);
  const grokStatus = resolveAgentDirection(fourAIs?.grok);

  // Consensus Validation Status
  const consensus = decision?.consensus;
  const isStrict4_4_Par =
    gptStatus === "PAR" &&
    claudeStatus === "PAR" &&
    geminiStatus === "PAR" &&
    grokStatus === "PAR";
  const isStrict4_4_Impar =
    gptStatus === "IMPAR" &&
    claudeStatus === "IMPAR" &&
    geminiStatus === "IMPAR" &&
    grokStatus === "IMPAR";
  const hasValid4_4 = isStrict4_4_Par || isStrict4_4_Impar;

  const agreementCount = [
    gptStatus === "PAR" || gptStatus === "IMPAR" ? 1 : 0,
    claudeStatus === "PAR" || claudeStatus === "IMPAR" ? 1 : 0,
    geminiStatus === "PAR" || geminiStatus === "IMPAR" ? 1 : 0,
    grokStatus === "PAR" || grokStatus === "IMPAR" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const consensusLabel = isEvaluating
    ? "--/4"
    : hasValid4_4
    ? isStrict4_4_Par
      ? "4/4 PAR"
      : "4/4 IMPAR"
    : `${agreementCount}/4`;

  // Decision & Flow Evaluation
  const lossGuard = decision?.lossGuard;
  const lossGuardPassed = lossGuard ? lossGuard.passed : true;
  const isExpired = Boolean(
    decision && Date.now() - decision.timestamp > 60000
  );

  let decisionText = "AGUARDANDO VALIDAÇÃO";
  let decisionBadgeClass = "bg-white/[0.05] text-slate-300 border-white/10";
  let canPaperTrade: "PAR" | "IMPAR" | null = null;

  if (!isFeedLive || isFeedDelayed) {
    decisionText = "NO TRADE — DADOS INDISPONÍVEIS";
    decisionBadgeClass = "bg-[#FF5570]/15 text-[#FF5570] border-[#FF5570]/30";
  } else if (isExpired) {
    decisionText = "SINAL EXPIRADO — AGUARDAR NOVA VELA";
    decisionBadgeClass = "bg-amber-500/15 text-amber-400 border-amber-500/30";
  } else if (isEvaluating) {
    decisionText = "ANALISANDO...";
    decisionBadgeClass = "bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30 animate-pulse";
  } else if (!hasValid4_4 && decision) {
    decisionText = "AGUARDAR — CONSENSO NÃO VALIDADO";
    decisionBadgeClass = "bg-amber-500/15 text-amber-400 border-amber-500/30";
  } else if (hasValid4_4 && !lossGuard) {
    decisionText = "CONSENSO 4/4 — AGUARDANDO LOSS GUARD";
    decisionBadgeClass = "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 animate-pulse";
  } else if (hasValid4_4 && !lossGuardPassed) {
    decisionText = `NO TRADE — ${lossGuard?.blockers?.[0] || "Loss Guard Bloqueou"}`;
    decisionBadgeClass = "bg-[#FF5570]/15 text-[#FF5570] border-[#FF5570]/30";
  } else if (hasValid4_4 && lossGuardPassed && (decision?.finalDecision === "PAR" || decision?.finalDecision === "IMPAR")) {
    decisionText = "POSSÍVEL SINAL PAPER";
    decisionBadgeClass =
      decision.finalDecision === "PAR"
        ? "bg-[#00D084]/20 text-[#00D084] border-[#00D084]/50 font-black animate-pulse"
        : "bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/50 font-black animate-pulse";
    canPaperTrade = decision.finalDecision;
  }

  const renderBadge = (dir: "aguardando" | "PAR" | "IMPAR" | "ERRO") => {
    switch (dir) {
      case "PAR":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40">PAR</span>;
      case "IMPAR":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40">IMPAR</span>;
      case "ERRO":
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#FF5570]/20 text-[#FF5570] border border-[#FF5570]/40">ERRO</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.05] text-slate-400 border border-white/10">aguardando</span>;
    }
  };

  return (
    <div className="bg-[#0D1220] border-2 border-[#22D3EE]/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 font-mono relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#22D3EE]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ================================================== */}
      {/* 1. HEADER: NEXORA ENTRY TIMER (M1 — ASSET) */}
      {/* ================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
            <Clock className={`w-4 h-4 ${isEvaluating ? "animate-spin" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                NEXORA ENTRY TIMER
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40">
                M1 — {asset}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Contador M1 em tempo real alinhado aos limites reais dos candles
            </p>
          </div>
        </div>

        {/* Estado da Vela Badge & Disparo Instantâneo */}
        <div className="flex items-center gap-2">
          {onTriggerAnalysis && (
            <button
              onClick={onTriggerAnalysis}
              disabled={isEvaluating}
              className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] border border-[#22D3EE]/40 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Disparar análise imediata do snapshot atual das 4 IAs"
            >
              <RefreshCw className={`w-3 h-3 ${isEvaluating ? "animate-spin" : ""}`} />
              <span>{isEvaluating ? "ANALISANDO..." : "BUSCAR AGORA"}</span>
            </button>
          )}

          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 border ${
              candleState === "ABERTA"
                ? "bg-[#00D084]/15 text-[#00D084] border-[#00D084]/30"
                : candleState === "FECHADA"
                ? "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 animate-pulse"
                : "bg-[#FF5570]/15 text-[#FF5570] border-[#FF5570]/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                candleState === "ABERTA"
                  ? "bg-[#00D084] animate-ping"
                  : candleState === "FECHADA"
                  ? "bg-[#8B5CF6]"
                  : "bg-[#FF5570]"
              }`}
            />
            {candleState === "ABERTA"
              ? "VELA ABERTA"
              : candleState === "FECHADA"
              ? "VELA FECHADA"
              : "DADOS INDISPONÍVEIS"}
          </span>
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. GRID PRINCIPAL: CONTAGEM MM:SS & HORÁRIOS */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Próximo Fechamento Countdown (MM:SS) */}
        <div className="bg-[#070912] p-3.5 rounded-xl border border-[#22D3EE]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>PRÓXIMO FECHAMENTO</span>
            <span className="text-[#22D3EE]">M1</span>
          </div>
          <div className="my-1.5">
            <span
              className={`text-3xl sm:text-4xl font-black tracking-widest font-mono drop-shadow ${
                secondsRemaining <= 5
                  ? "text-[#FF5570] animate-pulse"
                  : secondsRemaining <= 15
                  ? "text-amber-400"
                  : "text-[#22D3EE]"
              }`}
            >
              {isFeedLive && !isFeedDelayed ? formatCountdown(secondsRemaining) : "--:--"}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Fechamento previsto:</span>
            <span className="text-white font-bold">{nextCloseStr || "--:--:--"}</span>
          </div>
        </div>

        {/* Card 2: Horário Atual do Feed */}
        <div className="bg-[#070912] p-3.5 rounded-xl border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>HORÁRIO DO FEED</span>
            <Activity className="w-3.5 h-3.5 text-[#00D084]" />
          </div>
          <div className="my-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider">
              {currentTimeStr || "HORÁRIO NÃO VALIDADO"}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Timestamp sincronizado:</span>
            <span className={isFeedLive ? "text-[#00D084] font-bold" : "text-[#FF5570]"}>
              {isFeedLive ? "VALIDADO ● LIVE" : "NÃO SINCRONIZADO"}
            </span>
          </div>
        </div>

        {/* Card 3: Consenso Quórum 4 IAs */}
        <div className="bg-[#070912] p-3.5 rounded-xl border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>CONSENSO 4 IAS</span>
            <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
          </div>
          <div className="my-1.5">
            <span
              className={`text-xl sm:text-2xl font-black tracking-wider ${
                hasValid4_4
                  ? isStrict4_4_Par
                    ? "text-[#00D084]"
                    : "text-[#8B5CF6]"
                  : "text-slate-400"
              }`}
            >
              CONSENSO: {consensusLabel}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Regra de validação:</span>
            <span className="text-slate-400 font-bold">4/4 UNÂNIME EXIGIDO</span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 3. AS 4 IAS EM PARALELO (PROMISE.ALLSETTLED) */}
      {/* ================================================== */}
      <div className="bg-[#070912] p-3 rounded-xl border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase border-b border-white/[0.04] pb-1.5">
          <span>STATUS INDIVIDUAL DAS 4 IAS (MESMO SNAPSHOT ID)</span>
          <span className="text-slate-500">PROMISE.ALLSETTLED</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* GPT */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-white block">GPT</span>
              <span className="text-[9px] text-slate-500">OpenAI</span>
            </div>
            <div>{renderBadge(gptStatus)}</div>
          </div>

          {/* CLAUDE */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-white block">CLAUDE</span>
              <span className="text-[9px] text-slate-500">Anthropic</span>
            </div>
            <div>{renderBadge(claudeStatus)}</div>
          </div>

          {/* GEMINI */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-[#22D3EE]/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-white block">GEMINI</span>
              <span className="text-[9px] text-[#22D3EE]">Google</span>
            </div>
            <div>{renderBadge(geminiStatus)}</div>
          </div>

          {/* GROK */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-white block">GROK</span>
              <span className="text-[9px] text-slate-500">xAI</span>
            </div>
            <div>{renderBadge(grokStatus)}</div>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 4. DECISÃO FINAL: AVISO VISUAL ESPECIFICADO */}
      {/* ================================================== */}
      <div className="p-3.5 rounded-xl bg-[#070912] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">
            DECISÃO DO SISTEMA
          </span>
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${decisionBadgeClass}`}>
              {decisionText}
            </span>
            {lossGuard && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  lossGuard.passed
                    ? "text-[#00D084] bg-[#00D084]/10 border border-[#00D084]/20"
                    : "text-[#FF5570] bg-[#FF5570]/10 border border-[#FF5570]/20"
                }`}
              >
                LOSS GUARD: {lossGuard.passed ? "APROVADO" : "BLOQUEADO"}
              </span>
            )}
          </div>
        </div>

        {/* Action: Operar Paper Mode quando validado */}
        {canPaperTrade && onExecutePaperTrade && (
          <button
            onClick={() => onExecutePaperTrade(canPaperTrade!)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all ${
              canPaperTrade === "PAR"
                ? "bg-[#00D084] hover:bg-[#00D084]/90 text-slate-950 shadow-[#00D084]/30"
                : "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white shadow-[#8B5CF6]/30"
            }`}
          >
            {canPaperTrade === "PAR" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>EXECUTAR PAPER {canPaperTrade === "PAR" ? "PAR (COMPRA)" : "ÍMPAR (VENDA)"}</span>
          </button>
        )}
      </div>

      {/* ================================================== */}
      {/* 5. AVISO LEGAL E OPERACIONAL OBRIGATÓRIO */}
      {/* ================================================== */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>O contador indica o fechamento da vela; ele não garante uma entrada vencedora.</span>
        </div>
        <span className="font-bold text-[#00D084]">PAPER MODE ● ZERO EXECUÇÃO REAL</span>
      </div>
    </div>
  );
};
