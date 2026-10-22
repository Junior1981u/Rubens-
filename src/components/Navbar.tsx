import React, { useState } from "react";
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
  Menu,
  X,
  Columns2,
} from "lucide-react";
import { PlatformId } from "../types.js";

export type ActiveScreenType =
  | "PAINEL"
  | "GLOBAL_MARKETS"
  | "TELA_DIVIDIDA"
  | "SCANNER"
  | "GRAFICO"
  | "FOUR_AIS"
  | "APRENDER"
  | "PAPER"
  | "HISTORICO"
  | "PLATAFORMAS"
  | "YOUX_CATALOG"
  | "SAUDE";

interface NavbarProps {
  activeScreen: ActiveScreenType;
  setActiveScreen: (screen: ActiveScreenType) => void;
  activePlatform: PlatformId;
  paperBalance: number;
  serverOnline: boolean;
  scannerActive: boolean;
  marketLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  setActiveScreen,
  paperBalance,
  serverOnline,
  marketLive,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allNavItems: { id: ActiveScreenType; label: string; icon: React.ElementType }[] = [
    { id: "PAINEL", label: "PAINEL", icon: Zap },
    { id: "GLOBAL_MARKETS", label: "MERCADOS GLOBAIS", icon: Globe },
    { id: "TELA_DIVIDIDA", label: "TELA DIVIDIDA", icon: Columns2 },
    { id: "SCANNER", label: "SCANNER", icon: Radar },
    { id: "GRAFICO", label: "GRÁFICO", icon: BarChart2 },
    { id: "FOUR_AIS", label: "4 IAS", icon: Cpu },
    { id: "APRENDER", label: "APRENDER", icon: GraduationCap },
    { id: "PAPER", label: "PAPER", icon: Wallet },
    { id: "HISTORICO", label: "HISTÓRICO", icon: HistoryIcon },
    { id: "PLATAFORMAS", label: "PLATAFORMAS", icon: Globe },
    { id: "YOUX_CATALOG", label: "YOUX ATIVOS", icon: Globe },
    { id: "SAUDE", label: "SAÚDE", icon: ShieldCheck },
  ];

  // Mobile Bottom Navigation exactly per specification:
  // ⚡ PAINEL | ◉ SCANNER | ▥ GRÁFICO | 🧠 4 IAS | ▣ PAPER | ☰ MAIS
  const mobilePrimaryItems: { id: ActiveScreenType; label: string; symbol: string }[] = [
    { id: "PAINEL", label: "PAINEL", symbol: "⚡" },
    { id: "SCANNER", label: "SCANNER", symbol: "◉" },
    { id: "GRAFICO", label: "GRÁFICO", symbol: "▥" },
    { id: "FOUR_AIS", label: "4 IAS", symbol: "🧠" },
    { id: "PAPER", label: "PAPER", symbol: "▣" },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-[#070912]/95 backdrop-blur-md border-b border-white/[0.08] transition-all font-mono md:hidden">
        <div className="max-w-7xl mx-auto px-3 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveScreen("PAINEL")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#22D3EE] via-[#8B5CF6] to-[#00D084] p-0.5 flex items-center justify-center shadow-lg shadow-[#22D3EE]/20">
              <div className="w-full h-full bg-[#070912] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wider text-[#F5F7FF]">
                NEXORA <span className="text-[#22D3EE]">TITAN AI</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40">
                TITAN
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-1.5 text-xs">
            {/* Feed Status */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0D1220] border border-white/[0.08]">
              <span className={`w-1.5 h-1.5 rounded-full ${marketLive ? "bg-[#00D084] animate-pulse" : "bg-[#FF5570]"}`} />
              <span className={`text-[9px] font-black ${marketLive ? "text-[#00D084]" : "text-[#FF5570]"}`}>
                {marketLive ? "LIVE" : "OFFLINE"}
              </span>
            </div>

            {/* Paper Balance */}
            <div
              onClick={() => setActiveScreen("PAPER")}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#00D084]/10 border border-[#00D084]/30 text-[#00D084] cursor-pointer"
            >
              <Wallet className="w-3 h-3 text-[#00D084]" />
              <span className="font-black text-[10px]">
                ${(paperBalance ?? 10000).toFixed(0)}
              </span>
            </div>

            {/* Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-1 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 active:scale-95 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer for "Mais" */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#070912] px-3 py-3 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
              TODAS AS SEÇÕES NEXORA
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl font-bold gap-1 transition-all border cursor-pointer ${
                      isActive
                        ? "bg-[#8B5CF6]/25 text-[#22D3EE] border-[#8B5CF6]/60"
                        : "bg-[#0D1220] text-slate-400 border-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[9px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070912]/95 backdrop-blur-lg border-t border-white/[0.1] px-1 py-1.5 flex items-center justify-around font-mono shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        {mobilePrimaryItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-[#22D3EE] font-black scale-105"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-sm leading-none">{item.symbol}</span>
              <span className="text-[9px] mt-0.5 tracking-tight font-bold">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-[#22D3EE] mt-0.5 shadow-[0_0_6px_#22D3EE]" />}
            </button>
          );
        })}

        {/* ☰ MAIS */}
        <button
          onClick={() => setMobileMenuOpen((p) => !p)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            mobileMenuOpen ? "text-[#8B5CF6] font-black" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-sm leading-none">☰</span>
          <span className="text-[9px] mt-0.5 tracking-tight font-bold">MAIS</span>
        </button>
      </nav>
    </>
  );
};
