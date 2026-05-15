"use client";

import Link from "next/link";

import { JobLiveMap } from "@/components/job-live-map";

import { JobActions } from "./job-actions";
import type { JobDetail } from "./job-types";

export function JobImmersiveTracking({
  job,
  meId,
  meRole,
  children,
}: {
  job: JobDetail;
  meId: string | null;
  meRole: string | null;
  children: React.ReactNode;
}) {
  const isCustomer = meRole === "customer" && meId === job.customer_id;
  const isWorker = meRole === "worker" && meId != null && meId === job.assigned_worker_id;
  const headline = isCustomer
    ? "Professional is on the way"
    : isWorker
      ? "Navigate to the job"
      : "Live tracking";

  const backHref = meRole === "worker" ? "/worker/dashboard" : "/customer/jobs";
  const backLabel = meRole === "worker" ? "Dashboard" : "Orders";

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-neutral-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
        <Link
          href={backHref}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/75"
        >
          <span aria-hidden>←</span> {backLabel}
        </Link>
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-lime-400/15 px-3.5 py-2 text-xs font-bold uppercase tracking-widest text-lime-200 ring-1 ring-lime-400/35 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-400" />
          </span>
          Live
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <JobLiveMap
          layout="immersive"
          jobId={job.id}
          jobStatus={job.status}
          customerId={job.customer_id}
          assignedWorkerId={job.assigned_worker_id ?? null}
          meId={meId}
          meRole={meRole}
        />
      </div>

      <div className="pointer-events-auto relative z-20 max-h-[50vh] min-h-[100px] shrink-0 overflow-y-auto overscroll-contain rounded-t-[1.85rem] border border-white/10 border-b-0 bg-gradient-to-b from-neutral-900/98 via-neutral-950/99 to-neutral-950 shadow-[0_-16px_60px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-lg flex-col px-4 pb-2 pt-3">
          <div className="mx-auto mb-2 h-1 w-11 rounded-full bg-white/25" />
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.28em] text-lime-300/80">HirKaar</p>
          <h2 className="mt-1 text-center text-xl font-semibold tracking-tight text-white">{headline}</h2>
          <p className="mt-2 line-clamp-2 text-center text-sm text-neutral-400">{job.title}</p>
        </div>
        <div className="border-t border-white/5 px-4 py-4">{children}</div>
        <div className="border-t border-white/5 px-4 pb-8 pt-2">
          <JobActions
            surface="dark"
            jobId={job.id}
            jobStatus={job.status}
            customerId={job.customer_id}
            assignedWorkerId={job.assigned_worker_id ?? null}
            bids={job.bids}
            meId={meId}
            meRole={meRole}
          />
        </div>
      </div>
    </div>
  );
}
