// ==========================================================
// NEXORA TITAN AI V33 — FLAG & CURRENCY IDENTIFICATION ENGINE
// ISO 4217 Currency Codes, Base/Quote Flag Pairs & Crypto Symbols
// ==========================================================

export interface CurrencyMetadata {
  code: string;
  name: string;
  country: string;
  flag: string;
  symbol: string;
}

export interface CryptoMetadata {
  code: string;
  name: string;
  symbol: string;
  color: string;
}

export interface CommodityMetadata {
  code: string;
  name: string;
  symbol: string;
  unit: string;
}

// 1. ISO 4217 Validated Fiat Currencies with Official Regional Flags
export const FIAT_CURRENCIES: Record<string, CurrencyMetadata> = {
  EUR: { code: "EUR", name: "Euro", country: "União Europeia", flag: "🇪🇺", symbol: "€" },
  USD: { code: "USD", name: "Dólar Americano", country: "Estados Unidos", flag: "🇺🇸", symbol: "$" },
  GBP: { code: "GBP", name: "Libra Esterlina", country: "Reino Unido", flag: "🇬🇧", symbol: "£" },
  JPY: { code: "JPY", name: "Iene Japonês", country: "Japão", flag: "🇯🇵", symbol: "¥" },
  AUD: { code: "AUD", name: "Dólar Australiano", country: "Austrália", flag: "🇦🇺", symbol: "A$" },
  CAD: { code: "CAD", name: "Dólar Canadense", country: "Canadá", flag: "🇨🇦", symbol: "C$" },
  CHF: { code: "CHF", name: "Franco Suíço", country: "Suíça", flag: "🇨🇭", symbol: "Fr" },
  NZD: { code: "NZD", name: "Dólar Neozelandês", country: "Nova Zelândia", flag: "🇳🇿", symbol: "NZ$" },
  BRL: { code: "BRL", name: "Real Brasileiro", country: "Brasil", flag: "🇧🇷", symbol: "R$" },
  CNY: { code: "CNY", name: "Yuan Chinês", country: "China", flag: "🇨🇳", symbol: "¥" },
  CNH: { code: "CNH", name: "Yuan Offshore", country: "China Offshore", flag: "🇨🇳", symbol: "¥" },
  MXN: { code: "MXN", name: "Peso Mexicano", country: "México", flag: "🇲🇽", symbol: "Mex$" },
  INR: { code: "INR", name: "Rúpia Indiana", country: "Índia", flag: "🇮🇳", symbol: "₹" },
  ZAR: { code: "ZAR", name: "Rand Sul-Africano", country: "África do Sul", flag: "🇿🇦", symbol: "R" },
  TRY: { code: "TRY", name: "Lira Turca", country: "Turquia", flag: "🇹🇷", symbol: "₺" },
  SGD: { code: "SGD", name: "Dólar de Cingapura", country: "Cingapura", flag: "🇸🇬", symbol: "S$" },
  SEK: { code: "SEK", name: "Coroa Sueca", country: "Suécia", flag: "🇸🇪", symbol: "kr" },
  NOK: { code: "NOK", name: "Coroa Norueguesa", country: "Noruega", flag: "🇳🇴", symbol: "kr" },
  HKD: { code: "HKD", name: "Dólar de Hong Kong", country: "Hong Kong", flag: "🇭🇰", symbol: "HK$" },
  KRW: { code: "KRW", name: "Won Sul-Coreano", country: "Coreia do Sul", flag: "🇰🇷", symbol: "₩" },
  RUB: { code: "RUB", name: "Rublo Russo", country: "Rússia", flag: "🇷🇺", symbol: "₽" },
  PLN: { code: "PLN", name: "Złoty Polonês", country: "Polônia", flag: "🇵🇱", symbol: "zł" },
};

// 2. Cryptocurrencies Metadata & Symbols
export const CRYPTO_CURRENCIES: Record<string, CryptoMetadata> = {
  BTC: { code: "BTC", name: "Bitcoin", symbol: "₿", color: "#F7931A" },
  ETH: { code: "ETH", name: "Ethereum", symbol: "Ξ", color: "#627EEA" },
  SOL: { code: "SOL", name: "Solana", symbol: "◎", color: "#14F195" },
  XRP: { code: "XRP", name: "XRP Ledger", symbol: "✕", color: "#23292F" },
  BNB: { code: "BNB", name: "Binance Coin", symbol: "🟡", color: "#F3BA2F" },
  ADA: { code: "ADA", name: "Cardano", symbol: "₳", color: "#0033AD" },
  DOGE: { code: "DOGE", name: "Dogecoin", symbol: "Ð", color: "#C2A633" },
  AVAX: { code: "AVAX", name: "Avalanche", symbol: "🔺", color: "#E84142" },
  LINK: { code: "LINK", name: "Chainlink", symbol: "⬡", color: "#375BD2" },
  DOT: { code: "DOT", name: "Polkadot", symbol: "●", color: "#E6007A" },
  LTC: { code: "LTC", name: "Litecoin", symbol: "Ł", color: "#345D9D" },
  USDT: { code: "USDT", name: "Tether USD", symbol: "₮", color: "#26A17B" },
};

// 3. Commodities & Metals
export const COMMODITIES_METADATA: Record<string, CommodityMetadata> = {
  XAU: { code: "XAU", name: "Ouro (Gold)", symbol: "🪙", unit: "oz troy" },
  XAG: { code: "XAG", name: "Prata (Silver)", symbol: "🥈", unit: "oz troy" },
  WTI: { code: "WTI", name: "Petróleo Bruto WTI", symbol: "🛢️", unit: "barril" },
  BRENT: { code: "BRENT", name: "Petróleo Brent", symbol: "🛢️", unit: "barril" },
  NG: { code: "NG", name: "Gás Natural", symbol: "🔥", unit: "MMBtu" },
  COPPER: { code: "COPPER", name: "Cobre", symbol: "🧱", unit: "libra" },
};

// 4. Index Symbols
export const INDICES_METADATA: Record<string, { code: string; name: string; country: string; flag: string; symbol: string }> = {
  US30: { code: "US30", name: "Dow Jones Industrial Average", country: "Estados Unidos", flag: "🇺🇸", symbol: "📈" },
  SPX500: { code: "SPX500", name: "S&P 500 Index", country: "Estados Unidos", flag: "🇺🇸", symbol: "📈" },
  NAS100: { code: "NAS100", name: "Nasdaq 100 Tech Index", country: "Estados Unidos", flag: "🇺🇸", symbol: "📈" },
  GER40: { code: "GER40", name: "DAX 40 Germany", country: "Alemanha", flag: "🇩🇪", symbol: "📈" },
  UK100: { code: "UK100", name: "FTSE 100 London", country: "Reino Unido", flag: "🇬🇧", symbol: "📈" },
  JPN225: { code: "JPN225", name: "Nikkei 225 Tokyo", country: "Japão", flag: "🇯🇵", symbol: "📈" },
  IBOV: { code: "IBOV", name: "Ibovespa Brasil", country: "Brasil", flag: "🇧🇷", symbol: "📈" },
};

/**
 * Extracts Base and Quote currencies from symbol like "EUR/USD" or "EUR/USD (OTC)"
 */
export function parsePairCurrencies(symbol: string): { base: string; quote: string } {
  const cleaned = symbol.replace(/\s*\(OTC\)/i, "").trim();
  if (cleaned.includes("/")) {
    const [b, q] = cleaned.split("/");
    return { base: b.toUpperCase(), quote: q.toUpperCase() };
  }
  // Se for Crypto/USD ou 6 letras tipo EURUSD
  if (cleaned.length === 6) {
    return { base: cleaned.slice(0, 3).toUpperCase(), quote: cleaned.slice(3).toUpperCase() };
  }
  return { base: cleaned, quote: "USD" };
}

/**
 * Returns base and quote flags for forex or single flag/icon for other assets
 */
export function getAssetVisualBadges(symbol: string, category?: string): {
  baseFlag: string;
  quoteFlag?: string;
  isPair: boolean;
  iconSymbol: string;
  displayLabel: string;
} {
  const { base, quote } = parsePairCurrencies(symbol);

  // 1. Forex pair
  if (FIAT_CURRENCIES[base] && FIAT_CURRENCIES[quote]) {
    return {
      baseFlag: FIAT_CURRENCIES[base].flag,
      quoteFlag: FIAT_CURRENCIES[quote].flag,
      isPair: true,
      iconSymbol: `${FIAT_CURRENCIES[base].flag}${FIAT_CURRENCIES[quote].flag}`,
      displayLabel: `${base}/${quote}`,
    };
  }

  // 2. Crypto pair (e.g. BTC/USD, ETH/USD)
  if (CRYPTO_CURRENCIES[base]) {
    const quoteFlag = FIAT_CURRENCIES[quote]?.flag || "🇺🇸";
    return {
      baseFlag: CRYPTO_CURRENCIES[base].symbol,
      quoteFlag,
      isPair: true,
      iconSymbol: CRYPTO_CURRENCIES[base].symbol,
      displayLabel: `${base}/${quote}`,
    };
  }

  // 3. Commodity (e.g. XAU/USD, XAG/USD)
  if (COMMODITIES_METADATA[base]) {
    return {
      baseFlag: COMMODITIES_METADATA[base].symbol,
      quoteFlag: FIAT_CURRENCIES[quote]?.flag || "🇺🇸",
      isPair: true,
      iconSymbol: COMMODITIES_METADATA[base].symbol,
      displayLabel: `${base}/${quote}`,
    };
  }

  // 4. Index (e.g. US30, SPX500, NAS100)
  if (INDICES_METADATA[base]) {
    return {
      baseFlag: INDICES_METADATA[base].flag,
      isPair: false,
      iconSymbol: INDICES_METADATA[base].symbol,
      displayLabel: base,
    };
  }

  // 5. Stocks (e.g. AAPL, TSLA, PETR4)
  if (category === "STOCKS" || ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN", "META"].includes(base)) {
    return {
      baseFlag: "🇺🇸",
      isPair: false,
      iconSymbol: "🏛️",
      displayLabel: base,
    };
  }

  // Fallback
  return {
    baseFlag: "🌐",
    isPair: false,
    iconSymbol: "🌐",
    displayLabel: symbol,
  };
}
