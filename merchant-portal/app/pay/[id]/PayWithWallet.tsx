"use client";
import { useState } from "react";
import { ethers } from "ethers";

export default function PayWithWallet({ to, amount, currency }: { to: string; amount: string; currency: string }) {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    setTxHash(null);
    try {
      if (!window.ethereum) {
        setError("No wallet found. Please install MetaMask or another Ethereum wallet.");
        setLoading(false);
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      // For demo, treat TSHC as an ERC20 with 18 decimals (adjust if needed)
      if (currency === "TSHC") {
        // Replace with your TSHC contract address:
        const tokenAddress = "0x0000000000000000000000000000000000000000"; // TODO: Replace
        const erc20ABI = [
          "function transfer(address to, uint256 amount) public returns (bool)"
        ];
        const contract = new ethers.Contract(tokenAddress, erc20ABI, signer);
        const decimals = 18; // Adjust if TSHC uses a different number of decimals
        const value = ethers.utils.parseUnits(amount, decimals);
        const tx = await contract.transfer(to, value);
        setTxHash(tx.hash);
        await tx.wait();
      } else {
        // For native ETH payments (not recommended for TSHC)
        const value = ethers.utils.parseEther(amount);
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
      {error && <div className="mt-2 text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}
