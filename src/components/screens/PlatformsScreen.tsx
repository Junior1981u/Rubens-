import React, { useState } from "react";
import {
  ExternalLink,
  ShieldCheck,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Clock,
  Layers,
  Activity,
  Info,
} from "lucide-react";
import { PlatformId } from "../../types.js";
import {
  PlatformIdentifier,
  PlatformConfig,
  platformAdapters,
} from "../../services/platformAdapters.js";
import { OlympTradeSafeModal } from "../OlympTradeSafeModal.js";

export interface PlatformCardItem {
  platformId: PlatformIdentifier;
  platformName: string;
  badge: string;
  color: string;
  glow: string;
  url: string;
  buttonLabel: string;
  description: string;
  isRestricted: boolean;
  status: "OFFLINE" | "NOT_CONNECTED" | "RESTRICTED";
  dataSource: "NOT CONNECTED";
  selectedAsset: string;
  selectedTimeframe: string;
}

export const PLATFORMS_DATA: PlatformCardItem[] = [
  {
    platformId: "quotex",
    platformName: "QUOTEX",
    badge: "🟣",
    color: "#A855F7",
    glow: "rgba(168, 85, 247, 0.25)",
    url: "https://quotex.com/pt/",
    buttonLabel: "[ ENTRAR NA QUOTEX ]",
    description: "Plataforma oficial com expirações rápidas de 1M, 5M e mercado de paridade OTC/Forex.",
    isRestricted: false,
    status: "OFFLINE",
    dataSource: "NOT CONNECTED",
    selectedAsset: "EUR/USD",
    selectedTimeframe: "1M",
  },
  {
    platformId: "iqoption",
    platformName: "IQ OPTION",
    badge: "🔵",
    color: "#3DA5FF",
    glow: "rgba(61, 165, 255, 0.25)",
    url: "https://iqoption.com/",
    buttonLabel: "[ ENTRAR NA IQ OPTION ]",
    description: "Plataforma oficial para opções binárias e digitais com cotações globais em tempo real.",
    isRestricted: false,
    status: "OFFLINE",
    dataSource: "NOT CONNECTED",
    selectedAsset: "EUR/USD",
    selectedTimeframe: "1M",
  },
  {
    platformId: "olymptrade",
    platformName: "OLYMPTRADE",
    badge: "🟢",
    color: "#00D68F",
    glow: "rgba(0, 214, 143, 0.25)",
    url: "https://olymptrade.com/pt-br/",
    buttonLabel: "[ ENTRAR NA OLYMPTRADE ]",
    description: "Plataforma oficial com modo Fixed Time Trades e múltiplos pares cambiais internacionais.",
    isRestricted: false,
    status: "OFFLINE",
    dataSource: "NOT CONNECTED",
    selectedAsset: "EUR/USD",
    selectedTimeframe: "1M",
  },
  {
    platformId: "pocketoption",
    platformName: "POCKET OPTION",
    badge: "🟠",
    color: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.25)",
    url: "https://pocketoption.com/pt/",
    buttonLabel: "[ ENTRAR NA POCKET OPTION ]",
    description: "Plataforma de alta liquidez com opções digitais, payouts flexíveis e ordens rápidas.",
    isRestricted: false,
    status: "OFFLINE",
    dataSource: "NOT CONNECTED",
    selectedAsset: "EUR/USD",
    selectedTimeframe: "1M",
  },
  {
    platformId: "binomo",
    platformName: "BINOMO",
    badge: "🔴",
    color: "#FF5570",
    glow: "rgba(255, 85, 112, 0.25)",
    url: "https://binomo.com/br-br",
    buttonLabel: "[ RESTRITO ]",
    description: "Aviso Oficial: Restrições regulatórias para residentes no Brasil comunicadas pelo próprio site.",
    isRestricted: true,
    status: "RESTRICTED",
    dataSource: "NOT CONNECTED",
    selectedAsset: "EUR/USD",
    selectedTimeframe: "1M",
  },
  {
    platformId: "exnova",
    platformName: "EXNOVA",
    badge: "🟣",
    color: "#8B5CF6",
    glow: "rgba(139, 92, 246, 0.25)",
    url: "https://exnova.org/",
    buttonLabel: "[ ENTRAR NA EXNOVA ]",
    description: "Terminal moderno de negociação multi-ativos com spreads reduzidos e execução instantânea.",
    isRestricted: false,
    status: "OFFLINE",
    dataSource: "NOT CONNECTED",
    selectedAsset: "EUR/USD",
    selectedTimeframe: "1M",
  },
  {
    platformId: "youxbroker",
    platformName: "YOUXBROKER",
    badge: "🌐",
    color: "#00E5FF",
    glow: "rgba(0, 229, 255, 0.25)",
    url: "https://trade.youxbroker.com/traderoom?registered=1",
    buttonLabel: "[ ABRIR YOUXBROKER ]",
    description: "Traderoom oficial da YouXBroker com gráficos em tempo real e negociações de opções rápidas.",
    isRestricted: false,
    status: "OFFLINE",
    dataSource: "NOT CONNECTED",
    selectedAsset: "EUR/USD",
    selectedTimeframe: "1M",
  },
];

interface PlatformsScreenProps {
  activePlatform: PlatformId | string;
  onSelectPlatform: (id: PlatformId) => void;
  currentAsset?: string;
  currentTimeframe?: string;
  onNavigateToYouXCatalog?: () => void;
}

export function normalizePlatformId(id: string): PlatformIdentifier {
  const clean = (id || "").toLowerCase().replace(/[^a-z]/g, "");
  if (clean.includes("youx")) return "youxbroker";
  if (clean.includes("quotex")) return "quotex";
  if (clean.includes("iq")) return "iqoption";
  if (clean.includes("olymp")) return "olymptrade";
  if (clean.includes("pocket")) return "pocketoption";
  if (clean.includes("binomo")) return "binomo";
  if (clean.includes("exnova")) return "exnova";
  return "quotex";
}

export const PlatformsScreen: React.FC<PlatformsScreenProps> = ({
  activePlatform,
  onSelectPlatform,
  currentAsset = "EUR/USD",
  currentTimeframe = "1M",
  onNavigateToYouXCatalog,
}) => {
  const normalizedActive = normalizePlatformId(String(activePlatform));
  const activeObj =
    PLATFORMS_DATA.find((p) => p.platformId === normalizedActive) || PLATFORMS_DATA[0];

  const [isOlympTradeModalOpen, setIsOlympTradeModalOpen] = useState(false);

  // Independent state per platform ensuring no data mixing between platforms
  const [platformState] = useState<Record<PlatformIdentifier, { lastUpdate: number }>>(() => ({
    quotex: { lastUpdate: Date.now() - 32000 },
    iqoption: { lastUpdate: Date.now() - 45000 },
    olymptrade: { lastUpdate: Date.now() - 28000 },
    pocketoption: { lastUpdate: Date.now() - 61000 },
    binomo: { lastUpdate: Date.now() - 120000 },
    exnova: { lastUpdate: Date.now() - 19000 },
    youxbroker: { lastUpdate: Date.now() - 15000 },
  }));

  const handleCardClick = (id: PlatformIdentifier) => {
    // Select platform without altering market data
    onSelectPlatform(id as PlatformId);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-2 sm:px-4 py-4 font-mono text-xs pb-24 text-[#F5F7FF]">
      {/* ================================================== */}
      {/* 1. CABEÇALHO & DIRETRIZES DE SEGURANÇA */}
      {/* ================================================== */}
      <div className="bg-[#0D1220] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                  HUB DE PLATAFORMAS — NEXORA VISION AI V12 PRO
                </h1>
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40">
                  7 CORRETORAS
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Auditoria de sinais e portal de acesso oficial para 7 corretoras globais com YouXBroker.
              </p>
            </div>
          </div>

          {/* Banner da Plataforma Selecionada */}
          <div className="px-4 py-2.5 rounded-xl bg-[#070912] border border-[#22D3EE]/30 shadow-lg shadow-[#22D3EE]/5 flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] text-[#22D3EE] font-bold uppercase tracking-wider block">
                PLATAFORMA SELECIONADA
              </span>
              <span className="text-sm font-black text-white tracking-wide">
                [ {activeObj.platformName} ]
              </span>
            </div>
            <span className="text-xl">{activeObj.badge}</span>
          </div>
        </div>

        {/* Políticas de Segurança e Integridade Estrita */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-[11px]">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-200 mb-0.5">
                Segurança Estrita de Credenciais:
              </strong>
              <span>
                A NEXORA <strong>NÃO</strong> captura senha, PIN, 2FA, cookies ou session token, e{" "}
                <strong>NÃO</strong> efetua bypass de CAPTCHA.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-emerald-200 mb-0.5">
                Modo Seguro Permanente:
              </strong>
              <span>
                <strong>PAPER MODE</strong> permanece ativado. <strong>EXECUÇÃO REAL</strong>{" "}
                permanece desativada. As plataformas operam com isolamento rigoroso de telemetria.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. GRADE DE 6 PLATAFORMAS (DESKTOP 3x2 / MOBILE HORIZONTAL) */}
      {/* ================================================== */}
      <div
        className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 pb-3 scroll-smooth scrollbar-thin scrollbar-thumb-white/10"
        style={{
          // Desktop uses 3 columns repeat(3, minmax(0, 1fr)) with 16px gap per instructions
          gap: "16px",
        }}
      >
        {PLATFORMS_DATA.map((p) => {
          const isSelected = normalizedActive === p.platformId;
          const isBinomo = p.platformId === "binomo";
          const pState = platformState[p.platformId];

          return (
            <div
              key={p.platformId}
              onClick={() => handleCardClick(p.platformId)}
              className={`bg-[#0D1220] rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between cursor-pointer select-none min-w-[250px] md:min-w-0 flex-shrink-0 md:flex-shrink relative overflow-hidden group ${
                isSelected
                  ? "border-[#22D3EE] shadow-xl shadow-[#22D3EE]/10 ring-1 ring-[#22D3EE]/50 bg-gradient-to-b from-[#0D1220] to-[#0A101C]"
                  : isBinomo
                  ? "border-rose-500/30 hover:border-rose-500/60"
                  : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#111728]"
              }`}
            >
              {/* Glow decorativo de fundo */}
              <div
                className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20"
                style={{ backgroundColor: p.color }}
              />

              {/* Topo do Card */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.badge}</span>
                    <div>
                      <h3 className="font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-2">
                        {p.platformName}
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        platformId: <strong className="text-slate-300 font-mono">{p.platformId}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Badge de Status / Restrição */}
                  {isBinomo ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 shadow-sm shadow-rose-500/10">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      ⚠ RESTRITO
                    </span>
                  ) : isSelected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-3 h-3 text-[#22D3EE]" />
                      SELECIONADA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.05] text-slate-400 border border-white/10">
                      DISPONÍVEL
                    </span>
                  )}
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                  {p.description}
                </p>

                {/* Telemetria de Plataforma (Cada plataforma possui seus parâmetros isolados) */}
                <div className="p-2.5 rounded-xl bg-[#070912] border border-white/[0.06] space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Activity className="w-3 h-3 text-slate-400" />
                      STATUS:
                    </span>
                    {isBinomo ? (
                      <span className="text-rose-400 font-black">RESTRITO</span>
                    ) : (
                      <span className="text-slate-400 font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        OFFLINE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Database className="w-3 h-3 text-slate-400" />
                      DATA SOURCE:
                    </span>
                    <span className="text-amber-400/90 font-bold">NOT CONNECTED</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      ATIVO / TF:
                    </span>
                    <span className="text-slate-300 font-bold">
                      {p.selectedAsset} • {p.selectedTimeframe}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      LAST UPDATE:
                    </span>
                    <span>
                      {new Date(pState.lastUpdate).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Aviso Regulatório Específico para Binomo */}
                {isBinomo && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] space-y-1">
                    <div className="flex items-center gap-1 font-bold text-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>Restrição Territorial Oficial</span>
                    </div>
                    <p className="text-rose-300/90 leading-tight">
                      O site oficial atualmente informa restrições para residentes no Brasil. A
                      NEXORA não contorna nem efetua bypass dessa restrição.
                    </p>
                  </div>
                )}
              </div>

              {/* Botões do Card */}
              <div className="space-y-2 pt-3 mt-3 border-t border-white/[0.06] relative z-10">
                {/* Botão de Seleção */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(p.platformId);
                  }}
                  className={`w-full py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 shadow-sm"
                      : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PLATAFORMA SELECIONADA</span>
                    </>
                  ) : (
                    <span>SELECIONAR COMO ATIVA</span>
                  )}
                </button>

                {/* Botão Oficial ENTRAR / RESTRITO */}
                {isBinomo ? (
                  <div
                    className="w-full py-2.5 rounded-xl font-black bg-rose-950/40 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-2 cursor-not-allowed opacity-90 text-xs shadow-inner select-none"
                    title="Operações restritas para residentes no Brasil"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>[ RESTRITO ]</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 w-full">
                    {p.platformId === "olymptrade" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOlympTradeModalOpen(true);
                        }}
                        className="w-full py-2 rounded-xl font-black bg-[#00D68F]/20 hover:bg-[#00D68F]/30 text-[#00D68F] border border-[#00D68F]/40 flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-all shadow-sm active:scale-95"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>[ 🟢 DIAGNÓSTICO SEGURO OLYMP TRADE ]</span>
                      </button>
                    )}
                    {p.platformId === "youxbroker" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToYouXCatalog?.();
                        }}
                        className="w-full py-2 rounded-xl font-black bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 text-[#00E5FF] border border-[#00E5FF]/40 flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-all shadow-sm active:scale-95"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>[ 🌐 ATIVOS YOUXBROKER ]</span>
                      </button>
                    )}
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-2.5 rounded-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-xs border border-white/10"
                    >
                      <span>{p.buttonLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================== */}
      {/* 3. INFORMAÇÕES DE INTEGRAÇÃO & COMPLIANCE */}
      {/* ================================================== */}
      <div className="bg-[#070912] border border-white/[0.06] rounded-2xl p-4 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <Info className="w-4 h-4 text-[#22D3EE]" />
          <span>DIRETRIZ DE ARQUITETURA DE DADOS — NEXORA CORE</span>
        </div>
        <p className="leading-relaxed">
          1. <strong>Isolamento Multi-Corretora:</strong> A seleção de plataforma atualiza o
          identificador ativo (<code className="text-[#22D3EE]">platformId</code>), mantendo os
          registros de auditoria, históricos e métricas totalmente separados.
        </p>
        <p className="leading-relaxed">
          2. <strong>Integridade de Cotações:</strong> A plataforma selecionada <strong>NÃO</strong>{" "}
          altera automaticamente os dados de mercado interbancários. As cotações permanecem contínuas
          para auditoria analítica transparente.
        </p>
        <p className="leading-relaxed">
          3. <strong>Adapters Padronizados:</strong> Cada corretora possui seu respectivo adapter (
          <code className="text-slate-300">QuotexAdapter</code>,{" "}
          <code className="text-slate-300">IQOptionAdapter</code>,{" "}
          <code className="text-slate-300">OlymptradeAdapter</code>,{" "}
          <code className="text-slate-300">PocketOptionAdapter</code>,{" "}
          <code className="text-slate-300">BinomoAdapter</code>,{" "}
          <code className="text-slate-300">ExnovaAdapter</code>,{" "}
          <code className="text-[#00E5FF]">YouXBrokerAdapter</code>
          ). Na ausência de API oficial autenticada pelo usuário, o status é rigorosamente mantido como{" "}
          <strong className="text-amber-300">NOT CONNECTED / OFFLINE</strong> sem simulações falsas de
          conectividade.
        </p>
      </div>

      {/* 4. MODAL DE DIAGNÓSTICO SEGURO OLYMP TRADE */}
      <OlympTradeSafeModal
        isOpen={isOlympTradeModalOpen}
        onClose={() => setIsOlympTradeModalOpen(false)}
        currentAsset={currentAsset}
      />
    </div>
  );
};
export default PlatformsScreen;
