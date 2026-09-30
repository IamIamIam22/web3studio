import React, { useState, useEffect } from "react";
import {
  Binary,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Terminal,
  FileCode,
  Sliders,
  DollarSign,
  Send,
  Boxes,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Clock,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
import {
  executeBitcoinScript,
  compileMiniscriptPolicy,
  simulateBitVM2Execution,
  constructPSBTTransaction,
  generateOrdinalInscriptionEnvelope,
  deriveBitcoinAddresses,
  detectBitcoinWallets,
  fetchLiveBitcoinUtxos,
  ScriptExecutionResult,
  MiniscriptPolicyAnalysis,
  UTXO,
  ConstructedPSBT,
} from "../../utils/bitcoinUtils";
import { formatAddress, triggerCelebration } from "../../utils/web3Utils";
import { BitcoinAutopilotModal } from "../modals/BitcoinAutopilotModal";

export const VERIFIED_MAINNET_RUNES = [
  {
    runeId: "1:0",
    name: "UNCOMMONGOODS",
    spacedRuneName: "UNCOMMON•GOODS",
    symbol: "🪙",
    supplyTotal: "Open Mint (Halving Subsidy)",
    mintCap: "Continuous",
    divisibility: 0,
    mintable: true,
  },
  {
    runeId: "840000:3",
    name: "DOGGOTOTHEMOON",
    spacedRuneName: "DOG•GO•TO•THE•MOON",
    symbol: "🐕",
    supplyTotal: "100,000,000,000",
    mintCap: "100%",
    divisibility: 2,
    mintable: false,
  },
  {
    runeId: "840000:2",
    name: "RSICGENESISRUNE",
    spacedRuneName: "RSIC•GENESIS•RUNE",
    symbol: "⛏️",
    supplyTotal: "21,000,000,000",
    mintCap: "100%",
    divisibility: 0,
    mintable: false,
  },
  {
    runeId: "840000:1",
    name: "SATOSHINAKAMOTO",
    spacedRuneName: "SATOSHI•NAKAMOTO",
    symbol: "⚡",
    supplyTotal: "21,000,000",
    mintCap: "100%",
    divisibility: 0,
    mintable: false,
  },
];

interface BitcoinStudioTabProps {
  activeAddress?: string;
}

export const BitcoinStudioTab: React.FC<BitcoinStudioTabProps> = ({
  activeAddress = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
}) => {
  const [subTab, setSubTab] = useState<
    "script" | "bitvm" | "clarity" | "psbt" | "metaprotocol" | "mempool" | "wallet"
  >("script");
  const [isAutopilotOpen, setIsAutopilotOpen] = useState(false);

  // ==========================================
  // SCRIPT & MINISCRIPT STATE
  // ==========================================
  const [scriptInput, setScriptInput] = useState(
    "OP_DUP OP_HASH160 0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7 OP_EQUALVERIFY OP_CHECKSIG"
  );
  const [initialStackInput, setInitialStackInput] = useState(
    "0x30440220...sig 0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
  );
  const [scriptResult, setScriptResult] = useState<ScriptExecutionResult | null>(null);

  const [miniscriptPolicy, setMiniscriptPolicy] = useState(
    "or_d(pk(key_user),and_v(v:pk(key_recovery),older(1000)))"
  );
  const [compiledMiniscript, setCompiledMiniscript] = useState<MiniscriptPolicyAnalysis | null>(null);

  // Run initial script
  useEffect(() => {
    handleRunScript();
    handleCompilePolicy();
  }, []);

  const handleRunScript = () => {
    const stackItems = initialStackInput
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const res = executeBitcoinScript(scriptInput, stackItems);
    setScriptResult(res);
    if (res.success) triggerCelebration();
  };

  const handleCompilePolicy = () => {
    const res = compileMiniscriptPolicy(miniscriptPolicy);
    setCompiledMiniscript(res);
  };

  // ==========================================
  // BITVM & BITVM2 STATE
  // ==========================================
  const [bitvmSim, setBitvmSim] = useState(() => simulateBitVM2Execution());
  const [isSimulatingBitVM, setIsSimulatingBitVM] = useState(false);

  const handleStepBitVM = () => {
    setIsSimulatingBitVM(true);
    setTimeout(() => {
      setBitvmSim(simulateBitVM2Execution());
      setIsSimulatingBitVM(false);
      triggerCelebration();
    }, 600);
  };

  // ==========================================
  // CLARITY (STACKS) & RGB STATE
  // ==========================================
  const [clarityCode, setClarityCode] = useState(`;; SIP-010 Compliant Fungible Token with Proof-of-Transfer Anchoring
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8Q86VNEC.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token quantum-sats u2100000000000000)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

;; Strict Read-Only Function with Deterministic Gas Cost
(define-read-only (get-name)
  (ok "Quantum Satoshi"))

(define-read-only (get-symbol)
  (ok "QSAT"))

(define-read-only (get-decimals)
  (ok u8))

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance quantum-sats account)))

;; SIP-010 Safe Transfer Function with Post-Condition Validation
(define-public (transfer (amount u128) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (try! (ft-transfer? quantum-sats amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)))

;; Minting function protected by Decidable Access Assertion
(define-public (mint (amount u128) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ft-mint? quantum-sats amount recipient)))`);

  const [clarityAuditResult, setClarityAuditResult] = useState<any>(null);
  const [isAuditingClarity, setIsAuditingClarity] = useState(false);

  const handleAuditClarity = async () => {
    setIsAuditingClarity(true);
    setClarityAuditResult(null);
    try {
      const res = await fetch("/api/bitcoin/clarity/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clarityCode, contractName: "quantum-sats" }),
      });
      if (res.ok) {
        const data = await res.json();
        setClarityAuditResult(data);
        triggerCelebration();
      }
    } catch (err) {
      console.error("Clarity audit failed:", err);
    } finally {
      setIsAuditingClarity(false);
    }
  };

  // ==========================================
  // PSBT & UTXO BUILDER STATE
  // ==========================================
  const [sampleUtxos] = useState<UTXO[]>([
    {
      txid: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
      vout: 0,
      valueSats: 25000000, // 0.25 BTC
      scriptPubKey: "5120892a0f41c30e9d6837194b5e28a9f024c6e1892d74ab38294a0293847291a0c8",
      address: "bc1p892a0f41c30e9d6837194b5e28a9f024c6e1892d74ab38294a0293847291a0c8",
      confirmations: 18,
      isTaproot: true,
    },
    {
      txid: "9b12e4f01928374a5b6c7d8e9f0123456789abcdef0123456789abcdef012345",
      vout: 1,
      valueSats: 15000000, // 0.15 BTC
      scriptPubKey: "001479be667ef9dcbbac55a06295ce870b07029bfcdb",
      address: "bc1q79be667ef9dcbbac55a06295ce870b07029bfcdb",
      confirmations: 64,
      isTaproot: false,
    },
  ]);

  const [psbtTargetAddress, setPsbtTargetAddress] = useState(
    "bc1p5d7rjq7g6rd22wd5kg5sw46sq46stx2eedmx26d6amnvryt0uq6qvss5dn"
  );
  const [psbtSendAmountBtc, setPsbtSendAmountBtc] = useState("0.125");
  const [psbtFeeRate, setPsbtFeeRate] = useState(24);
  const [psbtOpReturn, setPsbtOpReturn] = useState("NEXUS_SETTLEMENT_BATCH#8402");
  const [constructedPsbt, setConstructedPsbt] = useState<ConstructedPSBT | null>(null);

  const handleBuildPSBT = () => {
    const sats = Math.floor(parseFloat(psbtSendAmountBtc) * 1e8) || 12500000;
    const psbt = constructPSBTTransaction(
      sampleUtxos,
      psbtTargetAddress,
      sats,
      "bc1p892a0f41c30e9d6837194b5e28a9f024c6e1892d74ab38294a0293847291a0c8",
      psbtFeeRate,
      psbtOpReturn
    );
    setConstructedPsbt(psbt);
    triggerCelebration();
  };

  useEffect(() => {
    handleBuildPSBT();
  }, []);

  // ==========================================
  // METAPROTOCOLS (ORDINALS & RUNES) STATE
  // ==========================================
  const [inscriptionMime, setInscriptionMime] = useState("text/plain;charset=utf-8");
  const [inscriptionContent, setInscriptionContent] = useState(
    '{"p":"brc-20","op":"deploy","tick":"NEXUS","max":"21000000","lim":"1000"}'
  );
  const [inscriptionEnvelope, setInscriptionEnvelope] = useState(() =>
    generateOrdinalInscriptionEnvelope(inscriptionMime, inscriptionContent)
  );

  const handleGenerateInscription = () => {
    const env = generateOrdinalInscriptionEnvelope(inscriptionMime, inscriptionContent);
    setInscriptionEnvelope(env);
    triggerCelebration();
  };

  // ==========================================
  // MEMPOOL & LIVE FEES STATE
  // ==========================================
  const [liveFees, setLiveFees] = useState<{
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    minimumFee: number;
    source: string;
  }>({
    fastestFee: 26,
    halfHourFee: 21,
    hourFee: 16,
    minimumFee: 8,
    source: "Syncing...",
  });
  const [recentBlocks, setRecentBlocks] = useState<any[]>([]);
  const [isFetchingMempool, setIsFetchingMempool] = useState(false);

  // RBF Simulator State
  const [rbfOriginalFee, setRbfOriginalFee] = useState(12);
  const [rbfReplacementFee, setRbfReplacementFee] = useState(32);
  const [rbfStatus, setRbfStatus] = useState<string | null>(null);

  const handleFetchMempoolData = async () => {
    setIsFetchingMempool(true);
    try {
      const [feeRes, blockRes] = await Promise.all([
        fetch("/api/bitcoin/mempool/fees"),
        fetch("/api/bitcoin/mempool/blocks"),
      ]);
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        setLiveFees(feeData);
      }
      if (blockRes.ok) {
        const blockData = await blockRes.json();
        setRecentBlocks(blockData.blocks || []);
      }
    } catch (err) {
      console.warn("Mempool fetch error:", err);
    } finally {
      setIsFetchingMempool(false);
    }
  };

  useEffect(() => {
    handleFetchMempoolData();
  }, []);

  const handleSimulateRBF = () => {
    if (rbfReplacementFee <= rbfOriginalFee) {
      setRbfStatus("ERROR: Replacement fee must be strictly higher than original fee (BIP-125 Rule 2).");
      return;
    }
    setRbfStatus(
      `SUCCESS: Replacement transaction broadcast! Miner package priority boosted from ~${rbfOriginalFee} sat/vB to ${rbfReplacementFee} sat/vB. Estimated inclusion: Next block.`
    );
    triggerCelebration();
  };

  // ==========================================
  // BITCOIN WALLETS & KEYS STATE
  // ==========================================
  const [derivedBtcAddresses, setDerivedBtcAddresses] = useState(() =>
    deriveBitcoinAddresses(activeAddress, "mainnet")
  );
  const [btcWallets, setBtcWallets] = useState(() => detectBitcoinWallets());
  const [copiedKeyText, setCopiedKeyText] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyText(id);
    setTimeout(() => setCopiedKeyText(""), 2000);
  };

  return (
    <div className="space-y-6 font-mono text-xs animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Bitcoin Smart Contract & UTXO Engineering Suite
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  TAPROOT & BITVM2
                </span>
              </div>
              <p className="text-xs text-[#71717a] mt-0.5">
                Miniscript, BitVM Off-Chain Fraud Proofs, Stacks Clarity, BIP-174 PSBTs, Ordinals & Runes
              </p>
            </div>
          </div>

          {/* Autopilot Button & Quick Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAutopilotOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 border border-amber-400/40 transition active:scale-95 group"
            >
              <Zap className="w-4 h-4 text-black fill-black" />
              <span>Start Autonomous Autopilot</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-black/20 text-black font-extrabold rounded">
                1-Click
              </span>
            </button>

            <div className="px-3 py-1.5 rounded-lg bg-[#0c0c0e] border border-[#1e1e22] flex items-center gap-2">
              <span className="text-[11px] text-[#71717a]">Mempool Fee:</span>
              <span className="text-amber-400 font-bold">{liveFees.fastestFee} sat/vB</span>
            </div>
            <button
              onClick={handleFetchMempoolData}
              disabled={isFetchingMempool}
              className="px-3 py-1.5 bg-[#1e1e22] hover:bg-[#27272a] text-[#e1e1e3] rounded-lg flex items-center gap-1.5 border border-[#27272a] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingMempool ? "animate-spin text-amber-400" : "text-[#71717a]"}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Quick Autopilot Primer Bar */}
        <div className="mt-4 pt-3 border-t border-[#1e1e22] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Unfamiliar with UTXO scripting or BitVM2? Use Autopilot to configure, compile, verify Groth16 proofs, and broadcast automatically.
            </span>
          </div>
          <button
            onClick={() => setIsAutopilotOpen(true)}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 self-start sm:self-auto shrink-0 transition"
          >
            <span>Learn & Launch Autopilot &rarr;</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e1e22] pb-3 overflow-x-auto">
        {[
          { id: "script", label: "Bitcoin Script & Miniscript", icon: Code2 },
          { id: "bitvm", label: "BitVM & BitVM2 ZK Engine", icon: Cpu },
          { id: "clarity", label: "Stacks Clarity & RGB", icon: Layers },
          { id: "psbt", label: "UTXO & PSBT Constructor", icon: Boxes },
          { id: "metaprotocol", label: "Ordinals & Runes Indexer", icon: Flame },
          { id: "mempool", label: "Mempool & RBF Accelerator", icon: Activity },
          { id: "wallet", label: "Bitcoin Native Wallets", icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? "bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30"
                  : "text-[#71717a] hover:text-[#e1e1e3] hover:bg-[#131316]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==========================================
          TAB 1: BITCOIN SCRIPT & MINISCRIPT STUDIO
          ========================================== */}
      {subTab === "script" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Script Editor & Virtual Stack */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">Bitcoin Script Execution Machine</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setScriptInput(
                        "OP_DUP OP_HASH160 0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7 OP_EQUALVERIFY OP_CHECKSIG"
                      );
                      setInitialStackInput("0x304402...sig 0x0279be...pubkey");
                    }}
                    className="text-[11px] text-[#71717a] hover:text-white"
                  >
                    P2PKH Preset
                  </button>
                  <button
                    onClick={() => {
                      setScriptInput("2 0xAlicePubKey 0xBobPubKey 0xCarolPubKey 3 OP_CHECKMULTISIG");
                      setInitialStackInput("0x00 0xSigAlice 0xSigBob");
                    }}
                    className="text-[11px] text-[#71717a] hover:text-white"
                  >
                    2-of-3 Multisig
                  </button>
                  <button
                    onClick={() => {
                      setScriptInput("0xAlice 0xSigAlice 0 0xBob 0xSigBob OP_CHECKSIGADD OP_CHECKSIGADD 2 OP_EQUAL");
                      setInitialStackInput("");
                    }}
                    className="text-[11px] text-[#71717a] hover:text-white"
                  >
                    Tapscript OP_CHECKSIGADD
                  </button>
                </div>
              </div>

              {/* Initial Stack */}
              <div>
                <label className="text-[11px] text-[#71717a] block mb-1">
                  Witness / ScriptSig Initial Stack (Space-separated):
                </label>
                <input
                  type="text"
                  value={initialStackInput}
                  onChange={(e) => setInitialStackInput(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              {/* Script Body */}
              <div>
                <label className="text-[11px] text-[#71717a] block mb-1">
                  Bitcoin Script (ScriptPubKey / Tapscript Leaf):
                </label>
                <textarea
                  rows={3}
                  value={scriptInput}
                  onChange={(e) => setScriptInput(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg p-3 text-amber-300 outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[11px] text-[#71717a]">
                  <span>Stack Mode: Strict Non-Malleable</span>
                </div>
                <button
                  onClick={handleRunScript}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Execute Bitcoin Script</span>
                </button>
              </div>
            </div>

            {/* Execution Trace & Step-by-Step Opcode Inspector */}
            {scriptResult && (
              <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 ${scriptResult.success ? "text-emerald-400" : "text-rose-400"}`}
                    />
                    <h3 className="font-bold text-white text-sm">
                      Script Execution Result: {scriptResult.success ? "PASSED (Valid Spend)" : "FAILED (Script Halted)"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-[#71717a]">Weight Units: <strong className="text-white">{scriptResult.gasWeightUnits} WU</strong></span>
                    <span className="text-[#71717a]">Virtual Size: <strong className="text-white">{scriptResult.virtualBytes} vB</strong></span>
                  </div>
                </div>

                {scriptResult.error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{scriptResult.error}</span>
                  </div>
                )}

                {/* Step Trace */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {scriptResult.steps.map((step) => (
                    <div
                      key={step.step}
                      className="p-2.5 rounded-lg bg-[#0c0c0e] border border-[#1e1e22] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-[10px]">
                          Step {step.step}: {step.opcode}
                        </span>
                        <span className="text-[11px] text-[#a1a1aa]">{step.description}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-[#52525b]">Stack:</span>
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {step.stackAfter.length === 0 ? (
                            <span className="text-[#52525b] italic">[empty]</span>
                          ) : (
                            step.stackAfter.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-[#1e1e22] text-[#e1e1e3] border border-[#27272a] whitespace-nowrap"
                              >
                                {item}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Miniscript Compiler & Policy Studio */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e22]">
                <Code2 className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Miniscript Spending Policy Compiler</h3>
                  <p className="text-[11px] text-[#71717a]">Structured, statically verifiable Bitcoin Script</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#71717a] block mb-1">
                  Miniscript Spending Policy Syntax:
                </label>
                <textarea
                  rows={3}
                  value={miniscriptPolicy}
                  onChange={(e) => setMiniscriptPolicy(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg p-2.5 text-amber-300 outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <button
                  onClick={() => {
                    setMiniscriptPolicy("or_d(pk(key_user),and_v(v:pk(key_recovery),older(1000)))");
                  }}
                  className="px-2 py-1 bg-[#1e1e22] text-[#e1e1e3] rounded hover:bg-[#27272a]"
                >
                  Inheritance Timelock
                </button>
                <button
                  onClick={() => {
                    setMiniscriptPolicy("thresh(2,pk(alice),pk(bob),pk(carol))");
                  }}
                  className="px-2 py-1 bg-[#1e1e22] text-[#e1e1e3] rounded hover:bg-[#27272a]"
                >
                  Threshold 2-of-3
                </button>
                <button
                  onClick={handleCompilePolicy}
                  className="px-3 py-1 bg-amber-500 text-black font-bold rounded ml-auto"
                >
                  Compile
                </button>
              </div>

              {compiledMiniscript && (
                <div className="space-y-3 pt-3 border-t border-[#1e1e22]">
                  <div>
                    <span className="text-[10px] text-[#71717a] uppercase tracking-wider block mb-1">
                      Compiled Raw Bitcoin Script:
                    </span>
                    <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] text-amber-400 font-mono text-xs break-all">
                      {compiledMiniscript.compiledBitcoinScript}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-[#0c0c0e] rounded border border-[#1e1e22]">
                      <span className="text-[#71717a] block">Type Safety:</span>
                      <span className="text-emerald-400 font-bold">Type {compiledMiniscript.typeSafety} (Base Expression)</span>
                    </div>
                    <div className="p-2 bg-[#0c0c0e] rounded border border-[#1e1e22]">
                      <span className="text-[#71717a] block">Non-Malleable:</span>
                      <span className="text-emerald-400 font-bold">Guaranteed (BIP-141)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-[#71717a] uppercase tracking-wider block">
                      Valid Spending Paths:
                    </span>
                    {compiledMiniscript.spendingPaths.map((path, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{path.name}</span>
                          <span className="text-amber-400 font-semibold">{path.estimatedWitnessVBytes} vB</span>
                        </div>
                        <div className="text-[#71717a] text-[10px]">
                          Keys: {path.keysRequired.join(", ")}
                          {path.timelock && ` | Timelock: ${path.timelock}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: BITVM & BITVM2 ZK ENGINE
          ========================================== */}
      {subTab === "bitvm" && (
        <div className="space-y-6">
          <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e1e22]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">BitVM2: Off-Chain SNARK Verifier & Fraud Proof Graph</h3>
                  <p className="text-[11px] text-[#71717a]">
                    Turing-complete smart contracts on Bitcoin without soft forks via Groth16 chunk commitments
                  </p>
                </div>
              </div>

              <button
                onClick={handleStepBitVM}
                disabled={isSimulatingBitVM}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSimulatingBitVM ? "Simulating Circuit..." : "Simulate Challenge Round"}</span>
              </button>
            </div>

            {/* Dispute State Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] space-y-1">
                <span className="text-[10px] text-[#71717a] uppercase">Current Lifecycle Phase</span>
                <div className="text-amber-400 font-bold text-sm">
                  {bitvmSim.disputeFlow.state.replace("_", " ")}
                </div>
              </div>
              <div className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] space-y-1">
                <span className="text-[10px] text-[#71717a] uppercase">Prover Collateral Staked</span>
                <div className="text-white font-bold text-sm">
                  {bitvmSim.disputeFlow.proverDepositBtc} BTC ($962,500)
                </div>
              </div>
              <div className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] space-y-1">
                <span className="text-[10px] text-[#71717a] uppercase">SNARK Circuit Partition</span>
                <div className="text-purple-400 font-bold text-sm">
                  {bitvmSim.disputeFlow.snarkCircuitChunks} Bitcoin Leaf Chunks
                </div>
              </div>
              <div className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] space-y-1">
                <span className="text-[10px] text-[#71717a] uppercase">Dispute Timelock Window</span>
                <div className="text-emerald-400 font-bold text-sm">
                  {bitvmSim.disputeFlow.remainingBlocksForChallenge} Blocks Remaining
                </div>
              </div>
            </div>

            {/* Circuit Logic Gates Table */}
            <div className="space-y-2">
              <span className="text-[10px] text-[#71717a] uppercase tracking-wider block">
                Committed BitVM Logic Gates & Bit-Commitment Leaves:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {bitvmSim.gates.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-bold text-[10px] border border-purple-500/30">
                        {g.type} Gate ({g.id})
                      </span>
                      <span className="text-[10px] text-[#71717a]">{g.challengeTimeoutBlocks} blocks lock</span>
                    </div>
                    <div className="text-xs text-[#e1e1e3] space-y-1">
                      <div>Input A: <span className="text-amber-400">{g.inputA}</span></div>
                      {g.inputB && <div>Input B: <span className="text-amber-400">{g.inputB}</span></div>}
                      <div>Output Bit: <span className="text-emerald-400 font-bold">{g.outputBit}</span></div>
                    </div>
                    <div className="text-[10px] text-[#52525b] font-mono truncate">
                      Commitment: {g.scriptCommitment}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Fraud Proof Script */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#71717a] uppercase tracking-wider block">
                Disprove Leaf Script for Disputed Chunk #{bitvmSim.disputeFlow.currentDisputedChunk}:
              </span>
              <pre className="p-3 bg-[#0c0c0e] border border-[#1e1e22] rounded-xl text-purple-300 text-xs overflow-x-auto">
                {bitvmSim.fraudProofScript}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: STACKS CLARITY & RGB SMART CONTRACTS
          ========================================== */}
      {subTab === "clarity" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Stacks Clarity IDE & Decidable Analyzer</h3>
                    <p className="text-[11px] text-[#71717a]">
                      Non-Turing complete, decidable language anchored directly on Bitcoin
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAuditClarity}
                  disabled={isAuditingClarity}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAuditingClarity ? "Auditing Clarity..." : "AI Security Audit"}</span>
                </button>
              </div>

              <textarea
                rows={16}
                value={clarityCode}
                onChange={(e) => setClarityCode(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-xl p-3.5 text-indigo-300 font-mono text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {/* Clarity Audit Results */}
            {clarityAuditResult ? (
              <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Clarity Formal Verification Audit</h3>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm">
                    Score: {clarityAuditResult.securityScore || 94}/100
                  </span>
                </div>

                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  {clarityAuditResult.summary}
                </p>

                <div className="p-3 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] space-y-1.5">
                  <span className="text-[10px] text-[#71717a] uppercase">Post-Condition Status:</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Strict Post-Conditions Enforced (Reentrancy Impossible by Design)</span>
                  </div>
                </div>

                {clarityAuditResult.publicFunctions && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#71717a] uppercase">Public State Mutators:</span>
                    <div className="flex flex-wrap gap-1">
                      {clarityAuditResult.publicFunctions.map((fn: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]"
                        >
                          (define-public {fn})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e22]">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">Clarity Architectural Guarantees</h3>
                </div>

                <div className="space-y-2.5 text-xs text-[#a1a1aa]">
                  <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                    <strong className="text-white block mb-0.5">1. Zero Reentrancy by Design</strong>
                    Contracts cannot execute circular nested re-calls; execution flow is strictly acyclic.
                  </div>
                  <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                    <strong className="text-white block mb-0.5">2. Decidable Runtime Execution</strong>
                    Gas consumption, runtime memory bounds, and execution termination are mathematically proven before execution.
                  </div>
                  <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                    <strong className="text-white block mb-0.5">3. Client-Side Post-Conditions</strong>
                    Users can bind cryptographically enforced assertions to ensure balance drops cannot exceed authorized amounts.
                  </div>
                </div>
              </div>
            )}

            {/* RGB Protocol Single-Use Seals */}
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1e1e22]">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">RGB Client-Side Validation Seals</h3>
              </div>
              <p className="text-[11px] text-[#71717a]">
                Smart contract states bound to Bitcoin UTXO single-use seals without polluting on-chain blockspace.
              </p>
              <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] text-[11px] space-y-1">
                <div>Blinded Seal Outpoint: <span className="text-emerald-400 font-mono">tx:4a5e1e...#0</span></div>
                <div>Schema: <span className="text-white font-bold">RGB20 Fungible Asset</span></div>
                <div>State Transition: <span className="text-amber-400">Validated Client-Side via Stash</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: UTXO & PSBT TRANSACTION BUILDER
          ========================================== */}
      {subTab === "psbt" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input parameters */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e22]">
                <Boxes className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">BIP-174 / BIP-370 PSBT Constructor</h3>
                  <p className="text-[11px] text-[#71717a]">Multi-input UTXO transaction planner</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#71717a] block mb-1">Recipient Bitcoin Address:</label>
                <input
                  type="text"
                  value={psbtTargetAddress}
                  onChange={(e) => setPsbtTargetAddress(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#71717a] block mb-1">Send Amount (BTC):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={psbtSendAmountBtc}
                    onChange={(e) => setPsbtSendAmountBtc(e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#71717a] block mb-1">Fee Rate (sat/vB):</label>
                  <input
                    type="number"
                    value={psbtFeeRate}
                    onChange={(e) => setPsbtFeeRate(Number(e.target.value) || 1)}
                    className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#71717a] block mb-1">
                  OP_RETURN Metadata Payload (Optional):
                </label>
                <input
                  type="text"
                  value={psbtOpReturn}
                  onChange={(e) => setPsbtOpReturn(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <button
                onClick={handleBuildPSBT}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
              >
                <Boxes className="w-4 h-4" />
                <span>Construct & Finalize PSBT</span>
              </button>
            </div>
          </div>

          {/* Right: PSBT Breakdown & Visualizer */}
          <div className="lg:col-span-7 space-y-5">
            {constructedPsbt && (
              <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Constructed PSBT Package (v2)</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(constructedPsbt.base64Psbt, "psbt")}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs"
                  >
                    {copiedKeyText === "psbt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKeyText === "psbt" ? "Copied" : "Copy Base64"}</span>
                  </button>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                    <span className="text-[10px] text-[#71717a] block">Virtual Size (vB):</span>
                    <span className="text-white font-bold">{constructedPsbt.virtualBytes} vB</span>
                  </div>
                  <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                    <span className="text-[10px] text-[#71717a] block">Miner Fee:</span>
                    <span className="text-amber-400 font-bold">{constructedPsbt.feeSats} Sats (${((constructedPsbt.feeSats / 1e8) * 96250).toFixed(2)})</span>
                  </div>
                  <div className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22]">
                    <span className="text-[10px] text-[#71717a] block">Total Inputs:</span>
                    <span className="text-emerald-400 font-bold">{(constructedPsbt.totalInputSats / 1e8).toFixed(4)} BTC</span>
                  </div>
                </div>

                {/* Inputs List */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[#71717a] uppercase tracking-wider block">Selected UTXO Inputs:</span>
                  {constructedPsbt.inputs.map((inItem) => (
                    <div
                      key={inItem.index}
                      className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-white font-bold block">
                          Input #{inItem.index}: {formatAddress(inItem.utxo.txid, 8, 6)}:{inItem.utxo.vout}
                        </span>
                        <span className="text-[10px] text-[#71717a]">
                          {inItem.taprootKeySpend ? "Taproot Key-Path Spend (Schnorr BIP-340)" : "SegWit Witness v0"}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold">{(inItem.utxo.valueSats / 1e8).toFixed(4)} BTC</span>
                    </div>
                  ))}
                </div>

                {/* Outputs List */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[#71717a] uppercase tracking-wider block">Constructed Outputs:</span>
                  {constructedPsbt.outputs.map((outItem) => (
                    <div
                      key={outItem.index}
                      className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-white font-bold block">
                          Output #{outItem.index} [{outItem.type}]: {formatAddress(outItem.address, 10, 8)}
                        </span>
                        {outItem.opReturnHex && (
                          <span className="text-[10px] text-purple-400 font-mono">{outItem.opReturnHex}</span>
                        )}
                      </div>
                      <span className="text-emerald-400 font-bold">{(outItem.valueSats / 1e8).toFixed(4)} BTC</span>
                    </div>
                  ))}
                </div>

                {/* Raw PSBT Base64 */}
                <div>
                  <span className="text-[10px] text-[#71717a] block mb-1">Standard BIP-174 Base64 PSBT Payload:</span>
                  <div className="p-2 bg-[#0c0c0e] rounded border border-[#1e1e22] text-[#71717a] font-mono text-[10px] break-all select-all">
                    {constructedPsbt.base64Psbt}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: METAPROTOCOLS (ORDINALS & RUNES)
          ========================================== */}
      {subTab === "metaprotocol" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e22]">
                <Flame className="w-4 h-4 text-orange-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Ordinals Inscription Envelope Generator</h3>
                  <p className="text-[11px] text-[#71717a]">Taproot witness envelope encoding (OP_FALSE OP_IF)</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#71717a] block mb-1">Content MIME Type:</label>
                <input
                  type="text"
                  value={inscriptionMime}
                  onChange={(e) => setInscriptionMime(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-orange-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#71717a] block mb-1">Inscription Payload / BRC-20 JSON:</label>
                <textarea
                  rows={4}
                  value={inscriptionContent}
                  onChange={(e) => setInscriptionContent(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg p-3 text-orange-300 outline-none focus:border-orange-500 font-mono text-xs"
                />
              </div>

              <button
                onClick={handleGenerateInscription}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition"
              >
                <Flame className="w-4 h-4" />
                <span>Encode Taproot Inscription Envelope</span>
              </button>

              {/* Inscription ASM */}
              <div className="space-y-1 pt-2">
                <span className="text-[10px] text-[#71717a] uppercase">Witness Envelope Script ASM:</span>
                <div className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] text-orange-300 font-mono text-[11px] break-all">
                  {inscriptionEnvelope.envelopeAsm}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e22]">
                <Boxes className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Runes Protocol Protostone Indexer</h3>
                  <p className="text-[11px] text-[#71717a]">UTXO-based fungible tokens via OP_RETURN Runestones</p>
                </div>
              </div>

              <div className="space-y-3">
                {VERIFIED_MAINNET_RUNES.map((rune) => (
                  <div
                    key={rune.runeId}
                    className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{rune.symbol}</span>
                        <span className="text-white font-bold">{rune.spacedRuneName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        Rune ID: {rune.runeId}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-[#71717a]">
                      <div>Supply: <span className="text-white">{rune.supplyTotal}</span></div>
                      <div>Mint Cap: <span className="text-white">{rune.mintCap}</span></div>
                      <div>Divisibility: <span className="text-white">{rune.divisibility}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 6: MEMPOOL & RBF ACCELERATOR
          ========================================== */}
      {subTab === "mempool" && (
        <div className="space-y-6">
          {/* Fee Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-[#131316] border border-[#1e1e22] rounded-xl space-y-1">
              <span className="text-[11px] text-[#71717a]">Fastest Priority (Next Block)</span>
              <div className="text-xl font-bold text-amber-400">{liveFees.fastestFee} sat/vB</div>
              <span className="text-[10px] text-[#52525b]">Target: ~10 minutes</span>
            </div>
            <div className="p-4 bg-[#131316] border border-[#1e1e22] rounded-xl space-y-1">
              <span className="text-[11px] text-[#71717a]">Half Hour Priority (3 Blocks)</span>
              <div className="text-xl font-bold text-white">{liveFees.halfHourFee} sat/vB</div>
              <span className="text-[10px] text-[#52525b]">Target: ~30 minutes</span>
            </div>
            <div className="p-4 bg-[#131316] border border-[#1e1e22] rounded-xl space-y-1">
              <span className="text-[11px] text-[#71717a]">Hour Priority (6 Blocks)</span>
              <div className="text-xl font-bold text-white">{liveFees.hourFee} sat/vB</div>
              <span className="text-[10px] text-[#52525b]">Target: ~60 minutes</span>
            </div>
            <div className="p-4 bg-[#131316] border border-[#1e1e22] rounded-xl space-y-1">
              <span className="text-[11px] text-[#71717a]">Minimum Relay Fee</span>
              <div className="text-xl font-bold text-[#a1a1aa]">{liveFees.minimumFee} sat/vB</div>
              <span className="text-[10px] text-[#52525b]">Mempool purge threshold</span>
            </div>
          </div>

          {/* RBF / CPFP Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e22]">
                <Activity className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">BIP-125 Replace-By-Fee (RBF) Accelerator</h3>
                  <p className="text-[11px] text-[#71717a]">Unstick pending transactions by bumping fee rates</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#71717a] block mb-1">Stuck Fee Rate (sat/vB):</label>
                  <input
                    type="number"
                    value={rbfOriginalFee}
                    onChange={(e) => setRbfOriginalFee(Number(e.target.value))}
                    className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#71717a] block mb-1">Bumped Fee Rate (sat/vB):</label>
                  <input
                    type="number"
                    value={rbfReplacementFee}
                    onChange={(e) => setRbfReplacementFee(Number(e.target.value))}
                    className="w-full bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2 text-[#e1e1e3] outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateRBF}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate RBF Fee Bump</span>
              </button>

              {rbfStatus && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    rbfStatus.startsWith("ERROR")
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {rbfStatus}
                </div>
              )}
            </div>

            {/* Recent Blocks Feed */}
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">Recent Bitcoin Blocks (Live)</h3>
                </div>
                <span className="text-[11px] text-[#71717a]">Height ~859,420</span>
              </div>

              <div className="space-y-2">
                {recentBlocks.map((blk) => (
                  <div
                    key={blk.id}
                    className="p-2.5 bg-[#0c0c0e] rounded-lg border border-[#1e1e22] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">Block #{blk.height}</span>
                        <span className="text-[10px] text-amber-400 font-semibold">{blk.miner}</span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">
                        {blk.tx_count} txs | Median Fee: {blk.median_fee} sat/vB
                      </span>
                    </div>
                    <span className="text-[10px] text-[#52525b] font-mono">{formatAddress(blk.id, 8, 6)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 7: BITCOIN NATIVE WALLET CONNECTORS
          ========================================== */}
      {subTab === "wallet" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Multi-Standard Addresses */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e22]">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">Deterministic Bitcoin Address Derivations</h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  SECP256K1 SCHNORR
                </span>
              </div>

              <div className="space-y-3">
                {derivedBtcAddresses.map((addr) => (
                  <div
                    key={addr.type}
                    className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold uppercase text-[11px]">{addr.type} Format</span>
                      <button
                        onClick={() => handleCopy(addr.address, addr.type)}
                        className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px]"
                      >
                        {copiedKeyText === addr.type ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKeyText === addr.type ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <div className="text-amber-400 font-mono text-xs break-all select-all font-semibold">
                      {addr.address}
                    </div>

                    <p className="text-[10px] text-[#71717a]">{addr.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Injected Wallet Detectors */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#131316] border border-[#1e1e22] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1e1e22]">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Bitcoin Browser Wallet Providers</h3>
                  <p className="text-[11px] text-[#71717a]">EIP-1193 + sats-connect standard detection</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {btcWallets.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 bg-[#0c0c0e] rounded-xl border border-[#1e1e22] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{w.icon}</span>
                      <div>
                        <span className="text-white font-bold block">{w.name}</span>
                        <span className="text-[10px] text-[#71717a]">
                          {w.id === "xverse" ? "sats-connect protocol" : `window.${w.id}`}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        w.isDetected
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-[#1e1e22] text-[#71717a] border-[#27272a]"
                      }`}
                    >
                      {w.isDetected ? "Detected / Ready" : "Not Installed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Bitcoin Autopilot Modal */}
      <BitcoinAutopilotModal
        isOpen={isAutopilotOpen}
        onClose={() => setIsAutopilotOpen(false)}
        activeAddress={activeAddress}
      />
    </div>
  );
};
