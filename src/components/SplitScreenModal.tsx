// ==========================================================
// NEXORA VISION AI V12 PRO — MODO TELA DIVIDIDA WINDOWS SNAP
// Instruções visuais, controle de janela da corretora e atalhos
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Sparkles,
  Monitor,
  Columns2,
  Keyboard,
  Info,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export interface BrokerPreset {
  id: string;
  name: string;
  url: string;
  badge: string;
  payout: string;
}

export const BROKER_PRESETS: BrokerPreset[] = [
  { id: "youxbroker", name: "YOUXBROKER", url: "https://trade.youxbroker.com/traderoom?registered=1", badge: "🌐", payout: "90%" },
  { id: "pocketoption", name: "POCKET OPTION", url: "https://pocketoption.com/pt/", badge: "🟠", payout: "92%" },
  { id: "quotex", name: "QUOTEX", url: "https://qxbroker.com/pt/", badge: "🟣", payout: "90%" },
  { id: "iqoption", name: "IQ OPTION", url: "https://iqoption.com/", badge: "🔵", payout: "87%" },
  { id: "deriv", name: "DERIV", url: "https://app.deriv.com/", badge: "🔴", payout: "95%" },
  { id: "olymptrade", name: "OLYMP TRADE", url: "https://olymptrade.com/pt-br/", badge: "🟢", payout: "85%" },
];

const STORAGE_BROKER_URL_KEY = "nexora_broker_custom_url";
const STORAGE_BROKER_ID_KEY = "nexora_broker_preset_id";

interface SplitScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIntegratedSplit?: () => void;
}

export const SplitScreenModal: React.FC<SplitScreenModalProps> = ({
  isOpen,
  onClose,
  onOpenIntegratedSplit,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_BROKER_ID_KEY) || "pocketoption";
  });
  const [customUrl, setCustomUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_BROKER_URL_KEY) || "https://pocketoption.com/pt/";
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showHowToGuide, setShowHowToGuide] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [lastOpenedTime, setLastOpenedTime] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sincroniza estado de fullscreen
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  if (!isOpen) return null;

  const currentPreset = BROKER_PRESETS.find((p) => p.id === selectedPresetId);
  const effectiveUrl = customUrl.trim() || currentPreset?.url || "https://pocketoption.com/pt/";

  // Função para abrir corretora com detecção de bloqueio de pop-up
  const handleOpenBroker = () => {
    setPopupBlocked(false);
    try {
      // Abre a corretora em nova janela com dimensões padrão para a metade esquerda da tela
      const screenW = window.screen.availWidth || 1920;
      const screenH = window.screen.availHeight || 1080;
      const targetW = Math.round(screenW * 0.65);
      const targetH = screenH;

      const newWin = window.open(
        effectiveUrl,
        "_blank",
        `width=${targetW},height=${targetH},left=0,top=0,menubar=no,toolbar=no,location=yes,status=yes,resizable=yes,scrollbars=yes`
      );

      // Verificação segura se o navegador bloqueou o pop-up
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        setPopupBlocked(true);
      } else {
        setPopupBlocked(false);
        setLastOpenedTime(Date.now());
        if (newWin.focus) {
          try {
            newWin.focus();
          } catch {
            // Ignora se restrito pelo sandbox
          }
        }
      }
    } catch (err) {
      console.warn("Erro ao tentar abrir janela:", err);
      setPopupBlocked(true);
    }
  };

  // Alternar tela cheia da NEXORA
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen não suportado ou bloqueado pelo navegador:", err);
    }
  };

  const handleSelectPreset = (preset: BrokerPreset) => {
    setSelectedPresetId(preset.id);
    setCustomUrl(preset.url);
    localStorage.setItem(STORAGE_BROKER_ID_KEY, preset.id);
    localStorage.setItem(STORAGE_BROKER_URL_KEY, preset.url);
  };

  const handleSaveCustomUrl = (newUrl: string) => {
    setCustomUrl(newUrl);
    localStorage.setItem(STORAGE_BROKER_URL_KEY, newUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 font-mono text-xs text-[#F5F7FF]">
      <div className="relative w-full max-w-3xl bg-[#0D1220] border border-white/[0.12] rounded-3xl p-4 sm:p-6 shadow-2xl shadow-cyan-500/10 space-y-5 my-auto">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header do Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#22D3EE] via-[#8B5CF6] to-[#00D084] p-0.5 flex items-center justify-center shadow-lg shadow-[#22D3EE]/25">
              <div className="w-full h-full bg-[#070912] rounded-[14px] flex items-center justify-center">
                <Columns2 className="w-5 h-5 text-[#22D3EE]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  MODO TELA DIVIDIDA <span className="text-[#22D3EE]">WINDOWS PRO</span>
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#8B5CF6]/25 text-[#8B5CF6] border border-[#8B5CF6]/40">
                  SNAP 65/35
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gráfico da Corretora à esquerda (65%) e Painel NEXORA à direita (35%)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Alerta de Bloqueador de Pop-ups (Requisito 5) */}
        {popupBlocked && (
          <div className="p-3.5 rounded-2xl bg-[#FF5570]/15 border border-[#FF5570]/40 text-[#FF5570] space-y-2 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 font-black text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF5570]" />
              <span>BLOQUEADOR DE POP-UPS DETECTADO NO NAVEGADOR</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
              O seu navegador impediu a abertura automática da nova janela da corretora.
              Para resolver isso de forma permanente:
            </p>
            <ol className="list-decimal list-inside text-[11px] text-slate-300 font-sans space-y-1">
              <li>Clique no ícone de pop-up bloqueado na barra de endereços (ao lado do cadeado da URL).</li>
              <li>Selecione <strong>"Sempre permitir pop-ups e redirecionamentos deste site"</strong> e confirme.</li>
              <li>Em seguida, clique no botão <strong>"ABRIR CORRETORA"</strong> novamente abaixo.</li>
            </ol>
            <div className="pt-1 flex items-center gap-2">
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPopupBlocked(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5570] text-black font-black text-[11px] hover:bg-[#FF5570]/90 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                ABRIR CORRETORA DIRETAMENTE EM NOVA ABA
              </a>
            </div>
          </div>
        )}

        {/* 3. Seletor e Configuração da Corretora (Requisito 2) */}
        <div className="p-3.5 rounded-2xl bg-[#070912] border border-white/[0.08] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-[#22D3EE]" />
              CORRETORA SELECIONADA
            </span>
            <button
              onClick={() => setIsConfigOpen((p) => !p)}
              className="text-[10px] text-[#22D3EE] hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              {isConfigOpen ? "Fechar Configuração" : "Configurar Endereço / URL"}
            </button>
          </div>

          {/* Presets rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {BROKER_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id && customUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    isSelected
                      ? "bg-[#22D3EE]/15 border-[#22D3EE] text-white shadow-sm shadow-[#22D3EE]/20"
                      : "bg-[#0D1220] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span className="text-base">{preset.badge}</span>
                  <span className="font-black text-[10px] truncate max-w-full">{preset.name}</span>
                  <span className="text-[9px] text-[#00D084] font-bold">{preset.payout}</span>
                </button>
              );
            })}
          </div>

          {/* Campo de URL personalizada se aberto */}
          {isConfigOpen && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5 animate-in fade-in duration-150">
              <label className="text-[10px] text-slate-400 font-bold">
                ENDEREÇO OFICIAL DA SUA CORRETORA (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => handleSaveCustomUrl(e.target.value)}
                  placeholder="https://suacorretora.com"
                  className="flex-1 bg-[#0D1220] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#22D3EE]"
                />
                <button
                  onClick={() => {
                    handleSelectPreset(BROKER_PRESETS[0]);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px] font-bold cursor-pointer"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[9px] text-slate-500 font-sans">
                Você pode utilizar o link oficial da sua conta Quotex, Pocket Option, IQ Option ou qualquer outra plataforma autorizada.
              </p>
            </div>
          )}
        </div>

        {/* 4. Instruções Visuais do Windows Snap (Requisitos 3 e 6) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0D1220] to-[#070912] border border-white/[0.08] space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider text-white flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-[#8B5CF6]" />
              COMO ENCAIXAR AS DUAS JANELAS NO WINDOWS (SNAP ASSIST)
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00D084]/15 text-[#00D084] font-bold border border-[#00D084]/30">
              100% NATIVO WINDOWS
            </span>
          </div>

          {/* Gráfico Ilustrado de Dividir Tela */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Esquerda: Corretora */}
            <div className="p-3 rounded-xl bg-[#090D18] border border-[#22D3EE]/30 space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] text-[#22D3EE] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
                  1. ÁREA DA CORRETORA (ESQUERDA ~65%)
                </span>
                <span className="text-[9px] text-slate-500">Janela 1</span>
              </div>
              <p className="text-[10px] text-slate-300 font-sans">
                Clique na janela da sua corretora e aperte o atalho:
              </p>
              {/* Teclas 3D */}
              <div className="flex items-center gap-2 pt-1">
                <div className="px-2.5 py-1.5 rounded-lg bg-[#141B2E] border border-white/20 text-white font-black text-xs shadow-md shadow-black/40 flex items-center gap-1">
                  <span>⊞</span>
                  <span>Win</span>
                </div>
                <span className="text-slate-400 font-bold">+</span>
                <div className="px-3 py-1.5 rounded-lg bg-[#22D3EE]/20 border border-[#22D3EE]/50 text-[#22D3EE] font-black text-xs shadow-md shadow-[#22D3EE]/20 flex items-center gap-1">
                  <span>←</span>
                  <span>Seta Esquerda</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-sans mt-1">
                A corretora será fixada instantaneamente na metade esquerda do seu monitor!
              </p>
            </div>

            {/* Direita: NEXORA */}
            <div className="p-3 rounded-xl bg-[#090D18] border border-[#8B5CF6]/30 space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] text-[#8B5CF6] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  2. ÁREA DA NEXORA (DIREITA ~35%)
                </span>
                <span className="text-[9px] text-slate-500">Janela Atual</span>
              </div>
              <p className="text-[10px] text-slate-300 font-sans">
                Agora clique nesta janela da NEXORA e aperte o atalho:
              </p>
              {/* Teclas 3D */}
              <div className="flex items-center gap-2 pt-1">
                <div className="px-2.5 py-1.5 rounded-lg bg-[#141B2E] border border-white/20 text-white font-black text-xs shadow-md shadow-black/40 flex items-center gap-1">
                  <span>⊞</span>
                  <span>Win</span>
                </div>
                <span className="text-slate-400 font-bold">+</span>
                <div className="px-3 py-1.5 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-[#8B5CF6] font-black text-xs shadow-md shadow-[#8B5CF6]/20 flex items-center gap-1">
                  <span>→</span>
                  <span>Seta Direita</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-sans mt-1">
                A NEXORA encaixa perfeitamente na direita para acompanhar as 4 IAs em tempo real!
              </p>
            </div>
          </div>

          {/* Nota de Segurança e Sandbox (Requisito 6) */}
          <div className="p-2.5 rounded-xl bg-[#070912] border border-white/[0.06] flex items-start gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#00D084] shrink-0 mt-0.5" />
            <div className="font-sans leading-tight">
              <strong className="text-slate-300 font-mono">Segurança e Integridade:</strong> O navegador web
              opera em sandbox de segurança protegido e não tem permissão para redimensionar ou mover outras janelas do
              Windows de forma invasiva. O recurso oficial <code className="text-[#22D3EE] font-mono">Win + Setas</code> é
              o mecanismo oficial do Windows para divisão de tela rápida e sem risco à sua máquina.
            </div>
          </div>
        </div>

        {/* 5. Seção "COMO DIVIDIR A TELA" (Expandível) */}
        {showHowToGuide && (
          <div className="p-3.5 rounded-2xl bg-[#070912] border border-[#22D3EE]/30 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs text-[#22D3EE] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                GUIA PASSO A PASSO COMPLETO
              </h3>
              <button
                onClick={() => setShowHowToGuide(false)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                Ocultar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-sans">
              <div className="p-2.5 rounded-xl bg-[#0D1220] border border-white/[0.04]">
                <div className="text-[#22D3EE] font-mono font-bold mb-1">Passo 1: Abrir</div>
                <p className="text-slate-300">
                  Clique no botão <strong>"ABRIR CORRETORA"</strong>. A página oficial da corretora abrirá em uma nova janela.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1220] border border-white/[0.04]">
                <div className="text-[#8B5CF6] font-mono font-bold mb-1">Passo 2: Encaixar Esquerda</div>
                <p className="text-slate-300">
                  Na janela da corretora, aperte <strong>Win + Seta Esquerda</strong>. Ela ocupará metade da tela.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1220] border border-white/[0.04]">
                <div className="text-[#00D084] font-mono font-bold mb-1">Passo 3: Encaixar Direita</div>
                <p className="text-slate-300">
                  Nesta janela da NEXORA, aperte <strong>Win + Seta Direita</strong>. Arraste a linha do meio para 65%/35%.
                </p>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 font-sans pt-1">
              * Usuários Mac: Segure o botão verde de maximizar da janela e selecione "Mover para o lado esquerdo da tela".
            </div>
          </div>
        )}

        {/* 6. Barra de Ações e Botões Principais (Requisito 4 e 5) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Botão ABRIR CORRETORA */}
            <button
              onClick={handleOpenBroker}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#00D084] text-black font-black text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-[#22D3EE]/25 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>ABRIR CORRETORA</span>
            </button>

            {/* Botão MAXIMIZAR PAINEL (NEXORA) */}
            <button
              onClick={handleToggleFullscreen}
              className="px-3.5 py-2.5 rounded-xl bg-[#0D1220] hover:bg-white/[0.08] text-white border border-white/10 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Alternar tela cheia"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>RESTAURAR PAINEL</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>MAXIMIZAR PAINEL</span>
                </>
              )}
            </button>

            {/* Botão REDEFINIR LAYOUT */}
            <button
              onClick={() => {
                if (onOpenIntegratedSplit) {
                  onOpenIntegratedSplit();
                }
                setPopupBlocked(false);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#0D1220] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Redefinir layout padrão"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>REDEFINIR LAYOUT</span>
            </button>

            {/* Botão COMO DIVIDIR A TELA */}
            <button
              onClick={() => setShowHowToGuide((p) => !p)}
              className="px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>{showHowToGuide ? "OCULTAR GUIA" : "COMO DIVIDIR A TELA"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenIntegratedSplit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenIntegratedSplit();
                }}
                className="px-3 py-2 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                title="Abrir Gráfico e NEXORA lado a lado na mesma janela"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>LAYOUT INTEGRADO 65/35</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold text-[11px] cursor-pointer"
            >
              CONCLUÍDO
            </button>
          </div>
        </div>

        {lastOpenedTime && (
          <div className="text-center text-[10px] text-[#00D084] font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Janela da corretora aberta com sucesso! Agora utilize Win + ← e Win + → para posicionar.</span>
          </div>
        )}
      </div>
    </div>
  );
};
