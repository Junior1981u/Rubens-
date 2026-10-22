import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Database,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";

export interface DiscoveredAsset {
  symbol: string;
  originalName: string;
  category: "FOREX" | "CRYPTO" | "COMMODITIES" | "INDICES" | "OTC";
  modality: "REGULAR" | "OTC" | "CRYPTO_SPOT";
  availability: "CONFIRMED" | "PENDING_FEED" | "UNAVAILABLE" | "RATE_LIMITED";
  sourceConfirmed: string;
  lastConfirmationTs: number;
  liveQuoteAvailable: boolean;
  currentPrice: number;
  bid: number;
  ask: number;
  spread: number;
  quoteTimestamp: number;
  dataAgeMs: number;
  dataOrigin: string;
  quoteStatus: "LIVE" | "ATRASADO" | "OFFLINE" | "INDISPONÍVEL";
  candleCount: number;
  hasSufficientHistory: boolean;
  connectionStatus: "ONLINE" | "CONFIGURACAO_PENDENTE" | "OFFLINE";
  errorReason?: string;
  brokerOfficialUrl: string;
  notes?: string;
}

export interface YouXConnectorStatus {
  status: "CONFIGURACAO_PENDENTE";
  officialApiDocumented: boolean;
  officialTraderoomUrl: string;
  reason: string;
  requirements: string;
  externalFeedNote: string;
  lastSyncTs: number;
  nextSyncAllowedTs: number;
  cacheExpiresTs: number;
  confirmedAssetsCount: number;
  totalAssetsCount: number;
  confirmedCategories: string[];
  isRateLimited: boolean;
  rateLimitCooldownSec: number;
}

interface YouXAssetDiscoveryScreenProps {
  onSelectAssetForAnalysis: (assetSymbol: string) => void;
  currentSelectedAsset: string;
}

export const YouXAssetDiscoveryScreen: React.FC<YouXAssetDiscoveryScreenProps> = ({
  onSelectAssetForAnalysis,
  currentSelectedAsset,
}) => {
  const [assets, setAssets] = useState<DiscoveredAsset[]>([]);
  const [connector, setConnector] = useState<YouXConnectorStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number>(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("ALL");

  // Fetch Catálogo
  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/youxbroker/assets");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
        if (data.connector) {
          setConnector(data.connector);
        }
      }
    } catch (err) {
      console.warn("Erro ao carregar catálogo YouXBroker:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    const interval = setInterval(fetchCatalog, 15000); // Polling suave a cada 15s
    return () => clearInterval(interval);
  }, [fetchCatalog]);

  // Sync Manual com Proteção de Rate Limit
  const handleManualSync = async () => {
    if (isSyncing || rateLimitCooldown > 0) return;

    try {
      setIsSyncing(true);
      setSyncMessage(null);
      const res = await fetch("/api/youxbroker/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.assets)) {
          setAssets(data.assets);
        }
        if (data.connector) {
          setConnector(data.connector);
        }
        setSyncMessage("✔ Catálogo sincronizado e cotações revalidadas com sucesso.");
        setTimeout(() => setSyncMessage(null), 4000);
      } else if (data.rateLimited) {
        setRateLimitCooldown(data.cooldownRemainingSec || 3);
        setSyncMessage(`⏳ Limite de requisições: aguarde ${data.cooldownRemainingSec}s.`);
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (err) {
      setSyncMessage("❌ Falha na conexão com o servidor.");
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cooldown timer tick
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const t = setInterval(() => {
      setRateLimitCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [rateLimitCooldown]);

  // Filtragem local
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      asset.originalName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase().trim());

    const matchesCategory =
      selectedCategory === "ALL" || asset.category === selectedCategory;

    const matchesAvailability =
      selectedAvailability === "ALL" ||
      (selectedAvailability === "CONFIRMED" && asset.availability === "CONFIRMED") ||
      (selectedAvailability === "PENDING" && asset.availability === "PENDING_FEED");

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categoriesList = [
    { id: "ALL", label: "TODOS" },
    { id: "FOREX", label: "FOREX" },
    { id: "CRYPTO", label: "CRIPTOMOEDAS" },
    { id: "COMMODITIES", label: "COMMODITIES" },
    { id: "INDICES", label: "ÍNDICES" },
    { id: "OTC", label: "OTC YOUX" },
  ];

  const formatPrice = (symbol: string, price: number) => {
    if (symbol.includes("BTC") || symbol.includes("US30") || symbol.includes("NAS100")) {
      return price.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    if (symbol.includes("ETH") || symbol.includes("XAU") || symbol.includes("SPX")) {
      return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (symbol.includes("JPY")) {
      return price.toFixed(3);
    }
    return price.toFixed(5);
  };

  const formatTime = (ts: number) => {
    if (!ts) return "--:--:--";
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(ts));
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-3 py-4 font-mono text-xs pb-24 text-[#F5F7FF] select-none">
      {/* 1. HEADER DO MÓDULO YOUXBROKER ASSET DISCOVERY */}
      <div className="bg-[#0A101D] border-2 border-[#00E5FF]/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(0,229,255,0.12)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-52 h-52 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shadow-lg shadow-[#00E5FF]/20">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                  YOUXBROKER ASSET DISCOVERY & VALIDATION
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                  V22 PRO
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Catálogo dinâmico, classificação por categoria e auditoria em tempo real de cotações interbancárias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing || rateLimitCooldown > 0}
              className={`px-3.5 py-2 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                rateLimitCooldown > 0
                  ? "bg-slate-800 text-slate-400 border border-white/10"
                  : "bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 text-[#00E5FF] border border-[#00E5FF]/50"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>
                {rateLimitCooldown > 0
                  ? `AGUARDE (${rateLimitCooldown}s)`
                  : isSyncing
                  ? "SINCRONIZANDO..."
                  : "ATUALIZAR CATÁLOGO"}
              </span>
            </button>

            <a
              href="https://trade.youxbroker.com/traderoom?registered=1"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.15] font-black text-[11px] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>TRADEROOM YOUXBROKER</span>
            </a>
          </div>
        </div>

        {/* Notificação de Sincronização */}
        {syncMessage && (
          <div className="mt-3 p-2 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-bold animate-in fade-in">
            {syncMessage}
          </div>
        )}

        {/* 2. DISCLOSURE OFICIAL DE INTEGRAÇÃO & COMPLIANCE */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-black">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>ESTADO DO CONECTOR YOUXBROKER</span>
            </div>
            <p className="text-slate-300 font-medium leading-relaxed">
              <strong>CONFIGURAÇÃO PENDENTE (WEB GATEWAY)</strong>. A YouXBroker opera via terminal web (trade.youxbroker.com) sem disponibilizar API pública oficial documentada.
            </p>
          </div>

          <div className="bg-[#070B14] p-3 rounded-xl border border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-[#22D3EE] font-black">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>FONTE ANALÍTICA & DIVERGÊNCIA OTC</span>
            </div>
            <p className="text-slate-300 font-medium leading-relaxed">
              Cotações auditadas via feeds interbancários e Twelve Data. Preços e spreads de corretoras OTC podem diferir do livro de liquidez interbancário.
            </p>
          </div>

          <div className="bg-[#070B14] p-3 rounded-xl border border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>SEGURANÇA & ZERO SCRAPING</span>
            </div>
            <p className="text-slate-300 font-medium leading-relaxed">
              Nenhuma credencial, cookie, token ou sessão privada é capturada. Execuções operam estritamente em <strong>PAPER MODE</strong> sem risco de capital.
            </p>
          </div>
        </div>

        {/* 3. MÉTRICAS RÁPIDAS DO CATÁLOGO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-white/[0.06]">
          <div className="bg-[#060810] p-2.5 rounded-xl border border-white/[0.05]">
            <span className="text-slate-400 text-[10px]">TOTAL DE ATIVOS</span>
            <div className="text-sm font-black text-white mt-0.5">
              {connector?.totalAssetsCount || assets.length} Mapeados
            </div>
          </div>
          <div className="bg-[#060810] p-2.5 rounded-xl border border-white/[0.05]">
            <span className="text-slate-400 text-[10px]">CONFIRMADOS LIVE</span>
            <div className="text-sm font-black text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{connector?.confirmedAssetsCount || assets.filter((a) => a.availability === "CONFIRMED").length} Ativos</span>
            </div>
          </div>
          <div className="bg-[#060810] p-2.5 rounded-xl border border-white/[0.05]">
            <span className="text-slate-400 text-[10px]">CATEGORIAS CONFIRMADAS</span>
            <div className="text-sm font-black text-[#00E5FF] mt-0.5">
              {connector?.confirmedCategories?.length || 5} Categorias
            </div>
          </div>
          <div className="bg-[#060810] p-2.5 rounded-xl border border-white/[0.05]">
            <span className="text-slate-400 text-[10px]">VALIDADE DO CACHE</span>
            <div className="text-sm font-black text-purple-300 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(connector?.cacheExpiresTs || Date.now() + 900000)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BARRA DE PESQUISA E FILTROS */}
      <div className="bg-[#0D1220] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Busca por Símbolo ou Nome */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por símbolo ou nome (ex: EUR, BTC, Ouro, OTC)..."
              className="w-full bg-[#070912] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro de Disponibilidade */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400 text-[10px] font-bold uppercase">STATUS:</span>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="bg-[#070912] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#00E5FF]"
            >
              <option value="ALL">TODOS</option>
              <option value="CONFIRMED">SOMENTE LIVE (CONFIRMADOS)</option>
              <option value="PENDING">PENDENTES</option>
            </select>
          </div>
        </div>

        {/* Abas de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] sm:text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#00E5FF] text-slate-950 font-black shadow-md shadow-[#00E5FF]/20"
                  : "bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. TABELA DINÂMICA DE ATIVOS CONFIRMADOS */}
      <div className="bg-[#0D1220] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00E5FF]" />
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              CATÁLOGO DE ATIVOS YOUXBROKER ({filteredAssets.length} EXIBIDOS)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            ATIVO SELECIONADO ATUALMENTE: <strong className="text-white">{currentSelectedAsset}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00E5FF]" />
            <p className="text-xs">Carregando e auditando catálogo de ativos...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2 bg-[#070912] rounded-xl border border-white/[0.04]">
            <Info className="w-6 h-6 mx-auto text-amber-400" />
            <p className="text-xs font-bold text-slate-300">Nenhum ativo corresponde aos filtros selecionados.</p>
            <p className="text-[11px] text-slate-500">Tente limpar a pesquisa ou selecionar "TODOS".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">ATIVO & DESCRIÇÃO</th>
                  <th className="py-2.5 px-2">CATEGORIA</th>
                  <th className="py-2.5 px-2 text-right">COTAÇÃO RECEBIDA</th>
                  <th className="py-2.5 px-2 text-center">HORÁRIO / IDADE</th>
                  <th className="py-2.5 px-2">ORIGEM DO DADO</th>
                  <th className="py-2.5 px-2 text-center">ESTADO</th>
                  <th className="py-2.5 px-3 text-right">AÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[11px]">
                {filteredAssets.map((asset) => {
                  const isCurrent = asset.symbol === currentSelectedAsset;
                  const isLive = asset.quoteStatus === "LIVE";
                  const isDelayed = asset.quoteStatus === "ATRASADO";
                  const isOffline = asset.quoteStatus === "OFFLINE";

                  return (
                    <tr
                      key={asset.symbol}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isCurrent ? "bg-[#00E5FF]/[0.06] border-l-2 border-[#00E5FF]" : ""
                      }`}
                    >
                      {/* Ativo Identificado */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-xs">{asset.symbol}</span>
                          {asset.modality === "OTC" && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              OTC
                            </span>
                          )}
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                              ATIVO
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                          {asset.originalName}
                        </span>
                      </td>

                      {/* Categoria */}
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] font-bold text-slate-300 border border-white/[0.06]">
                          {asset.category}
                        </span>
                      </td>

                      {/* Cotação Recebida */}
                      <td className="py-2.5 px-2 text-right font-mono">
                        <div className="font-black text-white">
                          {formatPrice(asset.symbol, asset.currentPrice)}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Spread: {asset.spread}
                        </div>
                      </td>

                      {/* Horário da Cotação & Idade */}
                      <td className="py-2.5 px-2 text-center font-mono">
                        <div className="text-slate-200">{formatTime(asset.quoteTimestamp)}</div>
                        <div className="text-[9px] text-slate-400">
                          {Math.round(asset.dataAgeMs / 1000)}s atrás
                        </div>
                      </td>

                      {/* Origem dos Dados */}
                      <td className="py-2.5 px-2 font-mono text-[10px] text-slate-300">
                        <span className="truncate max-w-[140px] block" title={asset.sourceConfirmed}>
                          {asset.sourceConfirmed.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-2 text-center font-black">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] inline-flex items-center gap-1 ${
                            isLive
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : isDelayed
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : isOffline
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLive
                                ? "bg-emerald-400 animate-pulse"
                                : isDelayed
                                ? "bg-amber-400"
                                : isOffline
                                ? "bg-rose-400"
                                : "bg-slate-500"
                            }`}
                          />
                          {asset.quoteStatus}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSelectAssetForAnalysis(asset.symbol)}
                          className={`px-2.5 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1 ml-auto transition-all cursor-pointer active:scale-95 ${
                            isCurrent
                              ? "bg-[#00E5FF] text-slate-950 shadow-md shadow-[#00E5FF]/20"
                              : "bg-white/[0.07] hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] text-slate-200 border border-white/10"
                          }`}
                        >
                          <span>{isCurrent ? "SELECIONADO" : "ANALISAR COM NEXORA"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
