# Nexus Sentinel — Web3 & Smart Contract Developer Command Center

> A production-grade multi-chain Web3 developer command center, smart contract lifecycle studio, mempool & MEV scanner, cryptographic wallet vault, automated testnet faucet engine, and AI security audit system.

---

## ⚡ Quick Start (Run from Extracted ZIP / Terminal)

Follow these instructions to run the application locally on your machine after extracting the downloaded ZIP file.

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm** (`npm -v`) or **yarn** (`yarn -v`) / **pnpm** (`pnpm -v`)

---

### Step-by-Step Terminal Commands

#### 1. Extract the Archive & Navigate into the Project
```bash
# If using zip via terminal:
unzip nexus-sentinel-web3.zip -d nexus-sentinel
cd nexus-sentinel

# Or navigate to your extracted folder:
cd /path/to/extracted/project
```

#### 2. Install Project Dependencies
```bash
npm install
```

#### 3. (Optional) Configure Environment Variables
Create or copy the `.env` file for optional custom RPC endpoints, Gemini AI API key, or Etherscan API key:

```bash
cp .env.example .env
```

Edit `.env` (all keys have built-in zero-config public RPC fallbacks):
```env
# Optional: Google Gemini API Key for AI Smart Contract Auditing
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Etherscan API Key for fetching verified source code & ABI
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Custom EVM RPC URLs (Defaults to public Cloudflare/Ankr/LlamaNodes RPCs)
MAINNET_RPC_URL=https://cloudflare-eth.com
SEPOLIA_RPC_URL=https://rpc.sepolia.org
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
```

#### 4. Launch the Development Server
```bash
npm run dev
```

The application and Express backend proxy will start automatically:
```
➜  Local:   http://localhost:3000
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 📦 Production Build & Run

To create an optimized production bundle and launch the compiled server:

```bash
# Build frontend and server bundles
npm run build

# Launch the production server
npm run start
```

The compiled application serves static assets and proxy RPC endpoints from `dist/` on port `3000`.

---

## 🛠️ Core Feature Modules

### 1. Smart Contract Deployment & Verification Wizard
- Step-by-step 4-phase deployment flow:
  1. **Network Selection**: Mainnet, Sepolia, Base, Arbitrum One, Optimism, Holesky.
  2. **Bytecode & ABI Input**: Accepts raw EVM compilation artifacts or template contracts (ERC-20, ERC-721, Vaults).
  3. **Constructor Parameter Dynamic Encoding**: Calculates ABI spec 32-byte word padding (`uint256`, `address`, `string`, `bool`, `bytes32`).
  4. **Simulation & Gas Estimation**: Calculates intrinsic gas, calldata gas, and deployment costs in Gwei and USD.
  5. **Live Etherscan Source Fetching**: Real-time integration with Etherscan/Basescan/Arbiscan APIs to pull verified Solidity source code and metadata.

### 2. Contract Lifecycle & Interactive ABI Inspector
- Interactive **Read** (`view` / `pure`) and **Write** (`nonpayable` / `payable`) function caller.
- Computes real 4-byte EVM method selectors (`0x` + keccak256 signature prefix).
- Performs live on-chain `eth_call` RPC queries through the backend proxy.
- Live event log stream and state inspection.

### 3. AI Smart Contract Security Audit
- Powered by Gemini 2.5 Flash.
- Scans Solidity source code for critical vulnerabilities:
  - Reentrancy vulnerabilities (SWC-107)
  - Unchecked external calls & delegatecall hazards
  - Flashloan attack vectors & price manipulation risks
  - Access control flaws (missing `onlyOwner` or role checks)
  - Integer overflow / rounding issues
- Generates detailed severity reports with line-by-line remediation patches.

### 4. Developer Key Vault & Seed Phrase Recovery Hub
- **BIP-39 Mnemonic Generator**: Generates 12-word cryptographic seed phrases with checksum address derivation.
- **Wallet Recovery Engine**: Recover any EVM account from a 12-word mnemonic phrase or raw 64-character private key.
- **Injected Web3 Provider Connection**: Connect directly to MetaMask / Coinbase Wallet / Browser extensions via standard EIP-1193 protocol (`window.ethereum`).
- **Live Multi-Chain RPC Balance Sync**: Queries real-time on-chain balances across all connected testnets and mainnets.

### 5. Mempool Monitor & MEV Discovery Scanner
- Real-time mempool pending transaction streaming with decoded function signatures.
- MEV opportunity scanner for Arbitrage, Sandwich Attacks, Liquidation Snipes, and Flashloans.
- Visual breakdown of Expected Profit, Gas Bribe, Slippage Tolerance, and Block Timing.

### 6. Customizable Sentinel Alerting Engine
- Define custom trigger rules based on:
  - Contract events (e.g. `Transfer`, `Harvest`, `Approval`)
  - Wallet balance thresholds (`<` or `>` specified ETH)
  - High-yield MEV spreads and cross-DEX arbitrage
  - Mempool gas price surges
- In-app floating toast alerts, sound chimes, and trigger history log.

### 7. Multi-Chain Testnet Faucet Automator
- Automated testnet drip scheduler for Sepolia, Arbitrum Sepolia, Base Sepolia, and Holesky.
- Batch "Claim All" feature with countdown timers and claim telemetry.

### 8. Bitcoin Smart Contract & UTXO Engineering Suite
- **Bitcoin Script Virtual Machine**: Interactive opcode interpreter supporting `OP_DUP`, `OP_HASH160`, `OP_EQUALVERIFY`, `OP_CHECKSIG`, `OP_CHECKSIGADD`, `OP_CHECKMULTISIG`, `OP_CSV`, `OP_CLTV`, and mathematical stack transformations.
- **Miniscript Spending Policy Compiler**: Analyzes composable policies (e.g. `or_d(pk(user),and_v(v:pk(recovery),older(1000)))`), calculates exact witness virtual byte weights, checks non-malleability, and generates raw Bitcoin Script.
- **BitVM & BitVM2 ZK Engine**: Simulates off-chain logic gates (NAND, XOR, ADD), SNARK proof chunk partitioning across UTXOs, and the complete challenge-response dispute graph with disprove leaf scripts.
- **Stacks Clarity & RGB Client-Side Validation**: Clarity IDE with non-Turing complete decidability checks, post-condition assertions, and AI-driven formal verification via Gemini 3.7. Single-use seal blinded outpoint tracking for RGB20 assets.
- **BIP-174 / BIP-370 PSBT Constructor**: Multi-input UTXO transaction planner, virtual size (vB) calculation for SegWit & Taproot spends, OP_RETURN embedding, and Base64/Hex PSBT encoding.
- **Metaprotocol Indexers (Ordinals & Runes)**: Taproot witness inscription envelope generator (`OP_FALSE OP_IF 0x6f7264 ...`) and Runes protostone explorer with divisibility and supply tracking.
- **Mempool.space & RBF Engine**: Live fee rates (sat/vB), recent block stream, and BIP-125 Replace-By-Fee (RBF) fee bumping simulator.
- **Bitcoin Native Wallet Connectors**: Native detection and address derivation for UniSat, Xverse (sats-connect), Leather/Hiro, and OKX across Legacy (1...), Nested SegWit (3...), Native SegWit (bc1q...), and Taproot (bc1p...).

---

## 🔒 Security & Architecture

- **Stack**: React 19, TypeScript, Tailwind CSS, Viem v2, Lucide Icons, Express 4 backend with esbuild CJS bundle.
- **Server-Side RPC & Bitcoin Proxy**: JSON-RPC and Mempool.space queries are proxied server-side through `/api/*` to bypass CORS and prevent API key leakage.
- **Client-Side Key Derivation**: EVM private keys and Bitcoin SECP256K1 Schnorr / Taproot addresses are derived locally inside the browser's cryptographic sandbox without network transmission.
- **Sophisticated Dark UI**: Crafted with a curated dark aesthetic (`#0c0c0e` canvas, `#131316` cards, `#1e1e22` borders) with monospace typography and high contrast accents.

---

## 📜 License
MIT License. Built for Web3 developers, security researchers, Bitcoin engineers, and DeFi builders.
