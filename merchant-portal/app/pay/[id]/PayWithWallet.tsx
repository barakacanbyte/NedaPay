"use client";
import { useState } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import { stablecoins } from "../../data/stablecoins";
import { utils } from "ethers";

const WalletConnectButton = dynamic(() => import("./WalletConnectButton"), { ssr: false });

function isMobile() {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function PayWithWallet({ to, amount, currency }: { to: string; amount: string; currency: string }) {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    setTxHash(null);
    try {
      // Validate recipient address
      let isValidAddress = false;
      try {
        isValidAddress = !!to && utils.isAddress(to);
      } catch {
        isValidAddress = false;
      }
      if (!isValidAddress) {
        setError("Invalid merchant address. Please check the payment link.");
        setLoading(false);
        return;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError("Invalid amount.");
        setLoading(false);
        return;
      }
      if (!window.ethereum) {
        setError(null);
        setLoading(false);
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      // Find token info from stablecoins
      const token = stablecoins.find(
        (sc) => sc.baseToken.toLowerCase() === currency?.toLowerCase() || sc.currency.toLowerCase() === currency?.toLowerCase()
      );
      if (token && token.address && token.address !== "0x0000000000000000000000000000000000000000") {
        // ERC-20 transfer (EIP-681 style)
        const erc20ABI = [
          "function transfer(address to, uint256 amount) public returns (bool)",
          "function decimals() public view returns (uint8)"
        ];
        const contract = new ethers.Contract(token.address, erc20ABI, signer);
        let decimals = 18;
        try {
          decimals = await contract.decimals();
        } catch {
          // fallback to 18 if decimals() fails
          decimals = 18;
        }
        let value;
        try {
          value = utils.parseUnits(amount, decimals);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          return;
        }
        const tx = await contract.transfer(to, value);
        setTxHash(tx.hash);
        await tx.wait();
      } else {
        // Native ETH/coin transfer
        let value;
        try {
          value = utils.parseEther(amount);
        } catch {
          setError("Invalid amount format.");
          setLoading(false);
          return;
        }
        const tx = await signer.sendTransaction({ to, value });
        setTxHash(tx.hash);
        await tx.wait();
      }
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    }
    setLoading(false);
  };


  return (
    <div className="mt-4 text-center">
      <button
        onClick={handlePay}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-60"
      >
        {loading ? "Processing..." : `Pay with Wallet`}
      </button>
      {txHash && (
        <div className="mt-2 text-green-600 dark:text-green-400">
          Payment sent! Tx: <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a>
        </div>
      )}
      {!window.ethereum && isMobile() && (
        <div className="mt-4 text-center">
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">No wallet detected. Open in your wallet app:</div>
          <div className="flex flex-col gap-2 items-center">
            <a
              href={`metamask://dapp/${typeof window !== 'undefined' ? window.location.host + window.location.pathname + window.location.search : ''}`}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
            >
              Open in MetaMask
            </a>
            <a
              href={`cbwallet://dapp?url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Open in Coinbase Wallet
            </a>
            <WalletConnectButton to={to} amount={amount} currency={currency} />
          </div>
        </div>
      )}
      {error && <div className="mt-2 text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}
