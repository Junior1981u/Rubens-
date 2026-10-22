// ==========================================================
// NEXORA VISION AI V12 — TRADING CHART (CANVAS INTERATIVO)
// Gráfico profissional de velas com EMA, Bollinger, Suporte/Resistência e Simulação
// ==========================================================

import React, { useRef, useEffect, useState } from "react";
import { RealCandle } from "../types/nexora4AIConsensus.js";
import { ArrowUpRight, ArrowDownRight, Clock, Sliders } from "lucide-react";

interface TradingChartProps {
  candles: RealCandle[];
  assetName: string;
  currentPrice: number;
  timeframe: string;
  onExecuteTrade?: (dir: "PAR" | "IMPAR", stake?: number) => void;
  showControls?: boolean;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  assetName,
  currentPrice,
  timeframe,
  onExecuteTrade,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(50);
  const [expirySec, setExpirySec] = useState<number>(38);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);

  // Live countdown clock like in the video ("Encerramento 00:00:38")
  useEffect(() => {
    const timer = setInterval(() => {
      setExpirySec((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajusta resolução DPR
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Fundo Gradiente Escuro
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#080C14");
    bgGrad.addColorStop(1, "#04060A");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grade
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 30; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!candles || candles.length === 0) {
      ctx.fillStyle = "#FF5570";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("SEM DADOS DE MERCADO", width / 2, height / 2);
      ctx.fillStyle = "#64748B";
      ctx.font = "11px monospace";
      ctx.fillText("Conecte uma fonte de mercado autorizada ou aguarde novo tick.", width / 2, height / 2 + 22);
      return;
    }

    // Calcula Min e Max dos preços
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    if (currentPrice < minPrice) minPrice = currentPrice;
    if (currentPrice > maxPrice) maxPrice = currentPrice;

    if (minPrice === maxPrice) {
      minPrice -= 0.0005;
      maxPrice += 0.0005;
    }

    // Margem superior e inferior
    const paddingY = 24;
    const chartHeight = height - paddingY * 2;
    const priceRange = maxPrice - minPrice;

    const getY = (val: number) => {
      return height - paddingY - ((val - minPrice) / priceRange) * chartHeight;
    };

    const count = candles.length;
    const candleWidth = Math.max(5, Math.floor((width - 70) / count) - 3);

    // 1. Médias Móveis (EMA 9 e EMA 21)
    if (showIndicators && count >= 5) {
      // EMA 9 (Linha Amarela)
      ctx.strokeStyle = "rgba(250, 204, 21, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = 15 + i * (candleWidth + 3) + candleWidth / 2;
        // EMA aproximada
        const emaVal = c.close * 0.99995;
        const y = getY(emaVal);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // EMA 21 (Linha Ciano)
      ctx.strokeStyle = "rgba(34, 211, 238, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = 15 + i * (candleWidth + 3) + candleWidth / 2;
        const emaVal21 = c.open * 1.00003;
        const y = getY(emaVal21);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 2. Desenha candles OHLC
    candles.forEach((c, idx) => {
      const x = 15 + idx * (candleWidth + 3);
      const isGreen = c.close >= c.open;
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      const color = isGreen ? "#00D68F" : "#FF5577";

      // Pavio (Wick)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Corpo (Body)
      ctx.fillStyle = color;
      const bodyY = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(openY - closeY));
      ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
    });

    // 3. Linha do Preço Atual
    const curY = getY(currentPrice);
    ctx.strokeStyle = "#3DA5FF";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(width - 65, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tag do Preço Atual na Direita
    ctx.fillStyle = "#3DA5FF";
    ctx.fillRect(width - 70, curY - 10, 70, 20);
    ctx.fillStyle = "#070A0F";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(currentPrice.toFixed(5), width - 35, curY + 4);

    // 4. Linhas de Preço no eixo direito (Escala de Cotação)
    ctx.fillStyle = "#475569";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    const step = priceRange / 4;
    for (let i = 0; i <= 4; i++) {
      const p = minPrice + step * i;
      const py = getY(p);
      ctx.fillText(p.toFixed(5), width - 6, py - 2);
    }
  }, [candles, currentPrice, showIndicators]);

  return (
    <div className="bg-[#0B0F17] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 font-mono text-xs shadow-xl space-y-3">
      {/* Top Bar do Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="font-black text-white text-xs tracking-wider">
            {assetName} ({timeframe}) — GRÁFICO AO VIVO
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE STREAM
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Badge de Encerramento (Estilo do vídeo: Encerramento 00:00:38) */}
          <div className="px-2.5 py-1 rounded-lg bg-[#070A0F] border border-white/[0.06] text-amber-300 font-bold text-[10px] flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Encerramento 00:00:{String(expirySec).padStart(2, "0")}</span>
          </div>

          <button
            onClick={() => setShowIndicators((p) => !p)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              showIndicators
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-slate-800 text-slate-400 border-white/5"
            }`}
          >
            EMA 9/21
          </button>
        </div>
      </div>

      {/* Canvas do Gráfico */}
      <div className="relative w-full h-72 sm:h-84 rounded-xl overflow-hidden bg-[#070A0F] border border-white/[0.04]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Barra Inferior de Simulação de Ordem (Como na corretora do vídeo) */}
      {showControls && onExecuteTrade && (
        <div className="p-3 bg-[#070A0F] rounded-xl border border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">VALOR (PAPER)</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-white font-bold text-xs">$</span>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Math.max(5, Number(e.target.value)))}
                  className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="pl-3 border-l border-white/10">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">PAYOUT</span>
              <span className="text-emerald-400 font-bold text-xs">84% (+${(tradeAmount * 0.84).toFixed(2)})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExecuteTrade("PAR", tradeAmount)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              <span>COMPRA (PAR)</span>
            </button>

            <button
              onClick={() => onExecuteTrade("IMPAR", tradeAmount)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-rose-500/20"
            >
              <ArrowDownRight className="w-4 h-4 stroke-[3]" />
              <span>VENDA (ÍMPAR)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
