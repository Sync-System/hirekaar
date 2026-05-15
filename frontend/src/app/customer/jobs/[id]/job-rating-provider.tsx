"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { JobRatingModal } from "./job-rating-modal";

const SKIP_KEY = (jobId: string) => `hk_rating_skip_${jobId}`;

export function JobRatingProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string | undefined) ?? "";

  const [open, setOpen] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [workerProfile, setWorkerProfile] = useState<{
    full_name: string;
    rating_avg: number;
    rating_count: number;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    setWorkerId(null);
    setWorkerProfile(null);
    setOpen(false);
    if (!jobId) return;
    const ac = new AbortController();

    void (async () => {
      try {
        const meRes = await fetch("/api/hirekaar/users/me");
        if (!meRes.ok || ac.signal.aborted) return;
        const me = (await meRes.json()) as { id?: string; role?: string };
        if (me.role !== "customer") return;

        const jobRes = await fetch(`/api/hirekaar/jobs/${jobId}`);
        if (!jobRes.ok || ac.signal.aborted) return;
        const job = (await jobRes.json()) as {
          status?: string;
          customer_id?: string;
          assigned_worker_id?: string | null;
        assigned_worker?: {
          full_name: string;
          rating_avg: number;
          rating_count: number;
          avatar_url: string | null;
        } | null;
        };
        if (job.status !== "completed" || job.customer_id !== me.id) return;
        const wid = job.assigned_worker_id;
        if (!wid) return;

        if (typeof window !== "undefined" && window.localStorage.getItem(SKIP_KEY(jobId))) return;

        const revRes = await fetch(`/api/hirekaar/reviews/job/${jobId}`);
        if (!revRes.ok || ac.signal.aborted) return;
        const rev = (await revRes.json()) as { review?: { id: string } | null };
        if (rev.review?.id) return;

        if (ac.signal.aborted) return;
        setWorkerId(wid);
        setWorkerProfile(job.assigned_worker ?? null);
        setOpen(true);
      } catch {
        /* ignore */
      }
    })();

    return () => ac.abort();
  }, [jobId]);

  const closeModal = useCallback(() => {
    setOpen(false);
    if (jobId && typeof window !== "undefined") {
      window.localStorage.setItem(SKIP_KEY(jobId), "1");
    }
  }, [jobId]);

  const onSubmitted = useCallback(() => {
    if (jobId && typeof window !== "undefined") {
      window.localStorage.removeItem(SKIP_KEY(jobId));
    }
    router.refresh();
  }, [jobId, router]);

  return (
    <>
      {children}
      {workerId && (
        <JobRatingModal
          open={open}
          jobId={jobId}
          workerId={workerId}
          workerProfile={workerProfile}
          onClose={closeModal}
          onSubmitted={onSubmitted}
        />
      )}
    </>
  );
}
