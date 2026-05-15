"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CATEGORIES, CITIES, CATEGORY_LABELS } from "@/types";
import { hirekaarApi } from "@/lib/api-browser";

export function WorkerProfileForm() {
  const router = useRouter();
  const [country, setCountry] = useState("PK");
  const [city, setCity] = useState("");
  const [cnic, setCnic] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(hirekaarApi("/users/me"));
      if (!res.ok) return;
      const u = (await res.json()) as {
        country?: string;
        city?: string | null;
        cnic_number?: string | null;
        cnic_photo_url?: string | null;
        skills?: string[];
      };
      if (u.country) setCountry(u.country);
      if (u.city) setCity(u.city);
      if (u.cnic_number) setCnic(u.cnic_number);
      if (u.cnic_photo_url) setPhotoUrl(u.cnic_photo_url);
      if (u.skills?.length) {
        const valid = new Set(CATEGORIES);
        setSkills(u.skills.filter((s) => valid.has(s as (typeof CATEGORIES)[number])));
      }
    })();
  }, []);

  function toggleSkill(s: string) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (skills.length === 0) {
      toast.error("Select at least one skill");
      return;
    }
    setLoading(true);
    try {
      const p = await fetch(hirekaarApi("/users/me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          city,
          cnic_number: cnic,
          cnic_photo_url: photoUrl || null,
        }),
      });
      if (!p.ok) {
        toast.error(await p.text());
        return;
      }
      const s = await fetch(hirekaarApi("/users/me/skills"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });
      if (!s.ok) {
        toast.error(await s.text());
        return;
      }
      toast.success("Profile updated");
      router.push("/worker/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="hk-card flex flex-col gap-4">
      <label className="hk-label">
        Country (ISO-2)
        <input
          className="hk-input uppercase"
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
          maxLength={2}
          required
        />
      </label>
      <label className="hk-label">
        City
        <select className="hk-input" value={city} onChange={(e) => setCity(e.target.value)} required>
          <option value="">Select</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="hk-label">
        CNIC (13 digits)
        <input className="hk-input" value={cnic} onChange={(e) => setCnic(e.target.value)} required />
      </label>
      <label className="hk-label">
        CNIC photo URL (paste link — file upload coming later)
        <input className="hk-input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} required />
      </label>
      <fieldset>
        <legend className="hk-label">Skills</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleSkill(c)}
              className={`hk-chip ${
                skills.includes(c) ? "hk-chip-active" : ""
              }`}
            >
              {CATEGORY_LABELS[c].emoji} {CATEGORY_LABELS[c].en}
            </button>
          ))}
        </div>
      </fieldset>
      <button type="submit" disabled={loading} className="hk-btn-lime mt-2">
        {loading ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
