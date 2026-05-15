import Link from "next/link";

import { FeaturedWorkersSection } from "@/components/featured-workers-section";

const serviceCards = [
  {
    title: "Home repairs",
    copy: "Electricians, plumbers, carpenters and AC technicians bid on your job.",
    accent: "bg-lime-300",
  },
  {
    title: "Cleaning & help",
    copy: "Post daily work, compare worker offers, then hire at the price you accept.",
    accent: "bg-lime-200",
  },
  {
    title: "Live job tracking",
    copy: "After acceptance, customer and worker see the route and live location.",
    accent: "bg-yellow-300",
  },
];

export default async function Home() {
  return (
    <div className="flex flex-col bg-[#f5f5ef]">
      <section className="relative isolate overflow-hidden bg-[#b9ff35] text-neutral-950">
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-[#f5f5ef] to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-6 md:py-20 lg:py-24">
          <div className="space-y-7">
            <p className="inline-flex rounded-full border border-neutral-950/15 bg-white/35 px-4 py-2 text-xs font-black uppercase tracking-[0.22em]">
              Pakistan-first service marketplace
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-7xl lg:text-8xl">
              Fair work for the price you both agree on
            </h1>
            <p className="max-w-xl text-base font-medium leading-7 text-neutral-800 md:text-lg">
              Post a job, receive worker offers, accept your best match, then track the professional live
              until the work is done. HirKaar brings InDrive-style negotiation to local home services.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/customer/jobs"
                className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-black text-white shadow-xl shadow-neutral-950/20 transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                Find a worker
              </Link>
              <Link
                href="/register"
                className="rounded-full border-2 border-neutral-950 px-6 py-3 text-sm font-black text-neutral-950 transition hover:-translate-y-0.5 hover:bg-white/35"
              >
                Become a worker
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm md:max-w-md">
            <div className="absolute -left-5 top-10 hidden rounded-3xl bg-white px-5 py-4 shadow-2xl md:block">
              <p className="text-xs font-bold text-neutral-500">Best offer</p>
              <p className="text-2xl font-black">PKR 4,500</p>
            </div>
            <div className="rounded-[2.5rem] border-[10px] border-neutral-950 bg-neutral-950 p-3 shadow-[0_30px_90px_rgba(10,10,10,0.35)]">
              <div className="overflow-hidden rounded-[1.75rem] bg-[#111] text-white">
                <div className="h-64 bg-[radial-gradient(circle_at_30%_20%,rgba(185,255,53,0.55),transparent_28%),linear-gradient(145deg,#242424,#050505)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-neutral-950">LIVE</span>
                    <span className="text-xs text-neutral-400">12 min away</span>
                  </div>
                  <div className="mt-12 h-1.5 rounded-full bg-lime-300 shadow-[0_0_28px_rgba(190,242,100,0.9)]" />
                  <div className="ml-auto mt-10 h-5 w-5 rounded-full border-4 border-neutral-950 bg-lime-300 ring-4 ring-lime-300/30" />
                  <div className="mt-12 h-5 w-5 rounded-full bg-white ring-4 ring-white/25" />
                </div>
                <div className="space-y-3 bg-neutral-950 p-5">
                  <p className="text-sm font-bold text-neutral-400">AC repair accepted</p>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xl font-black">Worker is on the way</p>
                    <p className="mt-1 text-sm text-neutral-400">Live map starts after customer accepts a bid.</p>
                  </div>
                  <button className="w-full rounded-2xl bg-lime-300 py-3 text-sm font-black text-neutral-950">
                    Track job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 md:grid-cols-3 md:px-6 md:py-14">
        {serviceCards.map((card) => (
          <div key={card.title} className="group rounded-[2rem] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className={`mb-8 h-16 w-16 rounded-3xl ${card.accent}`} />
            <h2 className="text-2xl font-black tracking-tight text-neutral-950">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{card.copy}</p>
          </div>
        ))}
      </section>

      <FeaturedWorkersSection />

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:py-20">
        <div className="rounded-[2rem] bg-neutral-950 p-7 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">One flow, many services</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-5xl">
            Post. Compare. Accept. Track. Rate.
          </h2>
          <p className="mt-5 text-sm leading-7 text-neutral-300">
            HirKaar keeps the service flow simple: customers choose the price they like, workers compete fairly,
            and live tracking builds trust after the offer is accepted.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["1", "Customer posts the job with budget and location."],
            ["2", "Workers submit offers with their own price."],
            ["3", "Customer accepts one offer and the live map opens."],
            ["4", "After completion, customer rates the worker."],
          ].map(([n, text]) => (
            <div key={n} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-lime-300 text-sm font-black text-neutral-950">
                {n}
              </span>
              <p className="mt-5 text-lg font-bold leading-snug text-neutral-950">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-950 px-5 py-16 text-white md:px-6 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">Safety first</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">Trust for every job</h2>
          </div>
          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            {["Worker profiles with CNIC fields", "Ratings after completed jobs", "Admin dashboard for oversight"].map(
              (item) => (
                <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-sm font-semibold leading-6 text-neutral-200">{item}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
