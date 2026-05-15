import { JobHistoryPanel } from "@/components/job-history-panel";
import { apiFetch, getMeJson } from "@/lib/api-server";
import type { Job } from "@/types";

export default async function CustomerProfilePage() {
  const me = await getMeJson();
  const res = await apiFetch("/jobs/me");
  const data = res.ok ? ((await res.json()) as { jobs: Job[] }) : { jobs: [] };

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#f5f5ef]">
      <header className="bg-lime-300 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-neutral-700">Customer profile</p>
          <h1 className="mt-1 text-4xl font-black tracking-[-0.05em] text-neutral-950">
            {String(me?.full_name ?? "My jobs")}
          </h1>
          <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-neutral-800">
            Track every posted job: workers finding, accepted/in-progress, completed, and cancelled.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <JobHistoryPanel jobs={data.jobs} role="customer" />
      </main>
    </div>
  );
}
