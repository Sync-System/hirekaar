"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { CITIES } from "@/types";
import { hirekaarApi } from "@/lib/api-browser";

export function CompleteProfileForm() {
  const router = useRouter();
  const [country, setCountry] = useState("PK");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(hirekaarApi("/users/me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, city }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(JSON.stringify((data as { detail?: unknown }).detail ?? data));
        return;
      }
      toast.success("Profile saved");
      router.push("/customer/jobs");
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
        <select
          className="hk-input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        >
          <option value="">Select city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="hk-btn-lime mt-2"
      >
        {loading ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
