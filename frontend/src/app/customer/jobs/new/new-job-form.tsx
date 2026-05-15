"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { CATEGORIES, CITIES, CATEGORY_LABELS, type Category } from "@/types";

export function NewJobForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]!);
  const [city, setCity] = useState(CITIES[0]!);
  const [area, setArea] = useState("");
  const [budgetMin, setBudgetMin] = useState(5000);
  const [budgetMax, setBudgetMax] = useState(15000);
  const [pinJobSite, setPinJobSite] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let site_lat: number | undefined;
      let site_lng: number | undefined;
      if (pinJobSite && navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12_000,
          });
        }).catch(() => null);
        if (pos) {
          site_lat = pos.coords.latitude;
          site_lng = pos.coords.longitude;
        } else {
          toast.error("Could not read GPS for job site — posting without map pin");
        }
      }

      const body: Record<string, unknown> = {
        title,
        description,
        category,
        country: "PK",
        city,
        area,
        budget_min: budgetMin,
        budget_max: budgetMax,
      };
      if (site_lat != null && site_lng != null) {
        body.site_lat = site_lat;
        body.site_lng = site_lng;
      }

      const res = await fetch("/api/hirekaar/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(JSON.stringify((data as { detail?: unknown }).detail ?? data));
        return;
      }
      toast.success("Job posted");
      router.push(`/customer/jobs/${(data as { id: string }).id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="hk-card flex flex-col gap-5">
      <div className="-mx-6 -mt-6 mb-1 overflow-hidden rounded-t-[2rem] bg-neutral-950 p-5 text-white">
        <div className="relative h-40 rounded-[1.5rem] bg-[radial-gradient(circle_at_25%_25%,rgba(190,242,100,0.45),transparent_28%),linear-gradient(135deg,#2a2a2a,#070707)]">
          <div className="absolute left-5 top-5 rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-neutral-950">
            Location
          </div>
          <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300 ring-8 ring-lime-300/25" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/10 p-3 text-sm font-bold backdrop-blur">
            Add a job site now, or pin it later after accepting a worker.
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="hk-label">Skill required</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-2xl border p-3 text-left text-sm font-black transition ${
                category === c ? "border-neutral-950 bg-lime-300" : "border-neutral-950/10 bg-neutral-50 hover:bg-white"
              }`}
            >
              <span className="block text-xl">{CATEGORY_LABELS[c].emoji}</span>
              {CATEGORY_LABELS[c].en}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="hk-label">
        Title
        <input className="hk-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="hk-label">
        Description
        <textarea
          className="hk-input"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>
      <label className="hk-label">
        City
        <select className="hk-input" value={city} onChange={(e) => setCity(e.target.value as typeof city)}>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="hk-label">
        Area / neighbourhood
        <input className="hk-input" value={area} onChange={(e) => setArea(e.target.value)} required />
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-950/10 bg-neutral-50 p-4 text-sm font-medium text-neutral-700">
        <input
          type="checkbox"
          checked={pinJobSite}
          onChange={(e) => setPinJobSite(e.target.checked)}
          className="mt-1 accent-lime-300"
        />
        <span>
          Pin <strong>job site</strong> with my current location (for live map & route to worker after a bid is
          accepted). You can also add it later on the job page.
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="hk-label">
          Budget min (PKR)
          <input
            type="number"
            className="hk-input"
            value={budgetMin}
            onChange={(e) => setBudgetMin(Number(e.target.value))}
          />
        </label>
        <label className="hk-label">
          Budget max (PKR)
          <input
            type="number"
            className="hk-input"
            value={budgetMax}
            onChange={(e) => setBudgetMax(Number(e.target.value))}
          />
        </label>
      </div>
      <button type="submit" disabled={loading} className="hk-btn-lime">
        {loading ? "Posting…" : "Publish"}
      </button>
    </form>
  );
}
