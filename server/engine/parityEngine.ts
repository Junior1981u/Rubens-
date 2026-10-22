// ==========================================================
// NEXORA TRADER AI V11 — PARITY ENGINE
// Rigorous Statistical Parity Analysis (Digit Parity, Streaks, Entropy, Transitions)
// Enforces: No claim of certainty. If entropy high or small sample -> WAIT.
// ==========================================================

import { ParityFeatures, MarketRegimeType } from "../../src/types.js";

export class ParityEngine {
  public static calculate(
    pricesOrCandles: Array<{ close: number } | number>,
    regime: MarketRegimeType = "TRENDING"
  ): ParityFeatures {
    const rawDigits: number[] = [];

    for (const item of pricesOrCandles) {
      const price = typeof item === "number" ? item : item.close;
      // Extract the last 5th decimal pip digit (standard EUR/USD parity reference)
      const str = price.toFixed(5).replace(".", "");
      const lastDigit = parseInt(str[str.length - 1], 10);
      if (!isNaN(lastDigit)) {
        rawDigits.push(lastDigit);
      }
    }

    const sampleSize = rawDigits.length;

    // Default if tiny sample (< 20)
    if (sampleSize < 20) {
      return this.defaultParity(sampleSize);
    }

    let evenCount = 0;
    let oddCount = 0;
    let ee = 0;
    let eo = 0;
    let oe = 0;
    let oo = 0;

    for (let i = 0; i < rawDigits.length; i++) {
      const isEven = rawDigits[i] % 2 === 0;
      if (isEven) evenCount++;
      else oddCount++;

      if (i > 0) {
        const prevEven = rawDigits[i - 1] % 2 === 0;
        if (prevEven && isEven) ee++;
        else if (prevEven && !isEven) eo++;
        else if (!prevEven && isEven) oe++;
        else oo++;
      }
    }

    const evenFrequency = Number((evenCount / sampleSize).toFixed(3));
    const oddFrequency = Number((oddCount / sampleSize).toFixed(3));

    // Transitions
    const totalTransitions = sampleSize - 1;
    const transitionMatrix = {
      evenToEven: totalTransitions > 0 ? Number((ee / totalTransitions).toFixed(3)) : 0.25,
      evenToOdd: totalTransitions > 0 ? Number((eo / totalTransitions).toFixed(3)) : 0.25,
      oddToEven: totalTransitions > 0 ? Number((oe / totalTransitions).toFixed(3)) : 0.25,
      oddToOdd: totalTransitions > 0 ? Number((oo / totalTransitions).toFixed(3)) : 0.25,
    };

    // Current streak at the end of observed series
    let streak = 0;
    let streakType: "PAR" | "IMPAR" | "NONE" = "NONE";
    if (sampleSize > 0) {
      const lastIsEven = rawDigits[sampleSize - 1] % 2 === 0;
      streakType = lastIsEven ? "PAR" : "IMPAR";
      for (let i = sampleSize - 1; i >= 0; i--) {
        const isEv = rawDigits[i] % 2 === 0;
        if ((streakType === "PAR" && isEv) || (streakType === "IMPAR" && !isEv)) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Shannon Entropy: H = - sum(p * log2(p))
    const pEven = Math.max(0.0001, evenFrequency);
    const pOdd = Math.max(0.0001, oddFrequency);
    const parityEntropy = Number((-(pEven * Math.log2(pEven) + pOdd * Math.log2(pOdd))).toFixed(3));

    // Parity Bias: -1 (all odd) to +1 (all even)
    const parityBias = Number(((evenCount - oddCount) / sampleSize).toFixed(3));

    // Streak Strength (threshold >= 4 starts to form reversion/continuation edge)
    const streakStrength = Math.min(100, streak * 22);

    // Transition Strength (deviation from random 50/50 alternating walk)
    const transitionStrength = Number((Math.abs(transitionMatrix.evenToOdd - transitionMatrix.evenToEven) * 100).toFixed(1));

    // Rolling windows: 20, 50, 100, 200
    const calcWindow = (windowSize: number) => {
      const slice = rawDigits.slice(-windowSize);
      if (slice.length === 0) return { evenRatio: 0.5, oddRatio: 0.5, entropy: 1.0 };
      const ev = slice.filter((d) => d % 2 === 0).length;
      const ratio = ev / slice.length;
      const p1 = Math.max(0.0001, ratio);
      const p2 = Math.max(0.0001, 1 - ratio);
      const ent = -(p1 * Math.log2(p1) + p2 * Math.log2(p2));
      return {
        evenRatio: Number(ratio.toFixed(3)),
        oddRatio: Number((1 - ratio).toFixed(3)),
        entropy: Number(ent.toFixed(3)),
      };
    };

    const rollingWindows = {
      w20: calcWindow(20),
      w50: calcWindow(50),
      w100: calcWindow(100),
      w200: calcWindow(200),
    };

    // Conditional probability
    const nextEvenGivenStreak = streakType === "PAR" ? 1 / (1 + Math.exp(streak * 0.45)) : 1 - 1 / (1 + Math.exp(streak * 0.45));
    const nextOddGivenStreak = 1 - nextEvenGivenStreak;

    // Edge check:
    // Requires minimum sample >= 20, noticeable deviation or streak >= 3, and entropy not strictly maximal 1.0
    const hasStatisticalEdge =
      sampleSize >= 20 &&
      (streak >= 3 || Math.abs(parityBias) >= 0.15 || rollingWindows.w20.entropy < 0.95);

    let edgeReason = "Sem desbalanceamento estatístico comprovado (distribuição simétrica).";
    if (streak >= 4) {
      edgeReason = `Cluster exaustivo de ${streak} ${streakType}s com probabilidade condicional de alternância.`;
    } else if (Math.abs(parityBias) >= 0.15) {
      edgeReason = `Desvio significativo de paridade (${parityBias > 0 ? "Viés Par" : "Viés Ímpar"}).`;
    }

    return {
      observedDigits: rawDigits.slice(-20),
      evenCount,
      oddCount,
      evenFrequency,
      oddFrequency,
      streak,
      streakType,
      streakStrength,
      transitionMatrix,
      transitionStrength,
      conditionalProbability: {
        nextEvenGivenStreak: Number(nextEvenGivenStreak.toFixed(3)),
        nextOddGivenStreak: Number(nextOddGivenStreak.toFixed(3)),
      },
      entropy: parityEntropy,
      parityEntropy,
      parityBias,
      rollingWindows,
      recentDistribution: { even: evenCount, odd: oddCount },
      timeframeDistribution: { even: evenCount, odd: oddCount },
      regimeDistribution: { regime, evenRatio: evenFrequency },
      sampleSize,
      hasStatisticalEdge,
      edgeReason,
    };
  }

  private static defaultParity(sampleSize = 0): ParityFeatures {
    return {
      observedDigits: [],
      evenCount: 0,
      oddCount: 0,
      evenFrequency: 0.5,
      oddFrequency: 0.5,
      streak: 0,
      streakType: "NONE",
      streakStrength: 0,
      transitionMatrix: { evenToEven: 0.25, evenToOdd: 0.25, oddToEven: 0.25, oddToOdd: 0.25 },
      transitionStrength: 0,
      conditionalProbability: { nextEvenGivenStreak: 0.5, nextOddGivenStreak: 0.5 },
      entropy: 1.0,
      parityEntropy: 1.0,
      parityBias: 0,
      rollingWindows: {
        w20: { evenRatio: 0.5, oddRatio: 0.5, entropy: 1.0 },
        w50: { evenRatio: 0.5, oddRatio: 0.5, entropy: 1.0 },
        w100: { evenRatio: 0.5, oddRatio: 0.5, entropy: 1.0 },
        w200: { evenRatio: 0.5, oddRatio: 0.5, entropy: 1.0 },
      },
      recentDistribution: { even: 0, odd: 0 },
      timeframeDistribution: { even: 0, odd: 0 },
      regimeDistribution: { regime: "UNCERTAIN", evenRatio: 0.5 },
      sampleSize,
      hasStatisticalEdge: false,
      edgeReason: "Amostra insuficiente para inferência estatística confiável.",
    };
  }
}
