"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
// Type-only import — erased at build time, so Leaflet's window-touching runtime
// never reaches the server render.
import type * as L from "leaflet";

type LeafletModule = typeof import("leaflet");

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  /** Fired when the buyer taps the map or drags the pin. */
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

// Tashkent center — default before the buyer has picked a point.
const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];
const BRAND = "#FF6B35"; // --color-brand-500

function resolveLeaflet(mod: unknown): LeafletModule {
  const m = mod as { default?: LeafletModule } & LeafletModule;
  return m.default && typeof m.default.map === "function" ? m.default : m;
}

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
 * Interactive address picker — the buyer taps the map (or drags the pin) to set
 * their delivery coordinates. Controlled over (lat, lng) by AddressForm; the
 * "use current location" GPS button feeds the same state and the map re-centers.
 *
 * Leaflet is browser-only, so its runtime loads via dynamic import inside an
 * effect (never during SSR); only its CSS is imported statically.
 */
export function LocationPicker({ lat, lng, onChange, className }: LocationPickerProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  function syncPoint(la: number, ln: number) {
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
  }

  function clearPoint() {
    markerRef.current?.remove();
    markerRef.current = null;
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
      const map = leaflet.map(elRef.current).setView(start, hasPoint ? 15 : 12);
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
      if (hasPoint) syncPoint(lat!, lng!);
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

  // ─── sync external lat/lng (e.g. GPS button) ──────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (lat == null || lng == null) {
      clearPoint();
      return;
    }
    syncPoint(lat, lng);
    mapRef.current.panTo([lat, lng]);
  }, [lat, lng]);

  return (
    <div
      ref={elRef}
      className={className}
      style={{ height: 260, width: "100%", borderRadius: 12, zIndex: 0 }}
    />
  );
}
