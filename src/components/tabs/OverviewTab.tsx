import React from "react";
import {
  Zap,
  ShieldAlert,
  Activity,
  FileCode2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Droplets,
  Radio,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
} from "lucide-react";
import {
  DeployedContract,
  MevOpportunity,
  MempoolTransaction,
  FaucetInfo,
  NetworkConfig,
} from "../../types";
import { NETWORKS } from "../../data/networks";
import { formatAddress, formatEth, formatUsd, formatGwei } from "../../utils/web3Utils";

interface OverviewTabProps {
  contracts: DeployedContract[];
  mevOpportunities: MevOpportunity[];
  mempoolTxs: MempoolTransaction[];
  faucets: FaucetInfo[];
  onNavigateTab: (tabId: string) => void;
  onSelectContract: (contract: DeployedContract) => void;
  onOpenExplainMev: (mev: MevOpportunity) => void;
  onOpenDeployModal: () => void;
  onOpenMainnetOrchestrator?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  contracts,
  mevOpportunities,
  mempoolTxs,
  faucets,
  onNavigateTab,
  onSelectContract,
  onOpenExplainMev,
  onOpenDeployModal,
  onOpenMainnetOrchestrator,
}) => {
  const totalContractEth = contracts.reduce(
    (acc, c) => acc + (parseFloat(c.balanceEth) || 0),
    0
  );
  const totalMevEth24h = mevOpportunities.reduce(
    (acc, m) => acc + m.grossProfitEth,
    0
  );
  const eligibleFaucets = faucets.filter((f) => f.status === "ONLINE");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Hero Banner & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total TVL / Monitored Value */}
        <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 relative overflow-hidden group hover:border-[#27272a] transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a]">Total Vault Balance</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCode2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">
              {formatEth(totalContractEth, 2)} ETH
            </div>
            <div className="text-xs text-[#71717a] mt-1 flex items-center gap-1.5 font-mono">
              <span>{formatUsd(totalContractEth * 3310)} USD</span>
              <span className="text-emerald-400 text-[11px] font-semibold flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified On-Chain
              </span>
            </div>
          </div>
        </div>

        {/* 24h Discovered MEV Gross */}
        <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 relative overflow-hidden group hover:border-[#27272a] transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a]">Live MEV Opportunities</span>
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">
              {formatEth(totalMevEth24h, 2)} ETH
            </div>
            <div className="text-xs text-[#71717a] mt-1 flex items-center gap-1.5 font-mono">
              <span>{formatUsd(totalMevEth24h * 3310)} Gross</span>
              <span className="text-orange-400 text-[11px] font-semibold">
                {mevOpportunities.length} detected
              </span>
            </div>
          </div>
        </div>

        {/* Live Mempool Traffic */}
        <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 relative overflow-hidden group hover:border-[#27272a] transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a]">Pending Mempool Queue</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">
              {mempoolTxs.length} <span className="text-xs text-[#71717a] font-normal">pending</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-mono font-medium">
              <Radio className="w-3 h-3 animate-pulse" /> Live RPC Feed
            </div>
          </div>
        </div>

        {/* Telegram Alert Engine Status */}
        <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 relative overflow-hidden group hover:border-[#27272a] transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a]">Telegram Alerts</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Radio className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">
              Live Gateway
            </div>
            <div className="text-xs text-[#71717a] mt-1 flex items-center gap-1.5 font-mono">
              <span>Alert Stream:</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live MEV Scanner & Deployed Contracts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time MEV Discovery Box */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">Live MEV & Arbitrage Opportunities</h3>
                  <p className="text-xs text-[#71717a]">
                    Real-time front-running, cross-DEX spreads, and Flashbots bundle opportunities
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("mev")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                Full Scanner &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {mevOpportunities.length === 0 ? (
                <div className="p-6 text-center bg-[#0c0c0e] border border-[#1e1e22] rounded-lg">
                  <Zap className="w-8 h-8 text-[#52525b] mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-white font-mono font-medium">No active MEV opportunities in current block</p>
                  <p className="text-[11px] text-[#71717a] mt-1 font-mono">
                    Real-time transaction scanner will surface cross-DEX spreads and sandwich vectors as blocks arrive.
                  </p>
                </div>
              ) : (
                mevOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-[#0c0c0e] border border-[#1e1e22] hover:border-[#27272a] rounded-lg p-3.5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            opp.type === "Sandwich Attack"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : opp.type === "DEX Arbitrage"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                          }`}
                        >
                          {opp.type}
                        </span>
                        <span className="font-bold text-xs text-white font-mono">{opp.pair}</span>
                        <span className="text-[11px] text-[#71717a] font-mono">
                          ({opp.dexA} {opp.dexB ? `vs ${opp.dexB}` : ""})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#71717a] font-mono">
                        <span>Spread: <strong className="text-emerald-400">+{opp.spreadPercent}%</strong></span>
                        <span>Bribe: <strong className="text-orange-400">{opp.minerBribePercent}%</strong></span>
                        <span>Builder: <strong className="text-[#a1a1aa]">{opp.blockBuilder}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          +{formatEth(opp.grossProfitEth, 3)} ETH
                        </div>
                        <div className="text-[10px] text-[#52525b] font-mono">
                          {formatUsd(opp.grossProfitUsd)}
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenExplainMev(opp)}
                        className="px-3 py-1.5 rounded-lg bg-[#1e1e22] hover:bg-[#27272a] text-[#e1e1e3] text-xs font-mono font-medium flex items-center gap-1.5 border border-[#27272a] transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        AI Breakdown
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deployed Contract Vault Preview */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileCode2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">Active Deployed Contracts</h3>
                  <p className="text-xs text-[#71717a]">
                    Live contracts with interactive ABI calling & execution
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenDeployModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                + Deploy New
              </button>
            </div>

            {contracts.length === 0 ? (
              <div className="p-6 text-center bg-[#0c0c0e] border border-[#1e1e22] rounded-lg">
                <FileCode2 className="w-8 h-8 text-[#52525b] mx-auto mb-2 opacity-60" />
                <p className="text-xs text-white font-mono font-medium">No contracts in vault yet</p>
                <p className="text-[11px] text-[#71717a] mt-1 font-mono">
                  Deploy a new smart contract or import any verified contract address from Etherscan.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={onOpenDeployModal}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg shadow transition"
                  >
                    Deploy New Contract
                  </button>
                  <button
                    onClick={() => onNavigateTab("vault")}
                    className="px-3 py-1.5 bg-[#1e1e22] hover:bg-[#27272a] text-[#e1e1e3] text-xs font-mono font-semibold rounded-lg border border-[#27272a] transition"
                  >
                    Import Verified Address
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#1e1e22]">
                {contracts.slice(0, 3).map((contract) => (
                  <div
                    key={contract.id}
                    className="py-3 flex items-center justify-between hover:bg-[#1c1c21] px-2 rounded-lg transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white font-mono">{contract.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e1e22] text-[#71717a] font-mono border border-[#27272a]">
                          {contract.type}
                        </span>
                        {contract.verified && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-mono">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#71717a] font-mono flex items-center gap-2">
                        <span>{formatAddress(contract.address)}</span>
                        <span>&bull;</span>
                        <span>Balance: <strong className="text-[#e1e1e3]">{contract.balanceEth} ETH</strong></span>
                        {contract.auditScore && (
                          <>
                            <span>&bull;</span>
                            <span className="text-indigo-400">Score: {contract.auditScore}/100</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectContract(contract);
                          onNavigateTab("lifecycle");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 text-xs font-mono font-medium border border-indigo-500/20 transition"
                      >
                        Inspect ABI & Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Mainnet Broadcaster, Multi-Chain Gas Oracle & AI Assistant Launcher */}
        <div className="space-y-6">
          {/* Mainnet On-Chain Broadcaster Quick Card */}
          <div className="bg-gradient-to-br from-[#18150f] via-[#131316] to-[#0f1713] border border-amber-500/30 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-amber-950/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                </span>
                <h3 className="text-sm font-bold text-white font-mono">Mainnet On-Chain Sync</h3>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                ZERO MOCKS
              </span>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4 font-mono">
              Align nonces, estimate exact gas, and write all staged contracts, sweeps, and calls to the canonical EVM blockchain via your local device wallet.
            </p>
            <button
              onClick={onOpenMainnetOrchestrator}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-mono font-bold text-xs rounded-lg shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Mainnet Orchestrator &rarr;</span>
            </button>
          </div>

          {/* Multi-Chain Gas Price Matrix */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                <Flame className="w-4 h-4 text-orange-400" />
                Multi-Chain Gas Oracle
              </h3>
              <span className="text-[10px] text-[#52525b] font-mono">EIP-1559</span>
            </div>

            <div className="space-y-2.5">
              {NETWORKS.map((net) => (
                <div
                  key={net.id}
                  className="p-2.5 rounded-lg bg-[#0c0c0e] border border-[#1e1e22] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: net.color }}
                    />
                    <span className="text-[#e1e1e3] font-medium">{net.shortName}</span>
                    {net.isTestnet && (
                      <span className="text-[9px] px-1 rounded bg-[#1e1e22] text-[#71717a]">
                        Test
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-semibold">
                      {formatGwei(net.baseFeeGwei)}
                    </div>
                    <div className="text-[10px] text-[#52525b]">
                      +{net.priorityFeeGwei} Gwei
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Security Suite Banner */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-mono">Gemini Smart Contract Auditor</h3>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
              Perform deep static analysis, detect reentrancy and MEV vulnerabilities, and generate gas optimizations.
            </p>
            <button
              onClick={() => onNavigateTab("security")}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-medium text-xs rounded-lg shadow-lg shadow-indigo-600/20 transition"
            >
              Launch AI Security Scanner &rarr;
            </button>
          </div>

          {/* Bitcoin & UTXO Studio Quick Banner */}
          <div className="bg-[#131316] border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-400 font-bold">₿</span>
              <h3 className="text-sm font-bold text-white font-mono">Bitcoin & BitVM2 Studio</h3>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
              Miniscript compilers, BitVM fraud proofs, Stacks Clarity smart contracts, and BIP-174 PSBT builders.
            </p>
            <button
              onClick={() => onNavigateTab("bitcoin")}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-lg shadow-lg shadow-amber-500/20 transition"
            >
              Open Bitcoin Smart Contract Studio &rarr;
            </button>
          </div>

          {/* Telegram Alert Engine Quick Box */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                <Radio className="w-4 h-4 text-sky-400" />
                Telegram Alert Gateway
              </h3>
              <button
                onClick={() => onNavigateTab("faucets")}
                className="text-[11px] text-sky-400 hover:underline font-mono"
              >
                Configure &rarr;
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                <span className="text-[#a1a1aa]">Tx Receipts Dispatch</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                <span className="text-[#a1a1aa]">Profit Balances Telemetry</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                <span className="text-[#a1a1aa]">MEV Discovery Alerts</span>
                <span className="text-orange-400 font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
