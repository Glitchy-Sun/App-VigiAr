import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS } from "../theme";

export interface HeatmapPoint {
  id: string;
  status: "visitada" | "fechada";
  bairro?: string | null;
  focos_count: number;
  agente?: string;
}

export interface MapHeatmapProps {
  geojson: { features: { properties: HeatmapPoint; geometry: { coordinates: [number, number] } }[] };
}

// Recife default center
const DEFAULT_CENTER: [number, number] = [-8.0584, -34.8848];

let leafletLoading: Promise<void> | null = null;
function ensureLeaflet(): Promise<void> {
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    if ((window as unknown as { L?: unknown }).L) return resolve();
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.crossOrigin = "";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.crossOrigin = "";
    s.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
      s2.crossOrigin = "";
      s2.onload = () => resolve();
      s2.onerror = () => reject(new Error("Falha ao carregar leaflet.heat"));
      document.head.appendChild(s2);
    };
    s.onerror = () => reject(new Error("Falha ao carregar leaflet"));
    document.head.appendChild(s);
  });
  return leafletLoading;
}

interface LeafletMapApi {
  setView: (c: [number, number], z: number) => LeafletMapApi;
  remove: () => void;
  addLayer: (l: unknown) => LeafletMapApi;
  removeLayer: (l: unknown) => LeafletMapApi;
}
interface LeafletGlobal {
  map: (el: HTMLElement) => LeafletMapApi;
  tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (m: LeafletMapApi) => unknown };
  layerGroup: () => { addTo: (m: LeafletMapApi) => unknown; clearLayers: () => void; addLayer: (l: unknown) => unknown };
  circleMarker: (latlng: [number, number], opts: Record<string, unknown>) => { bindPopup: (s: string) => unknown };
  heatLayer?: (pts: [number, number, number][], opts: Record<string, unknown>) => unknown;
}

export default function MapHeatmap({ geojson }: MapHeatmapProps) {
  const ref = useRef<View | null>(null);
  const mapRef = useRef<LeafletMapApi | null>(null);
  const heatRef = useRef<unknown>(null);
  const markersRef = useRef<{ clearLayers: () => void; addLayer: (l: unknown) => unknown; addTo: (m: LeafletMapApi) => unknown } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureLeaflet();
        if (cancelled) return;
        const L = (window as unknown as { L: LeafletGlobal }).L;
        // ref.current is a View on RNW which maps to a div
        const node = ref.current as unknown as HTMLElement | null;
        if (!node) return;
        if (!mapRef.current) {
          const m = L.map(node).setView(DEFAULT_CENTER, 13);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(m);
          mapRef.current = m;
          markersRef.current = L.layerGroup();
          markersRef.current.addTo(m);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erro ao iniciar mapa");
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* noop */ }
        mapRef.current = null;
        heatRef.current = null;
        markersRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = typeof window !== "undefined" ? (window as unknown as { L?: LeafletGlobal }).L : undefined;
    const m = mapRef.current;
    if (!L || !m) return;

    // Update heat layer
    if (heatRef.current) {
      m.removeLayer(heatRef.current);
      heatRef.current = null;
    }
    const heatPoints: [number, number, number][] = geojson.features.map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const intensity = Math.min(1, 0.3 + (f.properties.focos_count || 0) * 0.25);
      return [lat, lng, intensity];
    });
    if (L.heatLayer && heatPoints.length > 0) {
      const h = L.heatLayer(heatPoints, { radius: 28, blur: 22, maxZoom: 16, max: 1.0 });
      m.addLayer(h);
      heatRef.current = h;
    }

    // Update markers
    if (markersRef.current) {
      markersRef.current.clearLayers();
      for (const f of geojson.features) {
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties;
        const color = p.status === "fechada" ? "#D97706" : p.focos_count > 0 ? "#DC2626" : "#16A34A";
        const cm = L.circleMarker([lat, lng], {
          radius: 7, color: "#fff", weight: 2, fillColor: color, fillOpacity: 0.95,
        });
        cm.bindPopup(
          `<div style="font-family:system-ui;font-size:13px">
            <strong>${p.status === "fechada" ? "🔒 Fechado" : "✅ Visitado"}</strong><br/>
            Bairro: ${p.bairro ?? "—"}<br/>
            Focos: ${p.focos_count}<br/>
            Agente: ${p.agente ?? "—"}
          </div>`,
        );
        markersRef.current.addLayer(cm);
      }
    }
  }, [geojson]);

  return (
    <View style={styles.wrap}>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <View ref={(r) => { ref.current = r; }} style={styles.map} testID="leaflet-map" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", height: 540, borderRadius: RADIUS.lg, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  map: { width: "100%", height: "100%" } as object,
  err: { color: COLORS.dangerText, padding: 12, fontWeight: "700" },
});
