import Link from "next/link";

import { WorkerJobRequests } from "@/components/worker-job-requests";
import { WorkerShareLocation } from "@/components/worker-share-location";

export default function WorkerDashboardPage() {
  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(188,255,0,0.18),transparent_26%),radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(135deg,#262626,#050505)]" />
      <div className="absolute left-[22%] top-[42%] z-10 flex flex-col items-center">
        <div className="mb-1 rounded-xl bg-neutral-950 px-3 py-1.5 text-sm font-black text-lime-300 shadow-2xl">
          PKR 5,000+
        </div>
        <div className="h-4 w-4 rounded-full border-4 border-white bg-lime-300 shadow-lg" />
      </div>
      <div className="absolute right-[22%] top-[28%] z-10 flex flex-col items-center">
        <div className="mb-1 rounded-xl bg-neutral-950 px-3 py-1.5 text-sm font-black text-lime-300 shadow-2xl">
          PKR 3,500+
        </div>
        <div className="h-4 w-4 rounded-full border-4 border-white bg-lime-300 shadow-lg" />
      </div>

      <header className="relative z-20 p-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/90 p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-lime-300">●</div>
            <div>
              <div className="text-xs font-black uppercase text-neutral-500">Status</div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-lime-300" />
                <span className="text-sm font-black">Online & Ready</span>
              </div>
            </div>
          </div>
          <Link href="/customer/jobs" className="rounded-xl border border-neutral-950/10 bg-white px-3 py-2 text-xs font-black">
            Jobs
          </Link>
        </div>
      </header>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4">
        <div className="max-h-[78vh] overflow-y-auto rounded-3xl border border-neutral-950/10 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-black uppercase tracking-tight">Job Requests Nearby</h1>
            <span className="rounded-lg bg-neutral-100 px-2 py-1 text-xs font-black">Live map</span>
          </div>

          <div className="mb-5">
            <WorkerShareLocation />
          </div>

          <WorkerJobRequests />

          <div className="grid grid-cols-2 gap-3">
            <Link href="/worker/profile" className="rounded-2xl bg-neutral-100 py-4 text-center text-sm font-black">
              Profile
            </Link>
            <Link href="/worker/wallet" className="rounded-2xl bg-lime-300 py-4 text-center text-sm font-black text-neutral-950 shadow-lg">
              Wallet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
