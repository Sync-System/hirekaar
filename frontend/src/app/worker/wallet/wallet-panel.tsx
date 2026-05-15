"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function WalletPanel() {
  const [balance, setBalance] = useState<number | null>(null);
  const [topup, setTopup] = useState(500000);
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/hirekaar/wallet/me");
    if (res.ok) {
      const j = (await res.json()) as { balance_minor: number };
      setBalance(j.balance_minor);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function doTopup() {
    setBusy(true);
    try {
      const res = await fetch("/api/hirekaar/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_minor: topup }),
      });
      if (!res.ok) {
        toast.error(await res.text());
        return;
      }
      toast.success("Top-up applied (demo)");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function doBoost() {
    setBusy(true);
    try {
      const res = await fetch("/api/hirekaar/wallet/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) {
        toast.error(await res.text());
        return;
      }
      toast.success("Boost activated");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hk-card space-y-6">
      <div className="rounded-[1.5rem] bg-neutral-950 p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">Available balance</p>
        <p className="mt-2 text-3xl font-black tracking-tight">
          {balance === null ? "…" : `PKR ${balance.toLocaleString()}`}
        </p>
        <p className="mt-1 text-xs text-neutral-400">Same PKR whole units as bids and platform fees.</p>
      </div>
      <div>
        <label className="hk-label">Demo top-up (minor units)</label>
        <input
          type="number"
          className="hk-input"
          value={topup}
          onChange={(e) => setTopup(Number(e.target.value))}
        />
        <button type="button" disabled={busy} onClick={doTopup} className="hk-btn-lime mt-3">
          Add funds
        </button>
      </div>
      <div>
        <label className="hk-label">Featured boost (days)</label>
        <input type="number" className="hk-input" value={days} onChange={(e) => setDays(Number(e.target.value))} min={1} max={30} />
        <button type="button" disabled={busy} onClick={doBoost} className="hk-btn-primary mt-3">
          Pay for boost
        </button>
      </div>
    </div>
  );
}
