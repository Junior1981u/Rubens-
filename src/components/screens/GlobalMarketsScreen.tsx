import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Globe,
  Filter,
  Star,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { getAssetVisualBadges } from "../../utils/flagUtils.js";

export interface GlobalAssetItem {
  symbol: string;
  normalizedSymbol: string;
  twelveDataSymbol: string;
  name: string;
  category: "FOREX" | "CRYPTO" | "STOCKS" | "INDICES" | "COMMODITIES" | "ETFS";
  subCategory: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  baseFlagEmoji?: string;
  quoteFlagEmoji?: string;
  cryptoIconSymbol?: string;
  country?: string;
  exchange: string;
  source: string;
  availability: "REAL_TIME" | "DELAYED_15M" | "END_OF_DAY" | "REQUIRES_PRO_PLAN";
  webSocketEligible: boolean;
  planRequirement: string;
  isTradablePaper: boolean;
  currentPrice: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  payoutPercent: string;
  pipDecimals: number;
  lastUpdated: number;
  supportedBrokers: string[];
  description?: string;
}

export interface BrokerConnectorInfo {
  id: string;
  name: string;
  officialPortalUrl: string;
  hasOfficialPublicTradingApi: boolean;
  integrationStatus: string;
  reason: string;
  supportedModalities: string[];
  separationOfConcerns: {
    catalogOrigin: string;
    quoteFeedOrigin: string;
    signalSource: string;
    executionMode: string;
  };
  notes: string;
}

interface GlobalMarketsScreenProps {
  onSelectAssetForAnalysis: (symbol: string) => void;
  onNavigateToChart: (symbol: string) => void;
  currentActiveAsset: string;
}

export const GlobalMarketsScreen: React.FC<GlobalMarketsScreenProps> = ({
  onSelectAssetForAnalysis,
  onNavigateToChart,
  currentActiveAsset,
}) => {
  const [assets, setAssets] = useState<GlobalAssetItem[]>([]);
  const [brokers, setBrokers] = useState<BrokerConnectorInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBroker, setSelectedBroker] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"CATALOGO" | "CORRETORAS">("CATALOGO");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("nexora_favorites");
      return saved ? JSON.parse(saved) : ["EUR/USD", "BTC/USD", "XAU/USD", "USD/BRL"];
    } catch {
      return ["EUR/USD", "BTC/USD", "XAU/USD", "USD/BRL"];
    }
  });

  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [selectedAssetModal, setSelectedAssetModal] = useState<GlobalAssetItem | null>(null);

  // Fetch Catalog
  const fetchGlobalAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetsRes, brokersRes] = await Promise.all([
        fetch(`/api/global-markets/assets?category=${selectedCategory}&broker=${selectedBroker}&q=${encodeURIComponent(searchQuery)}`),
        fetch("/api/global-markets/brokers"),
      ]);

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        if (Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
      }

      if (brokersRes.ok) {
        const data = await brokersRes.json();
        if (Array.isArray(data.brokers)) {
          setBrokers(data.brokers);
        }
      }
    } catch (err) {
      console.warn("Global markets fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedBroker, searchQuery]);

  useEffect(() => {
    fetchGlobalAssets();
  }, [fetchGlobalAssets]);

  // Toggle favorite
  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      try {
        localStorage.setItem("nexora_favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const categoriesList = [
    { id: "ALL", label: "TODOS OS ATIVOS" },
    { id: "FOREX", label: "FOREX (MOEDAS)" },
    { id: "CRYPTO", label: "CRIPTO" },
    { id: "COMMODITIES", label: "COMMODITIES & METAIS" },
    { id: "INDICES", label: "ÍNDICES" },
    { id: "STOCKS", label: "AÇÕES" },
    { id: "ETFS", label: "ETFs" },
  ];

  const displayedAssets = assets.filter((item) => {
    if (onlyFavorites && !favorites.includes(item.symbol)) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 font-mono text-xs text-[#F5F7FF] pb-24">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#090F1E] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00E5FF] animate-pulse" />
            <h1 className="text-lg sm:text-xl font-black tracking-wider text-white">
              GLOBAL ASSET UNIVERSE & CONECTORES
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Catálogo dinâmico global com bandeiras ISO 4217, metadados de bolsa, provedores e status auditável de corretoras.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#050B16] p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab("CATALOGO")}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeTab === "CATALOGO"
                ? "bg-[#00E5FF] text-slate-950 shadow-md shadow-[#00E5FF]/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            CATÁLOGO ({displayedAssets.length})
          </button>
          <button
            onClick={() => setActiveTab("CORRETORAS")}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
              activeTab === "CORRETORAS"
                ? "bg-[#00E5FF] text-slate-950 shadow-md shadow-[#00E5FF]/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            CORRETORAS ({brokers.length})
          </button>
        </div>
      </div>

      {activeTab === "CATALOGO" ? (
        <>
          {/* Search, Filter Bar & Favorites Toggle */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por par (EUR/USD), ativo (Bitcoin), país (Brasil) ou código..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090F1E] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00E5FF] transition-all"
              />
            </div>

            {/* Filter by Favorites */}
            <button
              onClick={() => setOnlyFavorites((p) => !p)}
              className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 font-black transition-all cursor-pointer shrink-0 ${
                onlyFavorites
                  ? "bg-[#FFD700]/15 border-[#FFD700] text-[#FFD700]"
                  : "bg-[#090F1E] border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-[#FFD700]" : ""}`} />
              <span>FAVORITOS ({favorites.length})</span>
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]"
                    : "bg-[#090F1E] text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Asset Grid */}
          {isLoading ? (
            <div className="w-full py-16 flex flex-col items-center justify-center gap-3 bg-[#090F1E] rounded-2xl border border-white/10">
              <RefreshCw className="w-6 h-6 text-[#00E5FF] animate-spin" />
              <span className="text-slate-400 font-bold">Sincronizando instrumentos globais...</span>
            </div>
          ) : displayedAssets.length === 0 ? (
            <div className="w-full py-16 flex flex-col items-center justify-center gap-3 bg-[#090F1E] rounded-2xl border border-white/10 text-center px-4">
              <AlertTriangle className="w-8 h-8 text-[#FFD700]" />
              <h3 className="font-black text-white text-sm">NENHUM ATIVO ENCONTRADO</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Nenhum instrumento corresponde aos critérios da busca. Tente buscar por 'EUR', 'USD', 'BTC' ou selecione outra categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedAssets.map((asset) => {
                const badges = getAssetVisualBadges(asset.symbol, asset.category);
                const isFav = favorites.includes(asset.symbol);
                const isSelected = currentActiveAsset === asset.symbol;
                const isPositive = asset.change24hPercent >= 0;

                return (
                  <div
                    key={asset.symbol}
                    className={`bg-[#090F1E] rounded-2xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.25)] bg-[#0C162E]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Top Row: Flags & Symbol & Fav */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {/* Flag Badges */}
                        <div className="flex items-center gap-1 text-lg bg-[#050B16] px-2 py-1 rounded-xl border border-white/10">
                          {badges.isPair ? (
                            <>
                              <span>{badges.baseFlag}</span>
                              <span className="text-[10px] text-slate-500 font-bold">/</span>
                              <span>{badges.quoteFlag}</span>
                            </>
                          ) : (
                            <span>{badges.baseFlag}</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-white tracking-wider">
                              {asset.symbol}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                              {asset.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {asset.name}
                          </span>
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(asset.symbol)}
                        className="p-1 rounded-lg text-slate-400 hover:text-[#FFD700] transition-colors cursor-pointer"
                        title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Star className={`w-4 h-4 ${isFav ? "fill-[#FFD700] text-[#FFD700]" : ""}`} />
                      </button>
                    </div>

                    {/* Middle: Price, 24h & Payout */}
                    <div className="flex items-center justify-between py-2 border-y border-white/5 bg-[#050B16]/50 px-3 rounded-xl">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Preço Atual</div>
                        <div className="text-sm font-black text-white">
                          {asset.category === "FOREX"
                            ? asset.currentPrice.toFixed(asset.pipDecimals)
                            : asset.currentPrice >= 100
                            ? asset.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : asset.currentPrice.toFixed(asset.pipDecimals)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase text-center">24h Variação</div>
                        <div className={`text-xs font-black flex items-center justify-center gap-0.5 ${isPositive ? "text-[#00E676]" : "text-[#FF3366]"}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isPositive ? `+${asset.change24hPercent.toFixed(2)}%` : `${asset.change24hPercent.toFixed(2)}%`}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase text-right">Payout Est.</div>
                        <div className="text-xs font-black text-[#00E676] text-right">
                          {asset.payoutPercent}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Badges: Source, Feed, Exchange */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-1">
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-[#00E5FF]" />
                        <span>{asset.source}</span>
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-[#00E676]/15 text-[#00E676] font-bold border border-[#00E676]/30">
                        {asset.availability === "REAL_TIME" ? "REAL-TIME" : asset.availability}
                      </span>
                    </div>

                    {/* Actions: Analisar com Nexora Titan / Ver Gráfico */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onSelectAssetForAnalysis(asset.symbol)}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 hover:brightness-110 cursor-pointer shadow-md shadow-[#00E5FF]/20"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>ANALISAR</span>
                      </button>

                      <button
                        onClick={() => onNavigateToChart(asset.symbol)}
                        className="py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                      >
                        <span>GRÁFICO</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Corretoras Tab — MÓDULO 4: Honest Broker Architecture */
        <div className="space-y-4">
          <div className="bg-[#090F1E] rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00E676]" />
              ARQUITETURA MODULAR DE CORRETORAS & COMPLIANCE
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              O NEXORA TITAN AI adota o padrão estrito de <strong>separação de responsabilidades</strong>:
              o motor de análise de velas M1, cálculo de indicadores e consenso das 4 IAs opera com feeds independentes de altíssima fidelidade. Nenhuma ordem financeira real é executada automaticamente sem API oficial pública autorizada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brokers.map((broker) => {
              const hasPublicApi = broker.hasOfficialPublicTradingApi;
              return (
                <div
                  key={broker.id}
                  className="bg-[#090F1E] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center font-black text-white text-xs border border-white/10">
                          {broker.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-black text-sm text-white">{broker.name}</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${
                          broker.integrationStatus === "CONFIGURACAO_PENDENTE"
                            ? "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40"
                            : broker.integrationStatus === "REQUER_CREDENCIAS_AUTORIZADAS"
                            ? "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40"
                            : "bg-[#FF3366]/15 text-[#FF3366] border-[#FF3366]/40"
                        }`}
                      >
                        {broker.integrationStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      {broker.reason}
                    </p>

                    {/* Separation of Concerns Card */}
                    <div className="bg-[#050B16] rounded-xl p-2.5 border border-white/5 space-y-1.5 text-[10px]">
                      <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        SEPARAÇÃO DE CONECTORES:
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Origem Cotações:</span>
                        <span className="font-bold text-[#00E5FF]">{broker.separationOfConcerns.quoteFeedOrigin}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Sinais Titan AI:</span>
                        <span className="font-bold text-[#00E676]">{broker.separationOfConcerns.signalSource}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Modo de Operação:</span>
                        <span className="font-bold text-white">{broker.separationOfConcerns.executionMode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                    <span className="text-slate-500">Modalidades: {broker.supportedModalities.join(", ")}</span>
                    <a
                      href={broker.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00E5FF] hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Portal Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
