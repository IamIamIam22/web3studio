import React, { useState } from "react";
import {
  Archive,
  Download,
  Search,
  Filter,
  Star,
  FileCode2,
  CheckCircle2,
  ExternalLink,
  Code,
  Layers,
  Terminal,
  Trash2,
  Sparkles,
  Plus,
  DownloadCloud,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Coins,
  ArrowRight,
  Zap,
} from "lucide-react";
import { DeployedContract, NetworkId, ContractType } from "../../types";
import {
  formatAddress,
  formatEth,
  downloadContractsZip,
  downloadContractJson,
  triggerCelebration,
  NETWORK_RPCS,
} from "../../utils/web3Utils";
import { ImportContractModal } from "../modals/ImportContractModal";
import { ProfitSweeper } from "./ProfitSweeper";

interface ContractVaultTabProps {
  contracts: DeployedContract[];
  onSelectContract: (contract: DeployedContract) => void;
  onNavigateLifecycle: () => void;
  onNavigateSecurityAudit: (code: string, name: string) => void;
  onAddContract?: (contract: DeployedContract) => void;
  onDeleteContract?: (contractId: string) => void;
}

export const ContractVaultTab: React.FC<ContractVaultTabProps> = ({
  contracts,
  onSelectContract,
  onNavigateLifecycle,
  onNavigateSecurityAudit,
  onAddContract,
  onDeleteContract,
}) => {
  const [activeSubView, setActiveSubView] = useState<"vault" | "sweeper">("vault");
  const [sweeperTargetContract, setSweeperTargetContract] = useState<DeployedContract | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [inspectTab, setInspectTab] = useState<"source" | "abi" | "bytecode">("source");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesNetwork = selectedNetwork === "all" || c.network === selectedNetwork;
    const matchesType = selectedType === "all" || c.type === selectedType;
    const matchesFavorite = !onlyFavorites || c.favorite;

    return matchesSearch && matchesNetwork && matchesType && matchesFavorite;
  });

  const toggleSelectContract = (id: string) => {
    setSelectedContractIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportZip = async (all = false) => {
    const targets = all
      ? contracts
      : contracts.filter((c) => selectedContractIds.includes(c.id));

    if (targets.length === 0) return;
    await downloadContractsZip(targets, `contract-vault-${Date.now()}.zip`);
    triggerCelebration();
  };

  const handleOpenSweeperForContract = (contract: DeployedContract) => {
    setSweeperTargetContract(contract);
    onSelectContract(contract);
    setActiveSubView("sweeper");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sub-view Navigation Switcher */}
      <div className="flex items-center gap-2 p-1 bg-[#131316] border border-[#1e1e22] rounded-xl w-fit font-mono">
        <button
          type="button"
          onClick={() => setActiveSubView("vault")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
            activeSubView === "vault"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-[#a1a1aa] hover:text-white"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Contracts & Artifacts ({contracts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView("sweeper")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
            activeSubView === "sweeper"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "text-[#a1a1aa] hover:text-white"
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span>Profit Sweeper (withdrawProfits)</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
            Cold Storage
          </span>
        </button>
      </div>

      {activeSubView === "sweeper" ? (
        <ProfitSweeper
          contracts={contracts}
          initialContract={sweeperTargetContract}
          onSelectContract={onSelectContract}
          onNavigateAudit={onNavigateSecurityAudit}
        />
      ) : (
        <>
          {/* Top Vault Controls */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">Smart Contract Vault & Artifacts</h2>
                  <p className="text-xs text-[#71717a] font-mono">
                    Secure multi-chain repository for verified Solidity sources, ABIs, bytecodes, and deployment metadata
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Import from Etherscan</span>
                </button>

                {selectedContractIds.length > 0 && (
                  <button
                    onClick={() => handleExportZip(false)}
                    className="px-3 py-1.5 bg-[#1e1e22] hover:bg-[#27272a] text-white text-xs font-mono font-medium rounded-lg border border-[#27272a] flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    Export ({selectedContractIds.length}) ZIP
                  </button>
                )}
                <button
                  onClick={() => handleExportZip(true)}
                  className="px-3 py-1.5 bg-[#1e1e22] hover:bg-[#27272a] text-[#e1e1e3] text-xs font-mono font-medium rounded-lg border border-[#27272a] flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#a1a1aa]" />
                  Export All ({contracts.length})
                </button>
              </div>
            </div>

            {/* Filters & Search Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1e1e22]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, address, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#e1e1e3] font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-1.5 text-xs text-[#e1e1e3] font-mono outline-none focus:border-indigo-500"
                >
                  <option value="all">All Networks</option>
                  <option value="ethereum">Ethereum Mainnet</option>
                  <option value="arbitrum">Arbitrum One</option>
                  <option value="base">Base</option>
                  <option value="optimism">Optimism</option>
                  <option value="polygon">Polygon</option>
                  <option value="sepolia">Sepolia Testnet</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-1.5 text-xs text-[#e1e1e3] font-mono outline-none focus:border-indigo-500"
                >
                  <option value="all">All Contract Types</option>
                  <option value="ERC20">ERC20 Token</option>
                  <option value="ERC721">ERC721 NFT</option>
                  <option value="DeFi Vault">DeFi Vault</option>
                  <option value="Flashloan Arbitrage">Flashloan Arbitrage</option>
                  <option value="DEX Router">DEX Router</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`w-full py-1.5 px-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition ${
                    onlyFavorites
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-400 font-semibold"
                      : "bg-[#0c0c0e] border-[#1e1e22] text-[#71717a] hover:text-[#e1e1e3]"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {onlyFavorites ? "Starred Only" : "Filter Starred"}
                </button>
              </div>
            </div>
          </div>

          {/* Contract Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => {
              const isSelected = selectedContractIds.includes(contract.id);
              const isExpanded = expandedContractId === contract.id;

              return (
                <div
                  key={contract.id}
                  className={`bg-[#131316] border rounded-xl p-4 transition flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "border-indigo-500 bg-[#16161a]"
                      : "border-[#1e1e22] hover:border-[#27272a]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectContract(contract.id)}
                          className="rounded bg-[#0c0c0e] border-[#1e1e22] text-indigo-500 focus:ring-0"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-white truncate max-w-[180px] font-mono">
                            {contract.name}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e1e22] text-[#71717a] border border-[#27272a]">
                            {contract.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {contract.verified ? (
                          <span
                            title="Source Code Verified on Etherscan"
                            className="text-emerald-400 p-1 bg-emerald-500/10 rounded border border-emerald-500/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span
                            title="Unverified (Bytecode only)"
                            className="text-orange-400 p-1 bg-orange-500/10 rounded border border-orange-500/20 text-[10px] font-mono"
                          >
                            Bytecode
                          </span>
                        )}
                        {contract.favorite && (
                          <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-mono text-[#71717a] space-y-1 bg-[#0c0c0e] p-2.5 rounded-lg border border-[#1e1e22]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#52525b]">Address:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[#e1e1e3] font-semibold">
                            {formatAddress(contract.address)}
                          </span>
                          <button
                            onClick={() => handleCopy(contract.address, `addr-${contract.id}`)}
                            className="text-[#71717a] hover:text-white"
                          >
                            {copiedId === `addr-${contract.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#52525b]">Network:</span>
                        <span className="text-indigo-400 capitalize">{contract.network}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#52525b]">Balance:</span>
                        <span className="text-[#e1e1e3]">{contract.balanceEth} ETH</span>
                      </div>
                      {contract.auditScore && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#52525b]">Audit Score:</span>
                          <span
                            className={`font-semibold ${
                              contract.auditScore >= 80
                                ? "text-emerald-400"
                                : "text-orange-400"
                            }`}
                          >
                            {contract.auditScore} / 100
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {contract.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1e1e22] text-[#71717a] border border-[#27272a]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Artifact Quick Inspector Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedContractId(isExpanded ? null : contract.id)}
                      className="w-full py-1 text-[10px] font-mono text-[#71717a] hover:text-indigo-400 flex items-center justify-center gap-1 transition"
                    >
                      <span>{isExpanded ? "Hide Artifact Inspector" : "View Source / ABI / Bytecode"}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* Collapsible Artifact Inspector Box */}
                    {isExpanded && (
                      <div className="mt-2 bg-[#0c0c0e] border border-[#1e1e22] rounded-lg p-2.5 space-y-2 font-mono text-[11px] animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-[#1e1e22] pb-1.5">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectTab("source")}
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                inspectTab === "source"
                                  ? "bg-indigo-500/20 text-indigo-300 font-bold"
                                  : "text-[#71717a] hover:text-[#e1e1e3]"
                              }`}
                            >
                              Source ({contract.verified ? "Solidity" : "N/A"})
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectTab("abi")}
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                inspectTab === "abi"
                                  ? "bg-indigo-500/20 text-indigo-300 font-bold"
                                  : "text-[#71717a] hover:text-[#e1e1e3]"
                              }`}
                            >
                              ABI ({contract.abi.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectTab("bytecode")}
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                inspectTab === "bytecode"
                                  ? "bg-indigo-500/20 text-indigo-300 font-bold"
                                  : "text-[#71717a] hover:text-[#e1e1e3]"
                              }`}
                            >
                              Bytecode
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              handleCopy(
                                inspectTab === "source"
                                  ? contract.sourceCode
                                  : inspectTab === "abi"
                                  ? JSON.stringify(contract.abi, null, 2)
                                  : contract.bytecode,
                                `inspect-${contract.id}`
                              )
                            }
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            {copiedId === `inspect-${contract.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === `inspect-${contract.id}` ? "Copied" : "Copy"}</span>
                          </button>
                        </div>

                        <div className="max-h-32 overflow-y-auto text-[#a1a1aa] text-[10px] leading-relaxed break-all bg-[#131316] p-2 rounded">
                          {inspectTab === "source" && (
                            <pre className="whitespace-pre-wrap">{contract.sourceCode || "// No verified source available"}</pre>
                          )}
                          {inspectTab === "abi" && (
                            <pre className="whitespace-pre-wrap">{JSON.stringify(contract.abi, null, 2)}</pre>
                          )}
                          {inspectTab === "bytecode" && (
                            <div>{contract.bytecode}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-[#1e1e22] flex items-center justify-between gap-2">
                    <button
                      onClick={() => downloadContractJson(contract)}
                      title="Download JSON Bundle"
                      className="p-1.5 rounded-lg bg-[#1e1e22] hover:bg-[#27272a] text-[#a1a1aa] border border-[#27272a] transition text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectContract(contract);
                        onNavigateLifecycle();
                      }}
                      className="flex-1 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 text-xs font-mono font-medium rounded-lg border border-indigo-500/30 transition text-center"
                    >
                      Inspect & Call
                    </button>
                    <button
                      onClick={() => handleOpenSweeperForContract(contract)}
                      title="Sweep Profits to Cold Storage"
                      className="px-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition text-xs font-mono font-semibold flex items-center gap-1"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Sweep</span>
                    </button>
                    <button
                      onClick={() =>
                        onNavigateSecurityAudit(contract.sourceCode, contract.name)
                      }
                      title="Audit in AI Suite"
                      className="p-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 transition text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Etherscan Import Modal */}
          <ImportContractModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={(contract) => {
              if (onAddContract) {
                onAddContract(contract);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

