// ==========================================================
// NEXORA TRADER AI V11 — FAST CONSENSUS ENGINE (TYPES)
// ==========================================================

export type PermittedRealTimeState =
  | "CONNECTED"
  | "STREAMING"
  | "DATA_VALIDATED"
  | "STALE_DATA"
  | "RECONNECTING"
  | "DISCONNECTED"
  | "ERROR";

export type MarketConnectionStatus =
  | PermittedRealTimeState
  | "LIVE"
  | "ATRASADO"
  | "DELAYED"
  | "STALE"
  | "OFFLINE"
  | "DEMO"
  | "SEM DADOS"
  | "DADOS DESATUALIZADOS";

export type SignalStatusType =
  | "ANALISANDO"
  | "SEM SINAL"
  | "SINAL VÁLIDO"
  | "INVALIDADO"
  | "EXPIRADO"
  | "ACTIVE"
  | "COMPLETED";

export type NormalizedDirection = "PAR" | "IMPAR" | "WAIT";

export type FinalDecision = "PAR" | "IMPAR" | "WAIT" | "NO TRADE";

export type MarketRegimeType =
  | "TRENDING"
  | "RANGING"
  | "BREAKOUT"
  | "HIGH_VOLATILITY"
  | "LOW_VOLATILITY"
  | "UNCERTAIN";

export type ModelHealthStatus = "ONLINE" | "OFFLINE" | "AUTH ERROR" | "TIMEOUT" | "QUOTA ERROR" | "MODEL ERROR" | "DEGRADED" | "OBSERVATION";

export type AIProviderName = "OpenAI" | "Anthropic" | "Google" | "xAI";
export type AIAgentName = "GPT" | "CLAUDE" | "GEMINI" | "GROK";

export type PlatformId =
  | "QUOTEX"
  | "IQ_OPTION"
  | "OLYMPTRADE"
  | "POCKET_OPTION"
  | "BINOMO"
  | "EXNOVA"
  | "YOUXBROKER"
  | "quotex"
  | "iqoption"
  | "olymptrade"
  | "pocketoption"
  | "binomo"
  | "exnova"
  | "youxbroker";

export interface MarketTick {
  asset: string;
  timestamp: number;
  bid: number;
  ask: number;
  price: number;
  source: string;
  latencyMs: number;
  spread?: number;
  volume?: number;
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  closed: boolean;
}

export interface TechnicalFeatures {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: { macd: number; signal: number; histogram: number };
  atr: number;
  bollingerBands: { upper: number; middle: number; lower: number; bandwidth: number; percentB: number };
  momentum: number;
  volatility: number;
  candleBody: number;
  upperWick: number;
  lowerWick: number;
  range: number;
  trendStrength: number;
  distanceFromEma21: number;
  bollingerPosition: "ABOVE_UPPER" | "UPPER_BAND" | "MIDDLE" | "LOWER_BAND" | "BELOW_LOWER";
  multiTimeframeAlignment: "BULLISH" | "BEARISH" | "NEUTRAL" | "CONFLICT";
  supportLevel?: number;
  resistanceLevel?: number;
}

export interface ParityFeatures {
  observedDigits: number[];
  evenCount: number;
  oddCount: number;
  evenFrequency: number;
  oddFrequency: number;
  streak: number;
  streakType: "PAR" | "IMPAR" | "NONE";
  streakStrength: number;
  transitionMatrix: {
    evenToEven: number;
    evenToOdd: number;
    oddToEven: number;
    oddToOdd: number;
  };
  transitionStrength: number;
  conditionalProbability: {
    nextEvenGivenStreak: number;
    nextOddGivenStreak: number;
  };
  entropy: number;
  parityEntropy: number;
  parityBias: number; // -1 (strong impar) to +1 (strong par)
  rollingWindows: {
    w20: { evenRatio: number; oddRatio: number; entropy: number };
    w50: { evenRatio: number; oddRatio: number; entropy: number };
    w100: { evenRatio: number; oddRatio: number; entropy: number };
    w200: { evenRatio: number; oddRatio: number; entropy: number };
  };
  recentDistribution: { even: number; odd: number };
  timeframeDistribution: { even: number; odd: number };
  regimeDistribution: { regime: MarketRegimeType; evenRatio: number };
  sampleSize: number;
  hasStatisticalEdge: boolean;
  edgeReason: string;
}

export interface MarketSnapshot {
  snapshotId: string;
  asset: string;
  timeframe: string;
  timestamp: number;
  price: number;
  bid: number;
  ask: number;
  candle: Candle;
  previousCandles: Candle[];
  indicators: TechnicalFeatures;
  parityFeatures: ParityFeatures;
  marketRegime: MarketRegimeType;
  dataQuality: number; // 0 - 100
  feedLatencyMs: number;
  isClosedCandle: boolean;
}

export interface AIResponse {
  provider: AIProviderName;
  agent: AIAgentName;
  status: "SUCCESS" | "TIMEOUT" | "AUTH ERROR" | "QUOTA ERROR" | "MODEL ERROR" | "OFFLINE" | "NÃO CONFIGURADO" | "API KEY AUSENTE";
  snapshotId: string;
  direction: NormalizedDirection;
  confidence: number; // 0 - 100
  configured?: boolean;
  patternScore?: number;
  riskScore?: number;
  technicalScore?: number;
  independentScore?: number;
  contradictions?: string[];
  evidence: string[];
  counterEvidence: string[];
  invalidation: string;
  latencyMs: number;
  timestamp: number;
  model: string;
  rawText?: string;
}

export interface FourAIResults {
  gpt: AIResponse;
  claude: AIResponse;
  gemini: AIResponse;
  grok: AIResponse;
  totalLatencyMs: number;
  allSuccess: boolean;
  quorumCount: number;
}

export interface TriggerEvaluation {
  allowed: boolean;
  reason: string;
  blockers: string[];
  timestamp: number;
  setupDetected: boolean;
  setupName: string;
}

export interface ConsensusResult {
  consensus: "PAR" | "IMPAR" | "WAIT";
  agreementCount: number; // 0..4
  unanimous: boolean; // true if models agreed
  consensusLabel?: string; // e.g. "4/4" or "1/1 (GEMINI ONLINE)"
  onlineQuorumRatio?: string; // e.g. "1/4" or "4/4"
  isStrict4_4?: boolean;
  directions: {
    gpt: NormalizedDirection;
    claude: NormalizedDirection;
    gemini: NormalizedDirection;
    grok: NormalizedDirection;
  };
  reasons: string[];
  snapshotId: string;
}

export interface StatisticalConfidence {
  isCalibrated: boolean;
  calibratedWinRate?: number; // Wilson empirical score percentage
  sampleSize: number;
  confidenceInterval?: [number, number]; // 95% Wilson score CI [lower, upper]
  statusText: string;
  limitations: string[];
}

export interface StrategySummaryItem {
  name: string;
  direction: "PAR" | "IMPAR" | "WAIT";
  evidence: string[];
  counterEvidence: string[];
  limitations: string[];
  invalidation: string;
}

export interface FormingCandleInfo {
  open: number;
  high: number;
  low: number;
  current: number;
  progressPercent: number; // percentage of current timeframe elapsed
  direction: "BULLISH" | "BEARISH" | "DOJI";
  status: "FORMING";
}

export interface NexoraCoreDecision {
  decisionId: string;
  snapshotId: string;
  asset?: string;
  timeframe?: string;
  price?: number;
  timestamp: number;
  finalDecision: FinalDecision;
  consensus: ConsensusResult;
  nexoraScore: number; // 0 - 100 derived purely from data
  scores: {
    dataQualityScore: number;
    technicalScore: number;
    parityScore: number;
    agreementScore: number;
    regimeScore: number;
    historicalSetupScore: number;
    latencyScore: number;
  };
  lossGuard: {
    passed: boolean;
    blockers: string[];
    riskScore: number;
    cooldownRemainingSec: number;
  };
  marketRegime: MarketRegimeType;
  dataQuality: number;
  latencyMs: number;
  setup: string;
  why: string;
  invalidation: string;
  fourAIs: FourAIResults;
  isPaperMode: boolean;
  signalLockUntil?: number;
  entryWindowSeconds?: number;
  entryTimestamp?: number;
  expiryTimestamp?: number;
  entryTime?: string;
  expiryTime?: string;
  confluences?: string[];
  signalMode?: "SNIPER" | "TURBO";
  confidenceRating?: "ALTA" | "MÉDIA" | "AGUARDANDO";
  statisticalConfidence?: StatisticalConfidence;
  strategies?: StrategySummaryItem[];
  formingCandle?: FormingCandleInfo;
  benchmarks?: {
    dataReceiptMs: number;
    calculationMs: number;
    aiLatencyMs: number;
    totalDurationMs: number;
    dataAgeSec: number;
    candleState: string;
    source: string;
    connectionStatus: string;
  };
}

export interface AnalysisRecord {
  signalId?: string;
  snapshotId: string;
  asset: string;
  timeframe: string;
  candleTimestamp: number;
  analysisTimestamp: number;
  directions: {
    gpt: NormalizedDirection;
    claude: NormalizedDirection;
    gemini: NormalizedDirection;
    grok: NormalizedDirection;
  };
  consensus: string;
  lossGuardStatus: {
    passed: boolean;
    blockers: string[];
    riskScore: number;
    cooldownRemainingSec: number;
  };
  decision: FinalDecision;
  reason: string;
}

export interface PaperTrade {
  signalId: string;
  snapshotId: string;
  asset: string;
  timeframe: string;
  platform: PlatformId;
  direction: "PAR" | "IMPAR";
  entryPrice: number;
  exitPrice?: number;
  stake: number;
  payoutRate: number;
  timestamp: number;
  expiresAt: number;
  fourAIConsensus: string; // e.g. "4/4"
  nexoraScore: number;
  status: "OPEN" | "SETTLED";
  result?: "WIN" | "LOSS" | "DRAW" | "INVALID";
  profit?: number;
}

export interface LearningRecord {
  id: string;
  asset: string;
  timeframe: string;
  setup: string;
  regime: MarketRegimeType;
  parityBias: number;
  fourAIConsensus: string;
  scores: Record<string, number>;
  decision: FinalDecision;
  result: "WIN" | "LOSS" | "DRAW" | "INVALID";
  timestamp: number;
  aiDecisions: {
    gpt: NormalizedDirection;
    claude: NormalizedDirection;
    gemini: NormalizedDirection;
    grok: NormalizedDirection;
  };
}

export interface ModelWeightStats {
  agent: AIAgentName;
  weight: number;
  totalSamples: number;
  wins: number;
  losses: number;
  winRate: number;
  status: "HEALTHY" | "OBSERVATION" | "DEGRADED";
  recentWinRate: number;
}

export interface SignalItem {
  id: string;
  snapshotId: string;
  timestamp: number;
  asset: string;
  timeframe: string;
  platform: PlatformId;
  direction: FinalDecision;
  price: number;
  nexoraScore: number;
  consensusScore: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  result?: "WIN" | "LOSS" | "DRAW";
  reason: string;
  expiresAt?: number;
  entryTime?: string;
  expiryTime?: string;
  confluences?: string[];
  signalMode?: "SNIPER" | "TURBO";
}

export interface AIHealthItem {
  provider: AIProviderName;
  model: string;
  status: ModelHealthStatus;
  latencyMs: number;
  error?: string;
  testedAt: number;
  configured: boolean;
}

export interface TwelveDataHealthStatus {
  configured: boolean;
  hasPersonalKey: boolean;
  status: "CONNECTED" | "KEY_MISSING" | "INVALID_KEY" | "ERROR" | "INITIALIZING";
  message: string;
  lastCheckTimestamp: number;
  dataReceiptTimestamp?: number;
  candleOpenTimestamp?: number;
  candleOpenTimeSP?: string;
  dataReceiptTimeSP?: string;
  indicatorsAvailableCount: number;
  indicatorsListSample: string[];
  latestCandleTimestamp?: string;
  candlesCount: number;
  symbol: string;
  interval: string;
  latencyMs: number;
  lastError?: string;
  testedRealResponse?: {
    endpoint: string;
    httpStatus: number;
    responseStatus: string;
    message?: string;
    timestamp: number;
  };
}

export interface MarketHealthStatus {
  source: string;
  status: MarketConnectionStatus;
  realTimeState?: PermittedRealTimeState;
  indicators?: {
    connectionState: "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "ERROR";
    streamingState: "STREAMING" | "IDLE" | "OFFLINE";
    validationState: "DATA_VALIDATED" | "STALE_DATA" | "INVALID_DATA";
  };
  timestamps?: {
    receivedAt: number;
    sourceTimestamp: number;
    ageMs: number;
    ageSeconds: number;
  };
  lastTick: MarketTick | null;
  latencyMs: number;
  ticksReceived: number;
  candlesReceived: number;
  reconnects: number;
  supportedTimeframes: string[];
  lastUpdated: number;
  twelveData?: TwelveDataHealthStatus;
}
