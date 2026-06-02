"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type * as L from "leaflet";

type LeafletModule = typeof import("leaflet");

interface Point {
  lat: number;
  lng: number;
  label?: string;
}

interface DeliveryMapProps {
  pickup: Point | null;
  dropoff: Point | null;
  className?: string;
}

const PICKUP_COLOR = "#0EA5E9"; // sky — sotuvchi (olish)
const DROPOFF_COLOR = "#F97316"; // brand — xaridor (yetkazish)
const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];

function resolveLeaflet(mod: unknown): LeafletModule {
  const m = mod as { default?: LeafletModule } & LeafletModule;
  return m.default && typeof m.default.map === "function" ? m.default : m;
}

function pin(leaflet: LeafletModule, color: string): L.DivIcon {
  return leaflet.divIcon({
    className: "",
    html: `<svg width="28" height="38" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.4 23.8 14 24.4a1.4 1.4 0 0 0 2 0c.6-.6 14-13.9 14-24.4C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
  });
}

/**
 * Read-only delivery map: pickup (store) + dropoff (customer) pins with a
 * dashed line for direction, auto-fit to both. Turn-by-turn navigation is
 * delegated to the external maps button on the detail page. Leaflet is
 * browser-only — loaded via dynamic import inside the effect.
 */
export function DeliveryMap({ pickup, dropoff, className }: DeliveryMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const leaflet = resolveLeaflet(await import("leaflet"));
      if (cancelled || !elRef.current || mapRef.current) return;

      const map = leaflet.map(elRef.current);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);

      const pts: [number, number][] = [];
      if (pickup) {
        leaflet
          .marker([pickup.lat, pickup.lng], { icon: pin(leaflet, PICKUP_COLOR) })
          .addTo(map)
          .bindPopup(pickup.label ?? "Olish manzili");
        pts.push([pickup.lat, pickup.lng]);
      }
      if (dropoff) {
        leaflet
          .marker([dropoff.lat, dropoff.lng], { icon: pin(leaflet, DROPOFF_COLOR) })
          .addTo(map)
          .bindPopup(dropoff.label ?? "Yetkazish manzili");
        pts.push([dropoff.lat, dropoff.lng]);
      }
      if (pickup && dropoff) {
        leaflet
          .polyline(
            [
              [pickup.lat, pickup.lng],
              [dropoff.lat, dropoff.lng],
            ],
            { color: DROPOFF_COLOR, weight: 3, dashArray: "6 6", opacity: 0.7 },
          )
          .addTo(map);
      }

      if (pts.length === 2) map.fitBounds(pts, { padding: [40, 40] });
      else if (pts.length === 1) map.setView(pts[0], 15);
      else map.setView(DEFAULT_CENTER, 12);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={elRef}
      className={className}
      style={{ height: 240, width: "100%", borderRadius: 12, zIndex: 0 }}
    />
  );
}
