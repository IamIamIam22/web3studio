import React, { useState } from "react";
import {
  ShieldAlert,
  Zap,
  Activity,
  PlusCircle,
  Bell,
  Layers,
  ChevronDown,
  Terminal,
  Cpu,
  Copy,
  Check,
  Fuel,
} from "lucide-react";
import { NetworkConfig, NetworkId, SentinelTriggerLog } from "../types";
import { NETWORKS } from "../data/networks";
import { formatAddress, formatGwei } from "../utils/web3Utils";

interface HeaderProps {
  activeNetwork?: NetworkId;
  currentNetwork?: NetworkId;
  onSelectNetwork: (networkId: NetworkId) => void;
  onOpenDeployModal: () => void;
  onOpenMainnetOrchestrator?: () => void;
  onOpenConnectWallet?: () => void;
  unreadAlertsCount?: number;
  logs?: SentinelTriggerLog[];
  onClearLogs?: () => void;
  activeTab?: string;
  onNavigateTab?: (tabId: string) => void;
  activeAddress?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeNetwork,
  currentNetwork,
  onSelectNetwork,
  onOpenDeployModal,
  onOpenMainnetOrchestrator,
  onOpenConnectWallet,
  unreadAlertsCount = 0,
  logs = [],
  onClearLogs = () => {},
  onNavigateTab = (_tabId?: string) => {},
  activeAddress = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
}) => {
  const activeNetId = activeNetwork || currentNetwork || "ethereum";
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentNetConfig = NETWORKS.find((n) => n.id === activeNetId) || NETWORKS[0];
  const userWallet = activeAddress;

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(userWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalAlerts = unreadAlertsCount || logs.length;

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c0e]/90 backdrop-blur-md border-b border-[#1e1e22] px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Studio Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono">
                WEB3_STUDIO
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.4
                </span>
              </span>
            </div>
            <p className="text-[11px] text-[#71717a] font-mono hidden sm:block">
              Contract Lifecycle & MEV Command Center
            </p>
          </div>
        </div>

        {/* Center Live Tickers: Gas Oracle & Mempool Status */}
        <div className="hidden md:flex items-center gap-3 bg-[#131316] border border-[#1e1e22] rounded-lg px-3 py-1.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            <span className="text-[#a1a1aa]">Mempool:</span>
            <span className="text-emerald-400 font-semibold">SYNCED</span>
          </div>
          <span className="text-[#27272a]">|</span>
          <div className="flex items-center gap-1.5 text-amber-300">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[#71717a]">Base:</span>
            <span className="font-semibold text-[#e1e1e3]">
              {formatGwei(currentNetConfig.baseFeeGwei)}
            </span>
          </div>
          <span className="text-[#27272a]">|</span>
          <div className="flex items-center gap-1.5 text-indigo-300">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[#71717a]">Prio:</span>
            <span className="font-semibold text-indigo-400">
              +{formatGwei(currentNetConfig.priorityFeeGwei)}
            </span>
          </div>
        </div>

        {/* Right Section: Network Switcher, Deploy Button, Wallet & Alerts */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Selector Dropdown */}
          <div className="relative">
            <button
              id="btn-network-selector"
              onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
              className="flex items-center gap-2 bg-[#131316] hover:bg-[#1c1c21] text-[#e1e1e3] border border-[#1e1e22] px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentNetConfig.color }}
              />
              <span className="hidden sm:inline font-mono">{currentNetConfig.name}</span>
              <span className="sm:hidden font-mono">{currentNetConfig.shortName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
            </button>

            {networkDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-[#131316] border border-[#1e1e22] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setNetworkDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#52525b] border-b border-[#1e1e22]">
                  Select EVM Network
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {NETWORKS.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => onSelectNetwork(net.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#1c1c21] transition ${
                        net.id === activeNetId ? "bg-indigo-600/15 text-indigo-400 font-semibold" : "text-[#a1a1aa]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: net.color }}
                        />
                        <span>{net.name}</span>
                      </div>
                      {net.isTestnet && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e22] text-[#71717a] border border-[#27272a]">
                          Testnet
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mainnet On-Chain Broadcaster Button */}
          <button
            id="btn-force-mainnet-sync"
            onClick={onOpenMainnetOrchestrator}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-500 hover:to-emerald-500 text-white font-mono font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition active:scale-95 animate-in fade-in"
            title="Write all queued & staged transactions directly to canonical EVM Mainnet via User Device Web3"
          >
            <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200 animate-pulse" />
            <span className="hidden sm:inline">Write All to Mainnet</span>
            <span className="sm:hidden">Mainnet</span>
            <span className="hidden md:inline text-[9px] px-1 py-0.2 rounded bg-black/40 text-emerald-300 font-normal">
              Live
            </span>
          </button>

          {/* Quick Deploy Button */}
          <button
            id="btn-quick-deploy"
            onClick={onOpenDeployModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-medium text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deploy Contract</span>
            <span className="sm:hidden">Deploy</span>
          </button>

          {/* Connected Developer Wallet / Connect Trigger */}
          <div className="flex items-center gap-1">
            <button
              id="btn-open-wallet-modal"
              onClick={onOpenConnectWallet}
              title="Click to Connect or Switch Web3 Browser Wallet"
              className="flex items-center gap-2 bg-[#131316] hover:bg-[#1c1c21] border border-[#1e1e22] hover:border-indigo-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-[#a1a1aa] hover:text-white cursor-pointer transition group"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="hidden sm:inline font-bold text-white group-hover:text-indigo-400 transition">
                {formatAddress(userWallet)}
              </span>
              <span className="sm:hidden font-bold text-white">Wallet</span>
            </button>

            <button
              onClick={handleCopyWallet}
              title="Copy active address to clipboard"
              className="p-1.5 rounded-lg bg-[#131316] hover:bg-[#1c1c21] text-[#71717a] hover:text-white border border-[#1e1e22] transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sentinel Notifications Bell */}
          <div className="relative">
            <button
              id="btn-alerts-bell"
              onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
              className="relative p-2 rounded-lg bg-[#131316] hover:bg-[#1c1c21] text-[#a1a1aa] hover:text-white border border-[#1e1e22] transition"
              aria-label="View Sentinel Alerts"
            >
              <Bell className="w-4 h-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_6px_rgba(249,115,22,0.6)]">
                  {totalAlerts > 9 ? "9+" : totalAlerts}
                </span>
              )}
            </button>

            {alertsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#131316] border border-[#1e1e22] rounded-xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e1e22]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-semibold text-white font-mono">Sentinel Alert Stream</span>
                  </div>
                  <button
                    onClick={onClearLogs}
                    className="text-[10px] font-mono text-[#71717a] hover:text-white transition"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#1e1e22] my-2">
                  {logs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#52525b] font-mono">
                      No active alerts triggered yet
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="py-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold font-mono ${
                              log.severity === "CRITICAL"
                                ? "text-rose-400"
                                : log.severity === "WARNING"
                                ? "text-orange-400"
                                : "text-indigo-400"
                            }`}
                          >
                            {log.ruleTitle}
                          </span>
                          <span className="text-[10px] text-[#52525b] font-mono">{log.timestamp}</span>
                        </div>
                        <p className="text-[#a1a1aa] text-[11px] mt-1 leading-relaxed">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    setAlertsDropdownOpen(false);
                    onNavigateTab("wallet");
                  }}
                  className="w-full text-center py-1.5 bg-[#1e1e22] hover:bg-[#27272a] text-indigo-400 text-xs rounded-lg font-mono font-medium transition"
                >
                  Configure Sentinel Rules &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
