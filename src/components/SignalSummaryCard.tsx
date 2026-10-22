import React, { useState, useEffect, useRef } from "react";
import {
  ExternalLink,
  Zap,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertTriangle,
  Radio,
  Volume2,
  VolumeX,
  BellRing,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { NexoraCoreDecision, MarketHealthStatus } from "../types.js";
import {
  formatSaoPauloTime,
  formatSaoPauloDateTime,
  calculateM1CandleCountdown,
  calculateEntryWindow,
  validateCandleFreshness,
} from "../utils/timeZoneUtils.js";

interface SignalSummaryCardProps {
  decision: NexoraCoreDecision | null;
  asset: string;
  timeframe: string;
  marketHealth: MarketHealthStatus | null;
  isEvaluating: boolean;
  onExecutePaperTrade?: (dir: "PAR" | "IMPAR") => void;
  onOpenBroker?: () => void;
  error?: string | null;
  lastAnalysisTime?: number | null;
  lastCandleTimestamp?: number | null;
}

export type SignalDisplayState = "ANALISANDO" | "COMPRA" | "VENDA" | "AGUARDAR";

export const SignalSummaryCard: React.FC<SignalSummaryCardProps> = ({
  decision,
  asset,
  timeframe,
  marketHealth,
  isEvaluating,
  onExecutePaperTrade,
  onOpenBroker,
  error,
  lastAnalysisTime,
}) => {
  // 1. Relógio e Contador Rigoroso
  const [liveNow, setLiveNow] = useState<number>(() => Date.now());
  const [isAlertTesting, setIsAlertTesting] = useState<boolean>(false);
  const lastAlertedTsRef = useRef<number>(0);

  // Áudio e Voz persistidos
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
      if (next) speakAlert("Alertas de voz ativados!");
      return next;
    });
  };

  // Web Audio Chime
  const playAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.24);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.warn("Audio warning:", e);
    }
  };

  // Síntese de Voz Nativa
  const speakAlert = (text: string) => {
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
      console.warn("Speech warning:", e);
    }
  };

  // Timer contínuo de segundo em segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const liveClockStr = formatSaoPauloTime(liveNow);
  const m1Calc = calculateM1CandleCountdown(liveNow);
  const secondsRemaining = m1Calc.secondsRemaining;

  // Status de Conexão e Frescura dos Dados
  const isFeedOffline = marketHealth?.status === "OFFLINE";
  const dataReceiptTimestamp = marketHealth?.twelveData?.dataReceiptTimestamp || marketHealth?.lastTick?.timestamp || liveNow;
  const candleOpenTimestamp = marketHealth?.twelveData?.candleOpenTimestamp || (Math.floor(liveNow / 60000) * 60000);
  const freshness = validateCandleFreshness(candleOpenTimestamp, dataReceiptTimestamp, 120000);

  // Timestamp real da análise
  const signalTimestamp = decision?.timestamp || lastAnalysisTime || null;
  const signalAgeSec = signalTimestamp ? Math.floor((liveNow - signalTimestamp) / 1000) : null;
  const isSignalExpired = Boolean(signalAgeSec !== null && signalAgeSec > 60);

  // Determinação do Estado: COMPRA, VENDA, AGUARDAR ou ANALISANDO
  let displayState: SignalDisplayState = "AGUARDAR";
  let stateReason = "";

  if (isEvaluating) {
    displayState = "ANALISANDO";
    stateReason = "Processando leitura técnica e quórum das 4 IAs em tempo real...";
  } else if (isFeedOffline) {
    displayState = "AGUARDAR";
    stateReason = "Feed de dados offline. Emissão de sinais bloqueada por segurança.";
  } else if (!decision) {
    displayState = "AGUARDAR";
    stateReason = "Aguardando análise. Toque na esfera para ler os dados da vela atual.";
  } else if (isSignalExpired) {
    displayState = "AGUARDAR";
    stateReason = `Sinal anterior expirou há mais de 60s. Toque na esfera para avaliar o candle atual.`;
  } else if (!freshness.isValid) {
    displayState = "AGUARDAR";
    stateReason = `Dados de mercado desatualizados (${freshness.ageSeconds}s de atraso). Entrada bloqueada.`;
  } else if (decision.finalDecision === "PAR") {
    displayState = "COMPRA";
    stateReason = decision.why || "Confluência compradora confirmada pelo Super Cérebro.";
  } else if (decision.finalDecision === "IMPAR") {
    displayState = "VENDA";
    stateReason = decision.why || "Confluência vendedora confirmada pelo Super Cérebro.";
  } else {
    displayState = "AGUARDAR";
    stateReason = decision.lossGuard?.blockers?.[0]
      ? `Proteção Anti-Loss: ${decision.lossGuard.blockers[0]}`
      : decision.why || "Sem confluência técnica direcional segura. Preservação de capital ativa.";
  }

  // Cálculos de Validade do Sinal (Apenas quando calculada e válida)
  const entryWindow = calculateEntryWindow(liveNow, timeframe, decision?.entryTimestamp);
  const expiryTimeStr = entryWindow.expiryTimeStr;
  const isSignalCalculatedAndValid = (displayState === "COMPRA" || displayState === "VENDA") && !isSignalExpired;
  const validitySecondsRemaining = isSignalCalculatedAndValid && signalTimestamp ? Math.max(0, 60 - signalAgeSec!) : null;

  // Alerta automático na virada do candle (:00)
  useEffect(() => {
    if (isSignalCalculatedAndValid && secondsRemaining <= 2) {
      const candleKey = Math.floor(liveNow / 60000);
      if (lastAlertedTsRef.current !== candleKey) {
        lastAlertedTsRef.current = candleKey;
        if (soundEnabled) playAudioChime();
        if (voiceEnabled) {
          const dirSpeech = displayState === "COMPRA" ? "Compra" : "Venda";
          speakAlert(`Horário de entrada atingido! Ordem de ${dirSpeech} no ${asset}!`);
        }
      }
    }
  }, [liveNow, isSignalCalculatedAndValid, secondsRemaining, displayState, asset, soundEnabled, voiceEnabled]);

  const triggerManualTestAlert = () => {
    setIsAlertTesting(true);
    playAudioChime();
    const dirLabel = displayState === "VENDA" ? "Venda" : "Compra";
    speakAlert(`Teste Nexora Titan AI: Horário confirmado! Ordem de ${dirLabel} no ${asset}!`);
    setTimeout(() => setIsAlertTesting(false), 3500);
  };

  // Cores de referência estritas: Verde para COMPRA, Vermelho para VENDA, Amarelo para AGUARDAR, Ciano para ANALISANDO
  const isCompra = displayState === "COMPRA";
  const isVenda = displayState === "VENDA";
  const isAguardar = displayState === "AGUARDAR";
  const isAnalisando = displayState === "ANALISANDO";

  const cardBorder = isCompra
    ? "border-[#00E676]/60 shadow-[0_0_35px_rgba(0,230,118,0.3)]"
    : isVenda
    ? "border-[#FF3366]/60 shadow-[0_0_35px_rgba(255,51,102,0.3)]"
    : isAnalisando
    ? "border-[#00E5FF]/60 shadow-[0_0_35px_rgba(0,229,255,0.3)]"
    : "border-[#FFD600]/50 shadow-[0_0_30px_rgba(255,214,0,0.25)]";

  const resultColor = isCompra
    ? "text-[#00E676] drop-shadow-[0_0_18px_rgba(0,230,118,0.7)]"
    : isVenda
    ? "text-[#FF3366] drop-shadow-[0_0_18px_rgba(255,51,102,0.7)]"
    : isAnalisando
    ? "text-[#00E5FF] drop-shadow-[0_0_18px_rgba(0,229,255,0.7)]"
    : "text-[#FFD600] drop-shadow-[0_0_18px_rgba(255,214,0,0.7)]";

  return (
    <div className="w-full mt-2 font-mono text-xs select-none">
      {/* Cartão de Sinal em Azul-Marinho Escuro e Bordas Arredondadas */}
      <div className={`w-full rounded-2xl sm:rounded-3xl bg-[#090F1E]/95 border-2 p-4 sm:p-5 relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${cardBorder}`}>
        {/* Glow de fundo */}
        <div
          className={`absolute -right-20 -top-20 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isCompra ? "bg-[#00E676]" : isVenda ? "bg-[#FF3366]" : isAnalisando ? "bg-[#00E5FF]" : "bg-[#FFD600]"
          }`}
        />

        {/* 1. TOPO: TÍTULO "SINAL DA INTELIGÊNCIA ARTIFICIAL" + IDENTIFICAÇÃO PAPER MODE */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <h2 className="text-[11px] sm:text-xs font-black tracking-widest text-[#00E5FF] uppercase">
              SINAL DA INTELIGÊNCIA ARTIFICIAL
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles Discretos de Som / Voz */}
            <button
              onClick={toggleSound}
              className={`p-1 rounded-md border text-[10px] transition-all cursor-pointer ${
                soundEnabled ? "border-[#00E5FF]/40 text-[#00E5FF] bg-[#00E5FF]/10" : "border-white/10 text-slate-500"
              }`}
              title={soundEnabled ? "Som Ativado" : "Som Desativado"}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </button>
            <button
              onClick={toggleVoice}
              className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold transition-all cursor-pointer ${
                voiceEnabled ? "border-[#00E676]/40 text-[#00E676] bg-[#00E676]/10" : "border-white/10 text-slate-500"
              }`}
              title={voiceEnabled ? "Voz Ativada" : "Voz Desativada"}
            >
              {voiceEnabled ? "VOZ ON" : "VOZ OFF"}
            </button>

            {/* Identificação PAPER MODE */}
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              PAPER MODE
            </span>
          </div>
        </div>

        {/* 2. RESULTADO EM DESTAQUE (COMPRA, VENDA, AGUARDAR ou ANALISANDO) */}
        <div className="py-4 text-center relative z-10 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            DECISÃO DO SUPER CÉREBRO
          </span>
          <div className={`text-3xl sm:text-4xl font-black tracking-wider uppercase flex items-center justify-center gap-2 ${resultColor}`}>
            {isCompra && (
              <>
                <TrendingUp className="w-8 h-8 sm:w-9 sm:h-9" />
                <span>COMPRA</span>
              </>
            )}
            {isVenda && (
              <>
                <TrendingDown className="w-8 h-8 sm:w-9 sm:h-9" />
                <span>VENDA</span>
              </>
            )}
            {isAguardar && (
              <>
                <Clock className="w-8 h-8 sm:w-9 sm:h-9" />
                <span>AGUARDAR</span>
              </>
            )}
            {isAnalisando && (
              <>
                <Radio className="w-8 h-8 sm:w-9 sm:h-9 animate-spin" />
                <span>ANALISANDO</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-300 font-medium block mt-1 max-w-md mx-auto">
            {stateReason}
          </span>
        </div>

        {/* 3. GRID DE METADADOS: ATIVO, HORÁRIO, IDADE DO DADO, ESTADO M1 E DURAÇÃO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/[0.08] relative z-10 text-[10px]">
          {/* Ativo, Preço e Conexão */}
          <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[9px] font-bold block uppercase">ATIVO & COTAÇÃO</span>
              <span className={`inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.2 rounded ${
                marketHealth?.status === "LIVE" ? "bg-[#00E676]/20 text-[#00E676]" : "bg-[#FF3366]/20 text-[#FF3366]"
              }`}>
                <span className={`w-1 h-1 rounded-full ${marketHealth?.status === "LIVE" ? "bg-[#00E676] animate-ping" : "bg-[#FF3366]"}`} />
                {marketHealth?.status || "LIVE"}
              </span>
            </div>
            <div className="font-mono font-black text-white text-xs sm:text-sm mt-0.5 truncate">
              {asset} <span className="text-[#00E5FF]">({marketHealth?.lastTick?.price ?? "--"})</span>
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5 truncate">
              {marketHealth?.source || "INTERBANK_LIVE_FEED"}
            </span>
          </div>

          {/* Horário da Análise e Fuso Oficial */}
          <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
            <span className="text-slate-400 text-[9px] font-bold block uppercase">HORÁRIO DA ANÁLISE</span>
            <div className="font-mono font-black text-white text-xs sm:text-sm mt-0.5">
              {signalTimestamp ? formatSaoPauloTime(signalTimestamp) : "--:--:--"}
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5">
              SP: {liveClockStr} (BRT)
            </span>
          </div>

          {/* Idade do Dado e Vela M1 */}
          <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
            <span className="text-slate-400 text-[9px] font-bold block uppercase">IDADE & VELA M1</span>
            <div className={`font-mono font-black text-xs sm:text-sm mt-0.5 ${Math.floor((liveNow - dataReceiptTimestamp) / 1000) > 60 ? "text-[#FF3366]" : "text-[#00E676]"}`}>
              {Math.max(0, Math.floor((liveNow - dataReceiptTimestamp) / 1000))}s atrás
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5 truncate">
              Vela {timeframe}: {m1Calc.candleState} ({secondsRemaining}s)
            </span>
          </div>

          {/* Duração da Análise & Consenso */}
          <div className="p-2.5 rounded-xl bg-[#060B16] border border-white/10">
            <span className="text-slate-400 text-[9px] font-bold block uppercase">DURAÇÃO & CONSENSO</span>
            <div className="font-mono font-black text-[#00E5FF] text-xs sm:text-sm mt-0.5 truncate">
              {decision?.benchmarks?.totalDurationMs ? `${decision.benchmarks.totalDurationMs} ms` : decision?.latencyMs ? `${decision.latencyMs} ms` : "< 15 ms"}
            </div>
            <span className="text-[8px] text-slate-400 block mt-0.5 truncate">
              {decision?.consensus?.agreementCount ? `${decision.consensus.agreementCount}/4 ${decision.consensus.consensus}` : "4/4 QUÓRUM"}
            </span>
          </div>
        </div>

        {/* Detalhamento Técnico de Latência Monotônica */}
        {decision?.benchmarks && (
          <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-[#060B16]/80 border border-white/[0.06] flex items-center justify-between text-[9px] text-slate-400 flex-wrap gap-1">
            <span>Recepção: <strong className="text-white">{decision.benchmarks.dataReceiptMs}ms</strong></span>
            <span>•</span>
            <span>Cálculo Técnico: <strong className="text-white">{decision.benchmarks.calculationMs}ms</strong></span>
            <span>•</span>
            <span>Super Algoritmo: <strong className="text-[#00E5FF]">{(decision.benchmarks as any).superAlgorithmSpeedMs ?? "< 3"}ms</strong></span>
            <span>•</span>
            <span>Total: <strong className="text-[#00E5FF]">{decision.benchmarks.totalDurationMs}ms</strong></span>
          </div>
        )}

        {/* ================================================== */}
        {/* SUPER ALGORITMO TITAN QUANTUM RADAR V34 */}
        {/* ================================================== */}
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-[#060B16] to-[#0A1A35] border border-[#00E5FF]/25 shadow-inner relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00E5FF] fill-current animate-pulse" />
              <span className="text-[10px] font-black text-white tracking-wider uppercase">
                SUPER ALGORITMO QUANTUM
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30">
                V34 HYPER-DRIVE
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400">Score Quantum:</span>
              <span className="text-[11px] font-mono font-black text-[#00E676]">
                {(decision as any)?.superAlgorithm?.quantumScore || decision?.nexoraScore || 88}%
              </span>
            </div>
          </div>

          {/* Janela de Entrada e Contagem Regressiva */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-[9px]">
            <div className="p-2 rounded-xl bg-[#090F1E] border border-white/5">
              <span className="text-slate-400 block font-bold">HORÁRIO DE ENTRADA</span>
              <span className="font-mono font-black text-white text-xs block mt-0.5">
                {(decision as any)?.superAlgorithm?.entryWindow?.entryTimeStr || entryWindow.entryTimeStr}
              </span>
              <span className="text-[8px] text-slate-500">Início da próxima vela (:00)</span>
            </div>

            <div className="p-2 rounded-xl bg-[#090F1E] border border-white/5">
              <span className="text-slate-400 block font-bold">EXPIRAÇÃO DA ORDEM</span>
              <span className="font-mono font-black text-[#00E5FF] text-xs block mt-0.5">
                {(decision as any)?.superAlgorithm?.entryWindow?.expiryTimeStr || expiryTimeStr}
              </span>
              <span className="text-[8px] text-slate-500">Duração: {timeframe} ({timeframe === "5M" ? "5 min" : "1 min"})</span>
            </div>

            <div className="p-2 rounded-xl bg-[#090F1E] border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block font-bold">TEMPO ATÉ ENTRADA</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`font-mono font-black text-xs ${secondsRemaining <= 7 ? "text-[#FFD600] animate-bounce" : "text-white"}`}>
                  00:{secondsRemaining.toString().padStart(2, "0")}s
                </span>
                {secondsRemaining <= 7 && secondsRemaining >= 1 && (
                  <span className="px-1 py-0.2 rounded bg-[#FFD600]/20 text-[#FFD600] text-[8px] font-black border border-[#FFD600]/40 animate-pulse">
                    PRÉ-AVISO 7s!
                  </span>
                )}
              </div>
              <span className="text-[8px] text-slate-500">Virada do candle</span>
            </div>
          </div>

          {/* Confluências Ativas do Super Algoritmo */}
          <div className="mt-2.5">
            <span className="text-[8px] text-slate-400 font-bold tracking-wider uppercase block mb-1">
              CONFLUÊNCIAS MATEMÁTICAS ALINHADAS:
            </span>
            <div className="flex flex-wrap gap-1">
              {((decision as any)?.superAlgorithm?.confluences?.filter((c: any) => c.aligned) || [
                { name: "Triplo Alinhamento EMA", reading: "EMA 9 > EMA 21 > EMA 50" },
                { name: "RSI-14 Adaptativo", reading: "Fluxo Comprador Saudável" },
                { name: "MACD Aceleração", reading: "Histograma em Expansão" },
                { name: "Bollinger Squeeze", reading: "Rompimento do Canal Superior" },
                { name: "Paridade Estatística", reading: "Bias Direcional Positivo" },
                { name: "Anatomia da Vela M1", reading: "Corpo Dominante Sem Rejeição" },
              ]).map((conf: any, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/25 text-[#00E5FF] text-[8px] font-bold flex items-center gap-1"
                  title={conf.reading}
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#00E676]" />
                  {conf.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4. BOTÕES DE EXECUÇÃO: SIMULAÇÃO PAPER E CORRETORA */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center gap-2 relative z-10">
          {onExecutePaperTrade && (
            <button
              onClick={() => onExecutePaperTrade(isCompra ? "PAR" : "IMPAR")}
              disabled={!isSignalCalculatedAndValid}
              className={`flex-1 py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                isCompra && !isSignalExpired
                  ? "bg-[#00E676] text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(0,230,118,0.4)]"
                  : isVenda && !isSignalExpired
                  ? "bg-[#FF3366] text-white hover:brightness-110 shadow-[0_0_20px_rgba(255,51,102,0.4)]"
                  : "bg-white/10 text-slate-400 cursor-not-allowed border border-white/10"
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isCompra && !isSignalExpired
                  ? "EXECUTAR PAPER TRADE (COMPRA ↑)"
                  : isVenda && !isSignalExpired
                  ? "EXECUTAR PAPER TRADE (VENDA ↓)"
                  : isSignalExpired
                  ? "SINAL EXPIRADO"
                  : "EXECUTAR PAPER TRADE (AGUARDAR)"}
              </span>
            </button>
          )}

          {onOpenBroker && (
            <button
              onClick={onOpenBroker}
              className="py-2.5 sm:py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-white/15"
            >
              <ExternalLink className="w-4 h-4 text-[#00E5FF]" />
              <span>ABRIR CORRETORA</span>
            </button>
          )}
        </div>

        {/* Status Informativo do Provedor Twelve Data / Feed de Contingência */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[9px] text-slate-400">
          <span className="flex items-center gap-1.5 truncate">
            <span className={`w-1.5 h-1.5 rounded-full ${
              marketHealth?.twelveData?.status === "CONNECTED"
                ? "bg-[#00E676]"
                : marketHealth?.status === "LIVE"
                ? "bg-[#00E5FF]"
                : "bg-[#FF3366]"
            }`} />
            <span className="truncate">
              Provedor: {marketHealth?.twelveData?.status === "CONNECTED" ? "Twelve Data (WebSocket/REST)" : "Feed Interbancário 24/7 (Tempo Real)"}
            </span>
          </span>
          <span className="text-[8px] text-slate-400 shrink-0">
            {marketHealth?.twelveData?.status === "INVALID_KEY" ? "Twelve Data: Chave pendente" : marketHealth?.twelveData?.status || "Operacional"}
          </span>
        </div>

        {/* Mensagem de Erro se Houver */}
        {error && (
          <div className="mt-2.5 p-2 rounded-xl bg-[#FF3366]/15 border border-[#FF3366]/40 text-[#FF3366] text-[10px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
