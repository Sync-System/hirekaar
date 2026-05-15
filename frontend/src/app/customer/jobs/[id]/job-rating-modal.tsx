"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { hirekaarApi } from "@/lib/api-browser";

type Props = {
  open: boolean;
  jobId: string;
  workerId: string;
  workerProfile: {
    full_name: string;
    rating_avg: number;
    rating_count: number;
    avatar_url: string | null;
  } | null;
  onClose: () => void;
  onSubmitted: () => void;
};

function formatDetail(data: unknown): string {
  const d = data as { detail?: unknown };
  if (typeof d.detail === "string") return d.detail;
  if (d.detail != null) return JSON.stringify(d.detail);
  return "Something went wrong";
}

const feedbackTags = ["On time", "Expert skill", "Clean work", "Great value"];

export function JobRatingModal({ open, jobId, workerId, workerProfile, onClose, onSubmitted }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(hirekaarApi(`/reviews/${jobId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewee_id: workerId,
          rating,
          comment: [tags.length > 0 ? `Feedback: ${tags.join(", ")}` : "", comment.trim()].filter(Boolean).join("\n\n") || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(formatDetail(data));
        return;
      }
      toast.success("Thanks — your rating was saved");
      onSubmitted();
      onClose();
      setComment("");
      setTags([]);
      setRating(5);
    } finally {
      setBusy(false);
    }
  }, [jobId, workerId, rating, comment, tags, onClose, onSubmitted]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-2xl ring-1 ring-white/5">
        <div className="rounded-3xl bg-white/5 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-lime-300 text-2xl font-black text-neutral-950">
              {workerProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workerProfile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (workerProfile?.full_name ?? "W").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">Worker profile</p>
              <h2 id="rating-title" className="truncate text-xl font-black text-white">
                {workerProfile?.full_name ?? "Your worker"}
              </h2>
              <p className="mt-1 text-sm font-bold text-neutral-400">
                ★ {workerProfile?.rating_avg ?? 0} · {workerProfile?.rating_count ?? 0} reviews
              </p>
            </div>
          </div>
        </div>

        <h3 className="mt-5 text-center text-lg font-semibold text-white">How was the job?</h3>
        <p className="mt-1 text-center text-sm text-neutral-400">Rate the worker and share feedback about this job.</p>

        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className={`rounded-xl px-2 py-2 text-2xl transition ${
                n <= rating ? "text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.5)]" : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-lime-200/80">{rating} / 5</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {feedbackTags.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]))}
                className={`rounded-xl border px-3 py-2 text-xs font-black uppercase transition ${
                  active
                    ? "border-lime-300 bg-lime-300/15 text-lime-200"
                    : "border-white/10 text-neutral-400 hover:border-white/25"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block text-xs font-medium text-neutral-400">
          Comment (optional)
          <textarea
            className="mt-1.5 min-h-[88px] w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-lime-400/40"
            placeholder="What went well?"
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="rounded-2xl bg-lime-300 px-4 py-3 text-sm font-bold text-neutral-950 transition hover:bg-lime-200 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Submit rating"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-white/5"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
