"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
// Type-only import — erased at build time, so it never drags Leaflet's
// window-touching runtime into the server render.
import type * as L from "leaflet";

type LeafletModule = typeof import("leaflet");

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  /** Service radius in km — drawn as a circle around the point. */
  radiusKm: number | null;
  /** Fired when the seller picks/drags a point or clicks the map. */
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

// Tashkent center — sensible default before the seller has picked a point.
const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];
const BRAND = "#F97316"; // --color-brand-500 (DESIGN_SYSTEM)

/**
 * Leaflet (CJS/UMD) under different bundler interop modes resolves either to
 * the module itself or to its `.default`. Probe for a known function.
 */
function resolveLeaflet(mod: unknown): LeafletModule {
  const m = mod as { default?: LeafletModule } & LeafletModule;
  return m.default && typeof m.default.map === "function" ? m.default : m;
}

/** Brand-coloured map pin built from inline SVG — no image assets to resolve. */
function pinIcon(leaflet: LeafletModule): L.DivIcon {
  return leaflet.divIcon({
    className: "",
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.4 23.8 14 24.4a1.4 1.4 0 0 0 2 0c.6-.6 14-13.9 14-24.4C30 6.7 23.3 0 15 0z" fill="${BRAND}"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

/**
 * Interactive location picker for the store's geo point. The seller clicks (or
 * drags the pin) to set latitude/longitude; the circle visualises the FOOD
 * service radius live as `radiusKm` changes. State lives in the parent
 * (StoreForm) — this is a controlled component over (lat, lng).
 *
 * Leaflet is browser-only, so its runtime is loaded via dynamic import inside
 * an effect (never executes during SSR). Only its CSS is imported statically.
 */
export function LocationPicker({ lat, lng, radiusKm, onChange, className }: LocationPickerProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  // Latest onChange without re-binding the click handler each render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Move/create the pin and keep the circle glued to it.
  function syncPoint(la: number, ln: number, radiusMeters: number) {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([la, ln]);
    } else {
      const marker = leaflet.marker([la, ln], { icon: pinIcon(leaflet), draggable: true });
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onChangeRef.current(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
      });
      marker.addTo(map);
      markerRef.current = marker;
    }

    if (radiusMeters > 0) {
      if (circleRef.current) {
        circleRef.current.setLatLng([la, ln]);
        circleRef.current.setRadius(radiusMeters);
      } else {
        circleRef.current = leaflet
          .circle([la, ln], {
            radius: radiusMeters,
            color: BRAND,
            weight: 1.5,
            fillColor: BRAND,
            fillOpacity: 0.12,
          })
          .addTo(map);
      }
    } else if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }

  function clearPoint() {
    markerRef.current?.remove();
    markerRef.current = null;
    circleRef.current?.remove();
    circleRef.current = null;
  }

  // ─── init (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const leaflet = resolveLeaflet(await import("leaflet"));
      if (cancelled || !elRef.current || mapRef.current) return;
      leafletRef.current = leaflet;

      const hasPoint = lat != null && lng != null;
      const start: [number, number] = hasPoint ? [lat!, lng!] : DEFAULT_CENTER;
      const map = leaflet.map(elRef.current).setView(start, hasPoint ? 14 : 12);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);

      map.on("click", (e: L.LeafletMouseEvent) => {
        onChangeRef.current(
          Number(e.latlng.lat.toFixed(6)),
          Number(e.latlng.lng.toFixed(6)),
        );
      });

      mapRef.current = map;
      if (hasPoint) syncPoint(lat!, lng!, (radiusKm ?? 0) * 1000);
      // Leaflet mis-measures inside a just-mounted card; force a re-read.
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      clearPoint();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── sync external lat/lng changes (e.g. GPS button) ──────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (lat == null || lng == null) {
      clearPoint();
      return;
    }
    syncPoint(lat, lng, (radiusKm ?? 0) * 1000);
    mapRef.current.panTo([lat, lng]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // ─── sync radius circle ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;
    syncPoint(lat, lng, (radiusKm ?? 0) * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm]);

  return (
    <div
      ref={elRef}
      className={className}
      style={{ height: 280, width: "100%", borderRadius: 12, zIndex: 0 }}
    />
  );
}
