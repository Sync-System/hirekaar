import Link from "next/link";
import { notFound } from "next/navigation";

import { JobActions } from "@/app/customer/jobs/[id]/job-actions";
import { JobDetailContent } from "@/app/customer/jobs/[id]/job-detail-content";
import { JobImmersiveTracking } from "@/app/customer/jobs/[id]/job-immersive-tracking";
import type { JobDetail } from "@/app/customer/jobs/[id]/job-types";
import { JobLiveMap } from "@/components/job-live-map";
import { apiFetch, getMeJson } from "@/lib/api-server";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetch(`/jobs/${id}`);
  if (!res.ok) notFound();
  const job = (await res.json()) as JobDetail;
  const me = await getMeJson();
  const myId = (me?.id as string | undefined) ?? null;
  const role = (me?.role as string | undefined) ?? null;
  const isOwner = myId === job.customer_id;
  const assigned = job.assigned_worker_id ?? null;

  const immersive =
    job.status === "in_progress" &&
    assigned != null &&
    myId != null &&
    ((role === "customer" && isOwner) || (role === "worker" && myId === assigned));

  if (immersive) {
    return (
      <JobImmersiveTracking job={job} meId={myId} meRole={role}>
        <JobDetailContent job={job} compact />
      </JobImmersiveTracking>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      <Link
        href="/customer/jobs"
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-neutral-950 shadow-sm transition hover:bg-lime-300"
      >
        ← All jobs
      </Link>

      <div className="hk-card mt-6 md:p-8">
        <JobDetailContent job={job} />
      </div>

      <JobLiveMap
        layout="embedded"
        jobId={job.id}
        jobStatus={job.status}
        customerId={job.customer_id}
        assignedWorkerId={assigned}
        meId={myId}
        meRole={role}
      />

      <JobActions
        jobId={job.id}
        jobStatus={job.status}
        customerId={job.customer_id}
        assignedWorkerId={assigned}
        bids={job.bids}
        meId={myId}
        meRole={role}
      />
    </div>
  );
}
