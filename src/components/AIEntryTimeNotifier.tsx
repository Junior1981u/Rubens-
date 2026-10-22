// ==========================================================
// NEXORA VISION AI V12 PRO — AI ENTRY TIME NOTIFIER
// Sistema Oficial de Alerta no Horário de Entrada (Voz + Som + Visual)
// Atende diretamente: "arruma o horário de entrada, quero que a minha IA me avisa horário 7 de entrada quando dá o horário de entrada ela me avisa"
// ==========================================================

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  BellRing,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings,
} from "lucide-react";
import {
  formatSaoPauloTime,
  calculateM1CandleCountdown,
  calculateEntryWindow,
  parseTargetClockToTimestamp,
  IANA_TIMEZONE_BR,
} from "../utils/timeZoneUtils.js";

export interface AIEntryTimeNotifierProps {
  asset: string;
  timeframe: string;
  direction?: "PAR" | "IMPAR" | "WAIT" | "NO TRADE" | null;
  entryTimeStr?: string;
  onExecuteTrade?: () => void;
}

export const AIEntryTimeNotifier: React.FC<AIEntryTimeNotifierProps> = ({
  asset = "EUR/USD",
  timeframe = "M1",
  direction = null,
  entryTimeStr: propEntryTimeStr,
  onExecuteTrade,
}) => {
  // Modo de alerta selecionado:
  // "CANDLE_NEXT": Virada da próxima vela M1 (:00)
  // "TARGET_7": Horário 7 (07:00:00 da manhã de Brasília)
  // "CUSTOM": Horário customizado
  const [mode, setMode] = useState<"TARGET_7" | "CANDLE_NEXT" | "CUSTOM">(() => {
    try {
      const saved = localStorage.getItem("nexora_entry_mode");
      if (saved === "TARGET_7" || saved === "CANDLE_NEXT" || saved === "CUSTOM") return saved;
    } catch {}
    return "TARGET_7"; // Padrão focado no pedido do usuário: Horário 7 de entrada!
  });

  const [customTime, setCustomTime] = useState<string>("07:00:00");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("nexora_sound_alert") !== "false";
    } catch {
      return true;
    }
  });
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("nexora_voice_alert") !== "false";
    } catch {
      return true;
    }
  });

  // Estado do relógio oficial ao vivo em America/Sao_Paulo
  const [liveClock, setLiveClock] = useState<string>(() => formatSaoPauloTime());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isEntryNow, setIsEntryNow] = useState<boolean>(false);
  const [isPreAlert7s, setIsPreAlert7s] = useState<boolean>(false);
  const [activeEntryTimeDisplay, setActiveEntryTimeDisplay] = useState<string>("07:00:00");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const lastAlertKeyRef = useRef<string>("");
  const lastPreAlertKeyRef = useRef<string>("");

  // Sintetizador nativo Web Audio API (Tríade ascendente de alta nitidez)
  const playAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12); // E6
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.24); // A6

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  // Síntese de Voz Nativa em Português
  const speakText = (text: string) => {
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = 1.15;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Atualização contínua a cada segundo ancorada estritamente em Date.now() e America/Sao_Paulo
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const spTime = formatSaoPauloTime(now);
      setLiveClock(spTime);

      let targetTimeStr = "07:00:00";
      let diffSec = 0;
      let entering = false;
      let preAlert = false;
      let alertKey = "";

      if (mode === "TARGET_7") {
        targetTimeStr = "07:00:00";
        const res = parseTargetClockToTimestamp("07:00:00", now);
        diffSec = res.diffSeconds;
        preAlert = diffSec > 0 && diffSec <= 7;
        entering = res.isDueNow;
        alertKey = `target-7-${Math.floor(res.targetTimestampMs / 60000)}`;
      } else if (mode === "CUSTOM") {
        targetTimeStr = customTime;
        const res = parseTargetClockToTimestamp(customTime, now);
        diffSec = res.diffSeconds;
        preAlert = diffSec > 0 && diffSec <= 7;
        entering = res.isDueNow;
        alertKey = `custom-${customTime}-${Math.floor(res.targetTimestampMs / 60000)}`;
      } else {
        // CANDLE_NEXT: virada da próxima vela M1 (:00)
        const windowCalc = calculateEntryWindow(now, timeframe);
        targetTimeStr = windowCalc.entryTimeStr;
        diffSec = windowCalc.secondsUntilEntry;
        preAlert = windowCalc.isPreAlert7s;
        entering = windowCalc.isEnteringNow;
        alertKey = `candle-${windowCalc.entryTimestampMs}`;
      }

      setActiveEntryTimeDisplay(targetTimeStr);
      setSecondsRemaining(diffSec);
      setIsPreAlert7s(preAlert);
      setIsEntryNow(entering);

      // 1. DISPARO DO PRÉ-ALERTA DOS 7 SEGUNDOS
      if (preAlert && lastPreAlertKeyRef.current !== alertKey) {
        lastPreAlertKeyRef.current = alertKey;
        if (voiceEnabled) {
          speakText(`Atenção! Faltam 7 segundos para o Horário de Entrada!`);
        }
      }

      // 2. DISPARO PRINCIPAL: QUANDO DÁ O HORÁRIO DE ENTRADA EXATO!
      if (entering && lastAlertKeyRef.current !== alertKey) {
        lastAlertKeyRef.current = alertKey;

        if (soundEnabled) {
          playAudioChime();
        }

        if (voiceEnabled) {
          const dirSpeech =
            direction === "PAR"
              ? "Ordem de Compra"
              : direction === "IMPAR"
              ? "Ordem de Venda"
              : "Operação confirmada";
          
          if (mode === "TARGET_7") {
            speakText(`Atenção! Horário 7 de entrada atingido! São exatamente 7 horas no horário de Brasília! A IA Nexora está alertando para sua entrada agora!`);
          } else {
            speakText(`Atenção! Horário de entrada atingido às ${targetTimeStr}! ${dirSpeech} no ${asset}!`);
          }
        }

        if ("vibrate" in navigator) {
          navigator.vibrate([250, 100, 250, 100, 400]);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [mode, customTime, timeframe, asset, direction, soundEnabled, voiceEnabled]);

  const selectMode = (newMode: "TARGET_7" | "CANDLE_NEXT" | "CUSTOM") => {
    setMode(newMode);
    try {
      localStorage.setItem("nexora_entry_mode", newMode);
    } catch {}
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nexora_sound_alert", String(next));
      } catch {}
      if (next) playAudioChime();
      return next;
    });
  };

  const toggleVoice = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nexora_voice_alert", String(next));
      } catch {}
      if (next) speakText("Avisos de voz da IA Nexora ativados!");
      return next;
    });
  };

  // Teste interativo para o usuário ouvir a voz da IA avisando o horário 7
  const triggerManualTest = () => {
    setIsTesting(true);
    playAudioChime();
    const targetLabel = mode === "TARGET_7" ? "Horário 7 de Entrada (07:00:00)" : activeEntryTimeDisplay;
    speakText(`Aviso da IA Nexora: Horário de entrada atingido às ${targetLabel}! Prepare sua operação no ${asset}!`);
    if ("vibrate" in navigator) {
      navigator.vibrate([150, 80, 150]);
    }
    setTimeout(() => setIsTesting(false), 3500);
  };

  // Formatação amigável do tempo restante
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-[#0D1220]/95 border-2 border-[#22D3EE]/40 rounded-2xl p-3 sm:p-4 shadow-2xl relative overflow-hidden font-mono text-xs">
      {/* Glow de fundo */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

      {/* ================================================== */}
      {/* 1. BANNER DE ALARME ATIVO: QUANDO DÁ O HORÁRIO DE ENTRADA */}
      {/* ================================================== */}
      {isEntryNow && (
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/30 via-[#22D3EE]/25 to-emerald-500/30 border-2 border-emerald-400 text-white animate-pulse shadow-[0_0_35px_rgba(0,208,132,0.5)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-sm font-black tracking-wide text-white block">
                🚨 HORÁRIO DE ENTRADA ATINGIDO! ENTRAR AGORA!
              </span>
              <span className="text-[11px] text-emerald-200 font-bold block">
                Horário oficial de Brasília: {liveClock} • Operação em andamento!
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-400 text-slate-950 font-black text-xs shrink-0">
            AGORA :00
          </span>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. PRÉ-AVISO DOS 7 SEGUNDOS */}
      {/* ================================================== */}
      {!isEntryNow && isPreAlert7s && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 animate-pulse flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className="font-black text-xs text-white">
              PREPARE-SE: Faltam {secondsRemaining}s para o Horário de Entrada!
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
            {secondsRemaining}s
          </span>
        </div>
      )}

      {/* ================================================== */}
      {/* 3. CABEÇALHO DO MONITOR: TÍTULO + CONTROLES DE SOM/VOZ */}
      {/* ================================================== */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 relative z-10 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#22D3EE]/20 border border-[#22D3EE]/50 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
              <span>AVISO DA IA NO HORÁRIO DE ENTRADA</span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40">
                AO VIVO
              </span>
            </h3>
            <p className="text-[9px] text-slate-400 font-sans">
              A IA avisa com voz alta e som exatamente quando o horário for atingido
            </p>
          </div>
        </div>

        {/* Botão de Teste + Botões de Som & Voz */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={triggerManualTest}
            disabled={isTesting}
            className={`px-2 py-1 rounded-lg border text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              isTesting
                ? "bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse"
                : "bg-white/10 hover:bg-emerald-500/20 text-emerald-300 border-white/20 hover:border-emerald-400"
            }`}
            title="Testar aviso sonoro e voz da IA agora"
          >
            <BellRing className={`w-3 h-3 ${isTesting ? "animate-bounce" : ""}`} />
            <span>{isTesting ? "AVISANDO..." : "TESTAR AVISO"}</span>
          </button>

          <button
            onClick={toggleSound}
            className={`p-1 rounded-lg border transition-all cursor-pointer ${
              soundEnabled
                ? "bg-[#22D3EE]/20 border-[#22D3EE]/40 text-[#22D3EE]"
                : "bg-white/5 border-white/10 text-slate-500"
            }`}
            title={soundEnabled ? "Som Ativado" : "Som Silenciado"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleVoice}
            className={`px-1.5 py-1 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
              voiceEnabled
                ? "bg-[#00D084]/20 border-[#00D084]/40 text-[#00D084]"
                : "bg-white/5 border-white/10 text-slate-500"
            }`}
            title={voiceEnabled ? "Aviso por Voz Ativo" : "Aviso por Voz Desativado"}
          >
            {voiceEnabled ? "🗣️ VOZ ON" : "🤐 VOZ OFF"}
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* 4. SELETOR DE MODO: HORÁRIO 7 (07:00:00) vs PRÓXIMA VELA (:00) */}
      {/* ================================================== */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 relative z-10">
        <button
          onClick={() => selectMode("TARGET_7")}
          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
            mode === "TARGET_7"
              ? "bg-[#22D3EE]/20 border-[#22D3EE] text-white shadow-md shadow-[#22D3EE]/20"
              : "bg-[#070912] border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <span className="block text-[8px] text-[#22D3EE] font-black">SOLICITADO</span>
          <span className="block text-[11px] font-black text-white mt-0.5">⏰ HORÁRIO 7 (07:00)</span>
          <span className="block text-[8px] text-slate-400 mt-0.5">Sessão das 7h BRT</span>
        </button>

        <button
          onClick={() => selectMode("CANDLE_NEXT")}
          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
            mode === "CANDLE_NEXT"
              ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20"
              : "bg-[#070912] border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <span className="block text-[8px] text-[#8B5CF6] font-black">AUTOMÁTICO</span>
          <span className="block text-[11px] font-black text-white mt-0.5">⚡ PRÓXIMA VELA (:00)</span>
          <span className="block text-[8px] text-slate-400 mt-0.5">Vela a vela em M1</span>
        </button>

        <button
          onClick={() => selectMode("CUSTOM")}
          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
            mode === "CUSTOM"
              ? "bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20"
              : "bg-[#070912] border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <span className="block text-[8px] text-emerald-400 font-black">MANUAL</span>
          <span className="block text-[11px] font-black text-white mt-0.5">🎯 PERSONALIZADO</span>
          <span className="block text-[8px] text-slate-400 mt-0.5">Escolher horário</span>
        </button>
      </div>

      {/* Input de horário personalizado se selecionado */}
      {mode === "CUSTOM" && (
        <div className="mt-2 p-2 rounded-xl bg-[#070912] border border-white/10 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 font-bold">DIGITE O HORÁRIO (HH:mm:ss):</span>
          <input
            type="text"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            placeholder="07:00:00"
            className="w-24 px-2 py-1 rounded bg-black/60 border border-white/20 text-center font-mono text-xs text-white font-black focus:outline-none focus:border-[#22D3EE]"
          />
        </div>
      )}

      {/* ================================================== */}
      {/* 5. PAINEL DE MONITORAMENTO: HORÁRIO ALVO + RELÓGIO + CONTAGEM */}
      {/* ================================================== */}
      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 relative z-10 text-[10px]">
        {/* Card 1: Horário Programado de Entrada */}
        <div className="p-2.5 rounded-xl bg-[#070912] border border-[#22D3EE]/50 shadow-md">
          <span className="text-[#22D3EE] font-black text-[9px] block flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> HORÁRIO DE ENTRADA
          </span>
          <div className="font-mono font-black text-white text-base mt-1 tracking-wider">
            {activeEntryTimeDisplay}
          </div>
          <span className="text-[8px] text-slate-400 block mt-0.5">
            Horário de Brasília (BRT)
          </span>
        </div>

        {/* Card 2: Relógio Oficial ao Vivo */}
        <div className="p-2.5 rounded-xl bg-[#070912] border border-white/10">
          <span className="text-[#00D084] font-black text-[9px] block flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> RELÓGIO OFICIAL AO VIVO
          </span>
          <div className="font-mono font-black text-[#00D084] text-base mt-1 tracking-wider">
            {liveClock}
          </div>
          <span className="text-[8px] text-slate-400 block mt-0.5">
            America/Sao_Paulo (24h)
          </span>
        </div>

        {/* Card 3: Contagem Regressiva para o Alarme da IA */}
        <div className="p-2.5 rounded-xl bg-[#070912] border border-white/10">
          <span className="text-amber-300 font-black text-[9px] block flex items-center gap-1">
            <BellRing className="w-2.5 h-2.5" /> TEMPO PARA O AVISO
          </span>
          <div
            className={`font-mono font-black text-base mt-1 tracking-wider ${
              secondsRemaining <= 7 ? "text-amber-400 animate-pulse" : "text-white"
            }`}
          >
            {formatCountdown(secondsRemaining)}
          </div>
          <span className="text-[8px] text-slate-400 block mt-0.5">
            {secondsRemaining <= 7 ? "⚠️ Aviso Iminente (7s)" : "IA Monitorando em segundo plano"}
          </span>
        </div>
      </div>

      {/* ================================================== */}
      {/* 6. STATUS E MENSAGEM EXPLICATIVA */}
      {/* ================================================== */}
      <div className="mt-2.5 p-2 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-[9px] text-slate-300 relative z-10 flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00D084] shrink-0" />
          <span>
            {mode === "TARGET_7"
              ? "A IA avisará você às 07:00:00 com voz e som no horário de entrada!"
              : mode === "CANDLE_NEXT"
              ? `A IA avisará a cada virada de vela M1 (${activeEntryTimeDisplay}) no segundo :00!`
              : `A IA avisará no horário programado ${activeEntryTimeDisplay}!`}
          </span>
        </div>
        <span className="text-[#22D3EE] font-bold">100% SINCRONIZADO</span>
      </div>
    </div>
  );
};
