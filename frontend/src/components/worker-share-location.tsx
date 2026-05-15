"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { hirekaarApi } from "@/lib/api-browser";

/** Push one GPS fix to the API so customers can find this worker in “nearby” search. */
export function WorkerShareLocation() {
  const [busy, setBusy] = useState(false);

  function send(lat: number, lng: number) {
    void (async () => {
      setBusy(true);
      try {
        const res = await fetch(hirekaarApi("/users/me/location"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
        if (!res.ok) {
          const t = await res.text();
          toast.error(t || "Could not update location");
          return;
        }
        toast.success("Location shared — customers can find you nearby");
      } finally {
        setBusy(false);
      }
    })();
  }

  function onClick() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        send(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setBusy(false);
        toast.error("Permission denied or unavailable");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  }

  return (
    <div className="hk-card">
      <h3 className="text-lg font-black tracking-tight text-neutral-950">Share location once</h3>
      <p className="mt-1 text-xs leading-5 text-neutral-600">
        Lets customers search nearby workers (like InDrive). Share again when you move to a new area. Live tracking
        starts automatically after a customer accepts your offer.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onClick}
        className="hk-btn-lime mt-4"
      >
        {busy ? "Getting GPS…" : "Update my location"}
      </button>
    </div>
  );
}
