# Nexus Sentinel: Comprehensive Architecture, Design Decisions & Step-by-Step Code Walkthrough

This document outlines the architectural structure, design philosophy, and step-by-step implementation rationale behind **Nexus Sentinel** — a production-grade Web3 & Multi-Chain Autonomous Infrastructure, MEV Intelligence, and On-Chain Execution Suite.

---

## Table of Contents
1. [Core Architectural Philosophy & Security Directives](#1-core-architectural-philosophy--security-directives)
2. [High-Level Architecture Overview](#2-high-level-architecture-overview)
3. [Backend Server Layer (`server.ts`)](#3-backend-server-layer-serverts)
   - [Step 1: Multi-Chain JSON-RPC Proxy Engine](#step-1-multi-chain-json-rpc-proxy-engine)
   - [Step 2: Nonce Sequencing & Alignment Gateway](#step-2-nonce-sequencing--alignment-gateway)
   - [Step 3: Pre-Flight Simulation & Gas Estimation Engine](#step-3-pre-flight-simulation--gas-estimation-engine)
   - [Step 4: Flashbots Protect & Raw Transaction Relay](#step-4-flashbots-protect--raw-transaction-relay)
   - [Step 5: Bitcoin Mainnet UTXO & Esplora Gateway](#step-5-bitcoin-mainnet-utxo--esplora-gateway)
4. [Data Model & Type System (`src/types.ts`)](#4-data-model--type-system-srctypests)
5. [Frontend Execution & Orchestration Layer](#5-frontend-execution--orchestration-layer)
   - [Step 6: Mainnet Orchestrator Modal (`MainnetOrchestratorModal.tsx`)](#step-6-mainnet-orchestrator-modal)
   - [Step 7: Injected Device Wallet Integration (`window.ethereum`)](#step-7-injected-device-wallet-integration)
   - [Step 8: Sequential Pipeline Execution & Receipt Polling](#step-8-sequential-pipeline-execution--receipt-polling)
   - [Step 9: Contract Vault & Lifecycle Management](#step-9-contract-vault--lifecycle-management)
   - [Step 10: Multi-Tab Modular Architecture](#step-10-multi-tab-modular-architecture)
6. [Design Rationale & Problem/Solution Matrix](#6-design-rationale--problemsolution-matrix)

---

## 1. Core Architectural Philosophy & Security Directives

When building Web3 and decentralized applications, standard web paradigms can lead to severe security vulnerabilities, data loss, or high transaction failure rates. Nexus Sentinel was constructed around five strict design tenets:

1. **Zero Mock Infrastructure**: Real blockchain interaction using canonical JSON-RPC endpoints across Ethereum, Arbitrum, Base, Optimism, Polygon, BSC, Avalanche, and Bitcoin.
2. **Client-Side Key Sovereignty**: Private keys are **never** stored on the server or transmitted over HTTP. Transaction signing is delegated to user-controlled hardware or browser wallets (`window.ethereum`).
3. **Sequential Nonce Alignment**: Blockchain accounts track transaction order via incremental nonces. If transactions are broadcast out of order, later ones get stuck in the mempool or revert. We automate live nonce alignment.
4. **Pre-Flight EVM Simulation**: High-gas transactions (like contract deployments or complex swaps) are pre-simulated via `eth_call` before spending real funds to ensure zero reverts.
5. **MEV & Frontrunning Protection**: High-value transactions can be routed through Flashbots Protect to bypass public mempool sandwich bots.

---

## 2. High-Level Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Client Frontend                        │
 │  (React 18 + Vite + Tailwind CSS + Lucide Icons + Motion)  │
 └──────────────┬───────────────────────────────▲──────────────┘
                │ User Signs Transaction         │ Polls Status & Receipts
                ▼                                │
 ┌──────────────────────────────┐ ┌──────────────┴──────────────┐
 │  Local Injected Device Wallet│ │  Express Backend Gateway    │
 │  (MetaMask, Rabby, Hardware) │ │  (server.ts / Node.js)      │
 └──────────────┬───────────────┘ └──────────────┬──────────────┘
                │ Broadcast Signed Raw Tx        │ Proxy JSON-RPC / Simulation
                ▼                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │            Multi-Chain Canonical Networks & Relays          │
 │  • Ethereum Mainnet   • Arbitrum One    • Base              │
 │  • Optimism           • Polygon PoS     • BSC               │
 │  • Flashbots Protect  • Bitcoin Mempool (mempool.space)     │
 └─────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Server Layer (`server.ts`)

### Step 1: Multi-Chain JSON-RPC Proxy Engine
- **Why we coded it this way**: Public RPC endpoints enforce strict CORS headers, IP rate-limits, and payload constraints. Direct browser-to-node requests frequently fail or expose API keys.
- **Code implementation**:
  - We implemented a unified `forwardJsonRpc(network, method, params)` proxy that routes queries to healthy, resilient RPC nodes across 8+ EVM networks.
  - Failovers are built in so that if one node lags, the request falls back gracefully without breaking the client UI.

### Step 2: Nonce Sequencing & Alignment Gateway (`/api/rpc/nonce`)
- **Why we coded it this way**: When a user queues multiple transactions (e.g., deploying a contract, funding a liquidity pool, and setting vault permissions), using stale or cached nonces causes immediate rejection with `"nonce too low"` or `"replacement transaction underpriced"`.
- **Code implementation**:
  - We query `eth_getTransactionCount(address, 'pending')` directly from the live mempool to obtain the true, immediate nonce of the account.

### Step 3: Pre-Flight Simulation & Gas Estimation Engine (`/api/rpc/align-mainnet-queue`)
- **Why we coded it this way**: Deploying contracts or interacting with smart contracts on Mainnet costs real money in gas. If a contract creation fails due to out-of-gas or require-reverts, the gas fee is burned and unrecoverable.
- **Code implementation**:
  - The endpoint takes an array of staged transactions, queries the current `baseFeePerGas`, wallet balance, and sequential nonces.
  - Runs `eth_call` to verify that the bytecode or contract interaction succeeds without throwing an EVM revert.
  - Dynamically calculates gas limits with a +15% safety buffer to accommodate state drift between blocks.

### Step 4: Flashbots Protect & Raw Transaction Relay (`/api/rpc/broadcast-raw`)
- **Why we coded it this way**: Public mempools are actively monitored by searchers running generalized frontrunning and sandwich bots. High-value transactions sent to public mempools can suffer slippage or exploitation.
- **Code implementation**:
  - Supports routing transactions either to public validator nodes or directly to the Flashbots Protect Builder relay (`https://relay.flashbots.net` / `https://protect.flashbots.net`).
  - Guarantees private mempool inclusion with zero revert risk in mined blocks.

### Step 5: Bitcoin Mainnet UTXO & Esplora Gateway (`/api/bitcoin/*`)
- **Why we coded it this way**: Bitcoin operates on the UTXO (Unspent Transaction Output) model rather than EVM account state. Constructing PSBTs (Partially Signed Bitcoin Transactions) or calculating fees requires real-time mempool fee rates and UTXO sets.
- **Code implementation**:
  - Direct integration with Mempool.space / Esplora APIs to retrieve live recommended fees (Fastest, Half-Hour, Minimum) and address UTXO lists.

---

## 4. Data Model & Type System (`src/types.ts`)

- **Why we coded it this way**: Strict TypeScript interfaces prevent silent state corruption and guarantee synchronization between server responses, smart contract ABIs, and React components.
- **Key Types Introduced**:
  - `QueuedMainnetTx`: Encapsulates transaction state (`QUEUED`, `ALIGNED_READY_FOR_DEVICE_SIGNATURE`, `AWAITING_DEVICE_SIGNATURE`, `BROADCASTING`, `MINED_CONFIRMED`, `FAILED`), raw calldata, value in ETH, gas limits, and sequential nonces.
  - `MainnetAlignmentReport`: Aggregates live block numbers, base fees, wallet balances, deficit calculations, and pre-flight simulation notes.
  - `DeployedContract`: Stores verified contract metadata, ABI arrays, Solidity compiler versions, and verified bytecode.
  - `MevOpportunity`: Structures real-time arbitrage paths, DEX pool addresses, and estimated profit margins.

---

## 5. Frontend Execution & Orchestration Layer

### Step 6: Mainnet Orchestrator Modal (`MainnetOrchestratorModal.tsx`)
- **Why we coded it this way**: Developers and traders need a centralized command center to inspect, verify, simulate, and execute batches of transactions rather than firing one-off blind transactions.
- **Core Features**:
  - Visual timeline of queued transactions with sequential nonces.
  - Gas price matrices, live base fees, and total ETH cost estimators.
  - Collapsible raw calldata viewers with one-click copy.
  - Verifiable JSON execution ledger export for accounting and audits.

### Step 7: Injected Device Wallet Integration (`window.ethereum`)
- **Why we coded it this way**: Relying on web apps to custody user private keys is an anti-pattern. Instead, we interface with EIP-1193 standard injected providers.
- **Workflow**:
  1. Detects `window.ethereum` and retrieves accounts via `eth_requestAccounts`.
  2. Queries current `eth_chainId` and checks if it matches the selected target network.
  3. If mismatched, triggers `wallet_switchEthereumChain` or `wallet_addEthereumChain` to ensure the user's wallet is pointed to the correct network before signing.

### Step 8: Sequential Pipeline Execution & Receipt Polling
- **Why we coded it this way**: Asynchronous transactions in Web3 cannot simply be "fired and forgotten". The UI must confirm block inclusion before advancing to the next dependent transaction.
- **Workflow**:
  1. Requests signature via `eth_sendTransaction`.
  2. Transitions transaction status to `BROADCASTING` and displays live transaction hash.
  3. Polls `fetchOnChainTxReceipt` until the transaction is mined into a block.
  4. Updates status to `MINED_CONFIRMED` with block number and gas used.
  5. If the transaction was a contract deployment, automatically registers the new contract in the Contract Vault.

### Step 9: Contract Vault & Lifecycle Management (`ContractVaultTab.tsx` & `ContractLifecycleTab.tsx`)
- **Why we coded it this way**: Once a contract is deployed, users must interact with its functions (read view states, execute write transactions, withdraw profits, pause/unpause).
- **Workflow**:
  - Parses the contract's ABI to generate dynamic interactive UI forms for each read and write method.
  - Pre-fills caller addresses, handles BigNumber uint256 conversions, and validates input parameters.

### Step 10: Multi-Tab Modular Architecture
- **Why we coded it this way**: To prevent code bloat and maintain responsiveness, the application is divided into purpose-built tabs:
  - `OverviewTab`: High-level metrics, active contracts, live gas matrix, and orchestrator trigger.
  - `MempoolMonitorTab`: Real-time pending EVM transaction stream.
  - `MevDiscoveryTab`: Live DEX arbitrage opportunities and flashloan simulation.
  - `ContractVaultTab`: Repository of verified contracts with source code and ABI.
  - `ContractLifecycleTab`: Method executor and live contract state inspector.
  - `ProfitSweeper`: Automated profit collection directly to hardware cold storage.
  - `SecurityAuditTab`: Static analysis and vulnerability scanner for smart contracts.
  - `BitcoinStudioTab`: Bitcoin UTXO manager, fee estimator, and PSBT generator.
  - `SentinelWalletTab`: Multi-chain portfolio tracker and gas tracker.

---

## 6. Design Rationale & Problem/Solution Matrix

| Problem in Web3 Apps | Potential Failure Mode | Nexus Sentinel Solution |
|---|---|---|
| **CORS & RPC Rate Limits** | Browser crashes or cannot fetch block numbers | Express backend gateway with load-balanced JSON-RPC forwarding. |
| **Nonce Desynchronization** | Transactions get stuck or fail with "nonce too low" | Pre-querying pending nonces and assigning deterministic sequential nonces. |
| **Out of Gas / Reverts** | Burning real ETH on failed contract executions | Running pre-flight `eth_call` and `eth_estimateGas` simulations. |
| **Mempool Frontrunning** | MEV bots sandwiching user transactions | Built-in toggle for Flashbots Protect private mempools. |
| **Chain ID Mismatch** | Signing transactions on the wrong blockchain | Automatic `eth_chainId` detection and automatic wallet network switching. |
| **Key Custody Risks** | Storing private keys on server risks total loss | 100% Client-side signing via injected device wallets (`window.ethereum`). |
