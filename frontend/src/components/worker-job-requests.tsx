"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { JobHistoryPanel } from "@/components/job-history-panel";
import { hirekaarApi } from "@/lib/api-browser";
import type { Job } from "@/types";

type MineResponse = { jobs: Job[] };

function secondsLeft(expiresAt?: string): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function playTone() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Browser may block audio until the user interacts.
  }
}

export function WorkerJobRequests() {
  const [requests, setRequests] = useState<Job[]>([]);
  const [history, setHistory] = useState<Job[]>([]);
  const [alerts, setAlerts] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const knownIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  const load = useCallback(async () => {
    const [openRes, mineRes] = await Promise.all([
      fetch(hirekaarApi("/jobs?status=open")),
      fetch(hirekaarApi("/jobs/me")),
    ]);
    const open = openRes.ok ? ((await openRes.json()) as Job[]) : [];
    const mine = mineRes.ok ? ((await mineRes.json()) as MineResponse) : { jobs: [] };
    const newOnes = open.filter((j) => !knownIds.current.has(j.id));
    setRequests(open);
    setHistory(mine.jobs);
    open.forEach((j) => knownIds.current.add(j.id));
    if (!initialLoad.current && alerts && newOnes.length > 0) {
      playTone();
      toast.success(`New job request: ${newOnes[0]!.title}`);
    }
    initialLoad.current = false;
  }, [alerts]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function sendOffer(job: Job) {
    setBusy(job.id);
    try {
      const amount = job.recommended_price ?? Math.round((job.budget_min + job.budget_max) / 2);
      const res = await fetch(hirekaarApi(`/jobs/${job.id}/bids`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          message: `I can do this for PKR ${amount.toLocaleString()}`,
          eta: "On my way",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.detail === "string" ? data.detail : "Could not send offer");
        return;
      }
      toast.success("Offer sent");
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-neutral-950/10 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Live job requests</h2>
            <p className="mt-1 text-xs font-bold text-neutral-500">
              Market recommended price shown on each request.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAlerts(true);
              playTone();
              toast.success("Worker alerts enabled");
            }}
            className={alerts ? "rounded-full bg-lime-300 px-3 py-2 text-xs font-black" : "rounded-full bg-neutral-950 px-3 py-2 text-xs font-black text-lime-300"}
          >
            {alerts ? "Alerts on" : "Enable tone"}
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-950/10 p-5 text-sm text-neutral-500">
            No open customer requests right now.
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.slice(0, 5).map((j) => {
              const left = secondsLeft(j.request_expires_at);
              const mine = history.find((h) => h.id === j.id && h.bid);
              return (
                <li key={`${j.id}-${tick}`} className="relative overflow-hidden rounded-2xl border-2 border-lime-300 bg-white p-4 shadow-lg">
                  <div className="absolute left-0 top-0 h-1 bg-lime-300" style={{ width: `${Math.max(10, (left / 30) * 100)}%` }} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-neutral-950">{j.title}</p>
                      <p className="mt-1 text-xs font-bold text-neutral-500">
                        {j.category} · {j.city} · {j.area}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">PKR {(j.recommended_price ?? j.budget_min).toLocaleString()}</p>
                      <p className="rounded bg-neutral-950 px-2 py-0.5 text-[10px] font-black uppercase text-lime-300">
                        Recommended
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-neutral-100 p-2 text-center">
                      <p className="text-[10px] font-black uppercase text-neutral-500">Budget</p>
                      <p className="text-sm font-black">
                        {j.budget_min.toLocaleString()}–{j.budget_max.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-neutral-100 p-2 text-center">
                      <p className="text-[10px] font-black uppercase text-neutral-500">Fast accept timer</p>
                      <p className="text-sm font-black">{left > 0 ? `${left}s` : "Respond now"}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Link href={`/customer/jobs/${j.id}`} className="rounded-2xl bg-neutral-100 py-3 text-center text-sm font-black">
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={busy === j.id || Boolean(mine)}
                      onClick={() => void sendOffer(j)}
                      className="rounded-2xl bg-lime-300 py-3 text-sm font-black text-neutral-950 disabled:opacity-50"
                    >
                      {mine ? "Offer sent" : busy === j.id ? "Sending..." : "Send offer"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <JobHistoryPanel jobs={history} role="worker" />
    </div>
  );
}
