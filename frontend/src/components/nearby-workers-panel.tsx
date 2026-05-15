"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { CITIES } from "@/types";

type Row = {
  id: string;
  full_name: string;
  city: string | null;
  country: string;
  rating_avg: number;
  skills: string[];
  distance_km?: number;
  location_updated_at?: string;
};

export function NearbyWorkersPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("karachi");

  const loadByGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const q = new URLSearchParams({
          lat: String(latitude),
          lng: String(longitude),
          radius_km: "25",
        });
        try {
          const res = await fetch(`/api/hirekaar/public/workers-nearby?${q}`);
          const data = await res.json().catch(() => []);
          if (!res.ok) {
            toast.error(typeof data?.detail === "string" ? data.detail : "Could not load nearby workers");
            setRows([]);
            return;
          }
          setRows(data as Row[]);
          if ((data as Row[]).length === 0) {
            toast("No workers with a recent location in this radius. Ask workers to tap “Share location”.");
          }
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error("Location permission denied — try same-city list instead.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, []);

  const loadByCity = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ city });
      const res = await fetch(`/api/hirekaar/public/workers-nearby?${q}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        toast.error("Could not load workers");
        setRows([]);
        return;
      }
      setRows(data as Row[]);
    } finally {
      setLoading(false);
    }
  }, [city]);

  return (
    <section className="rounded-[2rem] border border-neutral-950/10 bg-white p-6 shadow-sm">
      <div className="rounded-[1.5rem] bg-neutral-950 p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">Nearby pros</p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Find workers around you</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-neutral-600">
        Use your GPS to see workers who recently shared their location, or pick a city if you prefer not to share GPS
        yet.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={loadByGps}
          className="hk-btn-lime"
        >
          {loading ? "Loading…" : "Use my location"}
        </button>
        <div className="flex items-center gap-2">
          <select
            className="rounded-full border border-neutral-950/10 bg-neutral-50 px-3 py-3 text-sm font-bold outline-none focus:border-lime-400"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading}
            onClick={loadByCity}
            className="hk-btn-outline"
          >
            Workers in city
          </button>
        </div>
      </div>
      {rows && (
        <ul className="mt-4 space-y-2">
          {rows.length === 0 ? (
            <li className="text-sm text-neutral-500">No workers found.</li>
          ) : (
            rows.map((w) => (
              <li key={w.id} className="rounded-2xl border border-neutral-950/10 bg-neutral-50 px-4 py-3 text-sm">
                <span className="font-black text-neutral-950">{w.full_name}</span>
                <span className="text-neutral-500">
                  {" "}
                  · ★ {w.rating_avg}
                  {w.distance_km != null && <> · {w.distance_km} km away</>}
                  {w.city && w.distance_km == null && (
                    <>
                      {" "}
                      · {w.city}
                    </>
                  )}
                </span>
                {w.skills?.length > 0 && (
                  <p className="text-xs text-neutral-500">{w.skills.join(", ")}</p>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}
