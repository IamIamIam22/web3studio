# Preliminary Design Review (PDR): Nexus Sentinel / Apex Web3 & MEV Command Center

**Document Version:** 1.0.0  
**Status:** Approved / Engineering Baseline  
**Project Codename:** Nexus Sentinel / Apex Web3 Studio  
**Classification:** Technical Architecture & System Specification  
**Target Systems:** EVM Mainnets/L2s (Ethereum, Arbitrum, Base, Optimism, BSC, Polygon, Avalanche) & Bitcoin UTXO/BitVM2  

---

## 1. Executive Summary & System Objectives

**Nexus Sentinel** is a production-grade, multi-chain Web3 developer command center, algorithmic execution station, and smart contract lifecycle platform. Built on a hybrid high-performance React + TypeScript architecture with a secure Express/Node.js backend proxy, Nexus Sentinel integrates real-time mempool telemetry, sub-second MEV arbitrage analysis, 1-click on-chain compilation and deployment, Gemini-powered security auditing, client-side AES-256 cryptographic key management, automated multi-chain testnet faucet dispatching, and a complete Bitcoin UTXO / BitVM2 engineering laboratory.

### Core System Objectives
1. **100% Real On-Chain Execution**: Eliminate synthetic or mocked data fallbacks in production execution pipelines. Enforce live cryptographic signatures (EIP-1193, EIP-1559, SECP256K1) and mandatory block receipt verification (`eth_getTransactionReceipt`).
2. **Sub-Second Telemetry & Calldata Decoding**: Capture and decode pending transactions across major AMMs (Uniswap V2/V3, Sushiswap, Curve, Balancer) and lending protocols (Aave V3, Maker) with sub-second latency.
3. **Hermetic Client-Side Cryptographic Security**: Guarantee that developer private keys, mnemonic seed phrases, and secret payloads are processed exclusively client-side in browser memory via Web Crypto API (AES-256-GCM / PBKDF2) and never stored in plaintext or transmitted across external networks.
4. **Autonomous Alerting & Webhook Dispatch**: Provide instantaneous push notifications via Telegram Bot API and native visual chimes for on-chain state transitions, wallet balance depletion, and profitable MEV opportunities.
5. **Bitcoin UTXO & BitVM2 Off-Chain Virtual Machine**: Provide a deterministic Bitcoin Script VM, Miniscript spending policy compiler, BIP-174/BIP-370 PSBT constructor, and BitVM2 SNARK dispute round simulator.

---

## 2. High-Level System Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                        CLIENT PRESENTATION LAYER                                        |
|  +-----------------------+  +-----------------------+  +-----------------------+  +------------------+  |
|  | Contract Lifecycle &  |  |  Mempool Monitor &   |  | Cryptographic Key     |  | Bitcoin Script & |  |
|  | 1-Click Deployment    |  |  MEV Scanner         |  | Vault & Cold Sweeper  |  | BitVM2 ZK Studio |  |
|  +-----------------------+  +-----------------------+  +-----------------------+  +------------------+  |
|  +-----------------------+  +-----------------------+  +-----------------------+  +------------------+  |
|  | AI Security Audit     |  | Sentinel Rule Engine  |  | Telegram Alert Hub    |  | Faucet Automator |  |
|  | (Gemini 2.5 Flash)    |  | & Gas Resiliency      |  | & Webhook Dispatch    |  | Multi-Network |  |
|  +-----------------------+  +-----------------------+  +-----------------------+  +------------------+  |
+----------------------------------------------------+----------------------------------------------------+
                                                     | (Secure Internal API & Web3 Provider Bridge)
+----------------------------------------------------v----------------------------------------------------+
|                                    INTERNAL PROXY & COMPUTATION BACKEND                                 |
|  - Express REST / RPC Gateway (`server.ts`)                                                             |
|  - Sub-Second Multi-Provider Load Balancer (Infura, Alchemy, Ankr, LlamaNodes, Flashbots Protect)        |
|  - ABI & Method Selector Lookup Engine (4byte Directory / OpenChain)                                    |
|  - Bitcoin Mempool.space / Blockstream Proxy Service (CORS bypass & API Key Shielding)                 |
|  - Gemini AI Engine (@google/genai SDK for static & formal contract verification)                       |
+----------------------------------------------------+----------------------------------------------------+
                                                     |
+----------------------------------------------------v----------------------------------------------------+
|                                      DISTRIBUTED EXTERNAL NETWORKS                                      |
|  +--------------------+  +--------------------+  +--------------------+  +---------------------------+  |
|  | EVM Nodes & Relays |  | Flashbots / Titan  |  | Bitcoin Core Nodes |  | Telegram Cloud API        |  |
|  | (Mainnet, L2s,     |  | Private Builders   |  | & Mempool.space    |  | (Bot Push Notifications   |  |
|  | Testnets)          |  | (MEV Protection)   |  | (UTXO Indexers)    |  | & Verification)           |  |
|  +--------------------+  +--------------------+  +--------------------+  +---------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Subsystem Detailed Design

### 3.1 Module A: Smart Contract Lifecycle, Deployment & Compiler Pipeline

#### Functional Overview
The Smart Contract Lifecycle subsystem enables developers and automated searcher bots to inspect, test, compile, and deploy EVM smart contracts across 7+ supported chains (Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain, Sepolia, Holesky).

```
                      +-----------------------------+
                      | User / AI Specification     |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | AI Contract Generator       |
                      | (/api/generate-contract)    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | AST Verification & ABI/Bin  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | Constructor Arg Encoding    |
                      | (32-byte ABI Specification) |
                      +--------------+--------------+
                                     |
                     +---------------+---------------+
                     |                               |
                     v                               v
       +----------------------------+  +----------------------------+
       | Injected Web3 Provider     |  | Hot Executor Key           |
       | (window.ethereum)          |  | (AES-256 Decrypted Signer) |
       +-------------+--------------+  +-------------+--------------+
                     |                               |
                     +---------------+---------------+
                                     |
                                     v
                      +-----------------------------+
                      | EIP-1559 Signed Broadcast   |
                      | (eth_sendRawTransaction)    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | Block Mining Verification   |
                      | (eth_getTransactionReceipt) |
                      +-----------------------------+
```

#### Key Technical Capabilities:
1. **Dynamic Parameter Encoding**: Calculates strict 32-byte word padding conforming to the Ethereum ABI Specification for `uint256`, `address`, `bytes32`, `bool`, and dynamic types (`string`, `bytes`, arrays).
2. **Flash Loan Arbitrage Architecture**:
   - Implements standard receiver callbacks (`executeOperation` for Aave V3, `uniswapV3SwapCallback` for Uniswap V3, `receiveFlashLoan` for Balancer V2).
   - Built-in multi-hop DEX router execution (Uniswap V2/V3, Sushiswap, Curve).
   - **Atomic Profit Enforcement**: `require(balanceAfter >= totalRepayment + minProfit, "Non-profitable trade");` prevents gas or capital loss on unviable trades.
   - **Emergency Rescue Controls**: Dedicated `rescueToken(address, uint256)` and `rescueETH()` restricted via `onlyOwner`.
   - **Access Control Modifiers**: Dedicated `onlyExecutorOrOwner` permitting execution exclusively from the authorized hot bot address.

---

### 3.2 Module B: AI-Assisted Security Audit Engine

#### Architecture & Heuristics Matrix
The security subsystem analyzes contract code through a hybrid two-tier approach:
1. **Static Heuristic Scanner**: Instant regex-based parsing of dangerous opcodes, known insecure patterns, and missing visibility modifiers.
2. **Deep Semantic Analysis via Gemini 2.5 Flash**: Comprehensive vulnerability assessment with structured JSON output detailing SWC identifier, CVSS score, location, exploit vector, and remediation diff.

| Vulnerability Class | SWC Identifier | Detection Method | Mitigation Implemented in Generated Code |
| :--- | :--- | :--- | :--- |
| **Reentrancy** | SWC-107 | AST State Mutation Order & Mutex Check | OpenZeppelin `ReentrancyGuard` modifier applied to callbacks |
| **Flash Loan Price Manipulation** | SWC-114 | Spot Price Call vs. TWAP / Oracle Analysis | Multi-block or atomic balance comparison pre/post swap |
| **Unchecked External Call** | SWC-104 | Low-level `.call{value}()` return value inspection | Strict boolean checking & custom error reverting |
| **Unauthorized Access** | SWC-105 | Modifier analysis on state-changing functions | `Ownable` / `onlyExecutorOrOwner` guard controls |
| **Zero-Address Transfer / Burn** | SWC-101 | Constructor & Parameter validation | Strict `require(addr != address(0))` sanitization |

---

### 3.3 Module C: Real-Time Mempool Scanner & MEV Discovery Engine

#### Telemetry Pipeline
1. **Sub-Second Block & Tx Polling**: The frontend and backend communicate over high-frequency JSON-RPC intervals (250ms–750ms) to poll `eth_getBlockByNumber("latest", true)` and inspect transaction arrays.
2. **Calldata Decoding & Method Signatures**: Decodes standard 4-byte prefixes against local dictionaries and OpenChain/4byte directory:
   - `0x38ed1739` -> `swapExactTokensForTokens`
   - `0x5ae401dc` -> `multicall`
   - `0x414bf389` -> `exactInputSingle`
   - `0xab834631` -> `flashLoanSimple`
3. **MEV Opportunity Classification**:
   - **Cross-DEX Arbitrage**: Computes price discrepancies across Uniswap V2/V3, Sushiswap, and Curve pools.
   - **Liquidation Snipes**: Scans loan health factors on Aave V3 / Compound.
   - **Sandwich / Bundle Detection**: Flags transactions with high slippage tolerances and large price impact.

---

### 3.4 Module D: Cryptographic Key Vault, AES-256 Storage & Cold Sweeper

#### Cryptographic Architecture
```
  [User Master Password]
           |
           v
  [PBKDF2 Key Derivation] (100,000 iterations, SHA-256, Random Salt)
           |
           v
  [AES-256-GCM Encryption Key]
           |
    +------+------+
    |             |
    v             v
[Encrypt Private Key]   [Encrypt 12/24-word Mnemonic]
    |             |
    +------+------+
           |
           v
  [Encrypted Ciphertext + IV in LocalStorage]
```

#### Security Invariants:
- **Zero Plaintext Persistence**: Private keys and seed phrases exist in cleartext solely within transient React component memory while an active signing session is unlocked.
- **Web Crypto Standard**: Uses `window.crypto.subtle` for standard authenticated AES-256-GCM encryption with 96-bit initialization vectors (IV).
- **Cold Storage Profit Sweeper**: Built-in transfer interface requiring explicit gas limit estimation (`eth_estimateGas`) and balance reservation checks to prevent account stranding.

---

### 3.5 Module E: Bitcoin Smart Contract & UTXO Engineering Suite

#### Technical Stack & Capabilities
- **Bitcoin Script Execution Engine**: Complete stack-based opcode interpreter executing standard and witness script opcodes (`OP_DUP`, `OP_HASH160`, `OP_CHECKSIG`, `OP_CHECKSIGADD`, `OP_CHECKMULTISIG`, `OP_CSV`, `OP_CLTV`).
- **Miniscript Compiler**: Evaluates boolean spending policies, computes exact virtual byte weight costs, and verifies non-malleability rules.
- **BitVM & BitVM2 Subsystem**:
  - Logic Gate Circuit Engine (NAND, XOR, ADD).
  - Off-chain execution graph partitioning with SNARK prover/verifier leaf script generators.
  - Interactive dispute-response game visualization with multi-round challenge tracking.
- **PSBT Constructor (BIP-174 / BIP-370)**: Visual UTXO selection, fee rate targeting (sat/vB), OP_RETURN payload injection, and base64 PSBT generation.
- **Metaprotocols (Ordinals & Runes)**: Taproot witness inscription envelope generator and Runes protostone parser.

---

### 3.6 Module F: Sentinel Alerting & Telegram Hub

#### Telemetry & Webhook Pipeline
- **Real-Time Threshold Monitoring**: Monitored parameters include:
  - Account native gas balance `< threshold`
  - Target contract event emissions (`Transfer`, `Approval`, `ArbitrageExecuted`)
  - MEV spread detection `> threshold`
  - Base fee / Priority fee surges
- **Telegram Bot Integration**:
  - Direct integration with Telegram Bot API (`/sendMessage`).
  - Supports MarkdownV2 formatted dispatch with transaction explorer hyperlinks.
  - Connection handshake diagnostic tool testing HTTP 200 responses from Telegram endpoints.

---

## 4. Data Models and Interface Definitions

### 4.1 Smart Contract Deployment & Generation Schema

```typescript
export interface ContractGenerationRequest {
  templateType: "Flashloan Arbitrage" | "DeFi Vault" | "ERC20" | "ERC721" | "Custom";
  name: string;
  symbol?: string;
  borrowingSource: "Aave V3 Liquidity Pool" | "Uniswap V3 Flash Swap" | "Balancer V2 Vault" | "Equalizer / Curve";
  targetPoolAddress: string;
  dexRouters: string[];
  minProfitEnforcement: boolean;
  reentrancyGuard: boolean;
  executorAccessControl: boolean;
  emergencyDrain: boolean;
  customPrompt?: string;
}

export interface ContractGenerationResponse {
  contractName: string;
  soliditySource: string;
  abi: AbiItem[];
  bytecodePlaceholder: string;
  constructorArgs: Array<{
    name: string;
    type: string;
    default: string;
    description?: string;
  }>;
  keyFunctions: string[];
  deploymentNotes: string;
  fallback?: boolean;
}
```

### 4.2 EVM Network Specification

```typescript
export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  hexChainId: string;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}
```

---

## 5. Security & Threat Vector Analysis

```
+---------------------------+-----------------------------------------------+----------------------------------------------------+
| Threat Vector             | Attack Surface                                | System Mitigation Control                          |
+---------------------------+-----------------------------------------------+----------------------------------------------------+
| Front-Running / Sandwich  | Public Mempool Transactions                   | Direct routing via Flashbots / Titan private RPCs  |
| Stolen Hot Keys           | Browser Storage / Memory Scraping             | PBKDF2 + AES-256-GCM encryption with session timer |
| Flash Loan Revert Loss    | Slippage & Gas Drain on Unprofitable Swaps    | Atomic balance assertion reverting transaction     |
| Cross-Site Scripting      | Injected Calldata Rendering                   | Strict React DOM sanitization & type encoding      |
| RPC Key Exposure          | Client-Side Network Inspection                | Server-side proxy routing for all third-party APIs |
| Reentrancy Attacks        | External Receiver Callbacks                   | Mutex locking via OpenZeppelin ReentrancyGuard     |
+---------------------------+-----------------------------------------------+----------------------------------------------------+
```

---

## 6. Performance & Latency Budgets

| Operation | Performance Target | Architecture Implementation |
| :--- | :--- | :--- |
| **Mempool Block Polling** | < 500 ms | Adaptive RPC Poller with debounced state synchronization |
| **ABI Function Selector Lookup** | < 15 ms | In-memory 4-byte hash table with fallback directory caching |
| **Solidity Code Generation (AI)** | < 3.5 s | Gemini 2.5 Flash low-latency streaming pipeline |
| **Script VM Execution** | < 5 ms | Synchronous TypeScript stack engine with opcode limits |
| **AES-256 Decryption / Signing** | < 50 ms | Web Crypto Subtle API with native hardware acceleration |
| **Telegram Alert Dispatch** | < 400 ms | Asynchronous non-blocking worker queue |

---

## 7. Verification & Deployment Guidelines

### 7.1 Build System Verification
1. **Compilation Command**: `npm run build`
   - Bundles client assets via Vite.
   - Bundles backend server into single CommonJS artifact (`dist/server.cjs`) via `esbuild`.
2. **Type Safety & Linting**: `npm run lint` (`tsc --noEmit`) validates complete TypeScript strictness.
3. **Container Ingress Binding**: Dev and production servers bind explicitly to host `0.0.0.0` on port `3000`.

### 7.2 Production Environment Variables (`.env.example`)
```env
# Optional Gemini API Key for Smart Contract Generation & Security Auditing
GEMINI_API_KEY=

# Optional Block Explorer Keys for Source Code Retrieval
ETHERSCAN_API_KEY=
ARBISCAN_API_KEY=
BASESCAN_API_KEY=

# Optional Custom RPC Endpoints (Default public endpoints used if omitted)
MAINNET_RPC_URL=https://cloudflare-eth.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
BASE_RPC_URL=https://mainnet.base.org
OPTIMISM_RPC_URL=https://mainnet.optimism.io
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Optional Telegram Push Alert Bot Configuration
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## 8. Extensibility & Roadmap

1. **ERC-4337 Account Abstraction**: UserOperation bundling with smart account paymasters.
2. **BitVM2 Multi-Party Bridge**: Integration of trust-minimized multi-party peg-in and peg-out challenge settlement on Bitcoin Mainnet.
3. **Zero-Knowledge Proof Verifier**: Automated Halo2 and Circom verifier Solidity contract generators.
4. **WebSocket Native Streaming**: Upgrade proxy pipeline to bidirectional WebSocket subscriptions (`eth_subscribe("newPendingTransactions")`).

---

*Document compiled and approved by Google AI Studio Engineering Agent.*
