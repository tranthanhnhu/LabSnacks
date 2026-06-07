"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onScan: (sku: string) => void;
};

export function QrScanner({ open, onClose, onScan }: Props) {
  const [manualSku, setManualSku] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader-region";

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined" || !navigator.mediaDevices) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          onScan(decoded.trim());
          onClose();
        },
        () => {},
      )
      .catch(() => {
        if (!cancelled) console.warn("Camera not available");
      });

    return () => {
      cancelled = true;
      void scanner.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [open, onClose, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-on-surface/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] bg-surface-container-lowest p-6 shadow-xl">
        <h2 className="font-headline text-xl font-bold">Scan SKU</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Point camera at barcode/QR or enter SKU manually.</p>
        <div id={regionId} className="mt-4 overflow-hidden rounded-xl" />
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-xl bg-surface-container-highest px-4 py-2 text-sm ring-1 ring-outline-variant/15"
            placeholder="Enter SKU"
            value={manualSku}
            onChange={(e) => setManualSku(e.target.value)}
          />
          <button
            type="button"
            disabled={!manualSku.trim()}
            onClick={() => {
              onScan(manualSku.trim());
              onClose();
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
          >
            Go
          </button>
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full text-sm font-bold text-primary">
          Cancel
        </button>
      </div>
    </div>
  );
}
