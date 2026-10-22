// ==========================================================
// NEXORA TITAN AI — EVOLUÇÃO FINAL TITAN OMEGA MASCOT ORB
// Compact metallic navy robot, luminous golden eyes, cyan accents,
// golden 'N' chest core, transparent sphere, dual blue/gold rings & tech base.
// 6 Real-Time States: PRONTO | ANALISANDO | DADOS_DESATUALIZADOS | AGUARDAR | SINAL_CONFIRMADO | ERRO_CONEXAO
// ==========================================================

import React, { useState } from "react";
import titanOmegaRobotImg from "../assets/images/titan_omega_robot.jpg";
import nexoraRobotFaceImg from "../assets/images/nexora_robot_face.jpg";
import { Sparkles, Zap, AlertTriangle, ShieldCheck, WifiOff, Clock } from "lucide-react";

export type TitanVisualState =
  | "PRONTO"
  | "ANALISANDO"
  | "DADOS_DESATUALIZADOS"
  | "AGUARDAR"
  | "SINAL_CONFIRMADO"
  | "ERRO_CONEXAO";

export type NucleusPhase =
  | "AGUARDANDO"
  | "ANALISANDO"
  | "VALIDANDO DADOS"
  | "CONSULTANDO 4 IAS"
  | "NEXORA CORE"
  | "LOSS GUARD"
  | "SINAL"
  | "AGUARDAR"
  | "NO TRADE";

interface VisionOrbProps {
  isAnalyzing: boolean;
  phase?: NucleusPhase;
  onAnalyze: () => void;
  decisionDirection?: "PAR" | "IMPAR" | "WAIT" | "NO TRADE" | null;
  asset: string;
  timeframe: string;
  isDataStale?: boolean;
  isConnectionOffline?: boolean;
}

export const VisionOrb: React.FC<VisionOrbProps> = ({
  isAnalyzing,
  phase = "AGUARDANDO",
  onAnalyze,
  decisionDirection,
  asset,
  timeframe,
  isDataStale = false,
  isConnectionOffline = false,
}) => {
  const [imgUrlIndex, setImgUrlIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const fallbackUrls = [
    titanOmegaRobotImg,
    "/titan_omega_robot.jpg",
    nexoraRobotFaceImg,
    "/nexora_robot_face.jpg",
  ];

  const handleImageError = () => {
    if (imgUrlIndex < fallbackUrls.length - 1) {
      setImgUrlIndex((prev) => prev + 1);
    } else {
      setImgError(true);
    }
  };

  const isBuy = decisionDirection === "PAR";
  const isSell = decisionDirection === "IMPAR";
  const isSignal = isBuy || isSell;
  const isWait = decisionDirection === "WAIT" || decisionDirection === "NO TRADE";

  // Determinação rigorosa dos 6 Estados Visuais Titan Omega
  let visualState: TitanVisualState = "PRONTO";
  if (isConnectionOffline) {
    visualState = "ERRO_CONEXAO";
  } else if (isAnalyzing) {
    visualState = "ANALISANDO";
  } else if (isDataStale) {
    visualState = "DADOS_DESATUALIZADOS";
  } else if (isSignal) {
    visualState = "SINAL_CONFIRMADO";
  } else if (isWait) {
    visualState = "AGUARDAR";
  } else {
    visualState = "PRONTO";
  }

  // Esquema de Iluminação Dinâmica por Estado
  const stateTheme = {
    PRONTO: {
      glow: "rgba(0, 229, 255, 0.45)",
      outerRing: "border-[#00E5FF]/70",
      innerRing: "border-[#FFD700]/60",
      statusText: "PRONTO — MONITORANDO",
      statusColor: "text-[#00E5FF]",
      badgeBg: "bg-[#00E5FF]/10 border-[#00E5FF]/30",
      icon: ShieldCheck,
    },
    ANALISANDO: {
      glow: "rgba(0, 229, 255, 0.75)",
      outerRing: "border-[#00E5FF]",
      innerRing: "border-[#FFD700]",
      statusText: "ANALISANDO MERCADO (M1)...",
      statusColor: "text-[#00E5FF]",
      badgeBg: "bg-[#00E5FF]/20 border-[#00E5FF]/60",
      icon: Sparkles,
    },
    DADOS_DESATUALIZADOS: {
      glow: "rgba(245, 158, 11, 0.55)",
      outerRing: "border-amber-400/80",
      innerRing: "border-amber-500/70",
      statusText: "DADOS DESATUALIZADOS (> 60s)",
      statusColor: "text-amber-400",
      badgeBg: "bg-amber-400/15 border-amber-400/40",
      icon: Clock,
    },
    AGUARDAR: {
      glow: "rgba(255, 214, 0, 0.5)",
      outerRing: "border-[#FFD600]/80",
      innerRing: "border-[#FFD700]/70",
      statusText: "AGUARDAR — FILTRO DE RISCO ATIVO",
      statusColor: "text-[#FFD600]",
      badgeBg: "bg-[#FFD600]/15 border-[#FFD600]/40",
      icon: AlertTriangle,
    },
    SINAL_CONFIRMADO: {
      glow: isBuy ? "rgba(0, 230, 118, 0.75)" : "rgba(255, 51, 102, 0.75)",
      outerRing: isBuy ? "border-[#00E676]" : "border-[#FF3366]",
      innerRing: "border-[#FFD700]",
      statusText: isBuy ? "SINAL CONFIRMADO: COMPRA (PAR)" : "SINAL CONFIRMADO: VENDA (IMPAR)",
      statusColor: isBuy ? "text-[#00E676]" : "text-[#FF3366]",
      badgeBg: isBuy ? "bg-[#00E676]/20 border-[#00E676]/50" : "bg-[#FF3366]/20 border-[#FF3366]/50",
      icon: Zap,
    },
    ERRO_CONEXAO: {
      glow: "rgba(239, 68, 68, 0.65)",
      outerRing: "border-red-500/80",
      innerRing: "border-red-400/60",
      statusText: "ERRO DE CONEXÃO COM O FEED",
      statusColor: "text-red-400",
      badgeBg: "bg-red-500/20 border-red-500/50",
      icon: WifiOff,
    },
  }[visualState];

  const StatusIcon = stateTheme.icon;

  return (
    <div className="flex flex-col items-center justify-center py-1 sm:py-2 select-none font-mono w-full">
      {/* Contêiner da Esfera Titan Omega — Robô Completo, Centralizado e Nítido */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-88 md:h-88 flex items-center justify-center my-0.5 sm:my-1">
        {/* Glow Tecnológico Holográfico de Fundo */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            isAnalyzing ? "scale-115 opacity-90 animate-pulse" : "opacity-60"
          }`}
          style={{ background: stateTheme.glow }}
        />

        {/* Anel Orbital 1: Anel Energético Dourado e Ciano Inclinado */}
        <div
          className={`absolute w-68 h-68 sm:w-76 sm:h-76 md:w-84 md:h-84 rounded-full border border-dashed ${stateTheme.outerRing} pointer-events-none transition-all ${
            isAnalyzing
              ? "animate-spin duration-1000 scale-105"
              : "animate-[spin_20s_linear_infinite]"
          }`}
          style={{ transform: "rotateX(68deg) rotateY(18deg)" }}
        >
          {/* Partículas Orbitais (Ciano Neon & Dourado) */}
          <div className="absolute -top-1.5 left-1/2 w-3.5 h-3.5 rounded-full bg-[#00E5FF] shadow-[0_0_16px_#00E5FF]" />
          <div className="absolute -bottom-1.5 left-1/4 w-3.5 h-3.5 rounded-full bg-[#FFD700] shadow-[0_0_14px_#FFD700]" />
        </div>

        {/* Anel Orbital 2: Anel Energético Contra-Inclinado Ciano */}
        <div
          className={`absolute w-60 h-60 sm:w-68 sm:h-68 md:w-76 md:h-76 rounded-full border border-dotted ${stateTheme.innerRing} pointer-events-none transition-all ${
            isAnalyzing
              ? "animate-[spin_1.5s_linear_infinite_reverse] scale-105"
              : "animate-[spin_24s_linear_infinite_reverse]"
          }`}
          style={{ transform: "rotateX(76deg) rotateY(-36deg)" }}
        >
          <div className="absolute top-1/2 -right-1.5 w-3 h-3 rounded-full bg-[#00E5FF] shadow-[0_0_14px_#00E5FF]" />
          <div className="absolute top-1/4 -left-1 w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]" />
        </div>

        {/* Base Tecnológica Circular Flutuante com Iluminação Suave */}
        <div
          className="absolute -bottom-2 sm:-bottom-3 w-52 sm:w-60 md:w-68 h-6 sm:h-7 rounded-[50%] bg-gradient-to-r from-transparent via-[#0A1832] to-transparent border-t border-[#00E5FF]/40 shadow-[0_0_24px_rgba(0,229,255,0.4)] pointer-events-none z-0"
        >
          {/* LEDs da Base */}
          <div className="absolute top-1 left-1/4 w-2 h-1 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#FFD700] shadow-[0_0_10px_#FFD700]" />
          <div className="absolute top-1 right-1/4 w-2 h-1 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
        </div>

        {/* Esfera Central Transparente Titan Omega (Botão Touch) */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`relative z-10 w-52 h-52 sm:w-60 sm:h-60 md:w-68 md:h-68 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 group focus:outline-none cursor-pointer overflow-hidden border-2 sm:border-[3px] ${
            isBuy
              ? "bg-[#06291B]/80 border-[#00E676] shadow-[0_0_55px_rgba(0,230,118,0.7)]"
              : isSell
              ? "bg-[#330A19]/80 border-[#FF3366] shadow-[0_0_55px_rgba(255,51,102,0.7)]"
              : visualState === "DADOS_DESATUALIZADOS"
              ? "bg-[#2A1805]/80 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)]"
              : visualState === "ERRO_CONEXAO"
              ? "bg-[#2E0B0B]/80 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)]"
              : visualState === "AGUARDAR"
              ? "bg-[#292006]/80 border-[#FFD600] shadow-[0_0_50px_rgba(255,214,0,0.6)]"
              : "bg-[#091122]/80 border-[#00E5FF] shadow-[0_0_50px_rgba(0,229,255,0.65)] hover:shadow-[0_0_65px_rgba(0,229,255,0.85)]"
          }`}
          title="Toque na esfera para ativar a inteligência Titan Omega"
        >
          {/* Reflexo de Vidro Curvo da Esfera Transparente */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/[0.04] via-transparent to-white/[0.18] pointer-events-none z-20" />
          <div className="absolute top-2 left-6 w-20 h-8 rounded-[50%] bg-white/20 blur-[2px] -rotate-12 pointer-events-none z-20" />

          {/* Renderização do Robô Titan Omega: Imagem Oficial ou Vetor Mascote */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none flex items-center justify-center z-10">
            {!imgError ? (
              <img
                src={fallbackUrls[imgUrlIndex]}
                onError={handleImageError}
                alt="Nexora Titan Omega Mascot"
                className={`w-full h-full object-cover object-center transition-all duration-700 ${
                  isAnalyzing
                    ? "scale-110 brightness-115 contrast-125"
                    : "scale-100 brightness-105 contrast-110 group-hover:scale-105"
                }`}
              />
            ) : (
              // Vetor Nativo de Contingência do Mascote Titan Omega Completo
              <div className="w-full h-full bg-gradient-to-b from-[#0B1528] via-[#070D1B] to-[#040810] flex flex-col items-center justify-center relative">
                <svg className="w-40 h-40 sm:w-48 sm:h-48 text-[#00E5FF]" viewBox="0 0 200 200" fill="none">
                  {/* Antenas Auriculares */}
                  <rect x="42" y="55" width="8" height="26" rx="4" fill="#0A1E3D" stroke="#00E5FF" strokeWidth="2" />
                  <rect x="150" y="55" width="8" height="26" rx="4" fill="#0A1E3D" stroke="#00E5FF" strokeWidth="2" />
                  
                  {/* Cabeça do Robô Metálico Azul-Marinho */}
                  <rect x="52" y="44" width="96" height="74" rx="28" fill="#0C1B33" stroke="#00E5FF" strokeWidth="2.5" />
                  
                  {/* Viseira Escura */}
                  <rect x="62" y="60" width="76" height="42" rx="18" fill="#040914" stroke="#00E5FF" strokeWidth="1.5" />
                  
                  {/* Olhos Dourados Luminosos */}
                  <circle cx="82" cy="80" r="11" fill="#FFD700" className="animate-pulse" filter="drop-shadow(0 0 10px #FFD700)" />
                  <circle cx="82" cy="80" r="4" fill="#FFFFFF" />
                  <circle cx="118" cy="80" r="11" fill="#FFD700" className="animate-pulse" filter="drop-shadow(0 0 10px #FFD700)" />
                  <circle cx="118" cy="80" r="4" fill="#FFFFFF" />
                  
                  {/* Sorriso Metálico Simpático */}
                  <path d="M92 94 Q100 99 108 94" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />

                  {/* Corpo Compacto Azul-Marinho */}
                  <path d="M68 124 L64 165 Q100 174 136 165 L132 124 Z" fill="#0C1B33" stroke="#00E5FF" strokeWidth="2" />

                  {/* Núcleo Dourado com Símbolo N no Peito */}
                  <circle cx="100" cy="144" r="15" fill="#141E10" stroke="#FFD700" strokeWidth="2.5" filter="drop-shadow(0 0 8px #FFD700)" />
                  <text x="100" y="150" textAnchor="middle" fill="#FFD700" fontSize="14" fontWeight="bold">N</text>

                  {/* Braços com Juntas em Azul Ciano */}
                  <rect x="42" y="126" width="16" height="28" rx="8" fill="#0C1B33" stroke="#00E5FF" strokeWidth="2" />
                  <rect x="142" y="126" width="16" height="28" rx="8" fill="#0C1B33" stroke="#00E5FF" strokeWidth="2" />
                </svg>
              </div>
            )}

            {/* Feixe Laser Holográfico durante a análise */}
            {isAnalyzing && (
              <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_20px_#00E5FF] animate-[bounce_1.2s_infinite] opacity-95 z-20" />
            )}
          </div>

          {/* Anel de Luz Interno da Esfera */}
          <div className="absolute inset-1.5 rounded-full border border-[#00E5FF]/40 pointer-events-none group-hover:border-[#00E5FF]/70 transition-all shadow-inner z-20" />
        </button>
      </div>

      {/* Badge do Estado Visual Real Titan Omega (Direct Connection to State) */}
      <div className={`mt-1.5 px-3 py-1 rounded-xl flex items-center gap-2 border text-[10px] sm:text-xs font-black shadow-lg transition-all ${stateTheme.badgeBg}`}>
        <StatusIcon className={`w-3.5 h-3.5 ${stateTheme.statusColor} ${isAnalyzing ? "animate-spin" : ""}`} />
        <span className={stateTheme.statusColor}>{stateTheme.statusText}</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300 uppercase">{phase}</span>
      </div>
    </div>
  );
};
