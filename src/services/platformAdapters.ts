// ==========================================================
// NEXORA VISION AI V12 PRO — OFFICIAL PLATFORM ADAPTERS
// Strict Integration Architecture:
// - No fake APIs or simulated sockets
// - No capture of credentials, PINs, 2FA, session tokens or cookies
// - No CAPTCHA bypass
// - If no authorized API is active: status = NOT_CONNECTED / OFFLINE
// ==========================================================

export type PlatformIdentifier =
  | "quotex"
  | "iqoption"
  | "olymptrade"
  | "pocketoption"
  | "binomo"
  | "exnova"
  | "youxbroker";

export interface PlatformConfig {
  platformId: PlatformIdentifier;
  platformName: string;
  status: "OFFLINE" | "NOT_CONNECTED" | "RESTRICTED";
  dataSource: "NOT CONNECTED";
  selectedAsset: string;
  selectedTimeframe: string;
  lastUpdate: number;
  officialUrl: string;
  buttonText: string;
  badge: string;
  color: string;
  glow: string;
  description: string;
  isRestricted?: boolean;
  restrictionReason?: string;
}

export interface IPlatformAdapter {
  readonly platformId: PlatformIdentifier;
  readonly platformName: string;
  readonly officialUrl: string;
  readonly isRestricted: boolean;
  getStatus(): "OFFLINE" | "NOT_CONNECTED" | "RESTRICTED";
  getDataSource(): "NOT CONNECTED";
  getData(selectedAsset?: string, selectedTimeframe?: string): PlatformConfig;
}

// 1. QUOTEX ADAPTER
export class QuotexAdapter implements IPlatformAdapter {
  readonly platformId: PlatformIdentifier = "quotex";
  readonly platformName = "QUOTEX";
  readonly officialUrl = "https://quotex.com/pt/";
  readonly isRestricted = false;

  getStatus(): "OFFLINE" | "NOT_CONNECTED" {
    return "NOT_CONNECTED";
  }

  getDataSource(): "NOT CONNECTED" {
    return "NOT CONNECTED";
  }

  getData(selectedAsset: string = "EUR/USD", selectedTimeframe: string = "1M"): PlatformConfig {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: "OFFLINE",
      dataSource: "NOT CONNECTED",
      selectedAsset,
      selectedTimeframe,
      lastUpdate: Date.now(),
      officialUrl: this.officialUrl,
      buttonText: "ENTRAR NA QUOTEX",
      badge: "🟣",
      color: "#A855F7",
      glow: "rgba(168, 85, 247, 0.25)",
      description: "Corretora oficial de opções digitais com expirações rápidas de 1M a 5M e pares cambiais.",
      isRestricted: false,
    };
  }
}

// 2. IQ OPTION ADAPTER
export class IQOptionAdapter implements IPlatformAdapter {
  readonly platformId: PlatformIdentifier = "iqoption";
  readonly platformName = "IQ OPTION";
  readonly officialUrl = "https://iqoption.com/";
  readonly isRestricted = false;

  getStatus(): "OFFLINE" | "NOT_CONNECTED" {
    return "NOT_CONNECTED";
  }

  getDataSource(): "NOT CONNECTED" {
    return "NOT CONNECTED";
  }

  getData(selectedAsset: string = "EUR/USD", selectedTimeframe: string = "1M"): PlatformConfig {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: "OFFLINE",
      dataSource: "NOT CONNECTED",
      selectedAsset,
      selectedTimeframe,
      lastUpdate: Date.now(),
      officialUrl: this.officialUrl,
      buttonText: "ENTRAR NA IQ OPTION",
      badge: "🔵",
      color: "#3DA5FF",
      glow: "rgba(61, 165, 255, 0.25)",
      description: "Plataforma de negociação multi-ativos com gráficos em tempo real e opções binárias/digitais.",
      isRestricted: false,
    };
  }
}

// 3. OLYMPTRADE ADAPTER
export class OlymptradeAdapter implements IPlatformAdapter {
  readonly platformId: PlatformIdentifier = "olymptrade";
  readonly platformName = "OLYMPTRADE";
  readonly officialUrl = "https://olymptrade.com/pt-br/";
  readonly isRestricted = false;

  getStatus(): "OFFLINE" | "NOT_CONNECTED" {
    return "NOT_CONNECTED";
  }

  getDataSource(): "NOT CONNECTED" {
    return "NOT CONNECTED";
  }

  getData(selectedAsset: string = "EUR/USD", selectedTimeframe: string = "1M"): PlatformConfig {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: "OFFLINE",
      dataSource: "NOT CONNECTED",
      selectedAsset,
      selectedTimeframe,
      lastUpdate: Date.now(),
      officialUrl: this.officialUrl,
      buttonText: "ENTRAR NA OLYMPTRADE",
      badge: "🟢",
      color: "#00D68F",
      glow: "rgba(0, 214, 143, 0.25)",
      description: "Ambiente oficial com modalidade Fixed Time Trades (FTT) e catálogo de forex internacional.",
      isRestricted: false,
    };
  }
}

// 4. POCKET OPTION ADAPTER
export class PocketOptionAdapter implements IPlatformAdapter {
  readonly platformId: PlatformIdentifier = "pocketoption";
  readonly platformName = "POCKET OPTION";
  readonly officialUrl = "https://pocketoption.com/pt/";
  readonly isRestricted = false;

  getStatus(): "OFFLINE" | "NOT_CONNECTED" {
    return "NOT_CONNECTED";
  }

  getDataSource(): "NOT CONNECTED" {
    return "NOT CONNECTED";
  }

  getData(selectedAsset: string = "EUR/USD", selectedTimeframe: string = "1M"): PlatformConfig {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: "OFFLINE",
      dataSource: "NOT CONNECTED",
      selectedAsset,
      selectedTimeframe,
      lastUpdate: Date.now(),
      officialUrl: this.officialUrl,
      buttonText: "ENTRAR NA POCKET OPTION",
      badge: "🟠",
      color: "#F59E0B",
      glow: "rgba(245, 158, 11, 0.25)",
      description: "Plataforma de alta liquidez com opções digitais, payouts flexíveis e operações rápidas.",
      isRestricted: false,
    };
  }
}

// 5. BINOMO ADAPTER (RESTRITO NO BRASIL)
export class BinomoAdapter implements IPlatformAdapter {
  readonly platformId: PlatformIdentifier = "binomo";
  readonly platformName = "BINOMO";
  readonly officialUrl = "https://binomo.com/br-br";
  readonly isRestricted = true;
  readonly restrictionReason =
    "O portal oficial informa restrições para residentes no Brasil. A NEXORA respeita rigorosamente as diretrizes e não efetua bypass ou evasão.";

  getStatus(): "RESTRICTED" {
    return "RESTRICTED";
  }

  getDataSource(): "NOT CONNECTED" {
    return "NOT CONNECTED";
  }

  getData(selectedAsset: string = "EUR/USD", selectedTimeframe: string = "1M"): PlatformConfig {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: "RESTRICTED",
      dataSource: "NOT CONNECTED",
      selectedAsset,
      selectedTimeframe,
      lastUpdate: Date.now(),
      officialUrl: this.officialUrl,
      buttonText: "RESTRITO",
      badge: "🔴",
      color: "#FF5570",
      glow: "rgba(255, 85, 112, 0.25)",
      description: "Serviço com restrições ativas para residentes no Brasil. Acesso bloqueado por diretriz de compliance.",
      isRestricted: true,
      restrictionReason: this.restrictionReason,
    };
  }
}

// 6. EXNOVA ADAPTER
export class ExnovaAdapter implements IPlatformAdapter {
  readonly platformId: PlatformIdentifier = "exnova";
  readonly platformName = "EXNOVA";
  readonly officialUrl = "https://exnova.org/";
  readonly isRestricted = false;

  getStatus(): "OFFLINE" | "NOT_CONNECTED" {
    return "NOT_CONNECTED";
  }

  getDataSource(): "NOT CONNECTED" {
    return "NOT CONNECTED";
  }

  getData(selectedAsset: string = "EUR/USD", selectedTimeframe: string = "1M"): PlatformConfig {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: "OFFLINE",
      dataSource: "NOT CONNECTED",
      selectedAsset,
      selectedTimeframe,
      lastUpdate: Date.now(),
      officialUrl: this.officialUrl,
      buttonText: "ENTRAR NA EXNOVA",
      badge: "🟣",
      color: "#8B5CF6",
      glow: "rgba(139, 92, 246, 0.25)",
      description: "Terminal moderno de trading com execução rápida, opções digitais e spreads reduzidos.",
      isRestricted: false,
    };
  }
}

// 7. YOUXBROKER ADAPTER
export class YouXBrokerAdapter implements IPlatformAdapter {
  readonly platformId: PlatformIdentifier = "youxbroker";
  readonly platformName = "YOUXBROKER";
  readonly officialUrl = "https://trade.youxbroker.com/traderoom?registered=1";
  readonly isRestricted = false;

  getStatus(): "OFFLINE" | "NOT_CONNECTED" {
    return "NOT_CONNECTED";
  }

  getDataSource(): "NOT CONNECTED" {
    return "NOT CONNECTED";
  }

  getData(selectedAsset: string = "EUR/USD", selectedTimeframe: string = "1M"): PlatformConfig {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      status: "OFFLINE",
      dataSource: "NOT CONNECTED",
      selectedAsset,
      selectedTimeframe,
      lastUpdate: Date.now(),
      officialUrl: this.officialUrl,
      buttonText: "ABRIR YOUXBROKER",
      badge: "🌐",
      color: "#00E5FF",
      glow: "rgba(0, 229, 255, 0.25)",
      description: "Traderoom oficial da YouXBroker com gráficos rápidos, alta liquidez e múltiplos ativos.",
      isRestricted: false,
    };
  }
}

// Registry of adapters
export const platformAdapters: Record<PlatformIdentifier, IPlatformAdapter> = {
  quotex: new QuotexAdapter(),
  iqoption: new IQOptionAdapter(),
  olymptrade: new OlymptradeAdapter(),
  pocketoption: new PocketOptionAdapter(),
  binomo: new BinomoAdapter(),
  exnova: new ExnovaAdapter(),
  youxbroker: new YouXBrokerAdapter(),
};

export const ALL_PLATFORM_CONFIGS: PlatformConfig[] = [
  platformAdapters.quotex.getData(),
  platformAdapters.iqoption.getData(),
  platformAdapters.olymptrade.getData(),
  platformAdapters.pocketoption.getData(),
  platformAdapters.binomo.getData(),
  platformAdapters.exnova.getData(),
  platformAdapters.youxbroker.getData(),
];
