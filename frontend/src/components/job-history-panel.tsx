import Link from "next/link";

import type { Job } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  open: "Finding workers",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function groupJobs(jobs: Job[]) {
  return {
    open: jobs.filter((j) => j.status === "open"),
    in_progress: jobs.filter((j) => j.status === "in_progress"),
    completed: jobs.filter((j) => j.status === "completed"),
    cancelled: jobs.filter((j) => j.status === "cancelled"),
  };
}

export function JobHistoryPanel({ jobs, role }: { jobs: Job[]; role: "customer" | "worker" }) {
  const groups = groupJobs(jobs);

  return (
    <div className="space-y-5">
      {(["open", "in_progress", "completed", "cancelled"] as const).map((status) => {
        const rows = groups[status];
        return (
          <section key={status} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                  {role === "customer" ? "Posted jobs" : "Worker jobs"}
                </p>
                <h2 className="text-xl font-black text-neutral-950">{STATUS_LABEL[status]}</h2>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black">{rows.length}</span>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-neutral-950/10 p-5 text-sm text-neutral-500">
                No {STATUS_LABEL[status].toLowerCase()} jobs.
              </p>
            ) : (
              <ul className="space-y-3">
                {rows.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/customer/jobs/${j.id}`}
                      className="block rounded-2xl border border-neutral-950/10 bg-neutral-50 p-4 transition hover:border-lime-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-neutral-950">{j.title}</p>
                          <p className="mt-1 text-xs font-medium text-neutral-500">
                            {j.category} · {j.city} · {j.area}
                          </p>
                          {j.bid && (
                            <p className="mt-2 text-xs font-bold text-neutral-600">
                              Your bid: PKR {j.bid.amount.toLocaleString()} · {j.bid.status}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-neutral-950">
                            PKR {(j.accepted_price_minor ?? j.recommended_price ?? j.budget_min).toLocaleString()}
                          </p>
                          <p className="mt-1 rounded bg-lime-300 px-2 py-0.5 text-[10px] font-black uppercase">
                            {j.status}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
