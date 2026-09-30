import React, { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  Flame,
  Radio,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Code,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { MempoolTransaction, NetworkId } from "../../types";
import { formatAddress, formatEth, formatGwei, formatUsd } from "../../utils/web3Utils";

interface MempoolMonitorTabProps {
  transactions: MempoolTransaction[];
  onRefresh?: () => void;
}

export const MempoolMonitorTab: React.FC<MempoolMonitorTabProps> = ({
  transactions,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<"all" | "whale" | "creation" | "highGas" | "mevRisk">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<MempoolTransaction | null>(transactions[0] || null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.decodedFunction?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "whale") return matchesSearch && tx.isWhale;
    if (filterType === "creation") return matchesSearch && tx.isContractCreation;
    if (filterType === "highGas") return matchesSearch && tx.isHighGas;
    if (filterType === "mevRisk") return matchesSearch && (tx.mevRisk === "HIGH" || tx.mevRisk === "MEDIUM");
    return matchesSearch;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">Live Mempool & Pending Tx Watcher</h2>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REAL-TIME STREAM
                </span>
              </div>
              <p className="text-xs text-[#71717a]">
                Inspect raw calldata, 4-byte selectors, pending whale swaps, and gas spikes in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 bg-[#1e1e22] hover:bg-[#27272a] text-[#e1e1e3] text-xs font-mono font-medium rounded-lg border border-[#27272a] transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh Mempool Feed</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#1e1e22]">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 text-xs font-mono rounded transition ${
                filterType === "all"
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold"
                  : "bg-[#0c0c0e] text-[#71717a] hover:text-[#e1e1e3] border border-[#1e1e22]"
              }`}
            >
              All Pending ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType("whale")}
              className={`px-3 py-1 text-xs font-mono rounded transition ${
                filterType === "whale"
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold"
                  : "bg-[#0c0c0e] text-[#71717a] hover:text-[#e1e1e3] border border-[#1e1e22]"
              }`}
            >
              Whales (&gt;20 ETH)
            </button>
            <button
              onClick={() => setFilterType("creation")}
              className={`px-3 py-1 text-xs font-mono rounded transition ${
                filterType === "creation"
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold"
                  : "bg-[#0c0c0e] text-[#71717a] hover:text-[#e1e1e3] border border-[#1e1e22]"
              }`}
            >
              Contract Deployments
            </button>
            <button
              onClick={() => setFilterType("highGas")}
              className={`px-3 py-1 text-xs font-mono rounded transition ${
                filterType === "highGas"
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold"
                  : "bg-[#0c0c0e] text-[#71717a] hover:text-[#e1e1e3] border border-[#1e1e22]"
              }`}
            >
              Gas Spikes (&gt;50 Gwei)
            </button>
            <button
              onClick={() => setFilterType("mevRisk")}
              className={`px-3 py-1 text-xs font-mono rounded transition ${
                filterType === "mevRisk"
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold"
                  : "bg-[#0c0c0e] text-[#71717a] hover:text-[#e1e1e3] border border-[#1e1e22]"
              }`}
            >
              MEV Vulnerable
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search hash, address, selector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#e1e1e3] font-mono outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Tx List (7 cols) + Deep Tx Inspector (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Feed */}
        <div className="lg:col-span-7 space-y-3">
          {filteredTxs.length === 0 ? (
            <div className="p-8 text-center bg-[#131316] rounded-xl border border-[#1e1e22] text-[#71717a] text-xs font-mono">
              No transactions matching the active filter.
            </div>
          ) : (
            filteredTxs.map((tx) => {
              const isSelected = selectedTx?.hash === tx.hash;
              return (
                <div
                  key={tx.hash}
                  onClick={() => setSelectedTx(tx)}
                  className={`bg-[#131316] border rounded-xl p-4 cursor-pointer transition space-y-2.5 ${
                    isSelected
                      ? "border-indigo-500 bg-[#16161a]"
                      : "border-[#1e1e22] hover:border-[#27272a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                      <span className="font-mono font-bold text-xs text-white">
                        {formatAddress(tx.hash, 8, 6)}
                      </span>
                      {tx.decodedFunction && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {tx.decodedFunction.name}()
                        </span>
                      )}
                      {tx.isContractCreation && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                          Deploy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      {parseFloat(tx.valueEth) > 0 && (
                        <span className="font-bold text-white">
                          {tx.valueEth} ETH
                        </span>
                      )}
                      <span className="text-[#52525b] text-[10px]">{tx.timestamp}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-[#71717a] bg-[#0c0c0e] p-2 rounded-lg border border-[#1e1e22]">
                    <div>
                      <span className="text-[#52525b] block">From</span>
                      <span className="text-[#a1a1aa]">{formatAddress(tx.from)}</span>
                    </div>
                    <div>
                      <span className="text-[#52525b] block">To</span>
                      <span className="text-[#a1a1aa]">{formatAddress(tx.to)}</span>
                    </div>
                    <div>
                      <span className="text-[#52525b] block">Gas Price</span>
                      <span className="text-orange-400 font-semibold">
                        {formatGwei(tx.gasPriceGwei)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#52525b] block">MEV Threat</span>
                      <span
                        className={`font-semibold ${
                          tx.mevRisk === "HIGH"
                            ? "text-rose-400"
                            : tx.mevRisk === "LOW"
                            ? "text-blue-400"
                            : "text-[#71717a]"
                        }`}
                      >
                        {tx.mevRisk || "NONE"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Transaction Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {selectedTx ? (
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                    <Code className="w-4 h-4 text-indigo-400" />
                    Transaction Calldata Inspector
                  </h3>
                  <span className="text-[10px] text-[#52525b] font-mono">
                    Nonce #{selectedTx.nonce} &bull; Network: {selectedTx.network}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyHash(selectedTx.hash)}
                  className="p-1.5 rounded-lg bg-[#1e1e22] hover:bg-[#27272a] text-[#a1a1aa] transition border border-[#27272a]"
                  title="Copy Hash"
                >
                  {copiedHash ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#71717a]" />
                  )}
                </button>
              </div>

              {/* Decoded Method Call */}
              {selectedTx.decodedFunction ? (
                <div className="p-3 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] font-mono text-xs space-y-2">
                  <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold block">
                    Decoded ABI Method:
                  </span>
                  <div className="text-white font-bold">
                    {selectedTx.decodedFunction.name}(
                    {selectedTx.decodedFunction.params.map((p) => p.type).join(", ")})
                  </div>
                  <div className="space-y-1 pt-1 border-t border-[#1e1e22] text-[11px]">
                    {selectedTx.decodedFunction.params.map((param, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <span className="text-[#71717a]">{param.name} ({param.type}):</span>
                        <span className="text-[#e1e1e3] text-right truncate max-w-[180px]">
                          {param.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] font-mono text-xs text-[#71717a]">
                  {selectedTx.isContractCreation ? "Direct Contract Creation Bytecode" : "Standard Value Transfer (No Calldata)"}
                </div>
              )}

              {/* Raw Calldata Hex */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-[#71717a] block font-semibold">
                  Raw Input Data (Hex)
                </span>
                <pre className="p-3 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] text-[10px] font-mono text-[#a1a1aa] overflow-x-auto max-h-[140px] break-all leading-normal">
                  {selectedTx.calldata}
                </pre>
              </div>

              {/* Gas & Fee Breakdown */}
              <div className="p-3 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#71717a]">Gas Limit:</span>
                  <span className="text-[#e1e1e3]">{selectedTx.gasLimit.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#71717a]">Effective Gas Price:</span>
                  <span className="text-orange-400 font-semibold">
                    {formatGwei(selectedTx.gasPriceGwei)}
                  </span>
                </div>
                {selectedTx.maxPriorityFeeGwei && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#71717a]">Max Priority Fee (Tip):</span>
                    <span className="text-indigo-400">
                      +{formatGwei(selectedTx.maxPriorityFeeGwei)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1e1e22]">
                  <span className="text-[#71717a]">Value:</span>
                  <span className="text-white font-bold">
                    {selectedTx.valueEth} ETH ({formatUsd(parseFloat(selectedTx.valueEth) * 3310)})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#131316] rounded-xl border border-[#1e1e22] text-[#71717a] font-mono text-xs">
              Select a transaction to inspect calldata and traces.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
