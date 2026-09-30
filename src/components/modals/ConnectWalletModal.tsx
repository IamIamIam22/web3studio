import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Key,
  Layers,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";
import {
  getInjectedEthereumProvider,
  getAnnouncedEIP6963Providers,
  connectInjectedWeb3Wallet,
  EIP6963ProviderDetail,
  formatAddress,
  triggerCelebration,
} from "../../utils/web3Utils";
import { NetworkId } from "../../types";
import { NETWORKS } from "../../data/networks";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected: (address: string, providerName?: string) => void;
  activeAddress?: string;
  selectedNetwork?: NetworkId;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onWalletConnected,
  activeAddress,
  selectedNetwork = "ethereum",
}) => {
  const [announcedProviders, setAnnouncedProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProviderId, setConnectingProviderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window !== window.top);
      const providers = getAnnouncedEIP6963Providers();
      setAnnouncedProviders(providers);

      // Listen for newly announced providers
      const handler = (event: any) => {
        if (event.detail && event.detail.info) {
          setAnnouncedProviders(getAnnouncedEIP6963Providers());
        }
      };
      window.addEventListener("eip6963:announceProvider", handler);
      return () => window.removeEventListener("eip6963:announceProvider", handler);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProvider = getInjectedEthereumProvider();
  const hasInjected = Boolean(currentProvider) || announcedProviders.length > 0;

  const handleConnect = async (providerDetail?: EIP6963ProviderDetail) => {
    setIsConnecting(true);
    setConnectingProviderId(providerDetail?.info.uuid || "default");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await connectInjectedWeb3Wallet(
        selectedNetwork as NetworkId,
        providerDetail?.info.uuid || providerDetail?.info.rdns
      );

      if (res.success && res.address) {
        triggerCelebration();
        const pName = providerDetail?.info.name || res.providerName || "Web3 Injected Extension";
        setSuccessMessage(`Connected with ${pName}: ${formatAddress(res.address)}`);
        onWalletConnected(res.address, pName);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || "Failed to establish Web3 wallet handshake.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Connection error encountered.");
    } finally {
      setIsConnecting(false);
      setConnectingProviderId(null);
    }
  };

  const handleOpenStandalone = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopy = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const networkConfig = NETWORKS.find((n) => n.id === selectedNetwork) || NETWORKS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#131316] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden text-xs font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e22] bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">Connect Web3 Wallet Extension</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  EIP-6963 / EIP-1193
                </span>
              </div>
              <p className="text-[11px] text-[#71717a] mt-0.5">
                Target Network: <span className="text-[#e1e1e3] font-semibold">{networkConfig.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#1e1e22] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Iframe Notice & Standalone Tab Button */}
          {isIframe && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Embedded Preview Frame Detected</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Sandbox Notice
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#d4d4d8]">
                Browser security policies prevent some wallet extensions (like MetaMask or Rabby) from injecting popups inside embedded preview frames. If your extension doesn&apos;t pop up, click below to open in a full tab or use the built-in Sentinel Vault.
              </p>
              <button
                onClick={handleOpenStandalone}
                className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg flex items-center justify-center gap-2 font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Standalone Browser Window</span>
              </button>
            </div>
          )}

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Currently Active Address */}
          {activeAddress && (
            <div className="p-3 bg-[#0c0c0e] border border-[#1e1e22] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-[10px] text-[#71717a]">Active Platform Address</div>
                  <div className="text-[#e1e1e3] font-bold">{formatAddress(activeAddress)}</div>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-[#1e1e22] text-[#a1a1aa] hover:text-white flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}

          {/* Discovered EIP-6963 Providers */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Installed Web3 Extensions ({announcedProviders.length > 0 ? announcedProviders.length : hasInjected ? 1 : 0})
            </div>

            {announcedProviders.length > 0 ? (
              announcedProviders.map((p) => (
                <button
                  key={p.info.uuid || p.info.name}
                  onClick={() => handleConnect(p)}
                  disabled={isConnecting}
                  className="w-full p-3 bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-indigo-500/40 rounded-xl flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-3">
                    {p.info.icon ? (
                      <img src={p.info.icon} alt={p.info.name} className="w-6 h-6 rounded-md" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold">
                        {p.info.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-white group-hover:text-indigo-400 transition">{p.info.name}</div>
                      <div className="text-[10px] text-[#71717a]">{p.info.rdns || "EIP-6963 Injected"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connectingProviderId === p.info.uuid && (
                      <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                    )}
                    <span className="text-[11px] px-2 py-1 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold group-hover:bg-indigo-600 group-hover:text-white transition">
                      Connect &rarr;
                    </span>
                  </div>
                </button>
              ))
            ) : hasInjected ? (
              <button
                onClick={() => handleConnect()}
                disabled={isConnecting}
                className="w-full p-3 bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-indigo-500/40 rounded-xl flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white group-hover:text-indigo-400 transition">
                      Default Injected Web3 Wallet (MetaMask / Rabby)
                    </div>
                    <div className="text-[10px] text-[#71717a]">EIP-1193 Standard Injected Provider</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnecting && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />}
                  <span className="text-[11px] px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold group-hover:bg-indigo-600 group-hover:text-white transition">
                    Connect Extension
                  </span>
                </div>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-[#0c0c0e] border border-[#1e1e22] text-center space-y-3">
                <div className="text-[#a1a1aa] leading-relaxed">
                  No extension announced directly in this frame. You can connect using the direct browser prompt or open in a standalone tab.
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleConnect()}
                    disabled={isConnecting}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 transition"
                  >
                    {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>Prompt Extension Handshake</span>
                  </button>
                  <button
                    onClick={handleOpenStandalone}
                    className="px-3.5 py-2 rounded-lg bg-[#1e1e22] hover:bg-[#27272a] text-[#e1e1e3] border border-[#27272a] flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Standalone</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Alternative: Sentinel Cryptographic Key Vault */}
          <div className="pt-2 border-t border-[#1e1e22]">
            <div className="p-3 bg-[#0c0c0e] border border-[#1e1e22] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Built-in Sentinel Key Vault</div>
                  <div className="text-[10px] text-[#71717a]">
                    Secp256k1 Ephemeral Signer (Zero Extension Required)
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1e1e22] hover:bg-[#27272a] text-emerald-400 border border-emerald-500/30 font-semibold transition"
              >
                Vault Ready
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0c0c0e] border-t border-[#1e1e22] flex items-center justify-between text-[#71717a] text-[11px]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted local session with Viem & Scure Signer</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1e1e22] hover:bg-[#27272a] text-[#e1e1e3] rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
