import Link from "next/link";

import { NearbyWorkersPanel } from "@/components/nearby-workers-panel";
import { apiFetch } from "@/lib/api-server";

type JobRow = {
  id: string;
  title: string;
  category: string;
  city: string;
  budget_min: number;
  budget_max: number;
  recommended_price?: number;
  status: string;
  request_expires_at?: string;
};

export default async function CustomerJobsPage() {
  const res = await apiFetch("/jobs?status=open");
  const jobs: JobRow[] = res.ok ? await res.json() : [];

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-white">
      <header className="bg-neutral-950 px-4 py-5 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight">Finding Workers...</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
                <span className="text-lime-300">●</span>
                <span>Compare live offers and choose your worker</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />
              <span className="text-xs font-black uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-4">
        <NearbyWorkersPanel />

        <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-neutral-100 p-5">
          <div>
            <p className="hk-eyebrow">Marketplace</p>
            <h2 className="text-2xl font-black tracking-tight text-neutral-950">Open jobs</h2>
          </div>
        <Link
          href="/customer/jobs/new"
          className="hk-btn-primary"
        >
          Post a job
        </Link>
        </div>

      <ul className="space-y-4">
        {jobs.length === 0 ? (
          <li className="rounded-[2rem] border border-dashed border-neutral-950/20 bg-white/60 p-10 text-center text-neutral-500">
            No open jobs yet. Post the first one.
          </li>
        ) : (
          jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={`/customer/jobs/${j.id}`}
                className="relative block overflow-hidden rounded-2xl border border-neutral-950/10 bg-white p-4 shadow-sm ring-0 transition hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-lg"
              >
                <div className="absolute left-0 top-0 h-1 w-2/3 bg-lime-300" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-lime-300 bg-neutral-100 text-xl">
                      🔧
                    </div>
                    <div>
                      <p className="text-lg font-black text-neutral-950">{j.title}</p>
                      <p className="mt-1 text-xs font-medium text-neutral-500">
                        {j.category} · {j.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-neutral-950">
                      PKR {(j.recommended_price ?? j.budget_min).toLocaleString()}
                    </div>
                    <div className="rounded bg-neutral-950 px-2 py-0.5 text-[10px] font-black uppercase text-lime-300">
                      Recommended
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 rounded-xl bg-neutral-100 p-2 text-center">
                    <div className="text-[10px] font-black uppercase text-neutral-500">Area</div>
                    <div className="text-sm font-black">{j.city}</div>
                  </div>
                  <div className="flex-1 rounded-xl bg-neutral-100 p-2 text-center">
                    <div className="text-[10px] font-black uppercase text-neutral-500">Budget max</div>
                    <div className="text-sm font-black">PKR {j.budget_max.toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
      </main>
      <footer className="px-6 pb-8 pt-2 text-center">
        <p className="text-sm italic text-neutral-500">New bids and jobs appear after refresh.</p>
      </footer>
    </div>
  );
}
