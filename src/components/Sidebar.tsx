import React from "react";
import {
  Zap,
  Radar,
  BarChart2,
  Cpu,
  GraduationCap,
  Wallet,
  History as HistoryIcon,
  Globe,
  ShieldCheck,
  Sparkles,
  Lock,
  Columns2,
} from "lucide-react";
import { ActiveScreenType } from "./Navbar.js";

interface SidebarProps {
  activeScreen: ActiveScreenType;
  setActiveScreen: (screen: ActiveScreenType) => void;
  serverOnline: boolean;
  marketLive: boolean;
  paperBalance: number;
  scannerActive: boolean;
  twelveDataConnected?: boolean;
  twelveDataStatusText?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  setActiveScreen,
  serverOnline,
  marketLive,
  paperBalance,
  scannerActive,
  twelveDataConnected,
  twelveDataStatusText,
}) => {
  const menuItems: { id: ActiveScreenType; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "PAINEL", label: "PAINEL", icon: Zap },
    { id: "GLOBAL_MARKETS", label: "MERCADOS GLOBAIS", icon: Globe, badge: "V33" },
    { id: "TELA_DIVIDIDA", label: "TELA DIVIDIDA", icon: Columns2, badge: "PRO" },
    { id: "SCANNER", label: "SCANNER", icon: Radar, badge: scannerActive ? "ON" : undefined },
    { id: "GRAFICO", label: "GRÁFICO", icon: BarChart2 },
    { id: "FOUR_AIS", label: "4 IAS", icon: Cpu, badge: "4/4" },
    { id: "APRENDER", label: "APRENDER", icon: GraduationCap },
    { id: "PAPER", label: "PAPER", icon: Wallet },
    { id: "HISTORICO", label: "HISTÓRICO", icon: HistoryIcon },
    { id: "PLATAFORMAS", label: "PLATAFORMAS", icon: Globe },
    { id: "YOUX_CATALOG", label: "YOUX ATIVOS", icon: Globe, badge: "V22" },
    { id: "SAUDE", label: "SAÚDE", icon: ShieldCheck },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#070912] border-r border-white/[0.08] fixed left-0 top-0 bottom-0 z-40 font-mono select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/[0.08]">
        <div
          onClick={() => setActiveScreen("PAINEL")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#22D3EE] via-[#8B5CF6] to-[#00D084] p-0.5 flex items-center justify-center shadow-lg shadow-[#22D3EE]/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070912] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wider text-[#F5F7FF]">
                NEXORA <span className="text-[#22D3EE]">TITAN AI</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40">
                TITAN
              </span>
            </div>
            <span className="text-[10px] text-slate-500 tracking-tight">Inteligência que analisa</span>
          </div>
        </div>

        {/* Status Beacons */}
        <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1.5 text-[10px]">
          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#0D1220] border border-white/[0.04]">
            <span className="text-slate-400 font-bold">SISTEMA</span>
            <span className="flex items-center gap-1.5 font-black text-[#00D084]">
              <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? "bg-[#00D084] animate-pulse" : "bg-[#FF5570]"}`} />
              {serverOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#0D1220] border border-white/[0.04]">
            <span className="text-slate-400 font-bold">TWELVE DATA</span>
            <span className={`flex items-center gap-1.5 font-black ${twelveDataConnected ? "text-[#00D084]" : "text-amber-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${twelveDataConnected ? "bg-[#00D084] animate-pulse" : "bg-amber-400"}`} />
              {twelveDataStatusText || (twelveDataConnected ? "CONECTADO" : "PENDENTE")}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#0D1220] border border-white/[0.04]">
            <span className="text-slate-400 font-bold">MARKET DATA</span>
            <span className={`flex items-center gap-1.5 font-black ${marketLive ? "text-[#00D084]" : "text-[#FF5570]"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${marketLive ? "bg-[#00D084] animate-pulse" : "bg-[#FF5570]"}`} />
              {marketLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu (9 items per spec) */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-98 cursor-pointer ${
                isActive
                  ? "bg-[#8B5CF6]/20 text-[#F5F7FF] border border-[#8B5CF6]/60 shadow-md shadow-[#8B5CF6]/15 font-black"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#22D3EE]" : "text-slate-400"}`} />
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                    item.badge === "ON"
                      ? "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40 animate-pulse"
                      : "bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Paper Mode Status & Balance */}
      <div className="p-3 border-t border-white/[0.08] space-y-2">
        <div
          onClick={() => setActiveScreen("PAPER")}
          className="p-3 rounded-xl bg-gradient-to-br from-[#063321]/30 to-[#0D1220] border border-[#00D084]/30 cursor-pointer hover:border-[#00D084]/60 transition-all space-y-1"
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#00D084] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] animate-pulse" />
              PAPER MODE ON
            </span>
            <Lock className="w-3 h-3 text-slate-500" />
          </div>
          <div className="text-sm font-black text-white">
            ${(Number(paperBalance ?? 10000) || 10000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-slate-500">Execução financeira real bloqueada</div>
        </div>
      </div>
    </aside>
  );
};
