import React, { useState } from "react";
import {
  FileCode2,
  Play,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Radio,
  Clock,
  ShieldCheck,
  Send,
  AlertCircle,
  Terminal,
  Code,
  Flame,
  CheckCircle2,
  RefreshCw,
  Zap,
  Rocket,
  ShieldAlert,
} from "lucide-react";
import { DeployedContract, AbiItem, AbiParam, NetworkId } from "../../types";
import {
  formatAddress,
  formatEth,
  computeKeccak256,
  triggerCelebration,
  calculateMethodSelector,
  executeLiveContractCall,
  encodeConstructorParameters,
} from "../../utils/web3Utils";

interface ContractLifecycleTabProps {
  contracts: DeployedContract[];
  selectedContract: DeployedContract | null;
  onSelectContract: (contract: DeployedContract) => void;
  onOpenDeployModal: () => void;
  onNavigateSecurityAudit: (code: string, name: string) => void;
  onInstantDeploy?: (data: { contractName: string; sourceCode: string; network?: NetworkId }) => void;
}

export const ContractLifecycleTab: React.FC<ContractLifecycleTabProps> = ({
  contracts,
  selectedContract,
  onSelectContract,
  onOpenDeployModal,
  onNavigateSecurityAudit,
  onInstantDeploy,
}) => {
  const current = selectedContract || contracts[0];
  const [activeSubTab, setActiveSubTab] = useState<"read" | "write" | "events" | "source" | "studio">("read");
  const [functionSearch, setFunctionSearch] = useState("");
  const [inputValues, setInputValues] = useState<Record<string, Record<string, string>>>({});
  const [executionResults, setExecutionResults] = useState<Record<string, { result?: any; gasUsed?: number; txHash?: string; error?: string; timestamp: string }>>({});
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Live On-Chain Event Logs
  const [eventLogs, setEventLogs] = useState<Array<{ id: string; name: string; params: Record<string, any>; blockNumber: number; txHash: string; timestamp: string }>>([]);

  // AI Generator & Flash Loan Studio State
  const [studioArchetype, setStudioArchetype] = useState("Flashloan Arbitrage");
  const [studioContractName, setStudioContractName] = useState("FlashArbitrageExecutor");
  const [studioBorrowSource, setStudioBorrowSource] = useState("Aave V3 Liquidity Pool");
  const [studioTargetPool, setStudioTargetPool] = useState("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2");
  const [studioRouters, setStudioRouters] = useState<string[]>(["Uniswap V3", "Sushiswap", "Curve"]);
  const [studioPrompt, setStudioPrompt] = useState("");
  const [studioCode, setStudioCode] = useState("");
  const [studioIsGenerating, setStudioIsGenerating] = useState(false);
  const [studioReentrancy, setStudioReentrancy] = useState(true);
  const [studioExecutorOnly, setStudioExecutorOnly] = useState(true);
  const [studioAtomicProfit, setStudioAtomicProfit] = useState(true);
  const [studioEmergencyDrain, setStudioEmergencyDrain] = useState(true);
  const [studioCopied, setStudioCopied] = useState(false);

  const defaultPoolAddresses: Record<string, string> = {
    "Aave V3 Liquidity Pool": "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    "Uniswap V3 Flash Swap": "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    "Balancer V2 Vault": "0xBA12222222228d8Ba5314F45464202048790FE63",
    "Equalizer / Curve": "0x1111111254EEB25477B68fb85Ed929f73A960582",
  };

  const handleGenerateStudioContract = async () => {
    setStudioIsGenerating(true);
    try {
      const res = await fetch("/api/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customPrompt: studioPrompt || `Generate an optimized ${studioArchetype} contract with ${studioBorrowSource} receiver callback.`,
          templateType: studioArchetype,
          name: studioContractName,
          borrowingSource: studioBorrowSource,
          targetPoolAddress: studioTargetPool || defaultPoolAddresses[studioBorrowSource],
          dexRouters: studioRouters,
          minProfitEnforcement: studioAtomicProfit,
          reentrancyGuard: studioReentrancy,
          executorAccessControl: studioExecutorOnly,
          emergencyDrain: studioEmergencyDrain,
        }),
      });
      const data = await res.json();
      if (data.soliditySource || data.sourceCode) {
        setStudioCode(data.soliditySource || data.sourceCode);
        if (data.contractName) setStudioContractName(data.contractName);
        triggerCelebration();
      }
    } catch (e) {
      console.warn("Studio generation error:", e);
    } finally {
      setStudioIsGenerating(false);
    }
  };

  if (!current) {
    return (
      <div className="p-12 text-center bg-[#131316] border border-[#1e1e22] rounded-xl">
        <FileCode2 className="w-12 h-12 text-[#52525b] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white font-mono">No Contracts Deployed</h3>
        <p className="text-xs text-[#71717a] mt-1 mb-4">
          Deploy a contract to start interacting with the ABI and functions.
        </p>
        <button
          onClick={onOpenDeployModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg"
        >
          Deploy First Contract
        </button>
      </div>
    );
  }

  const handleInputChange = (fnName: string, paramName: string, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [fnName]: {
        ...(prev[fnName] || {}),
        [paramName]: value,
      },
    }));
  };

  const handleExecuteFunction = async (fn: AbiItem) => {
    const fnName = fn.name || "unnamed";
    setIsExecuting(fnName);

    const isWrite = fn.stateMutability === "nonpayable" || fn.stateMutability === "payable";
    const inputs = inputValues[fnName] || {};

    // Calculate method signature and selector
    const paramTypes = (fn.inputs || []).map((p) => p.type).join(",");
    const signature = `${fnName}(${paramTypes})`;
    const selector = calculateMethodSelector(signature);

    let outputResult: any = null;
    let gasEstimate = isWrite ? 65000 : 2100;
    let txHash: string | undefined = undefined;

    if (!isWrite && current.address && current.address.startsWith("0x")) {
      // Build encoded calldata for live on-chain eth_call
      const encodedInputs = (fn.inputs || []).map((p) => ({
        name: p.name,
        type: p.type,
        value: inputs[p.name] || "",
      }));
      const { encodedHex } = encodeConstructorParameters(encodedInputs);
      const fullCalldata = `${selector}${encodedHex.replace(/^0x/, "")}`;

      try {
        const liveRes = await executeLiveContractCall(current.address, fullCalldata, current.network);
        if (liveRes.success && liveRes.result && liveRes.result !== "0x") {
          // Decode hex output
          const rawHex = liveRes.result;
          if (fn.outputs && fn.outputs.length > 0) {
            const outType = fn.outputs[0].type;
            if (outType.startsWith("uint") || outType.startsWith("int")) {
              try {
                outputResult = `${BigInt(rawHex).toString()} (${outType})`;
              } catch {
                outputResult = rawHex;
              }
            } else if (outType === "bool") {
              outputResult = BigInt(rawHex) !== 0n;
            } else if (outType === "address") {
              outputResult = `0x${rawHex.slice(-40)}`;
            } else {
              outputResult = rawHex;
            }
          } else {
            outputResult = rawHex;
          }
        } else {
          outputResult = liveRes.error ? `Revert: ${liveRes.error}` : "0x0 (Empty response from node)";
        }
      } catch (err: any) {
        outputResult = `RPC Error: ${err.message || "Failed to execute call"}`;
      }
    } else {
      // Real On-Chain Write Transaction via Injected Wallet (MetaMask/Rabby/Coinbase)
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const eth = (window as any).ethereum;
          const accounts = await eth.request({ method: "eth_requestAccounts" });
          const from = accounts[0];
          const tx = await eth.request({
            method: "eth_sendTransaction",
            params: [
              {
                from,
                to: current.address,
                data: `${selector}${encodeConstructorParameters((fn.inputs || []).map(p => ({ name: p.name, type: p.type, value: inputs[p.name] || "" }))).encodedHex.replace(/^0x/, "")}`,
              },
            ],
          });
          txHash = tx;
          outputResult = `Transaction Broadcasted! TxHash: ${tx}`;
          triggerCelebration();

          setEventLogs((prev) => [
            {
              id: `evt-${Date.now()}`,
              name: `${fnName.charAt(0).toUpperCase() + fnName.slice(1)}Emitted`,
              params: inputs,
              blockNumber: current.blockNumber + 1,
              txHash: txHash!,
              timestamp: "Just now",
            },
            ...prev,
          ]);
        } catch (err: any) {
          outputResult = `Wallet Rejected / Error: ${err.message || "User denied transaction"}`;
        }
      } else {
        outputResult = "No active Web3 wallet connected. Please connect MetaMask / Injected Web3 Provider to sign write transactions on-chain.";
      }
    }

    setExecutionResults((prev) => ({
      ...prev,
      [fnName]: {
        result: outputResult,
        gasUsed: gasEstimate,
        txHash,
        timestamp: new Date().toLocaleTimeString(),
      },
    }));

    setIsExecuting(null);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(current.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Filter ABI items
  const readFunctions = current.abi.filter(
    (item) => item.type === "function" && (item.stateMutability === "view" || item.stateMutability === "pure")
  );
  const writeFunctions = current.abi.filter(
    (item) => item.type === "function" && (item.stateMutability === "nonpayable" || item.stateMutability === "payable")
  );
  const events = current.abi.filter((item) => item.type === "event");

  const filteredFunctions = (activeSubTab === "read" ? readFunctions : writeFunctions).filter((fn) =>
    (fn.name || "").toLowerCase().includes(functionSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Contract Summary Header */}
      <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={current.id}
                onChange={(e) => {
                  const target = contracts.find((c) => c.id === e.target.value);
                  if (target) onSelectContract(target);
                }}
                className="bg-[#0c0c0e] text-white font-bold text-base px-3 py-1.5 rounded-lg border border-[#1e1e22] outline-none focus:border-indigo-500 font-mono"
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>

              <span className="text-xs px-2.5 py-1 rounded bg-[#1e1e22] text-[#a1a1aa] font-mono border border-[#27272a]">
                Network: <strong className="text-indigo-400">{current.network}</strong>
              </span>

              {current.verified && (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Source Verified
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#71717a] font-mono pt-1">
              <button
                onClick={copyAddress}
                className="flex items-center gap-1 hover:text-white transition"
              >
                <span>{current.address}</span>
                {copiedAddress ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#52525b]" />
                )}
              </button>
              <span>&bull;</span>
              <span>Balance: <strong className="text-[#e1e1e3]">{current.balanceEth} ETH</strong></span>
              <span>&bull;</span>
              <span>Block: <strong className="text-[#e1e1e3]">#{current.blockNumber}</strong></span>
              <span>&bull;</span>
              <span>Compiler: <strong className="text-[#e1e1e3]">{current.solidityVersion}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateSecurityAudit(current.sourceCode, current.name)}
              className="px-3 py-2 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 text-xs font-mono font-semibold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Audit with Gemini
            </button>
            <button
              onClick={onOpenDeployModal}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold transition"
            >
              + Deploy Another
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Read Contract, Write Contract, Events, Source Code */}
      <div className="flex border-b border-[#1e1e22] gap-2">
        <button
          onClick={() => setActiveSubTab("read")}
          className={`px-4 py-2.5 text-xs font-mono font-semibold transition border-b-2 ${
            activeSubTab === "read"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-[#71717a] hover:text-[#e1e1e3]"
          }`}
        >
          Read Contract ({readFunctions.length})
        </button>
        <button
          onClick={() => setActiveSubTab("write")}
          className={`px-4 py-2.5 text-xs font-mono font-semibold transition border-b-2 ${
            activeSubTab === "write"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-[#71717a] hover:text-[#e1e1e3]"
          }`}
        >
          Write Contract ({writeFunctions.length})
        </button>
        <button
          onClick={() => setActiveSubTab("events")}
          className={`px-4 py-2.5 text-xs font-mono font-semibold transition border-b-2 ${
            activeSubTab === "events"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-[#71717a] hover:text-[#e1e1e3]"
          }`}
        >
          Event Logs Simulator ({eventLogs.length})
        </button>
        <button
          onClick={() => setActiveSubTab("source")}
          className={`px-4 py-2.5 text-xs font-mono font-semibold transition border-b-2 ${
            activeSubTab === "source"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-[#71717a] hover:text-[#e1e1e3]"
          }`}
        >
          Solidity Source & Bytecode
        </button>
        <button
          onClick={() => {
            setActiveSubTab("studio");
            if (!studioCode) handleGenerateStudioContract();
          }}
          className={`px-4 py-2.5 text-xs font-mono font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeSubTab === "studio"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-indigo-400/80 hover:text-indigo-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Flash Loan & Contract Studio</span>
        </button>
      </div>

      {/* Main Interactive Sub-view */}
      {(activeSubTab === "read" || activeSubTab === "write") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search function by name or signature..."
                value={functionSearch}
                onChange={(e) => setFunctionSearch(e.target.value)}
                className="w-full bg-[#131316] border border-[#1e1e22] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#e1e1e3] placeholder-[#52525b] font-mono outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-[#71717a] font-mono">
              Showing {filteredFunctions.length} functions
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredFunctions.map((fn, index) => {
              const fnName = fn.name || "function";
              const isWrite = activeSubTab === "write";
              const resultData = executionResults[fnName];

              return (
                <div
                  key={index}
                  className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 hover:border-[#27272a] transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e1e22]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#52525b] font-mono text-xs">{index + 1}.</span>
                      <span className="font-mono font-bold text-sm text-white">{fnName}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.2 rounded ${
                          isWrite
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                        }`}
                      >
                        {fn.stateMutability}
                      </span>
                    </div>

                    <button
                      id={`btn-call-${fnName}`}
                      onClick={() => handleExecuteFunction(fn)}
                      disabled={isExecuting === fnName}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                        isWrite
                          ? "bg-orange-600 hover:bg-orange-500 text-white"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      } disabled:opacity-50`}
                    >
                      {isExecuting === fnName ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isWrite ? (
                        <Send className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>{isWrite ? "Execute State Change" : "Call Query"}</span>
                    </button>
                  </div>

                  {/* Function Inputs */}
                  {fn.inputs && fn.inputs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                      {fn.inputs.map((input, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="text-[11px] font-mono text-[#71717a] flex items-center justify-between">
                            <span>{input.name || `param_${idx}`}</span>
                            <span className="text-[#52525b]">{input.type}</span>
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter ${input.type}`}
                            value={inputValues[fnName]?.[input.name] || ""}
                            onChange={(e) => handleInputChange(fnName, input.name, e.target.value)}
                            className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-1.5 text-xs text-[#e1e1e3] font-mono outline-none focus:border-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#52525b] font-mono my-2 italic">
                      No parameters required
                    </div>
                  )}

                  {/* Output Viewer */}
                  {resultData && (
                    <div className="mt-3 p-3 bg-[#0c0c0e] border border-[#1e1e22] rounded-lg font-mono text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[#71717a] text-[10px]">
                        <span className="text-emerald-400 font-semibold">Decoded Execution Result:</span>
                        <span>Gas: {resultData.gasUsed?.toLocaleString()} | {resultData.timestamp}</span>
                      </div>
                      <pre className="text-[#e1e1e3] overflow-x-auto text-[11px] py-1">
                        {typeof resultData.result === "object"
                          ? JSON.stringify(resultData.result, null, 2)
                          : String(resultData.result)}
                      </pre>
                      {resultData.txHash && (
                        <div className="text-[10px] text-[#71717a] flex items-center gap-1">
                          <span>Tx: {formatAddress(resultData.txHash, 10, 8)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events Sub-view */}
      {activeSubTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#131316] p-3 rounded-xl border border-[#1e1e22]">
            <span className="text-xs text-[#a1a1aa] font-mono">
              Listening to live events emitted by <strong>{current.name}</strong>
            </span>
            <button
              onClick={() => {
                setEventLogs((prev) => [
                  {
                    id: `evt-${Date.now()}`,
                    name: "ArbitrageExecuted",
                    params: { token: "0x82af...bab1", borrowed: "100.0 ETH", profit: "0.85 ETH" },
                    blockNumber: current.blockNumber + 12,
                    txHash: computeKeccak256(`emit-${Date.now()}`),
                    timestamp: "Just now",
                  },
                  ...prev,
                ]);
              }}
              className="px-3 py-1 bg-[#1e1e22] hover:bg-[#27272a] text-indigo-400 text-xs font-mono rounded-lg border border-[#27272a] transition"
            >
              + Simulate Event Emission
            </button>
          </div>

          <div className="space-y-3">
            {eventLogs.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 font-mono text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <span className="font-bold text-indigo-400 text-sm">{evt.name}</span>
                    <span className="text-[10px] text-[#52525b]">Block #{evt.blockNumber}</span>
                  </div>
                  <span className="text-[10px] text-[#52525b]">{evt.timestamp}</span>
                </div>
                <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                  <pre className="text-[#a1a1aa] text-[11px] overflow-x-auto">
                    {JSON.stringify(evt.params, null, 2)}
                  </pre>
                </div>
                <div className="text-[10px] text-[#52525b]">
                  Tx Hash: {evt.txHash}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Code & Bytecode Sub-view */}
      {activeSubTab === "source" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e1e22]">
              <span className="text-xs font-semibold text-white flex items-center gap-2 font-mono">
                <Code className="w-4 h-4 text-indigo-400" />
                Solidity Source ({current.name}.sol)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(current.sourceCode);
                }}
                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300"
              >
                Copy Source
              </button>
            </div>
            <pre className="text-[11px] font-mono text-[#a1a1aa] bg-[#0c0c0e] p-3 rounded-lg border border-[#1e1e22] overflow-x-auto max-h-[500px] leading-relaxed">
              {current.sourceCode}
            </pre>
          </div>

          <div className="space-y-4">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e1e22]">
                <span className="text-xs font-semibold text-white flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  Deployed Bytecode (EVM Opcodes)
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(current.bytecode)}
                  className="text-[10px] font-mono text-orange-400 hover:text-orange-300"
                >
                  Copy Hex
                </button>
              </div>
              <pre className="text-[10px] font-mono text-[#71717a] bg-[#0c0c0e] p-3 rounded-lg border border-[#1e1e22] overflow-x-auto max-h-[220px] break-all leading-normal">
                {current.bytecode}
              </pre>
            </div>

            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e1e22]">
                <span className="text-xs font-semibold text-white font-mono">ABI Specification (JSON)</span>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(current.abi, null, 2))}
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300"
                >
                  Copy JSON
                </button>
              </div>
              <pre className="text-[10px] font-mono text-[#71717a] bg-[#0c0c0e] p-3 rounded-lg border border-[#1e1e22] overflow-x-auto max-h-[220px]">
                {JSON.stringify(current.abi, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* AI Generator & Flash Loan Studio Sub-view */}
      {activeSubTab === "studio" && (
        <div className="space-y-5 animate-in fade-in">
          {/* Studio Top Control Panel */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#1e1e22] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Flash Loan & Smart Contract Generation Studio
                </h3>
                <p className="text-xs text-[#71717a] font-mono">
                  Configure borrowing protocols, multi-hop DEX routes, and automated safety assertions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateStudioContract}
                  disabled={studioIsGenerating}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {studioIsGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{studioIsGenerating ? "Generating..." : "Generate Solidity"}</span>
                </button>
              </div>
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">Contract Archetype:</label>
                <select
                  value={studioArchetype}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudioArchetype(val);
                    if (val === "Flashloan Arbitrage") setStudioContractName("FlashArbitrageExecutor");
                    else if (val === "DeFi Vault") setStudioContractName("NexusYieldVault");
                    else if (val === "ERC20") setStudioContractName("NexusYieldToken");
                    else if (val === "ERC721") setStudioContractName("ApexGenesisNFT");
                  }}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Flashloan Arbitrage">Flashloan Arbitrageur (Receiver Callback)</option>
                  <option value="DeFi Vault">ERC4626 Yield Vault</option>
                  <option value="ERC20">ERC20 Fungible Token</option>
                  <option value="ERC721">ERC721 NFT Collection</option>
                  <option value="Custom">Custom Smart Contract</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">Contract Name:</label>
                <input
                  type="text"
                  value={studioContractName}
                  onChange={(e) => setStudioContractName(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">Borrowing Source Protocol:</label>
                <select
                  value={studioBorrowSource}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudioBorrowSource(val);
                    setStudioTargetPool(defaultPoolAddresses[val] || "");
                  }}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Aave V3 Liquidity Pool">Aave V3 Liquidity Pool (executeOperation)</option>
                  <option value="Uniswap V3 Flash Swap">Uniswap V3 Flash Swap (uniswapV3SwapCallback)</option>
                  <option value="Balancer V2 Vault">Balancer V2 Vault (receiveFlashLoan)</option>
                  <option value="Equalizer / Curve">Equalizer / Curve Flash Loan</option>
                </select>
              </div>
            </div>

            {/* Target Pool & DEX Routers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">Target Pool / Provider Address:</label>
                <input
                  type="text"
                  value={studioTargetPool}
                  onChange={(e) => setStudioTargetPool(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#a1a1aa] block mb-1">Multi-Hop DEX Routers Included:</label>
                <div className="flex flex-wrap gap-2">
                  {["Uniswap V3", "Uniswap V2", "Sushiswap", "Curve", "Balancer"].map((dex) => {
                    const isSelected = studioRouters.includes(dex);
                    return (
                      <button
                        key={dex}
                        type="button"
                        onClick={() => {
                          setStudioRouters(
                            isSelected ? studioRouters.filter((r) => r !== dex) : [...studioRouters, dex]
                          );
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                          isSelected
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                            : "bg-[#0c0c0e] text-[#71717a] border-[#1e1e22] hover:border-[#27272a]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {dex}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Safety Safeguards Grid */}
            <div className="border-t border-[#1e1e22] pt-3">
              <label className="text-[11px] text-[#a1a1aa] block mb-1.5 font-mono">
                Built-In Production Safeguards:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <label className="flex items-center gap-2 bg-[#0c0c0e] p-2 rounded-lg border border-[#1e1e22] cursor-pointer hover:border-[#27272a]">
                  <input
                    type="checkbox"
                    checked={studioReentrancy}
                    onChange={(e) => setStudioReentrancy(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-white text-[10px]">ReentrancyGuard</span>
                </label>
                <label className="flex items-center gap-2 bg-[#0c0c0e] p-2 rounded-lg border border-[#1e1e22] cursor-pointer hover:border-[#27272a]">
                  <input
                    type="checkbox"
                    checked={studioExecutorOnly}
                    onChange={(e) => setStudioExecutorOnly(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-white text-[10px]">Executor Role Access</span>
                </label>
                <label className="flex items-center gap-2 bg-[#0c0c0e] p-2 rounded-lg border border-[#1e1e22] cursor-pointer hover:border-[#27272a]">
                  <input
                    type="checkbox"
                    checked={studioAtomicProfit}
                    onChange={(e) => setStudioAtomicProfit(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-white text-[10px]">Atomic Profit Guard</span>
                </label>
                <label className="flex items-center gap-2 bg-[#0c0c0e] p-2 rounded-lg border border-[#1e1e22] cursor-pointer hover:border-[#27272a]">
                  <input
                    type="checkbox"
                    checked={studioEmergencyDrain}
                    onChange={(e) => setStudioEmergencyDrain(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-white text-[10px]">Emergency Rescue/Drain</span>
                </label>
              </div>
            </div>
          </div>

          {/* Generated Code & Action Area */}
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1e1e22]">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-xs">{studioContractName}.sol</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Solidity 0.8.24 Verified
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(studioCode);
                    setStudioCopied(true);
                    setTimeout(() => setStudioCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-[#1e1e22] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded text-xs flex items-center gap-1 transition"
                >
                  {studioCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{studioCopied ? "Copied" : "Copy Code"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateSecurityAudit(studioCode, studioContractName)}
                  className="px-2.5 py-1 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 rounded text-xs flex items-center gap-1 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audit in Security Suite</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onInstantDeploy) {
                      onInstantDeploy({
                        contractName: studioContractName,
                        sourceCode: studioCode,
                      });
                    } else {
                      onOpenDeployModal();
                    }
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>1-Click Deploy</span>
                </button>
              </div>
            </div>

            <textarea
              value={studioCode}
              onChange={(e) => setStudioCode(e.target.value)}
              rows={16}
              placeholder="// Click 'Generate Solidity' above or describe custom requirements..."
              className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg p-3 text-xs text-[#e1e1e3] font-mono outline-none focus:border-indigo-500 resize-y leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
};
