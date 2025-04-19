"use client";
import { QRCodeSVG } from "qrcode.react";

export default function PaymentQRCode({ to, amount, currency }: { to: string; amount: string; currency: string }) {
  // For QR, use a simple format: ethereum:<address>?amount=<amount>&token=<symbol>
  const qrValue = `ethereum:${to}?amount=${amount}&token=${currency}`;
  return (
    <div className="flex flex-col items-center my-6">
      <QRCodeSVG value={qrValue} size={160} level="M" includeMargin />
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Scan with wallet app</div>
    </div>
  );
}
