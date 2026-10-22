// ==========================================================
// NEXORA TITAN AI — OLYMP TRADE SAFE MODE MODAL & DIAGNOSTIC
// Auditoria transparente da biblioteca olymptrade_ws, teste isolado, validação M1 e Paper Mode
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Play,
  RotateCw,
  X,
  CheckCircle2,
  Lock,
  Layers,
  Clock,
  Terminal,
  Cpu,
  ArrowRight,
  Database,
} from "lucide-react";
import { OlympTradeReport, CandleValidationResult } from "../../server/engine/olympTradeConnector.js";

interface OlympTradeSafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAsset?: string;
}

export const OlympTradeSafeModal: React.FC<OlympTradeSafeModalProps> = ({
  isOpen,
  onClose,
  currentAsset = "EUR/USD",
}) => {
  const [report, setReport] = useState<OlympTradeReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [validatingCandle, setValidatingCandle] = useState<boolean>(false);
  const [simulatingSignal, setSimulatingSignal] = useState<boolean>(false);
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);
  const [candleResult, setCandleResult] = useState<CandleValidationResult | null>(null);

  // Carrega diagnóstico inicial
  const fetchDiagnostic = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/olymptrade/diagnostic");
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setReport(data.report);
          if (data.report.lastCandleValidation) {
            setCandleResult(data.report.lastCandleValidation);
          }
        }
      }
    } catch (err) {
      console.warn("Erro ao buscar diagnóstico Olymp Trade:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostic();
    }
  }, [isOpen]);

  // Dispara teste seguro de conexão
  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const res = await fetch("/api/olymptrade/test-connection", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setReport(data.report);
        }
      }
    } catch (err) {
      console.error("Falha ao testar conexão:", err);
    } finally {
      setTestingConnection(false);
    }
  };

  // Dispara validação de candle M1 de teste
  const handleValidateSampleCandle = async () => {
    try {
      setValidatingCandle(true);
      const res = await fetch("/api/olymptrade/validate-candle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: currentAsset,
          timestamp: Date.now() - 15000,
          open: 1.08245,
          high: 1.08260,
          low: 1.08240,
          close: 1.08252,
          periodSeconds: 60,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.validation) {
          setCandleResult(data.validation);
        }
      }
    } catch (err) {
      console.error("Erro ao validar candle:", err);
    } finally {
      setValidatingCandle(false);
    }
  };

  // Dispara simulação de sinal em Paper Mode
  const handleSimulatePaperSignal = async () => {
    try {
      setSimulatingSignal(true);
      const res = await fetch("/api/olymptrade/simulate-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: currentAsset,
          timeframe: "M1",
          direction: Math.random() > 0.5 ? "PAR" : "IMPAR",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationFeedback(
          `Sinal [${data.simulatedSignal?.direction}] registrado no Paper Mode às ${new Date(
            data.simulatedSignal?.timestamp
          ).toLocaleTimeString("pt-BR")}. Zero ordens financeiras enviadas.`
        );
        fetchDiagnostic();
      }
    } catch (err) {
      console.error("Erro na simulação:", err);
    } finally {
      setSimulatingSignal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#090D18] border border-[#00D68F]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0B1120]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00D68F]/10 border border-[#00D68F]/30 flex items-center justify-center text-[#00D68F]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  OLYMP TRADE — CONECTOR SEGURO & AUDITORIA
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#00D68F]/20 text-[#00D68F] border border-[#00D68F]/40">
                  SAFE MODE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auditoria da biblioteca <code className="text-[#00D68F]">olymptrade_ws</code>, validação M1 e Paper Mode estrito.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs text-slate-300">
          {/* Status Badge & Alert Box */}
          <div className="p-3.5 rounded-xl bg-[#060810] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                ESTADO DA CONEXÃO
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    report?.state === "CONECTADO"
                      ? "bg-emerald-400 animate-ping"
                      : report?.state === "REQUER_AUTENTICACAO_PRIVADA"
                      ? "bg-amber-400"
                      : report?.state === "CONECTANDO"
                      ? "bg-cyan-400 animate-pulse"
                      : "bg-slate-500"
                  }`}
                />
                <span className="text-sm font-black text-white">
                  {report?.state || "NÃO TESTADO"}
                </span>
                {report?.connectionTimeMs ? (
                  <span className="text-[10px] text-slate-400">
                    ({report.connectionTimeMs}ms)
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-3 py-2 rounded-xl font-bold bg-[#00D68F]/20 hover:bg-[#00D68F]/30 text-[#00D68F] border border-[#00D68F]/40 flex items-center gap-1.5 text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
                <span>{testingConnection ? "TESTANDO..." : "TESTAR CONEXÃO"}</span>
              </button>
            </div>
          </div>

          {/* Aviso Explícito */}
          {report?.explicitWarning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{report.explicitWarning}</div>
            </div>
          )}

          {/* Auditoria da biblioteca Python olymptrade_ws */}
          <div className="p-4 rounded-xl bg-[#0D1322] border border-white/[0.08] space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Terminal className="w-4 h-4 text-[#00D68F]" />
              <span>AUDITORIA TÉCNICA: BIBLIOTECA PYTHON (olymptrade_ws)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                <span className="text-slate-500 block text-[10px]">STATUS OFICIAL:</span>
                <span className="text-rose-400 font-bold">NÃO OFICIAL (Reverse-Engineered)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                <span className="text-slate-500 block text-[10px]">ORIGEM / REPOSITÓRIO:</span>
                <span className="text-slate-200">ChipaDevTeam/OlympTradeAPI</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                <span className="text-slate-500 block text-[10px]">EXIGÊNCIA DE SESSÃO:</span>
                <span className="text-amber-300 font-bold">Requer access_token privado pós-login</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                <span className="text-slate-500 block text-[10px]">RISCO DE TOS:</span>
                <span className="text-rose-300 font-bold">ALTO (Suspensão de conta se detectado bot)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              <strong className="text-slate-200">Arquitetura do Projeto:</strong> O NEXORA TITAN AI opera sobre Node.js e TypeScript. Instanciar um backend Python exigiria gerenciar um processo secundário com bibliotecas comunitárias sem manutenção oficial e forçaria o usuário a extrair e colar seu token confidencial no aplicativo — violando diretamente as <strong>Regras 4 e 10</strong>.
            </p>
          </div>

          {/* Validação de Velas M1 */}
          <div className="p-4 rounded-xl bg-[#0D1322] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>VALIDAÇÃO DE VELAS M1 & FONTE DE REFERÊNCIA</span>
              </div>
              <button
                type="button"
                onClick={handleValidateSampleCandle}
                disabled={validatingCandle}
                className="px-2.5 py-1.5 rounded-lg font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3" />
                <span>VALIDAR AMOSTRA M1</span>
              </button>
            </div>

            {candleResult ? (
              <div className="space-y-2 text-[11px]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                    <span className="text-slate-500 block text-[10px]">PERÍODO M1:</span>
                    <span className={candleResult.timeframeM1Confirmed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {candleResult.timeframeM1Confirmed ? "CONFIRMADO (60s)" : "INVÁLIDO"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                    <span className="text-slate-500 block text-[10px]">COERÊNCIA OHLC:</span>
                    <span className={candleResult.ohlcConsistent ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {candleResult.ohlcConsistent ? "VÁLIDO (H>=O,C,L)" : "INCONSISTENTE"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                    <span className="text-slate-500 block text-[10px]">IDADE DOS DADOS:</span>
                    <span className={candleResult.isDelayed ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      {candleResult.ageSeconds}s ({candleResult.isDelayed ? "ATRASADO" : "FRESCO"})
                    </span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
                    <span className="text-slate-500 block text-[10px]">STATUS GERAL:</span>
                    <span className={candleResult.valid ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {candleResult.valid ? "APROVADO" : "REJEITADO"}
                    </span>
                  </div>
                </div>

                {candleResult.referenceComparison && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">
                      Comparação c/ Referência: <strong className="text-white">{candleResult.referenceComparison.referenceSource}</strong> ({candleResult.referenceComparison.referencePrice})
                    </span>
                    <span className="text-cyan-300 font-bold">
                      Diferença: {candleResult.referenceComparison.difference} ({candleResult.referenceComparison.percentageDiff}%)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Pressione "VALIDAR AMOSTRA M1" para submeter uma vela M1 ao rigoroso algoritmo de verificação OHLC e comparação com o feed de referência.
              </p>
            )}
          </div>

          {/* Simulação em Paper Mode */}
          <div className="p-4 rounded-xl bg-[#0D1322] border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>SIMULADOR PAPER MODE (Zero Execução Financeira)</span>
              </div>
              <button
                type="button"
                onClick={handleSimulatePaperSignal}
                disabled={simulatingSignal}
                className="px-3 py-1.5 rounded-lg font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{simulatingSignal ? "REGISTRANDO..." : "SIMULAR SINAL PAPER"}</span>
              </button>
            </div>

            {simulationFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                {simulationFeedback}
              </div>
            )}

            <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1 border-t border-white/[0.04]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Garantia Estrita de Segurança:</strong> Nenhuma função de envio de ordens (
                <code>place_order</code>, <code>close_position</code>) existe ou é executada. O PAPER MODE permanece 100% ativo.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#070912] flex items-center justify-between text-[11px] text-slate-400">
          <span>NEXORA TITAN AI — Safe Connector Protocol</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
};
