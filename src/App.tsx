import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { ContractLifecycleTab } from "./components/tabs/ContractLifecycleTab";
import { SecurityAuditTab } from "./components/tabs/SecurityAuditTab";
import { ContractVaultTab } from "./components/tabs/ContractVaultTab";
import { MevDiscoveryTab } from "./components/tabs/MevDiscoveryTab";
import { MempoolMonitorTab } from "./components/tabs/MempoolMonitorTab";
import { FaucetAutomatorTab } from "./components/tabs/FaucetAutomatorTab";
import { SentinelWalletTab } from "./components/tabs/SentinelWalletTab";
import { BitcoinStudioTab } from "./components/tabs/BitcoinStudioTab";
import { DeployContractModal } from "./components/modals/DeployContractModal";
import { MevExplainerModal } from "./components/modals/MevExplainerModal";
import { MainnetOrchestratorModal } from "./components/modals/MainnetOrchestratorModal";
import { ConnectWalletModal } from "./components/modals/ConnectWalletModal";
import {
  DeployedContract,
  MevOpportunity,
  MempoolTransaction,
  FaucetInfo,
  WalletBalance,
  SentinelAlertRule,
  SentinelTriggerLog,
  NetworkId,
} from "./types";
import { NETWORKS } from "./data/networks";
import { computeKeccak256, triggerCelebration } from "./utils/web3Utils";
import { Bell, ShieldAlert, X, Zap } from "lucide-react";

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("ethereum");
  const [activeAddress, setActiveAddress] = useState<string>(() => {
    return localStorage.getItem("nexus_web3_active_addr") || "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
  });

  const handleUpdateActiveAddress = (newAddr: string) => {
    setActiveAddress(newAddr);
    localStorage.setItem("nexus_web3_active_addr", newAddr);
  };

  // Persistent State
  const [contracts, setContracts] = useState<DeployedContract[]>(() => {
    const saved = localStorage.getItem("nexus_web3_contracts");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(
    contracts[0] || null
  );

  const [mevOpportunities, setMevOpportunities] = useState<MevOpportunity[]>(() => {
    const saved = localStorage.getItem("nexus_web3_mev");
    return saved ? JSON.parse(saved) : [];
  });

  const [mempoolTxs, setMempoolTxs] = useState<MempoolTransaction[]>(() => {
    const saved = localStorage.getItem("nexus_web3_mempool");
    return saved ? JSON.parse(saved) : [];
  });

  const [faucets, setFaucets] = useState<FaucetInfo[]>([]);
  const [dripHistory, setDripHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("nexus_web3_drip_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [alertRules, setAlertRules] = useState<SentinelAlertRule[]>(() => {
    const saved = localStorage.getItem("nexus_web3_sentinel_rules");
    return saved ? JSON.parse(saved) : [];
  });
  const [triggerLogs, setTriggerLogs] = useState<SentinelTriggerLog[]>(() => {
    const saved = localStorage.getItem("nexus_web3_trigger_logs");
    return saved ? JSON.parse(saved) : [];
  });

  // In-App Toast Notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Security audit state sharing
  const [auditTargetCode, setAuditTargetCode] = useState<string | undefined>();
  const [auditTargetName, setAuditTargetName] = useState<string | undefined>();

  // Modals state
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isMainnetOrchestratorOpen, setIsMainnetOrchestratorOpen] = useState(false);
  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);
  const [explainingMev, setExplainingMev] = useState<MevOpportunity | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("nexus_web3_contracts", JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem("nexus_web3_sentinel_rules", JSON.stringify(alertRules));
  }, [alertRules]);

  useEffect(() => {
    localStorage.setItem("nexus_web3_trigger_logs", JSON.stringify(triggerLogs));
  }, [triggerLogs]);

  useEffect(() => {
    localStorage.setItem("nexus_web3_drip_history", JSON.stringify(dripHistory));
  }, [dripHistory]);

  const addToast = (title: string, message: string, severity: "CRITICAL" | "WARNING" | "INFO") => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      severity,
      timestamp: "Just now",
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // High-Speed Real-Time Scanner & RPC Polling Optimization
  const [deployPrefillData, setDeployPrefillData] = useState<{
    contractName?: string;
    sourceCode?: string;
    network?: NetworkId;
    step?: 1 | 2 | 3 | 4 | 5;
  } | undefined>();

  // Fetch live recent on-chain transactions and MEV opportunities from RPC with adaptive high-speed polling
  useEffect(() => {
    let isMounted = true;

    const fetchLiveMempoolAndMev = async () => {
      try {
        const [txRes, mevRes] = await Promise.all([
          fetch(`/api/rpc/recent-transactions?network=${selectedNetwork}`),
          fetch(`/api/rpc/scan-mev?network=${selectedNetwork}`),
        ]);

        if (txRes.ok && isMounted) {
          const txData = await txRes.json();
          if (txData.transactions && txData.transactions.length > 0) {
            setMempoolTxs(txData.transactions);
          }
        }

        if (mevRes.ok && isMounted) {
          const mevData = await mevRes.json();
          if (Array.isArray(mevData.opportunities)) {
            setMevOpportunities(mevData.opportunities);
          }
        }
      } catch (err) {
        console.warn("Live data fetch error:", err);
      }
    };

    fetchLiveMempoolAndMev();
    // High-speed polling: 1200ms when user is actively monitoring MEV/Mempool, 4000ms otherwise
    const pollInterval = activeTab === "mev" || activeTab === "mempool" ? 1200 : 4000;
    const interval = setInterval(fetchLiveMempoolAndMev, pollInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedNetwork, activeTab]);

  const handleDeployContract = (newContract: DeployedContract) => {
    setContracts((prev) => [newContract, ...prev]);
    setSelectedContract(newContract);
    addToast(
      "Contract Deployed On-Chain",
      `${newContract.name} deployed to ${newContract.network} at ${newContract.address}`,
      "INFO"
    );
  };

  const handleAddContract = (newContract: DeployedContract) => {
    setContracts((prev) => [newContract, ...prev]);
    setSelectedContract(newContract);
    addToast(
      "Contract Added to Vault",
      `${newContract.name} (${newContract.verified ? "Verified" : "Unverified"}) successfully saved`,
      "INFO"
    );
  };

  // Fetch multi-chain balances for active address
  useEffect(() => {
    let isMounted = true;
    const fetchBalances = async () => {
      const networkKeys: NetworkId[] = ["ethereum", "arbitrum", "base", "optimism", "polygon", "bsc", "avalanche"];
      try {
        const results: WalletBalance[] = await Promise.all(
          networkKeys.map(async (net) => {
            const netConfig = NETWORKS.find((n) => n.id === net);
            const netName = netConfig?.name || net;
            const sym = netConfig?.currency || (net === "polygon" ? "POL" : net === "bsc" ? "BNB" : net === "avalanche" ? "AVAX" : "ETH");
            try {
              const res = await fetch("/api/rpc/balance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: activeAddress, network: net }),
              });
              if (res.ok) {
                const data = await res.json();
                const numEth = parseFloat(data.balanceEth || "0") || 0;
                const numUsd = parseFloat(data.balanceUsd || "0") || 0;
                return {
                  network: net,
                  networkName: netName,
                  symbol: sym,
                  balance: numEth,
                  usdValue: numUsd,
                  tokens: [],
                };
              }
            } catch {}
            return {
              network: net,
              networkName: netName,
              symbol: sym,
              balance: 0,
              usdValue: 0,
              tokens: [],
            };
          })
        );
        if (isMounted) {
          setWalletBalances(results);
        }
      } catch (err) {
        console.warn("Failed to query multi-chain balances:", err);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeAddress]);

  const handleClaimFaucet = async (faucetId: string) => {
    const target = faucets.find((f) => f.id === faucetId);
    if (!target) return;

    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faucetId,
          recipientAddress: activeAddress,
          network: target.network,
        }),
      });

      const data = await res.json();

      if (data.success && data.txHash) {
        setDripHistory((prev) => [
          {
            id: `drip-${Date.now()}`,
            network: target.network,
            amount: `${target.dripAmount} ${target.currency}`,
            recipient: activeAddress,
            txHash: data.txHash,
            timestamp: "Just now",
            status: "CONFIRMED",
          },
          ...prev,
        ]);

        addToast(
          "Faucet Drip Claimed",
          `Sent ${target.dripAmount} ${target.currency} on ${target.network}`,
          "INFO"
        );
        triggerCelebration();
      } else {
        addToast("Faucet Response", data.message || "Faucet drip submitted to relayer", "INFO");
      }
    } catch (err: any) {
      addToast(
        "Faucet Request Failed",
        err.message || "Failed to claim from faucet",
        "WARNING"
      );
    }
  };

  const handleBatchClaimAll = () => {
    faucets.forEach((f) => handleClaimFaucet(f.id));
  };

  const handleToggleAutoClaim = (faucetId: string) => {
    setFaucets((prev) =>
      prev.map((f) =>
        f.id === faucetId ? { ...f, autoClaimEnabled: !f.autoClaimEnabled } : f
      )
    );
  };

  const handleNavigateSecurityAudit = (code: string, name: string) => {
    setAuditTargetCode(code);
    setAuditTargetName(name);
    setActiveTab("security");
  };

  const handleToggleSentinelRule = (ruleId: string) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteSentinelRule = (ruleId: string) => {
    setAlertRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleAddSentinelRule = (rule: SentinelAlertRule) => {
    setAlertRules((prev) => [rule, ...prev]);
    addToast(
      "Sentinel Rule Activated",
      `Monitoring active for: ${rule.title}`,
      "INFO"
    );
  };

  const handleTriggerTestAlert = (rule: SentinelAlertRule) => {
    const newLog: SentinelTriggerLog = {
      id: `trigger-${Date.now()}`,
      ruleId: rule.id,
      ruleTitle: rule.title,
      message: `[TEST TRIGGER] Sentinel daemon fired for ${rule.title} (Condition: ${rule.threshold}). Dispatched at ${new Date().toLocaleTimeString()}.`,
      severity: rule.category === "CONTRACT_BALANCE" ? "CRITICAL" : "WARNING",
      timestamp: "Just now",
      dataPayload: {
        target: rule.target,
        condition: rule.condition,
        network: rule.network,
        simulatedBlock: 21894050,
      },
    };

    setTriggerLogs((prev) => [newLog, ...prev]);
    addToast(
      `Sentinel Alert: ${rule.title}`,
      newLog.message,
      newLog.severity
    );
    triggerCelebration();
  };

  const handleClearLogs = () => {
    setTriggerLogs([]);
  };

  const handleSimulateMevOpportunity = (id: string) => {
    setMevOpportunities((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isSimulated: true, lastSimulationTime: "Just now" } : m
      )
    );
  };

  const handleRefreshMempool = async () => {
    try {
      const res = await fetch(`/api/rpc/recent-transactions?network=${selectedNetwork}`);
      const data = await res.json();
      if (data.transactions && Array.isArray(data.transactions)) {
        setMempoolTxs(data.transactions);
      }
    } catch (err) {
      console.warn("Failed to refresh live mempool:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#e1e1e3] flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Floating In-App Toast Banners */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border font-mono text-xs shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-in slide-in-from-top-2 transition-all ${
              toast.severity === "CRITICAL"
                ? "bg-rose-950/90 border-rose-600/50 text-rose-100"
                : toast.severity === "WARNING"
                ? "bg-orange-950/90 border-orange-600/50 text-orange-100"
                : "bg-[#131316]/95 border-indigo-500/40 text-white"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1 rounded mt-0.5 ${
                  toast.severity === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-400"
                    : toast.severity === "WARNING"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-indigo-500/20 text-indigo-400"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>{toast.title}</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Application Bar */}
      <Header
        activeNetwork={selectedNetwork}
        onSelectNetwork={setSelectedNetwork}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenMainnetOrchestrator={() => setIsMainnetOrchestratorOpen(true)}
        onOpenConnectWallet={() => setIsConnectWalletModalOpen(true)}
        unreadAlertsCount={triggerLogs.length}
        logs={triggerLogs}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        activeAddress={activeAddress}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          contractCount={contracts.length}
          mevCount={mevOpportunities.length}
          mempoolCount={mempoolTxs.length}
        />

        {/* Center Workspace & Views */}
        <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-7xl mx-auto w-full space-y-6 bg-[#0c0c0e]">
          {activeTab === "overview" && (
            <OverviewTab
              contracts={contracts}
              mevOpportunities={mevOpportunities}
              mempoolTxs={mempoolTxs}
              faucets={faucets}
              onNavigateTab={setActiveTab}
              onSelectContract={setSelectedContract}
              onOpenExplainMev={(mev) => setExplainingMev(mev)}
              onOpenDeployModal={() => setIsDeployModalOpen(true)}
              onOpenMainnetOrchestrator={() => setIsMainnetOrchestratorOpen(true)}
            />
          )}

          {activeTab === "bitcoin" && (
            <BitcoinStudioTab activeAddress={activeAddress} />
          )}

          {activeTab === "lifecycle" && (
            <ContractLifecycleTab
              contracts={contracts}
              selectedContract={selectedContract}
              onSelectContract={setSelectedContract}
              onOpenDeployModal={() => setIsDeployModalOpen(true)}
              onNavigateSecurityAudit={handleNavigateSecurityAudit}
              onInstantDeploy={(data) => {
                setDeployPrefillData({
                  contractName: data.contractName,
                  sourceCode: data.sourceCode,
                  network: data.network || (selectedNetwork as any),
                  step: 2,
                });
                setIsDeployModalOpen(true);
              }}
            />
          )}

          {activeTab === "security" && (
            <SecurityAuditTab
              initialCode={auditTargetCode}
              initialName={auditTargetName}
              onInstantDeploy={(data) => {
                setDeployPrefillData({
                  contractName: data.contractName,
                  sourceCode: data.sourceCode,
                  network: data.network || (selectedNetwork as any),
                  step: 2,
                });
                setIsDeployModalOpen(true);
              }}
            />
          )}

          {activeTab === "vault" && (
            <ContractVaultTab
              contracts={contracts}
              onSelectContract={setSelectedContract}
              onNavigateLifecycle={() => setActiveTab("lifecycle")}
              onNavigateSecurityAudit={handleNavigateSecurityAudit}
              onAddContract={handleAddContract}
            />
          )}

          {activeTab === "mev" && (
            <MevDiscoveryTab
              opportunities={mevOpportunities}
              onOpenExplainMev={(mev) => setExplainingMev(mev)}
              onSimulateOpportunity={handleSimulateMevOpportunity}
              activeAddress={activeAddress}
              selectedNetwork={selectedNetwork}
              onAddToast={addToast}
              onOpenMainnetOrchestrator={() => setIsMainnetOrchestratorOpen(true)}
            />
          )}

          {activeTab === "mempool" && (
            <MempoolMonitorTab
              transactions={mempoolTxs}
              onRefresh={handleRefreshMempool}
            />
          )}

          {activeTab === "faucets" && (
            <FaucetAutomatorTab
              faucets={faucets}
              dripHistory={dripHistory}
              onClaimFaucet={handleClaimFaucet}
              onToggleAutoClaim={handleToggleAutoClaim}
              onBatchClaimAll={handleBatchClaimAll}
              activeAddress={activeAddress}
            />
          )}

          {activeTab === "wallet" && (
            <SentinelWalletTab
              balances={walletBalances}
              alertRules={alertRules}
              triggerLogs={triggerLogs}
              onToggleRule={handleToggleSentinelRule}
              onDeleteRule={handleDeleteSentinelRule}
              onAddRule={handleAddSentinelRule}
              onTriggerTestAlert={handleTriggerTestAlert}
              onClearLogs={handleClearLogs}
              activeAddress={activeAddress}
              onUpdateActiveAddress={handleUpdateActiveAddress}
            />
          )}
        </main>
      </div>

      {/* Telemetry Footer */}
      <footer className="h-9 bg-[#0c0c0e] border-t border-[#1e1e22] px-6 flex items-center justify-between text-[10px] font-mono text-[#71717a] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#52525b]">STUDIO:</span>
          <span className="text-[#e1e1e3] font-semibold">Nexus Sentinel Command Center</span>
        </div>
        <div className="hidden sm:flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            RPC: <strong className="text-[#a1a1aa]">ALCHEMY_INFURA_RELAY</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            AI ENGINE: <strong className="text-indigo-400">GEMINI-3.7-FLASH</strong>
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <MainnetOrchestratorModal
        isOpen={isMainnetOrchestratorOpen}
        onClose={() => setIsMainnetOrchestratorOpen(false)}
        selectedNetwork={selectedNetwork}
        onSelectNetwork={setSelectedNetwork}
        activeAddress={activeAddress}
        contracts={contracts}
        onContractDeployed={handleDeployContract}
        onAddToast={addToast}
      />

      <DeployContractModal
        isOpen={isDeployModalOpen}
        onClose={() => {
          setIsDeployModalOpen(false);
          setDeployPrefillData(undefined);
        }}
        onDeploy={handleDeployContract}
        prefillData={deployPrefillData}
      />

      <MevExplainerModal
        isOpen={explainingMev !== null}
        onClose={() => setExplainingMev(null)}
        opportunity={explainingMev}
        onExecuteRealMainnet={async (opp) => {
          try {
            const res = await fetch("/api/rpc/broadcast-flashbots-bundle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                network: opp.network || selectedNetwork || "ethereum",
                bribeAmountEth: (opp.grossProfitEth * (opp.minerBribePercent / 100)).toFixed(4),
                mevStrategy: opp.type,
                pair: opp.pair,
                turboMode: true,
                senderAddress: activeAddress,
              }),
            });
            const data = await res.json();
            if (data.success && data.txHash) {
              addToast(
                "Flashbots Bundle Dispatched!",
                `Real on-chain MEV bundle submitted to ${data.relaysBroadcasted || 5} PBS builders. Tx: ${data.txHash.slice(0, 10)}...`,
                "INFO"
              );
            }
          } catch (err: any) {
            addToast("Broadcast Error", err.message || "Failed to broadcast bundle", "CRITICAL");
          }
        }}
      />

      <ConnectWalletModal
        isOpen={isConnectWalletModalOpen}
        onClose={() => setIsConnectWalletModalOpen(false)}
        activeAddress={activeAddress}
        selectedNetwork={selectedNetwork}
        onWalletConnected={(addr, pName) => {
          handleUpdateActiveAddress(addr);
          addToast(
            "Web3 Wallet Connected",
            `Connected ${pName || "Extension"} (${addr.slice(0, 6)}...${addr.slice(-4)}) to Nexus Web3 Studio.`,
            "INFO"
          );
        }}
      />
    </div>
  );
}
