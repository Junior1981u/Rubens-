// ==========================================================
// NEXORA TRADER AI — ULTIMATE INTELLIGENCE CORE V4 TYPES
// Architecture Modules:
// 1. AI Orchestrator (GPT, Claude, Gemini, Grok)
// 2. Consensus Engine (4/4 Strict: PAR or IMPAR; otherwise WAIT)
// 3. Contradiction Engine (Adversarial check, vetoes if strong contradiction)
// 4. Confidence Calibrator (Historical calibration by asset, tf, regime, setup, agent)
// 5. Regime Engine (TRENDING, RANGING, BREAKOUT, HIGH_VOLATILITY, LOW_VOLATILITY, UNCERTAIN)
// 6. Signal Quality Gate (Data, Timestamp, Candle, Latency, Consensus, Contradiction, Regime, Health, Risk)
// 7. Risk Engine & Anti-Loss (Consecutive losses, daily limit, cooldown, bad data veto)
// 8. Model Health (HEALTHY, OBSERVATION, DEGRADED, OFFLINE)
// 9. Learning Engine (Walk-Forward, Out-of-sample, Drift Detection)
// 10. Loss Analyzer (Multidimensional autopsy: asset, tf, plat, regime, setup, AI, quality, latency)
// 11. Model Drift Detector (Tracks accuracy degradation, flags observation/degraded)
// 12. Autopilot (Server-authoritative background scheduler, reconnect, retry, timeout, logging)
// ==========================================================

export type ConsensusPlatformId =
  | "QUOTEX"
  | "IQ_OPTION"
  | "OLYMPTRADE"
  | "POCKET_OPTION"
  | "BINOMO"
  | "EXNOVA"
  | "quotex"
  | "iqoption"
  | "olymptrade"
  | "pocketoption"
  | "binomo"
  | "exnova"
  | "PLATAFORMA_03"
  | "PLATAFORMA_04"
  | "PLATAFORMA_05";

export type NormalizedDirection = "PAR" | "IMPAR" | "WAIT";
export type FinalDecision = "PAR" | "IMPAR" | "WAIT" | "NO TRADE";

export type MarketRegimeType =
  | "TRENDING"
  | "RANGING"
  | "BREAKOUT"
  | "HIGH_VOLATILITY"
  | "LOW_VOLATILITY"
  | "UNCERTAIN";

export type ModelHealthStatus =
  | "HEALTHY"
  | "OBSERVATION"
  | "DEGRADED"
  | "OFFLINE";

export type DataFeedStatus = "LIVE" | "DELAYED" | "STALE" | "OFFLINE" | "INVALID";

export interface RealCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
  isComplete: boolean;
}

export interface MarketFeatures {
  ema9?: number;
  ema21?: number;
  rsi?: number;
  macd?: number;
  atr?: number;
  volatility?: number;
  momentum?: number;
  regime: MarketRegimeType;
  alternationRate?: number;
  stabilityScore?: number;
  spread?: number;
  latencyMs?: number;
  adx?: number;
  contradictionScore?: number;
}

export interface ConsensusMarketSnapshot {
  snapshotId: string;
  platform: ConsensusPlatformId | string;
  asset: string;
  timeframe: string;
  timestamp: number;
  bid?: number;
  ask?: number;
  price: number;
  candle?: RealCandle | null;
  candles?: RealCandle[];
  indicators?: MarketFeatures;
  features?: MarketFeatures;
  dataQuality: number; // 0 - 100
  candleClosed?: boolean;
  latencyMs?: number;
  sequence?: number[]; // Sequence of parity/digits/candles
}

export interface AIStructuredResponse {
  agent: "GPT" | "CLAUDE" | "GEMINI" | "GROK";
  provider: string;
  model?: string;
  snapshotId?: string;
  direction: NormalizedDirection;
  confidence: number; // 0 - 100
  reasons: string[];
  counterReasons?: string[];
  invalidation?: string;
  latencyMs?: number;
  timestamp: number;
  status: string; // SUCCESS | ONLINE | OFFLINE | API KEY AUSENTE | AUTH ERROR | TIMEOUT | QUOTA ERROR | MODEL ERROR
  calibratedConfidence?: number;
  evidence?: string[];
  counterEvidence?: string[];
  patternStrength?: number;
  regimeCompatibility?: number;
  dataQuality?: number;
  invalidations?: string[];
  reasoningSummary?: string;
  marketRegime?: MarketRegimeType | string;
  contradictions?: string[];
  role?: string;
  setup?: string;
}

export interface ConsensusEvaluation {
  decision: NormalizedDirection;
  consensus: number; // 0 - 100%
  unanimous: boolean; // true ONLY if 4/4 PAR or 4/4 IMPAR
  agreementCount: number; // 0, 1, 2, 3, or 4
  directions: NormalizedDirection[];
  reason: string;
  quorumReached: boolean;
}

export interface ContradictionEvaluation {
  hasStrongContradiction: boolean;
  score: number; // 0 - 100 (higher = more contradiction)
  contradictionItems: string[];
  vetoTriggered: boolean;
  reason: string;
}

export interface QualityGateCheck {
  passed: boolean;
  blockReasons: string[];
  dataValid: boolean;
  timestampFresh: boolean;
  candleComplete: boolean;
  latencyAcceptable: boolean;
  consensusMet: boolean;
  noContradictionVeto: boolean;
  regimeAllowed: boolean;
  healthAcceptable: boolean;
  riskApproved: boolean;
}

export interface RiskEngineCheck {
  allowed: boolean;
  status: "PASSED" | "BLOCKED";
  blockReasons: string[];
  riskScore: number;
  cooldownActive: boolean;
  consecutiveLosses: number;
  dailyLimitReached: boolean;
  antiLossExplanation: {
    dados: string;
    consenso: string;
    regime: string;
    risco: string;
    historico: string;
    qualidade: string;
  };
}

export interface NexoraScoreBreakdown {
  consensus: number;
  dataQuality: number;
  regimeQuality: number;
  stability: number;
  latencyQuality: number;
}

export interface NexoraConsensusDecisionResult {
  id: string;
  snapshotId: string;
  timestamp: number;
  snapshot: ConsensusMarketSnapshot;
  aiResponses: AIStructuredResponse[];
  consensus: ConsensusEvaluation;
  contradiction: ContradictionEvaluation;
  qualityGate: QualityGateCheck;
  riskCheck: RiskEngineCheck;
  nexoraScore: number;
  scoresBreakdown: NexoraScoreBreakdown;
  state: "CONSENSUS VALIDATED" | "WAIT" | "NO TRADE" | "ANALYZING";
  opportunityLevel: "CONSENSO VALIDADO" | "AGUARDAR" | "NO TRADE";
  finalDecision: FinalDecision;
  why: string;
  invalidation: string;
  passedQualityGate: boolean;
  passedRiskGate: boolean;
  isPaperMode: boolean;
  features?: MarketFeatures;
}

export interface AgentDriftMetrics {
  provider?: string;
  agent: "GPT" | "CLAUDE" | "GEMINI" | "GROK";
  role: string;
  totalEvaluations: number;
  correctPredictions?: number;
  accuracyRate: number;
  recentAccuracyRate?: number;
  status: ModelHealthStatus;
  weight?: number;
  avgLatencyMs: number;
  wins: number;
  losses: number;
  lastDriftTimestamp?: number;
  driftScore?: number;
  lastUpdated?: number;
}

export interface LossAutopsy {
  platform: string;
  asset: string;
  timeframe: string;
  regime: MarketRegimeType;
  setup: string;
  decision: string;
  failedAIs: string[];
  consensus: string;
  dataQuality: number;
  latencyMs: number;
  rootCause: string;
  suggestedCorrection: string;
  timestamp: number;
}

export interface ConsensusLearningRecord {
  id: string;
  timestamp: number;
  platform: string;
  asset: string;
  timeframe: string;
  regime: MarketRegimeType;
  setup: string;
  decision: FinalDecision;
  consensusScore: number;
  gpt: NormalizedDirection;
  claude: NormalizedDirection;
  gemini: NormalizedDirection;
  grok: NormalizedDirection;
  result: "WIN" | "LOSS" | "DRAW" | "INVALID";
  dataQuality: number;
  latencyMs: number;
  lossAutopsy?: LossAutopsy;
  hour: number;
  features?: MarketFeatures;
}

export interface AutopilotStatus {
  active: boolean;
  status: "MONITORING" | "PAUSED" | "RECONNECTING" | "ERROR";
  lastCheckTimestamp: number;
  uptimeSeconds: number;
  uptimeStr: string;
  totalCycles: number;
  consensus44Count: number;
  waitCount: number;
  noTradeCount: number;
  winCount: number;
  lossCount: number;
  heartbeatIntervalMs: number;
  retryAttempts: number;
  backoffMs: number;
}

export interface HeartbeatStatus {
  serverOnline: boolean;
  coreOnline: boolean;
  autopilotOnline: boolean;
  gptOnline: boolean;
  claudeOnline: boolean;
  geminiOnline: boolean;
  grokOnline: boolean;
  feedOnline: boolean;
  databaseOnline: boolean;
  learningOnline: boolean;
  uptimeSeconds: number;
  uptimeStr: string;
  totalAnalysesToday?: number;
  totalConsensus44?: number;
  totalWait?: number;
  totalNoTrade?: number;
  totalPaperTrades?: number;
  totalWins?: number;
  totalLosses?: number;
  totalDraws?: number;
  totalInvalids?: number;
  memoryUsageMb?: number;
  lastHeartbeatMs?: number;
  latencies?: {
    gpt: number;
    claude: number;
    gemini: number;
    grok: number;
    data: number;
  };
}

export interface ConsensusSignalItem {
  id: string;
  timestamp: number;
  platform: string;
  asset: string;
  timeframe: string;
  price: number;
  decision: FinalDecision;
  consensus: string;
  agreementCount: number;
  nexoraScore: number;
  why: string;
  status: "ATIVO" | "CONCLUIDO" | "FILTRADO";
  result?: "WIN" | "LOSS";
  expiresAt?: number;
}

// ==========================================================
// NEXORA SUPER INTELLIGENCE V5 TYPES
// ==========================================================
export type MarketConnectionStatus = "LIVE" | "DELAYED" | "STALE" | "OFFLINE" | "DEMO";

export interface MarketDataEngineTelemetry {
  connectionStatus: MarketConnectionStatus;
  dataSource: string;
  lastTick: {
    symbol: string;
    price: number;
    bid?: number;
    ask?: number;
    timestamp: number;
    spread: number;
    volume: number;
  } | null;
  lastCandle: RealCandle | null;
  latencyMs: number;
  ticksReceived: number;
  reconnectCount: number;
  supportedTimeframes: string[];
  lastUpdated: number;
}

export interface LossGuardResult {
  passed: boolean;
  status: "PASSED" | "BLOCKED";
  blockReasons: string[];
  checks: {
    dataQuality: boolean;
    latency: boolean;
    candleClosed: boolean;
    regime: boolean;
    volatility: boolean;
    contradictions: boolean;
    setupHistory: boolean;
    lossStreak: boolean;
    aiHealth: boolean;
  };
}

export interface DetailedLossReport {
  id: string;
  timestamp: number;
  setup: string;
  asset: string;
  timeframe: string;
  regime: MarketRegimeType;
  fourAIConsensus: {
    gpt: string;
    claude: string;
    gemini: string;
    grok: string;
    consensus: string;
  };
  probableCause: string;
  presentConditions: string[];
  missingConditions: string[];
  recordedToLearning: boolean;
}

export type SignalQualityGrade = "A+" | "A" | "B" | "C" | "NO TRADE";

export interface NexoraCoreV5Decision {
  decision: "PAR" | "IMPAR" | "WAIT" | "NO_TRADE";
  status: "VALIDATED" | "WAIT" | "BLOCKED" | "NO_TRADE";
  score: number;
  signalGrade: SignalQualityGrade;
  reasons: string[];
  blockers: string[];
  timestamp: number;
}

export interface AuditTrailRecord {
  id: string;
  decisionId: string;
  timestamp: number;
  snapshot: ConsensusMarketSnapshot;
  aiResponses: AIStructuredResponse[];
  consensus: ConsensusEvaluation;
  contradiction: ContradictionEvaluation;
  qualityGate: QualityGateCheck;
  riskCheck: RiskEngineCheck;
  coreDecision: NexoraCoreV5Decision;
  result?: "WIN" | "LOSS" | "DRAW" | "INVALID";
  isPaperMode: boolean;
  reproducible: boolean;
}

export interface MemoryContextStats {
  key: string;
  platform: string;
  asset: string;
  timeframe: string;
  regime: MarketRegimeType;
  setup: string;
  agent: "GPT" | "CLAUDE" | "GEMINI" | "GROK" | "CONSENSUS";
  hour: number;
  samples: number;
  wins: number;
  losses: number;
  accuracy: number;
  avgConfidence: number;
  lastUpdated: number;
}

export interface LossAnalysisReport {
  lossId: string;
  timestamp: number;
  platform: string;
  asset: string;
  timeframe: string;
  regime: MarketRegimeType;
  setup: string;
  failedAIs: string[];
  successfulAIs: string[];
  allFailed: boolean;
  hadConsensus: boolean;
  hadContradiction: boolean;
  dataQuality: number;
  latencyMs: number;
  lossPattern: string;
  rootCause: string;
  remedyRecommendation: string;
}

// ==========================================================
// PAPER TRADING & SETTINGS
// ==========================================================
export interface PaperTradeOrder {
  id: string;
  snapshotId: string;
  timestamp: number;
  platform: ConsensusPlatformId;
  asset: string;
  timeframe: string;
  direction: "PAR" | "IMPAR";
  decision?: string; // PAR / IMPAR
  entryPrice: number;
  entry?: number; // Aliased entry price
  stakeAmount: number;
  payoutRate: number; // e.g. 0.85
  status: "OPEN" | "SETTLED";
  exitPrice?: number;
  result?: "WIN" | "LOSS" | "DRAW" | "INVALID";
  profit?: number;
  durationSeconds: number;
  expiresAt: number;
  consensusScore: string;
  fourAIConsensus?: {
    gpt: string;
    claude: string;
    gemini: string;
    grok: string;
    consensus?: string;
  };
  nexoraScore: number;
}

export interface PaperAccount {
  balance: number;
  initialBalance: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  maxDrawdown: number;
  activeOrders: PaperTradeOrder[];
  orderHistory: PaperTradeOrder[];
}

export interface SystemSettings {
  mode: "PAPER" | "LIVE";
  requireStrictConsensus: boolean;
  minDataQuality: number;
  maxConsecutiveLosses: number;
  cooldownMinutes: number;
  maxDailyLoss: number;
  defaultStake: number;
  soundEnabled: boolean;
  autoPaperTradeOnConsensus: boolean;
  apiProxyEndpoint?: string;
}

