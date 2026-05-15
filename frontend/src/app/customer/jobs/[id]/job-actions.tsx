"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { hirekaarApi } from "@/lib/api-browser";

type Bid = { id: string; worker_id: string; amount: number; status: string };

function formatApiError(data: unknown): string {
  const d = data as { detail?: unknown };
  if (typeof d.detail === "string") return d.detail;
  if (d.detail != null) return JSON.stringify(d.detail);
  return JSON.stringify(data);
}

export function JobActions(props: {
  jobId: string;
  jobStatus: string;
  customerId: string;
  assignedWorkerId?: string | null;
  bids: Bid[];
  meId: string | null;
  meRole: string | null;
  /** Dark glass panel (live tracking sheet). */
  surface?: "light" | "dark";
}) {
  const router = useRouter();
  const { jobId, jobStatus, customerId, assignedWorkerId = null, bids, meId, meRole, surface = "light" } = props;
  const [amount, setAmount] = useState(10_000);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const isOwner = meId === customerId && meRole === "customer";
  const isWorker = meRole === "worker";
  const isAssignedWorker = isWorker && assignedWorkerId != null && meId === assignedWorkerId;
  const myBid = bids.find((b) => b.worker_id === meId);
  const dark = surface === "dark";

  async function placeBid(e: React.FormEvent) {
    e.preventDefault();
    setBusy("bid");
    try {
      const res = await fetch(hirekaarApi(`/jobs/${jobId}/bids`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, message: message || null, eta: null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(formatApiError(data));
        return;
      }
      toast.success("Offer sent");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function acceptBid(bidId: string) {
    setBusy(bidId);
    try {
      const res = await fetch(hirekaarApi(`/jobs/${jobId}/accept/${bidId}`), { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(formatApiError(data));
        return;
      }
      toast.success("Offer accepted — live tracking started");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function completeJob() {
    setBusy("complete");
    try {
      const res = await fetch(hirekaarApi(`/jobs/${jobId}/complete`), { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(formatApiError(data));
        return;
      }
      toast.success(isAssignedWorker ? "Work marked done — customer can rate you now" : "Job completed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const card =
    dark
      ? "rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-inner backdrop-blur-sm"
      : "rounded-[2rem] bg-white p-5 shadow-sm";

  const labelCls = dark ? "text-xs font-medium text-neutral-400" : "hk-label";
  const inputCls = dark
    ? "mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-neutral-600 focus:border-lime-400/50"
    : "hk-input";

  return (
    <div className={dark ? "space-y-6" : "mt-8 space-y-8"}>
      {isWorker && jobStatus === "open" && (
        <div className={card}>
          <h3 className={dark ? "text-base font-semibold text-white" : "text-xl font-black text-neutral-950"}>
            Your offer
          </h3>
          <p className={dark ? "mt-1 text-xs text-neutral-500" : "mt-1 text-sm text-neutral-500"}>
            Name your price — customer picks one professional (InDrive-style bidding).
          </p>
          {myBid ? (
            <p className={dark ? "mt-3 text-sm text-lime-200/90" : "mt-3 text-sm font-bold text-neutral-700"}>
              You already sent an offer on this job.
            </p>
          ) : (
            <form onSubmit={placeBid} className="mt-4 flex flex-col gap-3">
              <label className={labelCls}>
                Price (PKR)
                <input
                  type="number"
                  className={inputCls}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
              </label>
              <label className={labelCls}>
                Message <span className="font-normal text-neutral-500">(optional)</span>
                <input className={inputCls} value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
              <button
                type="submit"
                disabled={busy === "bid"}
                className={
                  dark
                    ? "mt-1 rounded-2xl bg-lime-300 py-3.5 text-sm font-bold text-neutral-950 transition hover:bg-lime-200 disabled:opacity-50"
                    : "hk-btn-lime mt-1"
                }
              >
                {busy === "bid" ? "Sending…" : "Send offer"}
              </button>
            </form>
          )}
        </div>
      )}

      {isOwner && jobStatus === "open" && (
        <div className={dark ? "space-y-3" : ""}>
          <h3 className={dark ? "text-base font-semibold text-white" : "text-xl font-black text-neutral-950"}>
            Choose an offer
          </h3>
          <p className={dark ? "text-xs text-neutral-500" : "text-xs text-neutral-500"}>
            10% platform fee applies on acceptance (worker wallet).
          </p>
          <ul className={dark ? "mt-3 space-y-2" : "mt-2 space-y-2"}>
            {bids
              .filter((b) => b.status === "pending")
              .map((b) => (
                <li
                  key={b.id}
                  className={
                    dark
                      ? "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5"
                      : "flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                  }
                >
                  <span className={dark ? "text-sm font-semibold text-lime-200" : "text-sm font-black text-neutral-950"}>
                    PKR {b.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => acceptBid(b.id)}
                    className={
                      dark
                        ? "shrink-0 rounded-xl bg-lime-300 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-lime-200 disabled:opacity-40"
                        : "shrink-0 rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-neutral-950 hover:bg-lime-200 disabled:opacity-40"
                    }
                  >
                    Accept
                  </button>
                </li>
              ))}
          </ul>
          {bids.filter((b) => b.status === "pending").length === 0 && (
            <p className={dark ? "text-sm text-neutral-500" : "text-sm text-neutral-500"}>No pending offers yet.</p>
          )}
        </div>
      )}

      {(isOwner || isAssignedWorker) && jobStatus === "in_progress" && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={completeJob}
          className={
            dark
              ? "w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/15 disabled:opacity-40"
              : "hk-btn-primary"
          }
        >
          {busy === "complete" ? "Saving…" : isAssignedWorker ? "Mark work done" : "Mark job complete"}
        </button>
      )}
    </div>
  );
}
