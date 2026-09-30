import React from "react";
import {
  LayoutDashboard,
  FileCode2,
  Zap,
  Activity,
  ShieldCheck,
  Droplets,
  Wallet,
  Wrench,
  Archive,
  Database,
  Radio,
  Binary,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  contractCount?: number;
  contractsCount?: number;
  mevCount?: number;
  mempoolCount?: number;
  faucetsReadyCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  contractCount = 0,
  contractsCount = 0,
  mevCount = 0,
  mempoolCount = 0,
  faucetsReadyCount = 0,
}) => {
  const totalContracts = contractCount || contractsCount;

  const navItems = [
    {
      id: "overview",
      label: "Mission Control",
      icon: LayoutDashboard,
      badge: null,
      badgeColor: "",
    },
    {
      id: "bitcoin",
      label: "Bitcoin & UTXO",
      icon: Binary,
      badge: "BitVM / Clarity",
      badgeColor: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    },
    {
      id: "lifecycle",
      label: "Contract Lifecycle",
      icon: FileCode2,
      badge: totalContracts > 0 ? `${totalContracts}` : null,
      badgeColor: "bg-[#1e1e22] text-[#a1a1aa] border border-[#27272a]",
    },
    {
      id: "vault",
      label: "Contract Vault",
      icon: Archive,
      badge: null,
      badgeColor: "",
    },
    {
      id: "mev",
      label: "MEV Discovery",
      icon: Zap,
      badge: mevCount > 0 ? `${mevCount} Live` : null,
      badgeColor: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    },
    {
      id: "mempool",
      label: "Mempool Watcher",
      icon: Activity,
      badge: mempoolCount > 0 ? `${mempoolCount}` : null,
      badgeColor: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    },
    {
      id: "security",
      label: "AI Security Suite",
      icon: ShieldCheck,
      badge: "Gemini 3.7",
      badgeColor: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
    },
    {
      id: "faucets",
      label: "Telegram Alerts",
      icon: Radio,
      badge: "Live Bot",
      badgeColor: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    },
    {
      id: "wallet",
      label: "Wallet & Sentinel",
      icon: Wallet,
      badge: null,
      badgeColor: "",
    },
  ];

  return (
    <aside className="w-full md:w-60 bg-[#0c0c0e] border-r border-[#1e1e22] flex flex-col justify-between p-3 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] uppercase font-mono tracking-wider text-[#52525b] font-bold">
          Studio Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono transition-all group ${
                isActive
                  ? "bg-[#1e1e22] text-white border-l-2 border-indigo-500 font-semibold"
                  : "text-[#a1a1aa] hover:text-[#e1e1e3] hover:bg-[#1e1e22]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-[#71717a] group-hover:text-[#a1a1aa]"}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer system telemetry card */}
      <div className="mt-4 p-3 rounded-xl bg-[#131316] border border-[#1e1e22] text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-[#71717a]">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            RPC WebSocket
          </span>
          <span className="text-emerald-400 font-semibold">12ms</span>
        </div>
        <div className="flex items-center justify-between text-[#71717a]">
          <span>EVM Simulator</span>
          <span className="text-indigo-400 font-semibold">Ready</span>
        </div>
        <div className="pt-2 border-t border-[#1e1e22] text-[10px] text-[#52525b] flex items-center justify-between">
          <span>AI Model</span>
          <span className="text-indigo-400">Gemini 3.7 Flash</span>
        </div>
      </div>
    </aside>
  );
};
