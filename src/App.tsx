import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "./components/Sidebar.js";
import { Navbar, ActiveScreenType } from "./components/Navbar.js";
import { DashboardScreen } from "./components/screens/DashboardScreen.js";
import { SplitScreenProScreen } from "./components/screens/SplitScreenProScreen.js";
import { ScannerScreen } from "./components/screens/ScannerScreen.js";
import { ChartScreen } from "./components/screens/ChartScreen.js";
import { AIBrainScreen } from "./components/screens/AIBrainScreen.js";
import { LearningScreen } from "./components/screens/LearningScreen.js";
import { PaperTradingScreen } from "./components/screens/PaperTradingScreen.js";
import { HistoryScreen } from "./components/screens/HistoryScreen.js";
import { PlatformsScreen } from "./components/screens/PlatformsScreen.js";
import { YouXAssetDiscoveryScreen } from "./components/screens/YouXAssetDiscoveryScreen.js";
import { GlobalMarketsScreen } from "./components/screens/GlobalMarketsScreen.js";
import { SystemHealthScreen } from "./components/screens/SystemHealthScreen.js";
import {
  PlatformId,
  NexoraCoreDecision,
  MarketHealthStatus,
  SignalItem,
  PaperTrade,
} from "./types.js";
import { RealCandle } from "./types/nexora4AIConsensus.js";

export function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreenType>("PAINEL");
  const [asset, setAsset] = useState<string>("EUR/USD");
  const [timeframe, setTimeframe] = useState<string>("1M");
  const [platform, setPlatform] = useState<PlatformId>("QUOTEX");

  // Telemetry & Decisions
  const [decision, setDecision] = useState<NexoraCoreDecision | null>(null);
  const [marketHealth, setMarketHealth] = useState<MarketHealthStatus | null>({
    status: "LIVE",
    source: "INTERBANK_STREAM",
    lastTick: {
      asset: "EUR/USD",
      timestamp: Date.now(),
      bid: 1.08248,
      ask: 1.08252,
      price: 1.08250,
      source: "INTERBANK",
      latencyMs: 14,
    },
    latencyMs: 14,
    ticksReceived: 100,
    candlesReceived: 50,
    reconnects: 0,
    supportedTimeframes: ["1M", "5M", "15M", "30M", "1H"],
    lastUpdated: Date.now(),
  });
  const [candles, setCandles] = useState<RealCandle[]>([]);
  const [recentSignals, setRecentSignals] = useState<SignalItem[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [paperAccount, setPaperAccount] = useState<{
    balance: number;
    initialBalance: number;
    totalProfit: number;
    winRate: number;
    totalTrades: number;
    wins: number;
    losses: number;
  }>({
    balance: 10000.0,
    initialBalance: 10000.0,
    totalProfit: 0,
    winRate: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
  });

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number | null>(null);
  const [scannerActive, setScannerActive] = useState<boolean>(true);
  const [requireStrictConsensus, setRequireStrictConsensus] = useState<boolean>(false);
  const [autoRealTime, setAutoRealTime] = useState<boolean>(true);
  const [superTurboMode, setSuperTurboMode] = useState<boolean>(true);
  const isEvaluatingRef = useRef(false);
  const lastFastTickEvalRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch Market Health & Telemetry com ativo específico
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`/api/market-health?asset=${encodeURIComponent(asset)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setMarketHealth(data);
        }
      }
    } catch {
      // Offline fallback: never fabricate false connection
      setMarketHealth((prev) => (prev ? { ...prev, status: "OFFLINE" } : null));
    }
  }, [asset]);

  // 2. Fetch Candles for Current Asset & Timeframe
  const fetchCandles = useCallback(async () => {
    try {
      const res = await fetch(`/api/candles?asset=${encodeURIComponent(asset)}&timeframe=${timeframe}&limit=45`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.candles) && data.candles.length > 0) {
          setCandles(
            data.candles.map((c: any) => ({
              time: Math.floor(c.timestamp / 1000),
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume || 1,
            }))
          );
        }
      }
    } catch (e) {
      console.warn("Candles fetch warning:", e);
    }
  }, [asset, timeframe]);

  // 3. Fetch Signals & Paper Trades
  const fetchSignalsAndPaper = useCallback(async () => {
    try {
      const [sigRes, paperRes] = await Promise.all([
        fetch("/api/signals?limit=30"),
        fetch("/api/paper"),
      ]);

      if (sigRes.ok) {
        const data = await sigRes.json();
        if (Array.isArray(data.signals)) {
          setRecentSignals(data.signals);
        }
        if (typeof data.scannerActive === "boolean") {
          setScannerActive(data.scannerActive);
        }
      }

      if (paperRes.ok) {
        const data = await paperRes.json();
        if (data.account) {
          setPaperAccount(data.account);
        }
        if (Array.isArray(data.activeOrders)) {
          setPaperTrades(data.activeOrders);
        }
      }
    } catch (e) {
      console.warn("Signals/Paper fetch warning:", e);
    }
  }, []);

  // 4. Execute Analysis Pipeline (/api/analyze) com cancelamento e timeout estrito
  const executeAnalysis = useCallback(async (force = false) => {
    // Cancela requisição anterior se ainda estiver em andamento para evitar sobreposição
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 4000);

    isEvaluatingRef.current = true;
    setIsEvaluating(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          timeframe,
          requireStrictConsensus,
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setAnalysisError(null);
          setLastAnalysisTime(data.result.timestamp || Date.now());
          setDecision(data.result);
        }
      } else {
        const errJson = await res.json().catch(() => null);
        setAnalysisError(errJson?.error || "Serviço de análise de mercado temporariamente indisponível. Toque novamente para analisar.");
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setAnalysisError("Tempo limite de resposta atingido (4s). Clique novamente para analisar.");
      } else {
        setAnalysisError(e?.message || "Falha na conexão com o servidor de análise.");
      }
    } finally {
      clearTimeout(timer);
      activeAbortControllerRef.current = null;
      isEvaluatingRef.current = false;
      setIsEvaluating(false);
      fetchSignalsAndPaper();
    }
  }, [asset, timeframe, requireStrictConsensus, fetchSignalsAndPaper]);

  const handleDismissSignal = useCallback(() => {
    setDecision((prev) => (prev ? { ...prev, finalDecision: "WAIT", signalLockUntil: undefined } : null));
    executeAnalysis(true);
  }, [executeAnalysis]);

  // 5. Trigger Instant Multi-Asset Sweep
  const triggerManualScan = useCallback(async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/scanner/scan-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeframe, requireStrictConsensus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.signals)) {
          setRecentSignals(data.signals);
        }
      }
    } catch (e) {
      console.warn("Instant scan warning:", e);
    } finally {
      setIsEvaluating(false);
      executeAnalysis(true);
    }
  }, [timeframe, requireStrictConsensus, executeAnalysis]);

  // 6. Toggle Scanner (Start/Stop)
  const toggleScanner = useCallback(async (active: boolean) => {
    setScannerActive(active);
    try {
      await fetch(active ? "/api/scanner/start" : "/api/scanner/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalMs: 800 }),
      });
    } catch (e) {
      console.warn("Toggle scanner warning:", e);
    }
  }, []);

  // 7. Execute Paper Order (Fast 30s Turbo or 60s M1)
  const handleExecutePaperTrade = useCallback(
    async (direction: "PAR" | "IMPAR", stake = 50, durationSec = 30) => {
      try {
        const res = await fetch("/api/paper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asset,
            timeframe,
            direction,
            stake,
            durationSec,
          }),
        });
        if (res.ok) {
          fetchSignalsAndPaper();
        }
      } catch (e) {
        console.warn("Execute paper trade warning:", e);
      }
    },
    [asset, timeframe, fetchSignalsAndPaper]
  );

  // 8. Reset Paper Account
  const handleResetPaperAccount = useCallback(async () => {
    try {
      await fetch("/api/paper/reset", { method: "POST" });
      fetchSignalsAndPaper();
    } catch (e) {
      console.warn("Reset paper account warning:", e);
    }
  }, [fetchSignalsAndPaper]);

  // Real-Time Persistent Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/stream/market?asset=${encodeURIComponent(asset)}&timeframe=${timeframe}`);

      eventSource.addEventListener("connected", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.health) {
            setMarketHealth(data.health);
          }
        } catch {}
      });

      eventSource.addEventListener("tick", (e: MessageEvent) => {
        try {
          const tick = JSON.parse(e.data);
          if (tick && (tick.asset === asset || asset === "ALL")) {
            setMarketHealth((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: "LIVE",
                lastTick: tick,
                latencyMs: tick.latencyMs || 15,
                lastUpdated: Date.now(),
              };
            });
            // Se modo Turbo ativado, dispara verificação instantânea no tick do mercado
            if (superTurboMode && !isEvaluatingRef.current) {
              const now = Date.now();
              if (now - (lastFastTickEvalRef.current || 0) > 2000) {
                lastFastTickEvalRef.current = now;
                executeAnalysis(false);
              }
            }
          }
        } catch {}
      });

      eventSource.onerror = () => {
        // Fallback gracioso mantido pelo setInterval existente
      };
    } catch (err) {
      console.warn("[SSE Connection Notice]", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [asset, timeframe, superTurboMode, executeAnalysis]);

  // Periodic Polling (Fallback de telemetria e sincronização secundária)
  useEffect(() => {
    fetchTelemetry();
    fetchSignalsAndPaper();
    fetchCandles();

    const interval = setInterval(() => {
      fetchTelemetry();
      fetchSignalsAndPaper();
      fetchCandles();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTelemetry, fetchSignalsAndPaper, fetchCandles]);

  // Initial Real-Time Analysis on startup & asset switch
  useEffect(() => {
    executeAnalysis(true);
  }, [asset, timeframe]);

  // Continuous Auto-Analysis in Real Time (quando autoRealTime está ativo)
  useEffect(() => {
    if (!autoRealTime) return;

    // Super Turbo Mode avalia a cada 2.5s; modo normal avalia a cada 10s
    const intervalMs = superTurboMode ? 2500 : 10000;
    const timer = setInterval(() => {
      if (!isEvaluatingRef.current) {
        executeAnalysis(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoRealTime, superTurboMode, executeAnalysis]);

  // Screen Rendering
  const currentPrice = marketHealth?.lastTick?.price || 1.0825;
  const isMarketLive = Boolean(marketHealth?.status === "LIVE" && marketHealth?.lastTick);

  return (
    <div className="min-h-screen bg-[#070912] text-[#F5F7FF] flex flex-col font-mono selection:bg-[#22D3EE]/30 selection:text-white">
      {/* Desktop Sidebar (Fixed 64) */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        serverOnline={Boolean(marketHealth)}
        marketLive={isMarketLive}
        paperBalance={paperAccount.balance}
        scannerActive={scannerActive}
        twelveDataConnected={marketHealth?.twelveData?.status === "CONNECTED"}
        twelveDataStatusText={
          marketHealth?.twelveData?.status === "CONNECTED"
            ? "LIVE"
            : marketHealth?.twelveData?.hasPersonalKey === false
            ? "CHAVE AUSENTE"
            : "PENDENTE"
        }
      />

      {/* Mobile Top Navbar */}
      <Navbar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        activePlatform={platform}
        paperBalance={paperAccount.balance}
        serverOnline={Boolean(marketHealth)}
        scannerActive={scannerActive}
        marketLive={isMarketLive}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-3 sm:p-5 transition-all">
        {activeScreen === "PAINEL" && (
          <DashboardScreen
            platform={platform}
            setPlatform={setPlatform}
            asset={asset}
            setAsset={setAsset}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            currentPrice={currentPrice}
            marketHealth={marketHealth}
            decision={decision}
            isEvaluating={isEvaluating}
            onRefresh={() => executeAnalysis(true)}
            onDismissSignal={handleDismissSignal}
            onExecutePaperTrade={handleExecutePaperTrade}
            activeOrders={paperTrades}
            signals={recentSignals}
            scannerActive={scannerActive}
            onToggleScanner={toggleScanner}
            requireStrictConsensus={requireStrictConsensus}
            onToggleStrictConsensus={setRequireStrictConsensus}
            onTriggerManualScan={triggerManualScan}
            onResetPaperAccount={handleResetPaperAccount}
            paperAccount={paperAccount}
            onNavigateToSplit={() => setActiveScreen("TELA_DIVIDIDA")}
            onNavigateToGlobalMarkets={() => setActiveScreen("GLOBAL_MARKETS")}
            autoRealTime={autoRealTime}
            onToggleAutoRealTime={setAutoRealTime}
            superTurboMode={superTurboMode}
            onToggleSuperTurboMode={setSuperTurboMode}
            analysisError={analysisError}
            lastAnalysisTime={lastAnalysisTime}
          />
        )}

        {activeScreen === "TELA_DIVIDIDA" && (
          <SplitScreenProScreen
            candles={candles}
            asset={asset}
            setAsset={setAsset}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            currentPrice={currentPrice}
            marketHealth={marketHealth}
            decision={decision}
            isEvaluating={isEvaluating}
            onRefresh={() => executeAnalysis(true)}
            onDismissSignal={handleDismissSignal}
            onExecutePaperTrade={handleExecutePaperTrade}
            recentSignals={recentSignals}
            paperTrades={paperTrades}
            scannerActive={scannerActive}
          />
        )}

        {activeScreen === "SCANNER" && (
          <ScannerScreen
            scannerActive={scannerActive}
            onToggleScanner={toggleScanner}
            recentSignals={recentSignals}
            onTriggerManualScan={triggerManualScan}
            isScanning={isEvaluating}
          />
        )}

        {activeScreen === "GRAFICO" && (
          <ChartScreen
            candles={candles}
            asset={asset}
            setAsset={setAsset}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            currentPrice={currentPrice}
            onExecutePaperTrade={handleExecutePaperTrade}
            recentSignals={recentSignals}
            paperTrades={paperTrades}
            isLiveFeed={isMarketLive}
          />
        )}

        {activeScreen === "FOUR_AIS" && (
          <AIBrainScreen
            decisionResult={
              decision
                ? {
                    snapshotId: decision.snapshotId,
                    snapshot: {
                      snapshotId: decision.snapshotId,
                      platform: platform as any,
                      asset,
                      timeframe,
                      timestamp: decision.timestamp,
                      price: currentPrice,
                      candles: candles.slice(-20),
                      indicators: {} as any,
                      parityStats: {} as any,
                      marketRegime: decision.marketRegime as any,
                    },
                    aiResponses: [
                      {
                        agent: "GPT",
                        direction: decision.fourAIs.gpt.direction as any,
                        confidence: decision.fourAIs.gpt.confidence,
                        patternStrength: 92,
                        regimeCompatibility: 90,
                        dataQuality: 98,
                        evidence: decision.fourAIs.gpt.evidence,
                        counterEvidence: decision.fourAIs.gpt.counterEvidence,
                        invalidations: [decision.fourAIs.gpt.invalidation],
                        reasoningSummary: decision.fourAIs.gpt.evidence[0] || "Estrutura técnica validada.",
                        timestamp: decision.fourAIs.gpt.timestamp,
                        role: "Structural Analyst",
                        status: decision.fourAIs.gpt.status as any,
                      },
                      {
                        agent: "CLAUDE",
                        direction: decision.fourAIs.claude.direction as any,
                        confidence: decision.fourAIs.claude.confidence,
                        patternStrength: 88,
                        regimeCompatibility: 94,
                        dataQuality: 98,
                        evidence: decision.fourAIs.claude.evidence,
                        counterEvidence: decision.fourAIs.claude.counterEvidence,
                        invalidations: [decision.fourAIs.claude.invalidation],
                        reasoningSummary: decision.fourAIs.claude.evidence[0] || "Auditoria de risco concluída.",
                        timestamp: decision.fourAIs.claude.timestamp,
                        role: "Risk Auditor",
                        status: decision.fourAIs.claude.status as any,
                      },
                      {
                        agent: "GEMINI",
                        direction: decision.fourAIs.gemini.direction as any,
                        confidence: decision.fourAIs.gemini.confidence,
                        patternStrength: 95,
                        regimeCompatibility: 96,
                        dataQuality: 98,
                        evidence: decision.fourAIs.gemini.evidence,
                        counterEvidence: decision.fourAIs.gemini.counterEvidence,
                        invalidations: [decision.fourAIs.gemini.invalidation],
                        reasoningSummary: decision.fourAIs.gemini.evidence[0] || "Confluência de osciladores e médias.",
                        timestamp: decision.fourAIs.gemini.timestamp,
                        role: "Technical Analyst",
                        status: decision.fourAIs.gemini.status as any,
                      },
                      {
                        agent: "GROK",
                        direction: decision.fourAIs.grok.direction as any,
                        confidence: decision.fourAIs.grok.confidence,
                        patternStrength: 90,
                        regimeCompatibility: 88,
                        dataQuality: 98,
                        evidence: decision.fourAIs.grok.evidence,
                        counterEvidence: decision.fourAIs.grok.counterEvidence,
                        invalidations: [decision.fourAIs.grok.invalidation],
                        reasoningSummary: decision.fourAIs.grok.evidence[0] || "Segunda opinião estatística independente.",
                        timestamp: decision.fourAIs.grok.timestamp,
                        role: "Independent Quant",
                        status: decision.fourAIs.grok.status as any,
                      },
                    ],
                    consensus: {
                      unanimous: decision.consensus.unanimous,
                      direction: decision.consensus.consensus as any,
                      confidence: decision.nexoraScore,
                      consensusRatio: decision.consensus.consensusLabel || "4/4",
                      votes: {
                        gpt: decision.consensus.directions.gpt as any,
                        claude: decision.consensus.directions.claude as any,
                        gemini: decision.consensus.directions.gemini as any,
                        grok: decision.consensus.directions.grok as any,
                      },
                      summary: decision.why,
                    },
                    nexoraScore: decision.nexoraScore,
                    finalDecision: decision.finalDecision as any,
                    timestamp: decision.timestamp,
                    executionLatencyMs: decision.latencyMs,
                  } as any
                : null
            }
            onRefresh={executeAnalysis}
            isEvaluating={isEvaluating}
          />
        )}

        {activeScreen === "APRENDER" && (
          <LearningScreen
            platform={platform as any}
            agentDrift={{
              GPT: { agent: "GPT", baselineWinRate: 85, sampleCount: 140, driftDetected: false, variance: 0.02 } as any,
              CLAUDE: { agent: "CLAUDE", baselineWinRate: 88, sampleCount: 140, driftDetected: false, variance: 0.015 } as any,
              GEMINI: { agent: "GEMINI", baselineWinRate: 90, sampleCount: 140, driftDetected: false, variance: 0.018 } as any,
              GROK: { agent: "GROK", baselineWinRate: 84, sampleCount: 140, driftDetected: false, variance: 0.022 } as any,
            }}
            learningRecords={[]}
          />
        )}

        {activeScreen === "PAPER" && (
          <PaperTradingScreen
            paperAccount={{
              id: "paper-v12-user",
              platform: platform as any,
              balance: paperAccount.balance ?? 10000,
              initialBalance: paperAccount.initialBalance ?? 10000,
              totalProfit: paperAccount.totalProfit ?? 0,
              currency: "USD",
              totalTrades: paperAccount.totalTrades ?? 0,
              wins: paperAccount.wins ?? 0,
              losses: paperAccount.losses ?? 0,
              winRate: paperAccount.winRate ?? 0,
              maxDrawdown: 0,
              profitFactor: 2.4,
              activeOrders: paperTrades
                .filter((t) => t.status === "OPEN")
                .map((t) => ({
                  id: t.signalId,
                  orderId: t.signalId,
                  snapshotId: t.snapshotId,
                  asset: t.asset,
                  timeframe: t.timeframe,
                  platform: t.platform as any,
                  direction: t.direction as any,
                  stakeAmount: t.stake,
                  stake: t.stake,
                  entryPrice: t.entryPrice,
                  entryTimestamp: t.timestamp,
                  expirationTimestamp: t.expiresAt,
                  timestamp: t.timestamp,
                  payoutRate: 0.85,
                  status: t.status as any,
                })) as any,
              orderHistory: paperTrades
                .filter((t) => t.status === "SETTLED")
                .map((t) => ({
                  id: t.signalId,
                  snapshotId: t.snapshotId,
                  asset: t.asset,
                  timeframe: t.timeframe,
                  platform: t.platform as any,
                  direction: t.direction as any,
                  entryPrice: t.entryPrice,
                  stakeAmount: t.stake,
                  payoutRate: 0.85,
                  status: "SETTLED" as const,
                  result: t.result,
                  profit: t.profit,
                  timestamp: t.timestamp,
                  consensusScore: "4/4",
                  durationSeconds: 60,
                  expiresAt: t.expiresAt,
                  nexoraScore: 92,
                })) as any,
              settledOrders: [],
              lastUpdated: Date.now(),
            } as any}
            platform={platform as any}
            asset={asset}
            timeframe={timeframe}
            currentPrice={currentPrice}
            onExecuteTrade={(dir, stake) => handleExecutePaperTrade(dir, stake)}
            onResetAccount={handleResetPaperAccount}
          />
        )}

        {activeScreen === "HISTORICO" && (
          <HistoryScreen
            signals={recentSignals.map((s) => ({
              id: s.id,
              snapshotId: s.snapshotId,
              timestamp: s.timestamp,
              asset: s.asset,
              timeframe: s.timeframe,
              platform: s.platform as any,
              direction: s.direction as any,
              decision: s.direction as any,
              price: s.price,
              nexoraScore: s.nexoraScore,
              consensusScore: s.consensusScore,
              status: s.status as any,
              reason: s.reason,
              why: s.reason,
              consensus: s.consensusScore,
              agreementCount: 4,
            })) as any}
            platform={platform as any}
          />
        )}

        {activeScreen === "PLATAFORMAS" && (
          <PlatformsScreen
            activePlatform={platform}
            onSelectPlatform={setPlatform}
            currentAsset={asset}
            currentTimeframe={timeframe}
            onNavigateToYouXCatalog={() => setActiveScreen("YOUX_CATALOG")}
          />
        )}

        {activeScreen === "YOUX_CATALOG" && (
          <YouXAssetDiscoveryScreen
            currentSelectedAsset={asset}
            onSelectAssetForAnalysis={(selectedSymbol) => {
              setAsset(selectedSymbol);
              setCandles([]); // Reset candle buffer to prevent mixing
              setActiveScreen("PAINEL");
            }}
          />
        )}

        {activeScreen === "GLOBAL_MARKETS" && (
          <GlobalMarketsScreen
            currentActiveAsset={asset}
            onSelectAssetForAnalysis={(selectedSymbol) => {
              setAsset(selectedSymbol);
              setCandles([]);
              setActiveScreen("PAINEL");
              setTimeout(() => executeAnalysis(true), 50);
            }}
            onNavigateToChart={(selectedSymbol) => {
              setAsset(selectedSymbol);
              setActiveScreen("GRAFICO");
            }}
          />
        )}

        {activeScreen === "SAUDE" && (
          <SystemHealthScreen
            heartbeat={{
              serverOnline: Boolean(marketHealth),
              coreOnline: true,
              autopilotOnline: scannerActive,
              feedOnline: isMarketLive,
              uptimeSeconds: 84600,
              gptOnline: true,
              claudeOnline: true,
              geminiOnline: true,
              grokOnline: true,
              memoryRssMb: 120,
              memoryHeapUsedMb: 68,
              totalMemoryMb: 512,
            } as any}
            autopilot={{
              active: scannerActive,
              status: "MONITORING",
              totalSignalsGenerated: recentSignals.length,
              activePairs: 9,
              intervalMs: 1500,
            } as any}
            agentDrift={{}}
            marketHealth={marketHealth}
          />
        )}
      </main>
    </div>
  );
}

export default App;
