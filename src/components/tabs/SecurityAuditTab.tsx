import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Code,
  FileCheck,
  RefreshCw,
  Zap,
  Info,
  Rocket,
} from "lucide-react";
import { AuditReport, Vulnerability, GasOptimization, NetworkId } from "../../types";
import { triggerCelebration } from "../../utils/web3Utils";

const STARTER_SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VaultContract is ERC20, Ownable, ReentrancyGuard {
    constructor() ERC20("Vault Token", "VTKN") Ownable(msg.sender) {}

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Zero deposit");
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}`;

const VULNERABLE_SAMPLE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableLiquidityPool {
    mapping(address => uint256) public balances;
    address public owner;
    bool private locked;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        require(msg.value > 0, "Zero deposit");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // CRITICAL REENTRANCY VULNERABILITY: External call before state update
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] -= amount;
        emit Withdraw(msg.sender, amount);
    }
}`;

const FLASH_LOAN_SAMPLE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFlashLoanSimpleReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

/**
 * @title FlashArbitrageExecutor
 * @dev Production Flash Loan Arbitrage with atomic profit assertion and emergency drain
 */
contract FlashArbitrageExecutor is Ownable, ReentrancyGuard, IFlashLoanSimpleReceiver {
    address public immutable flashloanProvider;
    address public authorizedExecutor;

    event ArbitrageExecuted(address indexed asset, uint256 borrowed, uint256 profit, uint256 feePaid);
    event EmergencyDrain(address indexed token, uint256 amount);

    error Unauthorized();
    error NonProfitableTrade(uint256 finalBalance, uint256 requiredBalance);

    modifier onlyExecutorOrOwner() {
        if (msg.sender != authorizedExecutor && msg.sender != owner()) revert Unauthorized();
        _;
    }

    constructor(address _pool, address _owner, address _executor) Ownable(_owner) {
        require(_pool != address(0), "Zero pool");
        flashloanProvider = _pool;
        authorizedExecutor = _executor != address(0) ? _executor : _owner;
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == flashloanProvider, "Unauthorized caller");
        require(initiator == address(this), "Untrusted initiator");

        uint256 totalRepayment = amount + premium;
        (uint256 minProfit) = abi.decode(params, (uint256));

        // Arbitrage execution logic happens here...

        uint256 balanceAfter = IERC20(asset).balanceOf(address(this));
        if (balanceAfter < totalRepayment + minProfit) {
            revert NonProfitableTrade(balanceAfter, totalRepayment + minProfit);
        }

        IERC20(asset).approve(flashloanProvider, totalRepayment);
        emit ArbitrageExecuted(asset, amount, balanceAfter - totalRepayment, premium);
        return true;
    }

    function rescueToken(address token, uint256 amount) external onlyOwner nonReentrant {
        IERC20(token).transfer(owner(), amount);
        emit EmergencyDrain(token, amount);
    }
}`;

interface SecurityAuditTabProps {
  initialCode?: string;
  initialName?: string;
  onInstantDeploy?: (data: { contractName: string; sourceCode: string; network?: NetworkId }) => void;
}

export const SecurityAuditTab: React.FC<SecurityAuditTabProps> = ({
  initialCode,
  initialName,
  onInstantDeploy,
}) => {
  const [contractCode, setContractCode] = useState(
    initialCode || STARTER_SOLIDITY_CODE
  );
  const [contractName, setContractName] = useState(initialName || "VaultContract");
  const [network, setNetwork] = useState("Ethereum Mainnet");
  const [compilerVersion, setCompilerVersion] = useState("^0.8.24");

  const [isLoading, setIsLoading] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [activeView, setActiveView] = useState<"vulns" | "gas" | "checklist" | "formal">("vulns");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: contractCode,
          contractName,
          compilerVersion,
          network,
        }),
      });

      if (!res.ok) {
        throw new Error(`Audit request failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error && !data.vulnerabilities) {
        setErrorMessage(data.error);
      } else {
        setAuditReport(data);
        triggerCelebration();
      }
    } catch (err: any) {
      console.warn("Audit error:", err);
      setErrorMessage(err.message || "Security audit request failed. Please check network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = (preset: "vulnerable" | "vault" | "flashloan" | "empty") => {
    if (preset === "vulnerable") {
      setContractCode(VULNERABLE_SAMPLE_CODE);
      setContractName("VulnerableLiquidityPool");
    } else if (preset === "vault") {
      setContractCode(STARTER_SOLIDITY_CODE);
      setContractName("VaultContract");
    } else if (preset === "flashloan") {
      setContractCode(FLASH_LOAN_SAMPLE_CODE);
      setContractName("FlashArbitrageExecutor");
    } else {
      setContractCode(`// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract MyContract {\n    // write your custom contract code here\n}`);
      setContractName("MyContract");
    }
  };

  const downloadReportJson = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AuditReport_${contractName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">AI Smart Contract Security Suite</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-[#71717a]">
                Automated static analysis, reentrancy detection, MEV sandwich surface checks, and gas optimizations.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#71717a] font-mono">Load Presets:</span>
            <button
              onClick={() => handleLoadPreset("vulnerable")}
              className="px-2.5 py-1 text-xs font-mono rounded bg-[#1e1e22] hover:bg-[#27272a] text-rose-400 border border-[#27272a] transition"
            >
              Vulnerable Pool
            </button>
            <button
              onClick={() => handleLoadPreset("vault")}
              className="px-2.5 py-1 text-xs font-mono rounded bg-[#1e1e22] hover:bg-[#27272a] text-emerald-400 border border-[#27272a] transition"
            >
              Secure Vault
            </button>
            <button
              onClick={() => handleLoadPreset("flashloan")}
              className="px-2.5 py-1 text-xs font-mono rounded bg-[#1e1e22] hover:bg-[#27272a] text-indigo-400 border border-[#27272a] transition"
            >
              Flash Loan Arb
            </button>
            <button
              onClick={() => handleLoadPreset("empty")}
              className="px-2.5 py-1 text-xs font-mono rounded bg-[#1e1e22] hover:bg-[#27272a] text-[#a1a1aa] border border-[#27272a] transition"
            >
              Blank
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Input & Config (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e1e22]">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-mono">
                <Code className="w-4 h-4 text-indigo-400" />
                Solidity Target Code
              </span>
              <span className="text-[10px] text-[#52525b] font-mono">
                {contractCode.split("\n").length} lines
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-[#71717a]">Contract Name</label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded px-2.5 py-1 text-xs text-[#e1e1e3] outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#71717a]">Compiler</label>
                <select
                  value={compilerVersion}
                  onChange={(e) => setCompilerVersion(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded px-2 py-1 text-xs text-[#e1e1e3] outline-none focus:border-indigo-500"
                >
                  <option value="^0.8.24">0.8.24 (Latest)</option>
                  <option value="^0.8.20">0.8.20 (Shanghai)</option>
                  <option value="^0.8.19">0.8.19</option>
                  <option value="^0.7.6">0.7.6</option>
                </select>
              </div>
            </div>

            <textarea
              id="textarea-contract-code"
              value={contractCode}
              onChange={(e) => setContractCode(e.target.value)}
              rows={16}
              className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg p-3 font-mono text-xs text-[#e1e1e3] outline-none focus:border-indigo-500 leading-relaxed resize-y"
              placeholder="// Paste Solidity code here..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="btn-run-audit"
                onClick={handleRunAudit}
                disabled={isLoading || !contractCode.trim()}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-semibold text-xs rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing AST...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AI Security Audit</span>
                  </>
                )}
              </button>

              <button
                id="btn-instant-deploy-audit"
                onClick={() => {
                  if (onInstantDeploy) {
                    onInstantDeploy({
                      contractName: contractName || "AuditedContract",
                      sourceCode: contractCode,
                    });
                  }
                }}
                disabled={!contractCode.trim()}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold text-xs rounded-lg shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-98"
              >
                <Rocket className="w-4 h-4" />
                <span>Instant Deploy to Live Chain</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400 flex items-center gap-2 font-mono">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audit Results & Deep Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {auditReport ? (
            <div className="space-y-4">
              {/* Scorecard Header */}
              <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e1e22]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
                      Audit Scorecard
                    </span>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                      {auditReport.contractName || contractName}
                      <span
                        className={`text-xs font-mono px-2 py-0.2 rounded ${
                          auditReport.threatLevel === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : auditReport.threatLevel === "HIGH"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {auditReport.threatLevel} THREAT
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-[#71717a] font-mono">Security Score</div>
                      <div
                        className={`text-2xl font-bold font-mono ${
                          auditReport.overallScore >= 80
                            ? "text-emerald-400"
                            : auditReport.overallScore >= 50
                            ? "text-orange-400"
                            : "text-rose-400"
                        }`}
                      >
                        {auditReport.overallScore} / 100
                      </div>
                    </div>
                    <button
                      onClick={downloadReportJson}
                      title="Download Full JSON Audit Report"
                      className="p-2 rounded-lg bg-[#1e1e22] hover:bg-[#27272a] text-[#a1a1aa] border border-[#27272a] transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#a1a1aa] mt-3 leading-relaxed font-mono">
                  {auditReport.summary}
                </p>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex border-b border-[#1e1e22] gap-2">
                <button
                  onClick={() => setActiveView("vulns")}
                  className={`px-3 py-2 text-xs font-mono font-semibold transition border-b-2 ${
                    activeView === "vulns"
                      ? "border-indigo-400 text-indigo-400"
                      : "border-transparent text-[#71717a] hover:text-[#e1e1e3]"
                  }`}
                >
                  Vulnerabilities ({auditReport.vulnerabilities?.length || 0})
                </button>
                <button
                  onClick={() => setActiveView("gas")}
                  className={`px-3 py-2 text-xs font-mono font-semibold transition border-b-2 ${
                    activeView === "gas"
                      ? "border-indigo-400 text-indigo-400"
                      : "border-transparent text-[#71717a] hover:text-[#e1e1e3]"
                  }`}
                >
                  Gas Optimizations ({auditReport.gasOptimizations?.length || 0})
                </button>
                <button
                  onClick={() => setActiveView("checklist")}
                  className={`px-3 py-2 text-xs font-mono font-semibold transition border-b-2 ${
                    activeView === "checklist"
                      ? "border-indigo-400 text-indigo-400"
                      : "border-transparent text-[#71717a] hover:text-[#e1e1e3]"
                  }`}
                >
                  Audit Checklist ({auditReport.auditChecklist?.length || 0})
                </button>
              </div>

              {/* View 1: Vulnerabilities */}
              {activeView === "vulns" && (
                <div className="space-y-3">
                  {(!auditReport.vulnerabilities || auditReport.vulnerabilities.length === 0) ? (
                    <div className="p-8 text-center bg-[#131316] rounded-xl border border-[#1e1e22] text-[#71717a] text-xs font-mono">
                      No high-severity vulnerabilities identified.
                    </div>
                  ) : (
                    auditReport.vulnerabilities.map((v, i) => (
                      <div
                        key={v.id || i}
                        className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded ${
                                v.severity === "CRITICAL"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : v.severity === "HIGH"
                                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                                  : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {v.severity}
                            </span>
                            <span className="font-bold text-xs text-white font-mono">{v.title}</span>
                          </div>
                          <span className="text-[10px] text-[#52525b] font-mono">{v.category}</span>
                        </div>

                        <div className="text-[11px] text-[#71717a] font-mono">
                          Location: <span className="text-[#e1e1e3]">{v.location}</span>
                        </div>

                        <p className="text-xs text-[#a1a1aa] leading-relaxed">{v.description}</p>

                        {v.remediation && (
                          <div className="p-3 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] space-y-1 font-mono text-[11px]">
                            <span className="text-emerald-400 font-semibold block">
                              Remediation Fix:
                            </span>
                            <p className="text-[#a1a1aa] whitespace-pre-wrap">{v.remediation}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 2: Gas Optimizations */}
              {activeView === "gas" && (
                <div className="space-y-3">
                  {(!auditReport.gasOptimizations || auditReport.gasOptimizations.length === 0) ? (
                    <div className="p-8 text-center bg-[#131316] rounded-xl border border-[#1e1e22] text-[#71717a] text-xs font-mono">
                      No gas optimization warnings found.
                    </div>
                  ) : (
                    auditReport.gasOptimizations.map((g, i) => (
                      <div
                        key={g.id || i}
                        className="bg-[#131316] border border-[#1e1e22] rounded-xl p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="font-bold text-xs text-white font-mono">{g.title}</span>
                          </div>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            {g.potentialSaving}
                          </span>
                        </div>

                        <p className="text-xs text-[#a1a1aa] leading-relaxed">{g.description}</p>

                        {(g.beforeCode || g.afterCode) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                            {g.beforeCode && (
                              <div className="p-2.5 bg-[#1c1417] border border-rose-900/30 rounded-lg">
                                <span className="text-rose-400 font-semibold block mb-1">
                                  Before:
                                </span>
                                <pre className="text-[#a1a1aa] overflow-x-auto">{g.beforeCode}</pre>
                              </div>
                            )}
                            {g.afterCode && (
                              <div className="p-2.5 bg-[#121d18] border border-emerald-900/30 rounded-lg">
                                <span className="text-emerald-400 font-semibold block mb-1">
                                  Optimized:
                                </span>
                                <pre className="text-[#a1a1aa] overflow-x-auto">{g.afterCode}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 3: Checklist */}
              {activeView === "checklist" && (
                <div className="bg-[#131316] border border-[#1e1e22] rounded-xl divide-y divide-[#1e1e22]">
                  {auditReport.auditChecklist?.map((chk, i) => (
                    <div key={i} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-medium text-[#e1e1e3] font-mono">{chk.item}</span>
                        {chk.note && (
                          <p className="text-[11px] text-[#71717a] font-mono">{chk.note}</p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded ${
                          chk.status === "PASSED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : chk.status === "FAILED"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                        }`}
                      >
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white font-mono">Gemini 3.7 Flash Security Auditor Ready</h3>
                <p className="text-xs text-[#71717a] max-w-md mx-auto leading-relaxed">
                  Enter or select any Solidity smart contract on the left and click <span className="text-indigo-400 font-semibold">Execute AI Security Audit</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1e1e22] text-left font-mono">
                <div className="bg-[#0c0c0e] border border-[#1e1e22] p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase block">AST & SWC Analysis</span>
                  <p className="text-[11px] text-[#71717a]">Reentrancy, access controls, uninitialized storage, flashloan arbitrage vectors.</p>
                </div>
                <div className="bg-[#0c0c0e] border border-[#1e1e22] p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">Gas Optimization</span>
                  <p className="text-[11px] text-[#71717a]">Storage packing, immutable slots, custom error conversions, loop caching.</p>
                </div>
                <div className="bg-[#0c0c0e] border border-[#1e1e22] p-3 rounded-lg space-y-1">
                  <span className="text-[10px] text-orange-400 font-bold uppercase block">Formal Checklist</span>
                  <p className="text-[11px] text-[#71717a]">Automated pass/fail checklist according to OpenZeppelin & ConsenSys standards.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
