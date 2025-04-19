"use client";

import React, { useState } from "react";
import { useGlobalWallet } from "../context/GlobalWalletContext";

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

const wallets = [
  {
    key: "coinbase",
    name: "Coinbase Wallet",
    description: "Connect using Coinbase Wallet",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#0052FF"/><circle cx="18" cy="18" r="10" fill="white"/><circle cx="18" cy="18" r="4" fill="#0052FF"/></svg>
    )
  },
  {
    key: "metamask",
    name: "MetaMask",
    description: "Connect using MetaMask",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#F6851B"/><path d="M27 10L19.5 15L21 11.5L27 10Z" fill="#E17726"/><path d="M9 10L16.5 15L15 11.5L9 10Z" fill="#E27625"/></svg>
    )
  }
];

export default function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect, isConnecting } = useGlobalWallet();
  const [error, setError] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  if (!open) return null;

  const handleConnect = async (wallet: "metamask" | "coinbase") => {
    console.log(`[WalletConnectModal] Connect button clicked for:`, wallet);
    setConnectingWallet(wallet);
    setError(null);
    try {
      await connect(wallet);
      console.log(`[WalletConnectModal] connect() resolved for:`, wallet);
      onClose();
    } catch (err: any) {
      console.error(`[WalletConnectModal] connect() error for ${wallet}:`, err);
      setError(err?.message || "Failed to connect");
    } finally {
      setConnectingWallet(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h2 className="text-lg font-semibold mb-4">Select Wallet</h2>
        <div className="space-y-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.key}
              className={`flex items-center w-full p-4 rounded-xl transition border text-left shadow-sm ${connectingWallet===wallet.key ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400" : "bg-gray-100 dark:bg-gray-800 border-transparent hover:bg-blue-50 dark:hover:bg-blue-900/30"}`}
              onClick={() => handleConnect(wallet.key as "metamask" | "coinbase")}
              disabled={isConnecting || !!connectingWallet}
            >
              <span className="mr-4">{wallet.icon}</span>
              <span>
                <div className="font-semibold text-base">{wallet.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{wallet.description}</div>
              </span>
              {connectingWallet === wallet.key && (
                <svg className="animate-spin ml-auto h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              )}
            </button>
          ))}
        </div>
        {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
      </div>
    </div>
  );
}
