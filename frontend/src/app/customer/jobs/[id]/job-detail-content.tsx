import { CATEGORY_LABELS, type Category } from "@/types";

import type { JobDetail } from "./job-types";

function categoryLine(category: string): string {
  if (category in CATEGORY_LABELS) {
    const x = CATEGORY_LABELS[category as Category];
    return `${x.emoji} ${x.en}`;
  }
  return category;
}

export function JobDetailContent({ job, compact }: { job: JobDetail; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-4 text-neutral-200" : "space-y-4"}>
      {!compact && (
        <>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-neutral-950">{job.title}</h1>
          <p className="mt-2 text-sm font-medium text-neutral-500">
            {categoryLine(job.category)} · {job.city} · {job.area}
          </p>
        </>
      )}
      {compact && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400">
          <span>{categoryLine(job.category)}</span>
          <span className="text-neutral-600">·</span>
          <span>
            {job.city} · {job.area}
          </span>
        </div>
      )}
      <p className={compact ? "text-sm leading-relaxed text-neutral-300" : "leading-7 text-neutral-700"}>{job.description}</p>
      <p className={compact ? "text-sm text-neutral-400" : "text-sm font-bold text-neutral-600"}>
        Budget PKR {job.budget_min.toLocaleString()} – {job.budget_max.toLocaleString()}
      </p>
      {job.recommended_price != null && (
        <p className={compact ? "text-sm text-lime-200/90" : "rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-950"}>
          Market recommended price: PKR {job.recommended_price.toLocaleString()}
        </p>
      )}
      {job.accepted_price_minor != null && (
        <p className={compact ? "text-sm text-lime-200/90" : "rounded-2xl bg-lime-300 px-4 py-3 text-sm font-black text-neutral-950"}>
          Accepted offer: PKR {job.accepted_price_minor.toLocaleString()}
          {job.platform_fee_minor != null && (
            <> · Platform fee (10%): PKR {job.platform_fee_minor.toLocaleString()}</>
          )}
        </p>
      )}

      {!(compact && job.status === "in_progress") && (
        <section>
          <h2 className={compact ? "text-xs font-semibold uppercase tracking-wider text-neutral-500" : "text-xl font-black text-neutral-950"}>
            Offers
          </h2>
          <ul className={compact ? "mt-2 space-y-2" : "mt-3 space-y-2"}>
            {job.bids.map((b) => (
              <li
                key={b.id}
                className={
                  compact
                    ? "rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm backdrop-blur-sm"
                    : "rounded-2xl bg-neutral-50 px-4 py-3 text-sm"
                }
              >
                <span className={compact ? "font-semibold text-lime-300" : "font-black text-neutral-950"}>
                  PKR {b.amount.toLocaleString()}
                </span>{" "}
                <span className={compact ? "text-neutral-400" : "font-medium text-neutral-500"}>· {b.status}</span>
                {b.message && <p className={compact ? "mt-1 text-neutral-300" : "mt-1 text-neutral-600"}>{b.message}</p>}
                {b.eta && <p className="mt-1 text-xs text-neutral-500">ETA: {b.eta}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
