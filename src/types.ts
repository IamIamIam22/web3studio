export type NetworkId =
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "base"
  | "polygon"
  | "bsc"
  | "avalanche"
  | "sepolia"
  | "holesky";

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  shortName: string;
  chainId: number;
  currency: string;
  isTestnet: boolean;
  rpcUrl: string;
  explorerUrl: string;
  color: string;
  icon: string;
  baseFeeGwei: number;
  priorityFeeGwei: number;
  tps: number;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyOnTxReceipt: boolean;
  notifyOnBalanceProfit: boolean;
  notifyOnMevOpportunity: boolean;
  notifyOnSecurityAlert: boolean;
  lastNotified?: string;
}

export interface OnChainTxReceipt {
  txHash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  status: "SUCCESS" | "REVERTED" | "PENDING";
  gasUsed: number;
  effectiveGasPriceGwei: number;
  feeEth: string;
  valueEth: string;
  logsCount: number;
  network: NetworkId;
  timestamp: string;
}

export type ContractType =
  | "ERC20"
  | "ERC721"
  | "DeFi Vault"
  | "DEX Router"
  | "Flashloan Arbitrage"
  | "MultiSig Wallet"
  | "Staking Pool"
  | "Custom";

export interface AbiParam {
  name: string;
  type: string;
  indexed?: boolean;
  components?: AbiParam[];
}

export interface AbiItem {
  type: "function" | "constructor" | "event" | "fallback" | "receive";
  name?: string;
  inputs: AbiParam[];
  outputs?: AbiParam[];
  stateMutability?: "pure" | "view" | "nonpayable" | "payable";
  anonymous?: boolean;
}

export interface DeployedContract {
  id: string;
  name: string;
  type: ContractType;
  network: NetworkId;
  address: string;
  deployer: string;
  deployedAt: string;
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  balanceEth: string;
  solidityVersion: string;
  sourceCode: string;
  abi: AbiItem[];
  bytecode: string;
  verified: boolean;
  tags: string[];
  favorite?: boolean;
  lastAudited?: string;
  auditScore?: number;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: string;
  location: string;
  description: string;
  remediation: string;
}

export interface GasOptimization {
  id: string;
  title: string;
  potentialSaving: string;
  description: string;
  beforeCode: string;
  afterCode: string;
}

export interface AuditChecklistItem {
  item: string;
  status: "PASSED" | "FAILED" | "WARNING" | "N/A";
  note: string;
}

export interface AuditReport {
  contractName: string;
  compilerVersion: string;
  network: string;
  timestamp: string;
  summary: string;
  overallScore: number;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  vulnerabilities: Vulnerability[];
  gasOptimizations: GasOptimization[];
  auditChecklist: AuditChecklistItem[];
  formalVerificationNotes?: string;
}

export type MevType =
  | "Sandwich Attack"
  | "DEX Arbitrage"
  | "Liquidation"
  | "Flashloan Cross-DEX"
  | "NFT Floor Snipe"
  | "JIT Liquidity";

export interface MevOpportunity {
  id: string;
  type: MevType;
  network: NetworkId;
  pair: string;
  dexA: string;
  dexB?: string;
  spreadPercent: number;
  grossProfitEth: number;
  grossProfitUsd: number;
  minerBribeEth: number;
  minerBribePercent: number;
  priorityFeeGwei: number;
  blockBuilder: "Titan Builder" | "BeaverBuild" | "rsync-builder" | "Flashbots" | "builder0x69";
  targetTxHash: string;
  victimAddress?: string;
  status: "DETECTED" | "SIMULATING" | "EXECUTED" | "EXPIRED" | "REVERTED";
  detectedAt: string;
  gasRequired: number;
  confidence: number;
  simulationTrace?: string[];
}

export interface MempoolTransaction {
  hash: string;
  network: NetworkId;
  from: string;
  to: string;
  valueEth: string;
  gasLimit: number;
  gasPriceGwei: number;
  maxPriorityFeeGwei?: number;
  nonce: number;
  status: "pending" | "included" | "dropped" | "reverted";
  timestamp: string;
  calldata: string;
  decodedFunction?: {
    name: string;
    params: { name: string; type: string; value: string }[];
  };
  isWhale?: boolean;
  isContractCreation?: boolean;
  isHighGas?: boolean;
  mevRisk?: "HIGH" | "MEDIUM" | "LOW" | "NONE";
}

export interface FaucetInfo {
  id: string;
  network: NetworkId;
  name: string;
  dripAmount: string;
  currency: string;
  cooldownHours: number;
  lastClaimed?: string;
  nextEligibleAt?: string;
  poolBalance: string;
  faucetAddress: string;
  autoClaimEnabled: boolean;
  status: "ONLINE" | "DRY" | "RATE_LIMITED";
}

export interface DripHistoryItem {
  id: string;
  faucetId: string;
  network: NetworkId;
  amount: string;
  recipient: string;
  txHash: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
}

export interface WalletBalance {
  network: NetworkId;
  networkName: string;
  symbol: string;
  balance: number;
  usdValue: number;
  tokens: {
    symbol: string;
    name: string;
    balance: number;
    usdValue: number;
    icon?: string;
  }[];
}

export interface SentinelAlertRule {
  id: string;
  title: string;
  category: "CONTRACT_BALANCE" | "MEMPOOL_GAS" | "MEV_OPPORTUNITY" | "FAUCET_READY" | "WHALE_TX";
  target: string;
  condition: "GREATER_THAN" | "LESS_THAN" | "EQUALS" | "CONTAINS";
  threshold: string;
  network: NetworkId | "all";
  enabled: boolean;
  soundAlert: boolean;
  createdAt: string;
  triggerCount: number;
  lastTriggered?: string;
}

export interface SentinelTriggerLog {
  id: string;
  ruleId: string;
  ruleTitle: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  timestamp: string;
  dataPayload?: any;
}

export type MainnetTxType =
  | "DEPLOY_CONTRACT"
  | "SWEEP_PROFIT"
  | "LIFECYCLE_CALL"
  | "MEV_ARBITRAGE"
  | "CUSTOM_CALL";

export interface QueuedMainnetTx {
  id: string;
  title: string;
  type: MainnetTxType;
  network: NetworkId;
  from?: string;
  to?: string; // null or "0xContractCreation" for deployments
  data: string; // calldata or init bytecode
  valueEth?: string;
  description?: string;
  gasLimit?: number;
  nonce?: number;
  maxFeePerGasGwei?: number;
  maxPriorityFeePerGasGwei?: number;
  estimatedGasCostEth?: string;
  estimatedGasCostUsd?: string;
  simulationStatus?: "READY" | "SIMULATION_PASSED" | "WARNING";
  simulationMessage?: string;
  status:
    | "QUEUED"
    | "ALIGNED_READY_FOR_DEVICE_SIGNATURE"
    | "AWAITING_DEVICE_SIGNATURE"
    | "BROADCASTING"
    | "MINED_CONFIRMED"
    | "FAILED";
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  confirmedAt?: string;
  error?: string;
  contractArtifact?: {
    name: string;
    contractType: ContractType;
    sourceCode: string;
    abi: AbiItem[];
    bytecode: string;
  };
}

export interface MainnetAlignmentReport {
  network: NetworkId;
  senderAddress: string;
  startingNonce: number;
  blockNumber: number;
  baseFeeGwei: number;
  currentGasPriceGwei: number;
  walletBalanceEth: string;
  totalEstimatedGas: number;
  totalGasCostEth: string;
  totalGasCostUsd: string;
  totalRequiredEth: string;
  hasSufficientBalance: boolean;
  deficitEth: string;
  alignedTransactions: QueuedMainnetTx[];
}

