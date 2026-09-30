import JSZip from "jszip";
import confetti from "canvas-confetti";
import {
  isAddress,
  keccak256,
  toHex,
  stringToHex,
  getAddress,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  parseEther,
  PublicClient,
  WalletClient,
  Chain,
} from "viem";
import {
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  bsc,
  avalanche,
  sepolia,
  holesky,
} from "viem/chains";
import { generateMnemonic, english, mnemonicToAccount, privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { DeployedContract, NetworkId } from "../types";
import { NETWORKS } from "../data/networks";

// Alchemy, Infura, and Flashbots Infrastructure Constants
export const ALCHEMY_API_KEY = "alch_RoUqO8Gt0vy6xhHxaBXCE";
export const ALCHEMY_GAS_POLICY_ID = "0bc8745f-a5ec-4c42-846f-a1023df776ed";
export const INFURA_API_KEY = "4acc640a4f5d45d5952e9acdee591d86";

export const FLASHBOTS_CONFIG = {
  mainnetRelay: "https://relay.flashbots.net",
  sepoliaRelay: "https://relay-sepolia.flashbots.net",
  mainnetProtectTx: "https://protect.flashbots.net/tx/",
  sepoliaProtectTx: "https://protect-sepolia.flashbots.net/tx/",
};

// Viem Chains Mapping across all supported networks
export const VIEM_CHAINS: Record<NetworkId, Chain> = {
  ethereum: mainnet,
  arbitrum: arbitrum,
  base: base,
  optimism: optimism,
  polygon: polygon,
  bsc: bsc,
  avalanche: avalanche,
  sepolia: sepolia,
  holesky: holesky,
};

export function getViemChain(network: NetworkId = "ethereum"): Chain {
  return VIEM_CHAINS[network] || mainnet;
}

// RPC Providers by Network (Real Endpoints)
export const NETWORK_RPCS: Record<NetworkId, { alchemy?: string; infura?: string; public: string; explorer: string }> = {
  ethereum: {
    alchemy: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    infura: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    public: "https://cloudflare-eth.com",
    explorer: "https://etherscan.io",
  },
  arbitrum: {
    alchemy: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    infura: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    public: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io",
  },
  base: {
    alchemy: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    public: "https://mainnet.base.org",
    explorer: "https://basescan.org",
  },
  optimism: {
    alchemy: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    infura: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    public: "https://mainnet.optimism.io",
    explorer: "https://optimistic.etherscan.io",
  },
  polygon: {
    alchemy: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    infura: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    public: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com",
  },
  bsc: {
    public: "https://bsc-dataseed.binance.org",
    explorer: "https://bscscan.com",
  },
  avalanche: {
    public: "https://api.avax.network/ext/bc/C/rpc",
    explorer: "https://snowtrace.io",
  },
  sepolia: {
    alchemy: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    public: "https://rpc.sepolia.org",
    explorer: "https://sepolia.etherscan.io",
  },
  holesky: {
    public: "https://ethereum-holesky-rpc.publicnode.com",
    explorer: "https://holesky.etherscan.io",
  },
};

// Viem Client Factories & Multi-Provider Detection (EIP-6963, EIP-1193)
export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

// Global registry for EIP-6963 announced providers (MetaMask, Rabby, Coinbase, Phantom, OKX, etc.)
const announcedProviders: Map<string, EIP6963ProviderDetail> = new Map();

if (typeof window !== "undefined") {
  try {
    window.addEventListener("eip6963:announceProvider", (event: any) => {
      if (event.detail && event.detail.info && event.detail.provider) {
        announcedProviders.set(event.detail.info.uuid || event.detail.info.rdns || event.detail.info.name, event.detail);
      }
    });
    // Request announcements
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  } catch (_e) {
    // Ignore in non-browser env
  }
}

export function getAnnouncedEIP6963Providers(): EIP6963ProviderDetail[] {
  if (typeof window === "undefined") return [];
  try {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  } catch (_e) {}
  return Array.from(announcedProviders.values());
}

export function getInjectedEthereumProvider(preferredRdnsOrUuid?: string): any {
  if (typeof window === "undefined") return null;
  const win = window as any;

  // 1. If preferred EIP-6963 provider requested
  if (preferredRdnsOrUuid && announcedProviders.has(preferredRdnsOrUuid)) {
    return announcedProviders.get(preferredRdnsOrUuid)!.provider;
  }

  // 2. Check announced EIP-6963 providers first
  const announced = Array.from(announcedProviders.values());
  if (announced.length > 0) {
    const preferred = announced.find(
      (a) =>
        a.info.name.toLowerCase().includes("metamask") ||
        a.info.name.toLowerCase().includes("rabby") ||
        a.info.name.toLowerCase().includes("coinbase") ||
        a.info.name.toLowerCase().includes("phantom") ||
        a.info.name.toLowerCase().includes("okx")
    ) || announced[0];
    return preferred.provider;
  }

  // 3. Direct window.ethereum check
  if (win.ethereum) {
    if (Array.isArray(win.ethereum.providers) && win.ethereum.providers.length > 0) {
      const found = win.ethereum.providers.find(
        (p: any) => p.isMetaMask || p.isRabby || p.isCoinbaseWallet || p.isPhantom || p.isOKXWallet || p.isBraveWallet
      ) || win.ethereum.providers[0];
      return found;
    }
    return win.ethereum;
  }

  // 4. Specific extension namespaces
  if (win.rabby) return win.rabby;
  if (win.coinbaseWalletExtension) return win.coinbaseWalletExtension;
  if (win.phantom && win.phantom.ethereum) return win.phantom.ethereum;
  if (win.okxwallet) return win.okxwallet;
  if (win.bitkeep && win.bitkeep.ethereum) return win.bitkeep.ethereum;

  // 5. Legacy web3 provider
  if (win.web3 && win.web3.currentProvider) {
    return win.web3.currentProvider;
  }

  // 6. Check parent frame if running inside an iframe (safe try-catch)
  try {
    if (window.parent && window.parent !== window && (window.parent as any).ethereum) {
      const parentEth = (window.parent as any).ethereum;
      if (Array.isArray(parentEth.providers) && parentEth.providers.length > 0) {
        return parentEth.providers[0];
      }
      return parentEth;
    }
  } catch (_e) {
    // Cross-origin restriction
  }

  return null;
}

export function getPublicClient(network: NetworkId = "ethereum"): any {
  const chain = getViemChain(network);
  const rpcConfig = NETWORK_RPCS[network];
  const rpcUrl = rpcConfig?.alchemy || rpcConfig?.public || chain.rpcUrls.default.http[0];
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export function getInjectedWalletClient(network: NetworkId = "ethereum"): any {
  const provider = getInjectedEthereumProvider();
  if (!provider) {
    return null;
  }
  const chain = getViemChain(network);
  return createWalletClient({
    chain,
    transport: custom(provider),
  });
}

export function getPrivateKeyWalletClient(
  privateKey: `0x${string}`,
  network: NetworkId = "ethereum"
): any {
  const chain = getViemChain(network);
  const account = privateKeyToAccount(privateKey);
  const rpcConfig = NETWORK_RPCS[network];
  const rpcUrl = rpcConfig?.alchemy || rpcConfig?.public || chain.rpcUrls.default.http[0];
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}

// Multi-Chain Network Switcher for Injected Web3 Wallets (MetaMask, Rabby, Coinbase)
export async function switchInjectedWalletChain(
  network: NetworkId
): Promise<{ success: boolean; error?: string }> {
  const ethereum = getInjectedEthereumProvider();
  if (!ethereum) {
    return { success: false, error: "No injected Web3 browser wallet detected." };
  }
  const chain = getViemChain(network);
  const hexChainId = `0x${chain.id.toString(16)}`;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
    return { success: true };
  } catch (switchError: any) {
    // 4902 means the chain has not been added to the wallet yet
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        const netConfig = NETWORKS.find((n) => n.id === network);
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexChainId,
              chainName: netConfig?.name || chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [netConfig?.rpcUrl || chain.rpcUrls.default.http[0]],
              blockExplorerUrls: [netConfig?.explorerUrl || chain.blockExplorers?.default.url],
            },
          ],
        });
        return { success: true };
      } catch (addError: any) {
        return { success: false, error: addError.message || "Failed to add chain to wallet." };
      }
    }
    return { success: false, error: switchError.message || "Failed to switch chain in wallet." };
  }
}

// 1-Click Token Importer for Browser Wallets (EIP-747: wallet_watchAsset)
export async function addTokenToInjectedWallet(token: {
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
}): Promise<{ success: boolean; error?: string }> {
  const ethereum = getInjectedEthereumProvider();
  if (!ethereum) {
    return { success: false, error: "No injected Web3 browser wallet detected." };
  }
  try {
    const wasAdded = await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.image,
        },
      },
    });
    return { success: Boolean(wasAdded) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add token to wallet" };
  }
}

// Cryptographic Key & Wallet Generation / Recovery
export interface GeneratedWallet {
  address: string;
  privateKey: string;
  mnemonic: string;
  derivationPath: string;
  createdAt: string;
}

// Generate real developer key pair with genuine BIP-39 2048-word mnemonic and secp256k1 HD derivation
export function generateDeveloperWallet(): GeneratedWallet {
  // Generate real cryptographic secp256k1 private key
  const privKey = generatePrivateKey();
  const account = privateKeyToAccount(privKey);
  // Generate 12-word mnemonic using real standard BIP-39 English wordlist
  const mnemonic = generateMnemonic(english);

  return {
    address: account.address,
    privateKey: privKey,
    mnemonic,
    derivationPath: "m/44'/60'/0'/0/0",
    createdAt: new Date().toISOString(),
  };
}

// Broadcast real Flashbots / MEV bundle to PBS builders
export async function broadcastFlashbotsBundle(params: {
  network: NetworkId;
  signedTxs?: string[];
  rawTx?: string;
  bribeAmountEth?: string;
  mevStrategy?: string;
  pair?: string;
  turboMode?: boolean;
  senderAddress?: string;
}): Promise<{
  success: boolean;
  txHash?: string;
  targetBlock?: number;
  totalDurationMs?: number;
  relaysBroadcasted?: number;
  builderRelayResponses?: Array<{ builder: string; status: string; latencyMs: number; txHash?: string; error?: string }>;
  telemetry?: Record<string, string>;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/rpc/broadcast-flashbots-bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to broadcast bundle to Flashbots",
    };
  }
}

// Recover wallet address from raw Private Key or 12/24-Word BIP-39 Mnemonic
export function recoverWalletFromSecret(secretInput: string): {
  success: boolean;
  address?: string;
  type: "mnemonic" | "privateKey" | "invalid";
  error?: string;
} {
  const trimmed = secretInput.trim();
  if (!trimmed) {
    return { success: false, type: "invalid", error: "Input cannot be empty" };
  }

  // Check if input is 12 or 24 word mnemonic
  const words = trimmed.split(/\s+/);
  if (words.length === 12 || words.length === 24) {
    try {
      const account = mnemonicToAccount(trimmed, { path: "m/44'/60'/0'/0/0" });
      return {
        success: true,
        address: account.address,
        type: "mnemonic",
      };
    } catch (err: any) {
      return {
        success: false,
        type: "invalid",
        error: `Invalid BIP-39 mnemonic: ${err.message || "Checksum or word validation failed"}`,
      };
    }
  }

  // Check if input is hex private key (64 hex characters, with or without 0x)
  const cleanHex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
    try {
      const privKey = `0x${cleanHex}` as `0x${string}`;
      const account = privateKeyToAccount(privKey);
      return {
        success: true,
        address: account.address,
        type: "privateKey",
      };
    } catch (err: any) {
      return {
        success: false,
        type: "invalid",
        error: `Invalid private key: ${err.message}`,
      };
    }
  }

  // If already an address
  if (isAddress(trimmed)) {
    return {
      success: true,
      address: getAddress(trimmed),
      type: "privateKey",
    };
  }

  return {
    success: false,
    type: "invalid",
    error: "Invalid format. Provide a 64-char Hex Private Key or 12/24-word BIP-39 Mnemonic phrase.",
  };
}

// Live Injected Web3 Provider Connector (MetaMask / Rabby / EIP-1193 / EIP-6963) via Viem
export async function connectInjectedWeb3Wallet(
  targetNetwork?: NetworkId,
  preferredRdnsOrUuid?: string
): Promise<{
  success: boolean;
  address?: string;
  chainId?: number;
  walletClient?: any;
  providerName?: string;
  error?: string;
  isIframeBlocked?: boolean;
}> {
  const provider = getInjectedEthereumProvider(preferredRdnsOrUuid);
  const isIframe = typeof window !== "undefined" && window !== window.top;

  if (!provider) {
    return {
      success: false,
      isIframeBlocked: isIframe,
      error: isIframe
        ? "No browser wallet extension detected in this embedded frame. Browser extensions (like MetaMask or Rabby) require direct window access. Click 'Open Standalone Tab' or use the built-in Sentinel Key Vault below."
        : "No Web3 browser wallet extension found. Please install MetaMask, Rabby, Coinbase Wallet, or Phantom, or use the Sentinel Cryptographic Key Vault.",
    };
  }

  try {
    let accounts: string[] = [];
    try {
      accounts = await provider.request({ method: "eth_requestAccounts" });
    } catch (reqErr: any) {
      if (reqErr.code === 4001) {
        return { success: false, error: "Connection request was rejected in your wallet extension." };
      }
      if (reqErr.code === -32002) {
        return {
          success: false,
          error: "Connection request is already pending in your wallet extension. Please click the extension icon in your browser toolbar to approve.",
        };
      }
      // Try fallback to eth_accounts
      try {
        accounts = await provider.request({ method: "eth_accounts" });
      } catch (_e) {}
    }

    const chain = targetNetwork ? getViemChain(targetNetwork) : mainnet;
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });

    let address = accounts && accounts[0] ? accounts[0] : null;
    if (!address) {
      const requested = await client.requestAddresses();
      address = requested[0];
    }

    let chainId = chain.id;
    try {
      const hexChainId = await provider.request({ method: "eth_chainId" });
      if (hexChainId) chainId = parseInt(hexChainId, 16);
    } catch (_e) {
      chainId = await client.getChainId().catch(() => chain.id);
    }

    if (address) {
      const providerName =
        provider.isRabby ? "Rabby Wallet" :
        provider.isMetaMask ? "MetaMask" :
        provider.isCoinbaseWallet ? "Coinbase Wallet" :
        provider.isPhantom ? "Phantom" :
        provider.isOKXWallet ? "OKX Wallet" :
        provider.isBraveWallet ? "Brave Wallet" : "Web3 Injected Extension";

      return {
        success: true,
        address: getAddress(address),
        chainId,
        walletClient: client,
        providerName,
      };
    }
    return { success: false, error: "No accounts authorized by user in wallet extension." };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to connect to injected wallet extension.",
      isIframeBlocked: isIframe,
    };
  }
}

// Live Balance Fetcher via RPC Gateway
export async function fetchLiveBalance(
  address: string,
  network: NetworkId = "ethereum"
): Promise<{ balanceEth: string; balanceUsd: string; wei: string; success: boolean }> {
  try {
    const res = await fetch("/api/rpc/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, network }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          balanceEth: data.balanceEth || "0.000000",
          balanceUsd: data.balanceUsd || "0.00",
          wei: data.wei || "0x0",
          success: true,
        };
      }
    }
  } catch (err) {
    console.warn("Direct live balance fetch fallback:", err);
  }

  return {
    balanceEth: "0.000000",
    balanceUsd: "0.00",
    wei: "0x0",
    success: false,
  };
}

// Live Stats Fetcher (Block Number, Gas Prices)
export async function fetchLiveNetworkStats(
  network: NetworkId = "ethereum"
): Promise<{ blockNumber: number; gasPriceGwei: number; success: boolean }> {
  try {
    const res = await fetch(`/api/rpc/stats?network=${encodeURIComponent(network)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          blockNumber: data.blockNumber,
          gasPriceGwei: data.gasPriceGwei,
          success: true,
        };
      }
    }
  } catch (err) {
    console.warn("Failed to fetch live stats:", err);
  }

  return {
    blockNumber: 0,
    gasPriceGwei: 21.5,
    success: false,
  };
}

// Live Contract eth_call Reader
export async function executeLiveContractCall(
  to: string,
  dataHex: string,
  network: NetworkId = "ethereum"
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const res = await fetch("/api/rpc/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, data: dataHex, network }),
    });

    const body = await res.json();
    if (body.success) {
      return { success: true, result: body.result };
    }
    return { success: false, error: body.error || "Execution reverted" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Live On-Chain Transaction Receipt & Execution Verifier
export async function fetchOnChainTxReceipt(
  txHash: string,
  network: NetworkId = "ethereum"
): Promise<{
  success: boolean;
  receipt?: any;
  error?: string;
}> {
  try {
    const res = await fetch("/api/rpc/transaction-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, network }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return { success: false, error: "Failed to fetch on-chain transaction receipt" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Telegram Alert Dispatcher (Sends live on-chain receipts, profit alerts, MEV)
export async function sendTelegramNotification(payload: {
  type: "TX_RECEIPT" | "PROFIT_ALERT" | "MEV_OPPORTUNITY" | "SECURITY_ALERT" | "TEST_PING";
  title: string;
  message: string;
  txHash?: string;
  network?: string;
  amountEth?: string;
  amountUsd?: string;
  botToken?: string;
  chatId?: string;
}): Promise<{ success: boolean; messageId?: number; error?: string }> {
  try {
    const res = await fetch("/api/telegram/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to dispatch Telegram alert" };
  }
}

export function isValidEvmAddress(address: string): boolean {
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

export function formatAddress(address?: string, start = 6, end = 4): string {
  if (!address) return "0x0000...0000";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatEth(val: number | string, decimals = 4): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0.0000";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(val: number | string): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "$0.00";
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatGwei(val?: number | string): string {
  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (val == null || isNaN(num)) return "0.00 Gwei";
  return `${num.toFixed(2)} Gwei`;
}

// Flashbots Protect link generator
export function getFlashbotsProtectUrl(txHash: string, network: NetworkId): string {
  return `${FLASHBOTS_CONFIG.mainnetProtectTx}${txHash}`;
}

// Convert Wei, Gwei, Ether, USD (assuming 1 ETH = $3310)
export const ETH_PRICE_USD = 3310.0;

export function convertUnits(
  value: string | number,
  fromUnit: "wei" | "gwei" | "eth" | "usd"
): { wei: string; gwei: string; eth: string; usd: string } {
  let eth = 0;
  const num = typeof value === "string" ? parseFloat(value) || 0 : (Number(value) || 0);

  switch (fromUnit) {
    case "wei":
      eth = num / 1e18;
      break;
    case "gwei":
      eth = num / 1e9;
      break;
    case "eth":
      eth = num;
      break;
    case "usd":
      eth = num / ETH_PRICE_USD;
      break;
  }

  const wei = (eth * 1e18).toLocaleString("fullwide", { useGrouping: false });
  const gwei = (eth * 1e9).toFixed(4);
  const ethStr = (eth || 0).toFixed(6);
  const usdStr = ((eth || 0) * ETH_PRICE_USD).toFixed(2);

  return { wei, gwei, eth: ethStr, usd: usdStr };
}

// Keccak-256 via viem
export function computeKeccak256(input: string): string {
  try {
    return keccak256(stringToHex(input));
  } catch {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    const hex = hash.toString(16).padStart(8, "0");
    return `0x${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.slice(0, 66);
  }
}

export const mockKeccak256 = computeKeccak256;

// 4-byte selector calculator
export function calculateMethodSelector(signature: string): string {
  const clean = signature.replace(/\s+/g, "");
  const hash = computeKeccak256(clean);
  return hash.slice(0, 10);
}

// Encode constructor parameters into ABI hex bytes
export function encodeConstructorParameters(params: { name: string; type: string; value: string }[]): {
  encodedHex: string;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  let encodedHex = "";

  for (const param of params) {
    const val = param.value?.trim() || "";
    const type = param.type.toLowerCase();

    if (!val && type !== "bool") {
      errors[param.name] = `Value required for ${param.name} (${param.type})`;
      continue;
    }

    if (type === "address") {
      if (!isAddress(val)) {
        errors[param.name] = "Invalid Ethereum address format (must be 0x followed by 40 hex characters)";
      } else {
        const clean = val.replace(/^0x/, "").toLowerCase().padStart(64, "0");
        encodedHex += clean;
      }
    } else if (type.startsWith("uint") || type.startsWith("int")) {
      try {
        const bigIntVal = BigInt(val);
        if (type.startsWith("uint") && bigIntVal < 0n) {
          errors[param.name] = "Unsigned integer cannot be negative";
        } else {
          const hex = bigIntVal.toString(16).padStart(64, "0");
          encodedHex += hex;
        }
      } catch {
        errors[param.name] = `Invalid integer format for ${param.type}`;
      }
    } else if (type === "bool") {
      const boolVal = val === "true" || val === "1";
      encodedHex += (boolVal ? "1" : "0").padStart(64, "0");
    } else if (type === "string") {
      const utf8Hex = Array.from(new TextEncoder().encode(val))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const lenHex = val.length.toString(16).padStart(64, "0");
      const paddedData = utf8Hex.padEnd(Math.ceil(utf8Hex.length / 64) * 64 || 64, "0");
      encodedHex += lenHex + paddedData;
    } else if (type === "bytes32") {
      const clean = val.replace(/^0x/, "").padEnd(64, "0").slice(0, 64);
      encodedHex += clean;
    } else {
      // generic fallback pad
      encodedHex += val.replace(/^0x/, "").padStart(64, "0");
    }
  }

  return { encodedHex: encodedHex ? `0x${encodedHex}` : "0x", errors };
}

// Fetch verified contract from server Etherscan proxy
export async function fetchEtherscanContract(address: string, network: NetworkId = "ethereum") {
  try {
    const res = await fetch(`/api/etherscan/contract?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to reach contract resolver`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      verified: false,
      contractName: "Unverified Contract",
      error: err.message,
    };
  }
}

// Trigger celebratory confetti
export function triggerCelebration() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6366f1", "#10b981", "#38bdf8", "#f59e0b", "#ec4899"],
  });
}

// Export single contract or multiple contracts as a ZIP file
export async function downloadContractsZip(contracts: DeployedContract[], filename = "web3-contracts-vault.zip") {
  const zip = new JSZip();

  for (const contract of contracts) {
    const folder = zip.folder(`${contract.name}_${contract.address.slice(0, 8)}`);
    if (!folder) continue;

    // Source code file
    folder.file(`${contract.name}.sol`, contract.sourceCode || "// No source provided");

    // ABI file
    folder.file("abi.json", JSON.stringify(contract.abi, null, 2));

    // Bytecode file
    folder.file("bytecode.bin", contract.bytecode || "0x");

    // Deployment Metadata
    const metadata = {
      id: contract.id,
      name: contract.name,
      type: contract.type,
      network: contract.network,
      address: contract.address,
      deployer: contract.deployer,
      deployedAt: contract.deployedAt,
      txHash: contract.txHash,
      blockNumber: contract.blockNumber,
      gasUsed: contract.gasUsed,
      balanceEth: contract.balanceEth,
      solidityVersion: contract.solidityVersion,
      verified: contract.verified,
      tags: contract.tags,
      auditScore: contract.auditScore,
    };
    folder.file("deployment.json", JSON.stringify(metadata, null, 2));
  }

  // Add a master README.md
  zip.file(
    "README.md",
    `# Web3 Studio Contract Vault Export\n\nGenerated on: ${new Date().toUTCString()}\nTotal Contracts: ${contracts.length}\n\n## Exported Contracts\n` +
      contracts
        .map(
          (c) =>
            `- **${c.name}** (${c.type}) on network \`${c.network}\` at address \`${c.address}\``
        )
        .join("\n")
  );

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download single contract JSON bundle
export function downloadContractJson(contract: DeployedContract) {
  const data = JSON.stringify(contract, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${contract.name}_${contract.address.slice(0, 8)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
