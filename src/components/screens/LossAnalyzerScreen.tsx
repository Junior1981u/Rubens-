import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
} from "lucide-react";
import { LossAutopsy, LossAnalysisReport } from "../../types/nexora4AIConsensus";

interface LossAnalyzerScreenProps {
  platform: string;
}

export const LossAnalyzerScreen: React.FC<LossAnalyzerScreenProps> = ({ platform }) => {
  const [selectedLossId, setSelectedLossId] = useState<string>("loss_01");

  const sampleLosses: LossAnalysisReport[] = [
    {
      lossId: "loss_01",
      timestamp: Date.now() - 3600000 * 2,
      platform: "QUOTEX",
      asset: "USD/JPY",
      timeframe: "1M",
      regime: "HIGH_VOLATILITY",
      setup: "Alternância de Paridade",
      failedAIs: ["GEMINI", "GROK"],
      successfulAIs: ["GPT", "CLAUDE"],
      allFailed: false,
      hadConsensus: false,
      hadContradiction: true,
      dataQuality: 88,
      latencyMs: 45,
      lossPattern: "Spike de Notícia Macro com quebra repentina de spread",
      rootCause: "Volatilidade súbita não absorvida pelo filtro de ATR no primeiro candle.",
      remedyRecommendation: "Calibrar limiar de ATR para 2.5x acima da média em pares JPY.",
    },
    {
      lossId: "loss_02",
      timestamp: Date.now() - 3600000 * 5,
      platform: "IQ_OPTION",
      asset: "EUR/USD",
      timeframe: "1M",
      regime: "BREAKOUT",
      setup: "Rompimento de Suporte",
      failedAIs: ["GPT", "GEMINI"],
      successfulAIs: ["CLAUDE"],
      allFailed: false,
      hadConsensus: false,
      hadContradiction: true,
      dataQuality: 92,
      latencyMs: 25,
      lossPattern: "Falso Rompimento com retração imediata (Bull Trap)",
      rootCause: "Divergência entre EMA9 e EMA21 no timeframe superior (5M).",
      remedyRecommendation: "Adicionar verificação cruzada de volume no M5 antes de breakout.",
    },
  ];

  const currentLoss = sampleLosses.find((l) => l.lossId === selectedLossId) || sampleLosses[0];

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 py-3 sm:py-5 font-mono">
      {/* Top Banner */}
      <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              AUTÓPSIA MULTIDIMENSIONAL DE PERDAS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            NEXORA LOSS ANALYZER V5
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Diagnóstico de causa-raiz, lições aprendidas e imunização contra perdas repetidas.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PROTEÇÃO ANTI-LOSS: ATIVA</span>
        </div>
      </div>

      {/* Regras e Filtros Anti-Loss em Execução */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 bg-[#0B0F17] border border-white/[0.08] rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold">STOP PERDAS CONSECUTIVAS:</span>
            <span className="text-emerald-400 font-bold">3 MAX</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Se ocorrerem 3 perdas seguidas, o sistema entra em Cooldown obrigatório de 15 minutos.
          </p>
        </div>

        <div className="p-4 bg-[#0B0F17] border border-white/[0.08] rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold">VETO DE DADOS DEGRADADOS:</span>
            <span className="text-emerald-400 font-bold">&lt; 80% VETO</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Qualquer delay de feed acima de 15s ou candle incompleto cancela imediatamente o sinal.
          </p>
        </div>

        <div className="p-4 bg-[#0B0F17] border border-white/[0.08] rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold">CONSENSO OBRIGATÓRIO:</span>
            <span className="text-[#3DA5FF] font-bold">4/4 ESTRITO</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            3/4 nunca é transformado em 4/4. Divergência resulta invariavelmente em WAIT.
          </p>
        </div>
      </section>

      {/* Seletor de Autópsias */}
      <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
          <span className="font-bold text-white uppercase text-xs">
            CASOS DE LOSS CATALOGADOS PARA RETREINAMENTO
          </span>
          <span className="text-[11px] text-slate-400">
            TOTAL DE PERDAS NO PERÍODO: {sampleLosses.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sampleLosses.map((loss) => (
            <button
              key={loss.lossId}
              onClick={() => setSelectedLossId(loss.lossId)}
              className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
                selectedLossId === loss.lossId
                  ? "bg-[#101720] border-amber-500/50 shadow-md shadow-amber-500/10"
                  : "bg-[#070A0F] border-white/[0.06] hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-white text-xs">{loss.asset} ({loss.timeframe})</strong>
                <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  LOSS
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans line-clamp-1">
                {loss.lossPattern}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>{loss.platform}</span>
                <span>{new Date(loss.timestamp).toLocaleTimeString()}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Relatório Detalhado da Autópsia Selecionada */}
      {currentLoss && (
        <section className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] text-xs">
            <div>
              <span className="text-base font-black text-white">
                AUTÓPSIA DETALHADA: {currentLoss.asset} ({currentLoss.timeframe})
              </span>
              <span className="text-slate-400 block text-[11px]">
                Plataforma: {currentLoss.platform} • Regime: {currentLoss.regime}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                QUALIDADE DADOS: {currentLoss.dataQuality}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#070A0F] rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                CAUSA-RAIZ DIAGNOSTICADA:
              </span>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {currentLoss.rootCause}
              </p>
            </div>

            <div className="p-3.5 bg-[#070A0F] rounded-xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                RECOMENDAÇÃO DE REMEDIAÇÃO:
              </span>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {currentLoss.remedyRecommendation}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] text-[11px] text-slate-300 font-sans flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Este evento foi registrado no banco de memória permanente da Nexora para evitar reincidência neste mesmo padrão de mercado.
            </span>
          </div>
        </section>
      )}
    </div>
  );
};
