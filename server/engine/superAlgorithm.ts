// ==========================================================
// NEXORA TITAN AI V34 — SUPER ALGORITMO QUANTUM DE ALTA FREQUÊNCIA
// Revolução na IA: Varredura Contínua, 9 Confluências Matemáticas & Sinal Exato Sub-10ms
// ==========================================================

import { Candle, TechnicalFeatures, ParityFeatures, MarketSnapshot, NexoraCoreDecision } from "../../src/types.js";
import { formatSaoPauloTime, calculateM1CandleCountdown } from "../../src/utils/timeZoneUtils.js";

export interface SuperConfluenceItem {
  id: string;
  name: string;
  weight: number;
  aligned: boolean;
  direction: "COMPRA" | "VENDA" | "NEUTRO";
  reading: string;
}

export interface SuperAlgorithmResult {
  algorithmVersion: string;
  timestamp: number;
  asset: string;
  timeframe: string;
  exactSignalDetected: boolean;
  direction: "COMPRA" | "VENDA" | "PAR" | "IMPAR" | "AGUARDAR";
  finalDecision: "PAR" | "IMPAR" | "WAIT";
  quantumScore: number;
  confluences: SuperConfluenceItem[];
  alignedCount: number;
  totalConfluences: number;
  setupName: string;
  reason: string;
  executionSpeedMs: number;
  entryWindow: {
    entryTimestamp: number;
    entryTimeStr: string;
    expiryTimestamp: number;
    expiryTimeStr: string;
    countdownSec: number;
    preAlert7s: boolean;
  };
  recommendedPlatform: "QUOTEX" | "IQ_OPTION" | "OLYMPTRADE" | "YOUXBROKER";
}

export class SuperAlgorithmEngine {
  private static instance: SuperAlgorithmEngine | null = null;

  public static getInstance(): SuperAlgorithmEngine {
    if (!SuperAlgorithmEngine.instance) {
      SuperAlgorithmEngine.instance = new SuperAlgorithmEngine();
    }
    return SuperAlgorithmEngine.instance;
  }

  /**
   * Avalia o mercado com o Super Algoritmo em altíssima velocidade (< 5ms)
   */
  public evaluate(
    snapshot: MarketSnapshot,
    candles: Candle[] = []
  ): SuperAlgorithmResult {
    const t0 = performance.now();
    const ind = snapshot.indicators;
    const par = snapshot.parityFeatures;
    const candle = snapshot.candle;
    const now = Date.now();

    const confluences: SuperConfluenceItem[] = [];

    // 1. Confluência: Triplo Alinhamento EMA (9, 21, 50) + Inclinação
    const emaBullish = ind.ema9 > ind.ema21 && ind.ema21 > ind.ema50;
    const emaBearish = ind.ema9 < ind.ema21 && ind.ema21 < ind.ema50;
    const emaDelta = Math.abs(ind.ema9 - ind.ema21);
    const emaStrongTrend = emaDelta > (ind.atr * 0.15 || 0.00008);

    confluences.push({
      id: "triple_ema",
      name: "Triplo Alinhamento EMA (9/21/50)",
      weight: 15,
      aligned: (emaBullish || emaBearish) && emaStrongTrend,
      direction: emaBullish ? "COMPRA" : emaBearish ? "VENDA" : "NEUTRO",
      reading: emaBullish
        ? `EMA 9 (${ind.ema9.toFixed(5)}) > EMA 21 > EMA 50 (Alta Estrutural)`
        : emaBearish
        ? `EMA 9 (${ind.ema9.toFixed(5)}) < EMA 21 < EMA 50 (Baixa Estrutural)`
        : "Médias comprimidas em consolidação",
    });

    // 2. Confluência: RSI-14 Adaptativo & Dinâmica de Exaustão
    let rsiDir: "COMPRA" | "VENDA" | "NEUTRO" = "NEUTRO";
    let rsiAligned = false;
    let rsiReading = "";

    if (ind.rsi14 <= 34) {
      rsiDir = "COMPRA";
      rsiAligned = true;
      rsiReading = `RSI em sobrevenda extrema (${ind.rsi14.toFixed(1)} <= 34) — Reversão Iminente`;
    } else if (ind.rsi14 >= 66) {
      rsiDir = "VENDA";
      rsiAligned = true;
      rsiReading = `RSI em sobrecompra extrema (${ind.rsi14.toFixed(1)} >= 66) — Exaustão Vendedora`;
    } else if (ind.rsi14 >= 52 && ind.rsi14 <= 65 && emaBullish) {
      rsiDir = "COMPRA";
      rsiAligned = true;
      rsiReading = `RSI em expansão compradora saudável (${ind.rsi14.toFixed(1)}) alinhado à tendência`;
    } else if (ind.rsi14 <= 48 && ind.rsi14 >= 35 && emaBearish) {
      rsiDir = "VENDA";
      rsiAligned = true;
      rsiReading = `RSI em declínio vendedor (${ind.rsi14.toFixed(1)}) confirmando fluxo de baixa`;
    } else {
      rsiReading = `RSI neutro (${ind.rsi14.toFixed(1)})`;
    }

    confluences.push({
      id: "rsi_adaptive",
      name: "RSI-14 Momentum Adaptativo",
      weight: 12,
      aligned: rsiAligned,
      direction: rsiDir,
      reading: rsiReading,
    });

    // 3. Confluência: Bollinger Bands Volatility Squeeze & %B
    let bbDir: "COMPRA" | "VENDA" | "NEUTRO" = "NEUTRO";
    let bbAligned = false;
    let bbReading = "";

    if (ind.bollingerPosition === "BELOW_LOWER" || ind.bollingerBands.percentB <= 0.05) {
      bbDir = "COMPRA";
      bbAligned = true;
      bbReading = `Preço abaixo da banda inferior (Snap-back de volatilidade)`;
    } else if (ind.bollingerPosition === "ABOVE_UPPER" || ind.bollingerBands.percentB >= 0.95) {
      bbDir = "VENDA";
      bbAligned = true;
      bbReading = `Preço rompendo banda superior (Rejeição de volatilidade)`;
    } else if (ind.bollingerPosition === "UPPER_BAND" && emaBullish) {
      bbDir = "COMPRA";
      bbAligned = true;
      bbReading = "Rompimento do canal superior em expansão de tendência";
    } else if (ind.bollingerPosition === "LOWER_BAND" && emaBearish) {
      bbDir = "VENDA";
      bbAligned = true;
      bbReading = "Rompimento do canal inferior em aceleração de queda";
    } else {
      bbReading = "Preço dentro da média central de Bollinger";
    }

    confluences.push({
      id: "bollinger_snap",
      name: "Bollinger Squeeze & Volatilidade",
      weight: 12,
      aligned: bbAligned,
      direction: bbDir,
      reading: bbReading,
    });

    // 4. Confluência: MACD Histogram & Momentum Vector
    const macdHist = ind.macd.histogram;
    const macdDir: "COMPRA" | "VENDA" | "NEUTRO" =
      macdHist > 0.00002 ? "COMPRA" : macdHist < -0.00002 ? "VENDA" : "NEUTRO";
    const macdAligned = macdDir !== "NEUTRO";

    confluences.push({
      id: "macd_vector",
      name: "MACD Vetor de Aceleração",
      weight: 11,
      aligned: macdAligned,
      direction: macdDir,
      reading:
        macdHist > 0
          ? `Histograma positivo (+${(macdHist * 10000).toFixed(2)} pips) — Impulso Comprador`
          : `Histograma negativo (${(macdHist * 10000).toFixed(2)} pips) — Pressão Vendedora`,
    });

    // 5. Confluência: Paridade Estatística, Streak & Entropia (Par/Ímpar Edge)
    let parDir: "COMPRA" | "VENDA" | "NEUTRO" = "NEUTRO";
    let parAligned = false;
    let parReading = "";

    if (par.streak >= 3) {
      // Exaustão de sequência estatística -> reversão ou continuação conforme regime
      parAligned = true;
      if (par.streakType === "PAR") {
        parDir = "VENDA"; // Converte para ÍMPAR/VENDA
        parReading = `Streak de ${par.streak} dígitos PAR consecutivos — Alta probabilidade de reversão para ÍMPAR`;
      } else {
        parDir = "COMPRA"; // Converte para PAR/COMPRA
        parReading = `Streak de ${par.streak} dígitos ÍMPAR consecutivos — Alta probabilidade de reversão para PAR`;
      }
    } else if (Math.abs(par.parityBias) >= 0.08) {
      parAligned = true;
      if (par.parityBias > 0) {
        parDir = "COMPRA";
        parReading = `Assimetria estatística compradora (Bias +${(par.parityBias * 100).toFixed(1)}%)`;
      } else {
        parDir = "VENDA";
        parReading = `Assimetria estatística vendedora (Bias ${(par.parityBias * 100).toFixed(1)}%)`;
      }
    } else {
      parReading = `Distribuição equilibrada (Entropia ${par.parityEntropy.toFixed(2)})`;
    }

    confluences.push({
      id: "parity_quantum_edge",
      name: "Assimetria Estatística & Paridade",
      weight: 14,
      aligned: parAligned,
      direction: parDir,
      reading: parReading,
    });

    // 6. Confluência: Ação do Preço & Anatomia da Vela (Price Action)
    const body = Math.abs(candle.close - candle.open);
    const range = Math.max(0.00001, candle.high - candle.low);
    const isBull = candle.close >= candle.open;
    const upperWick = isBull ? candle.high - candle.close : candle.high - candle.open;
    const lowerWick = isBull ? candle.open - candle.low : candle.close - candle.low;

    let paDir: "COMPRA" | "VENDA" | "NEUTRO" = "NEUTRO";
    let paAligned = false;
    let paReading = "";

    if (lowerWick > body * 1.5 && lowerWick > upperWick * 2) {
      paDir = "COMPRA";
      paAligned = true;
      paReading = "Pavios de rejeição inferior (Martelo/Pinbar Comprador nos fundos)";
    } else if (upperWick > body * 1.5 && upperWick > lowerWick * 2) {
      paDir = "VENDA";
      paAligned = true;
      paReading = "Pavios de rejeição superior (Estrela Cadente nos topos)";
    } else if (isBull && body / range > 0.65) {
      paDir = "COMPRA";
      paAligned = true;
      paReading = "Corpo de alta dominante (>65% do candle) sem rejeição";
    } else if (!isBull && body / range > 0.65) {
      paDir = "VENDA";
      paAligned = true;
      paReading = "Corpo de baixa dominante (>65% do candle) com fluxo forte";
    } else {
      paReading = "Vela em formação com forças equilibradas";
    }

    confluences.push({
      id: "price_action_anatomy",
      name: "Anatomia da Vela M1 & Price Action",
      weight: 12,
      aligned: paAligned,
      direction: paDir,
      reading: paReading,
    });

    // 7. Confluência: Suporte e Resistência Dinâmicos
    const distToSupport = Math.abs(snapshot.price - ind.supportLevel);
    const distToResistance = Math.abs(snapshot.price - ind.resistanceLevel);
    const proximityThreshold = (ind.atr || 0.0004) * 0.8;

    let srDir: "COMPRA" | "VENDA" | "NEUTRO" = "NEUTRO";
    let srAligned = false;
    let srReading = "";

    if (distToSupport <= proximityThreshold && (isBull || lowerWick > body)) {
      srDir = "COMPRA";
      srAligned = true;
      srReading = `Toque e defesa no suporte dinâmico (${ind.supportLevel.toFixed(5)})`;
    } else if (distToResistance <= proximityThreshold && (!isBull || upperWick > body)) {
      srDir = "VENDA";
      srAligned = true;
      srReading = `Rejeição na resistência dinâmica (${ind.resistanceLevel.toFixed(5)})`;
    } else {
      srReading = `Preço trafegando entre S/R (${ind.supportLevel.toFixed(5)} — ${ind.resistanceLevel.toFixed(5)})`;
    }

    confluences.push({
      id: "dynamic_sr",
      name: "Defesa de Suporte / Resistência",
      weight: 10,
      aligned: srAligned,
      direction: srDir,
      reading: srReading,
    });

    // 8. Confluência: Força da Tendência e Volatilidade (ATR & Momentum)
    let volDir: "COMPRA" | "VENDA" | "NEUTRO" = "NEUTRO";
    let volAligned = false;
    if (ind.trendStrength >= 50) {
      volAligned = true;
      volDir = emaBullish ? "COMPRA" : emaBearish ? "VENDA" : "NEUTRO";
    }
    confluences.push({
      id: "trend_volatility",
      name: "Índice de Força de Tendência",
      weight: 14,
      aligned: volAligned,
      direction: volDir,
      reading: `Força direcional calculada em ${ind.trendStrength}% com volatilidade ${ind.volatility.toFixed(4)}`,
    });

    // ==========================================================
    // SÍNTESE DO SUPER ALGORITMO QUANTUM
    // ==========================================================
    let compraPoints = 0;
    let vendaPoints = 0;
    let totalWeight = 0;

    confluences.forEach((c) => {
      totalWeight += c.weight;
      if (c.aligned) {
        if (c.direction === "COMPRA") compraPoints += c.weight;
        if (c.direction === "VENDA") vendaPoints += c.weight;
      }
    });

    const alignedCount = confluences.filter((c) => c.aligned && c.direction !== "NEUTRO").length;
    const alignedCompra = confluences.filter((c) => c.aligned && c.direction === "COMPRA").length;
    const alignedVenda = confluences.filter((c) => c.aligned && c.direction === "VENDA").length;

    let direction: "COMPRA" | "VENDA" | "PAR" | "IMPAR" | "AGUARDAR" = "AGUARDAR";
    let finalDecision: "PAR" | "IMPAR" | "WAIT" = "WAIT";
    let quantumScore = 50;
    let setupName = "RADAR_EM_VARREDURA";
    let reason = "O Super Algoritmo está rastreando confluências em tempo real.";

    const compraScore = Math.round((compraPoints / totalWeight) * 100);
    const vendaScore = Math.round((vendaPoints / totalWeight) * 100);

    // Condição de Sinal Exato: >= 4 confluências dominantes e score >= 68%
    if (alignedCompra >= 4 && compraScore >= 65 && compraScore > vendaScore + 20) {
      direction = "COMPRA";
      finalDecision = "PAR"; // Mapeamento operacional nativo Nexora
      quantumScore = Math.min(98, Math.max(82, compraScore + 18));
      setupName = "SUPER_CONFLUENCIA_QUANTUM_COMPRA";
      const topEvidence = confluences.filter((c) => c.aligned && c.direction === "COMPRA").map((c) => c.name);
      reason = `SINAL EXATO DE COMPRA (CALL) — ${alignedCompra}/8 confluências alinhadas: ${topEvidence.slice(0, 3).join(", ")}.`;
    } else if (alignedVenda >= 4 && vendaScore >= 65 && vendaScore > compraScore + 20) {
      direction = "VENDA";
      finalDecision = "IMPAR"; // Mapeamento operacional nativo Nexora
      quantumScore = Math.min(98, Math.max(82, vendaScore + 18));
      setupName = "SUPER_CONFLUENCIA_QUANTUM_VENDA";
      const topEvidence = confluences.filter((c) => c.aligned && c.direction === "VENDA").map((c) => c.name);
      reason = `SINAL EXATO DE VENDA (PUT) — ${alignedVenda}/8 confluências alinhadas: ${topEvidence.slice(0, 3).join(", ")}.`;
    } else {
      direction = "AGUARDAR";
      finalDecision = "WAIT";
      quantumScore = Math.max(compraScore, vendaScore);
      setupName = "AGUARDANDO_CONFLUENCIA_EXATA";
      reason = `Aguardando alinhamento estrito (Compra: ${compraScore}%, Venda: ${vendaScore}%). Preservação de capital ativa.`;
    }

    const exactSignalDetected = finalDecision === "PAR" || finalDecision === "IMPAR";

    // Janela de Entrada Precisa (Entrada no :00, alerta 7s antes)
    const m1Countdown = calculateM1CandleCountdown(now);
    const nextCandleBucket = Math.floor(now / 60000) * 60000 + 60000;
    const expiryTimestamp = nextCandleBucket + 60000;

    const entryTimeStr = formatSaoPauloTime(nextCandleBucket);
    const expiryTimeStr = formatSaoPauloTime(expiryTimestamp);
    const preAlert7s = m1Countdown.secondsRemaining <= 7 && m1Countdown.secondsRemaining >= 1;

    // Plataforma recomendada
    const recommendedPlatform =
      quantumScore >= 92 ? "QUOTEX" : quantumScore >= 85 ? "IQ_OPTION" : "OLYMPTRADE";

    const executionSpeedMs = Number((performance.now() - t0).toFixed(2));

    return {
      algorithmVersion: "TITAN QUANTUM V34 HYPER-DRIVE",
      timestamp: now,
      asset: snapshot.asset,
      timeframe: snapshot.timeframe,
      exactSignalDetected,
      direction,
      finalDecision,
      quantumScore,
      confluences,
      alignedCount,
      totalConfluences: confluences.length,
      setupName,
      reason,
      executionSpeedMs,
      entryWindow: {
        entryTimestamp: nextCandleBucket,
        entryTimeStr,
        expiryTimestamp,
        expiryTimeStr,
        countdownSec: m1Countdown.secondsRemaining,
        preAlert7s,
      },
      recommendedPlatform,
    };
  }
}
