"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type LeafletModule = typeof import("leaflet");

const TRACK_INTERVAL_MS = 2000;
const POST_THROTTLE_MS = 3500;
const OSRM_THROTTLE_MS = 10_000;

const TILE_OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

type TrackingPayload = {
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
  worker_id: string;
  site_lat: number | null;
  site_lng: number | null;
};

async function fetchOsrmRoute(
  wlat: number,
  wlng: number,
  slat: number,
  slng: number,
): Promise<[number, number][] | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${wlng},${wlat};${slng},${slat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
  };
  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) return null;
  return coords.map(([lng, lat]) => [lat, lng] as [number, number]);
}

function workerDivIcon(L: LeafletModule): import("leaflet").DivIcon {
  return L.divIcon({
    className: "hk-marker-root",
    html: `<div class="hk-worker-dot" aria-hidden="true"></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function JobLiveMap(props: {
  jobId: string;
  jobStatus: string;
  customerId: string;
  assignedWorkerId: string | null;
  meId: string | null;
  meRole: string | null;
  /** `immersive` = full-bleed dark map (ride-app style). */
  layout?: "embedded" | "immersive";
}) {
  const {
    jobId,
    jobStatus,
    customerId,
    assignedWorkerId,
    meId,
    meRole,
    layout = "embedded",
  } = props;
  const immersive = layout === "immersive";
  const mapEl = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const workerMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const siteMarkerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const routeLayerRef = useRef<import("leaflet").Polyline | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const watchId = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPost = useRef(0);
  const lastOsrm = useRef(0);
  const lastWorkerPos = useRef<{ lat: number; lng: number } | null>(null);
  const siteCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const immersiveRef = useRef(immersive);
  immersiveRef.current = immersive;

  const [hasSite, setHasSite] = useState(false);

  const isCustomer = meRole === "customer" && meId === customerId;
  const isAssignedWorker =
    meRole === "worker" && meId != null && assignedWorkerId != null && meId === assignedWorkerId;
  const showMap = jobStatus === "in_progress" && assignedWorkerId != null && (isCustomer || isAssignedWorker);

  const routeStyle = immersive
    ? { color: "#d9f99d", weight: 5, opacity: 0.92, lineCap: "round" as const, lineJoin: "round" as const }
    : { color: "#059669", weight: 4, opacity: 0.85, lineCap: "round" as const, lineJoin: "round" as const };

  const updateRoute = useCallback(
    async (L: LeafletModule, map: import("leaflet").Map, wlat: number, wlng: number, slat: number, slng: number) => {
      const now = Date.now();
      if (now - lastOsrm.current < OSRM_THROTTLE_MS) {
        const prev = lastWorkerPos.current;
        if (prev) {
          const moved =
            Math.abs(prev.lat - wlat) > 0.0004 || Math.abs(prev.lng - wlng) > 0.0004;
          if (!moved) return;
        }
      }
      lastOsrm.current = Date.now();
      lastWorkerPos.current = { lat: wlat, lng: wlng };

      const latlngs = await fetchOsrmRoute(wlat, wlng, slat, slng);
      if (!latlngs?.length || !mapInstance.current) return;

      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      routeLayerRef.current = L.polyline(latlngs, routeStyle).addTo(map);
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: immersiveRef.current ? [80, 48] : [24, 24], maxZoom: 16 });
    },
    [routeStyle],
  );

  const applyFromPayload = useCallback(
    async (L: LeafletModule, map: import("leaflet").Map, d: TrackingPayload) => {
      const imm = immersiveRef.current;
      const siteOk = d.site_lat != null && d.site_lng != null;
      if (siteOk) {
        siteCoordsRef.current = { lat: d.site_lat!, lng: d.site_lng! };
        setHasSite(true);
      } else {
        siteCoordsRef.current = null;
        setHasSite(false);
      }

      if (siteOk) {
        if (!siteMarkerRef.current) {
          siteMarkerRef.current = L.circleMarker([d.site_lat!, d.site_lng!], {
            radius: imm ? 15 : 11,
            color: imm ? "#bef264" : "#047857",
            weight: imm ? 3 : 2,
            fillColor: imm ? "#4ade80" : "#10b981",
            fillOpacity: imm ? 0.95 : 0.95,
          }).addTo(map);
          siteMarkerRef.current.bindTooltip("Job site", { permanent: false, direction: "top" });
        } else {
          siteMarkerRef.current.setLatLng([d.site_lat!, d.site_lng!]);
        }
      } else if (siteMarkerRef.current) {
        map.removeLayer(siteMarkerRef.current);
        siteMarkerRef.current = null;
      }

      if (d.lat != null && d.lng != null) {
        if (!workerMarkerRef.current) {
          workerMarkerRef.current = L.marker([d.lat, d.lng], imm ? { icon: workerDivIcon(L) } : {}).addTo(map);
          workerMarkerRef.current.bindTooltip(isCustomer ? "Professional" : "You", { direction: "top" });
        } else {
          workerMarkerRef.current.setLatLng([d.lat, d.lng]);
        }

        if (siteOk) {
          await updateRoute(L, map, d.lat, d.lng, d.site_lat!, d.site_lng!);
        } else {
          map.setView([d.lat, d.lng], imm ? 15 : 14);
        }
      } else if (siteOk) {
        map.setView([d.site_lat!, d.site_lng!], imm ? 15 : 14);
      }
    },
    [isCustomer, updateRoute],
  );

  const fetchTracking = useCallback(async () => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;
    const res = await fetch(`/api/hirekaar/jobs/${jobId}/tracking`);
    if (!res.ok) return;
    const d = (await res.json()) as TrackingPayload;
    await applyFromPayload(L, map, d);
  }, [jobId, applyFromPayload]);

  const syncSiteOnly = useCallback(async () => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;
    const res = await fetch(`/api/hirekaar/jobs/${jobId}/tracking`);
    if (!res.ok) return;
    const d = (await res.json()) as TrackingPayload;
    const siteOk = d.site_lat != null && d.site_lng != null;
    if (!siteOk) return;
    siteCoordsRef.current = { lat: d.site_lat!, lng: d.site_lng! };
    setHasSite(true);
    const imm = immersiveRef.current;
    if (!siteMarkerRef.current) {
      siteMarkerRef.current = L.circleMarker([d.site_lat!, d.site_lng!], {
        radius: imm ? 15 : 11,
        color: imm ? "#bef264" : "#047857",
        weight: imm ? 3 : 2,
        fillColor: imm ? "#4ade80" : "#10b981",
        fillOpacity: 0.95,
      }).addTo(map);
      siteMarkerRef.current.bindTooltip("Job site", { permanent: false, direction: "top" });
    } else {
      siteMarkerRef.current.setLatLng([d.site_lat!, d.site_lng!]);
    }
    const wm = workerMarkerRef.current;
    if (wm) {
      const p = wm.getLatLng();
      await updateRoute(L, map, p.lat, p.lng, d.site_lat!, d.site_lng!);
    }
  }, [jobId, updateRoute]);

  const postTracking = useCallback(
    async (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastPost.current < POST_THROTTLE_MS) return;
      lastPost.current = now;
      const res = await fetch(`/api/hirekaar/jobs/${jobId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      if (!res.ok) {
        const t = await res.text();
        if (res.status === 403 || res.status === 400) return;
        toast.error(t || "Could not send location");
      }
    },
    [jobId],
  );

  const pinJobSite = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`/api/hirekaar/jobs/${jobId}/site`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: latitude, lng: longitude }),
        });
        if (!res.ok) {
          toast.error(await res.text());
          return;
        }
        toast.success("Job site saved");
        await fetchTracking();
      },
      () => toast.error("Could not read GPS for job site"),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }, [jobId, fetchTracking]);

  useEffect(() => {
    if (!showMap || !mapEl.current) return;

    let cancelled = false;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapEl.current) return;
      leafletRef.current = L;

      const iconBase = "https://unpkg.com/leaflet@1.9.4/dist/images/";
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: `${iconBase}marker-icon-2x.png`,
        iconUrl: `${iconBase}marker-icon.png`,
        shadowUrl: `${iconBase}marker-shadow.png`,
      });

      const map = L.map(mapEl.current, {
        zoomControl: true,
        attributionControl: true,
      });
      mapInstance.current = map;
      if (immersive && map.zoomControl) {
        map.zoomControl.setPosition("bottomright");
      }

      L.tileLayer(immersive ? TILE_DARK : TILE_OSM, {
        maxZoom: 19,
        attribution: immersive
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      map.setView([24.8607, 67.0011], 12);

      await fetchTracking();

      if (isCustomer) {
        pollRef.current = setInterval(() => void fetchTracking(), TRACK_INTERVAL_MS);
      }

      if (isAssignedWorker) {
        pollRef.current = setInterval(() => void syncSiteOnly(), 7000);
      }

      if (isAssignedWorker && navigator.geolocation) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const Lm = leafletRef.current;
            const mp = mapInstance.current;
            if (!Lm || !mp) return;
            const imm = immersiveRef.current;
            if (!workerMarkerRef.current) {
              workerMarkerRef.current = Lm.marker([latitude, longitude], imm ? { icon: workerDivIcon(Lm) } : {}).addTo(
                mp,
              );
              workerMarkerRef.current.bindTooltip("You", { direction: "top" });
            } else {
              workerMarkerRef.current.setLatLng([latitude, longitude]);
            }
            const site = siteCoordsRef.current;
            if (site) {
              void updateRoute(Lm, mp, latitude, longitude, site.lat, site.lng);
            } else {
              mp.setView([latitude, longitude], mp.getZoom() > 15 ? mp.getZoom() : 15);
            }
            void postTracking(latitude, longitude);
          },
          () => toast.error("Could not read GPS for live tracking"),
          { enableHighAccuracy: true, maximumAge: 4000 },
        );
      }
    })();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (watchId.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (routeLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(routeLayerRef.current);
      }
      routeLayerRef.current = null;
      workerMarkerRef.current?.remove();
      workerMarkerRef.current = null;
      siteMarkerRef.current?.remove();
      siteMarkerRef.current = null;
      mapInstance.current?.remove();
      mapInstance.current = null;
      leafletRef.current = null;
      siteCoordsRef.current = null;
    };
  }, [showMap, isCustomer, isAssignedWorker, fetchTracking, syncSiteOnly, postTracking, updateRoute, immersive]);

  if (!showMap) return null;

  if (immersive) {
    return (
      <div className="absolute inset-0 z-0">
        <div ref={mapEl} className="h-full w-full" />
        {isCustomer && !hasSite && (
          <div className="pointer-events-auto absolute bottom-4 left-1/2 z-[1000] w-[min(92vw,22rem)] -translate-x-1/2">
            <button
              type="button"
              onClick={pinJobSite}
              className="w-full rounded-2xl bg-lime-300 px-4 py-3.5 text-center text-sm font-bold text-neutral-950 shadow-lg shadow-lime-400/25 transition hover:bg-lime-200"
            >
              Pin job site (GPS)
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="hk-card mt-8">
      <h2 className="text-xl font-black text-neutral-950">Live on the way</h2>
      <p className="mt-1 text-xs text-neutral-600">
        <span className="inline-block h-2 w-2 rounded-full bg-lime-300 align-middle" /> Job site ·{" "}
        <span className="inline-block h-2 w-2 rounded-full bg-blue-600 align-middle" /> Worker · Green line = route (
        <a href="https://project-osrm.org/" className="font-bold text-neutral-950 underline" target="_blank" rel="noreferrer">
          OSRM
        </a>{" "}
        demo).
      </p>
      {isCustomer && !hasSite && (
        <button
          type="button"
          onClick={pinJobSite}
        className="hk-btn-lime mt-3"
        >
          Pin job site (GPS)
        </button>
      )}
      <div ref={mapEl} className="mt-3 h-[min(52vh,420px)] w-full overflow-hidden rounded-[1.5rem]" />
    </section>
  );
}
