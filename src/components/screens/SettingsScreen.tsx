import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  ShieldAlert,
  Lock,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SystemSettings } from "../../types/nexora4AIConsensus";

interface SettingsScreenProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onResetPaperAccount: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  setSettings,
  onResetPaperAccount,
}) => {
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleToggleSound = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleToggleAutoPaper = () => {
    setSettings((prev) => ({
      ...prev,
      autoPaperTradeOnConsensus: !prev.autoPaperTradeOnConsensus,
    }));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-3 sm:py-5 font-mono">
      {/* Top Banner */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#3DA5FF]" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              CONFIGURAÇÃO DO TERMINAL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            NEXORA SETTINGS & RISK CONTROLS
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Gerenciamento de risco, travas de segurança e parâmetros de execução paper.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 rounded-xl bg-[#3DA5FF] hover:bg-[#3DA5FF]/90 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-[#3DA5FF]/20"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>AJUSTES SALVOS!</span>
            </>
          ) : (
            <span>SALVAR PREFERÊNCIAS</span>
          )}
        </button>
      </div>

      {/* Modo de Execução: PAPER vs LIVE */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <span className="font-bold text-white uppercase text-xs">
            MODO DE OPERAÇÃO DO TERMINAL
          </span>
          <span className="text-emerald-400 font-bold">
            ● PAPER TRADING ATIVO
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Opção Paper Mode (Ativo) */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-white text-sm">PAPER TRADING</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                ✓ ATIVO
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Ambiente de simulação matemática em tempo real. Ordens virtuais validadas com saldo de teste sem exposição financeira.
            </p>
          </div>

          {/* Opção Live Mode (Bloqueado) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="font-black text-slate-400 text-sm">LIVE TRADING</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-amber-400 border border-amber-400/30">
                🔒 BLOQUEADO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              O modo LIVE permanece bloqueado por conformidade. A execução real só é permitida mediante credenciamento e integração oficial autorizada.
            </p>
          </div>
        </div>
      </section>

      {/* Regras e Parâmetros de Risco */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <span className="font-bold text-white uppercase text-xs">
            PARÂMETROS DE GESTÃO DE RISCO (ANTI-LOSS)
          </span>
          <span className="text-slate-400">
            PROTEÇÃO RIGOROSA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-[#070A0F] rounded-xl border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] text-slate-400 block font-bold">
              STOP PERDAS CONSECUTIVAS
            </span>
            <div className="text-base font-black text-white">3 PERDAS</div>
            <span className="text-[10px] text-slate-500 font-sans block">
              Aciona cooldown automático
            </span>
          </div>

          <div className="p-3.5 bg-[#070A0F] rounded-xl border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] text-slate-400 block font-bold">
              TEMPO DE COOLDOWN
            </span>
            <div className="text-base font-black text-white">15 MINUTOS</div>
            <span className="text-[10px] text-slate-500 font-sans block">
              Pausa para esfriar o mercado
            </span>
          </div>

          <div className="p-3.5 bg-[#070A0F] rounded-xl border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] text-slate-400 block font-bold">
              QUALIDADE MÍNIMA DO FEED
            </span>
            <div className="text-base font-black text-emerald-400">80% A+</div>
            <span className="text-[10px] text-slate-500 font-sans block">
              Abaixo disto gera NO TRADE
            </span>
          </div>
        </div>

        {/* Regra de Consenso Estrito 4/4 */}
        <div className="p-4 rounded-xl bg-blue-950/20 border border-[#3DA5FF]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <strong className="text-white text-xs block">
              REGRA DE CONSENSO ESTRITO (4/4 UNÂNIME)
            </strong>
            <p className="text-[11px] text-slate-300 font-sans mt-0.5">
              Se as 4 IAs não convergirem para a mesma direção exata, a decisão é compulsoriamente WAIT.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#3DA5FF]/20 text-[#3DA5FF] font-black border border-[#3DA5FF]/40 text-xs">
            ENFORCED (4/4)
          </span>
        </div>
      </section>

      {/* Preferências de Terminal */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <span className="font-bold text-white uppercase text-xs">
            PREFERÊNCIAS DO OPERADOR
          </span>
        </div>

        <div className="space-y-2">
          {/* Som de Sinais */}
          <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <span className="font-bold text-white block">Alertas Sonoros</span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Tocar bipe curto quando um sinal 4/4 for emitido
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                settings.soundEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {settings.soundEnabled ? "ATIVADO" : "DESATIVADO"}
            </button>
          </div>

          {/* Auto Paper Trade */}
          <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-[#3DA5FF]" />
              <div>
                <span className="font-bold text-white block">Execução Automática no Paper</span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Abrir ordem simulada automaticamente quando houver consenso unânime 4/4
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleAutoPaper}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                settings.autoPaperTradeOnConsensus
                  ? "bg-[#3DA5FF]/20 text-[#3DA5FF] border border-[#3DA5FF]/40"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {settings.autoPaperTradeOnConsensus ? "ATIVADO" : "DESATIVADO"}
            </button>
          </div>

          {/* Reiniciar Saldo Paper */}
          <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-white block">Reiniciar Saldo Virtual</span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Restaura o saldo do Paper Trading para $10,000.00 USD
                </span>
              </div>
            </div>

            <button
              onClick={onResetPaperAccount}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#151D27] hover:bg-[#1E2836] text-white border border-white/[0.08] active:scale-95 transition-all"
            >
              REINICIAR SALDO
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
