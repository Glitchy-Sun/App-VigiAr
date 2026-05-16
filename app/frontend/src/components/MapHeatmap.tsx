import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../theme";

// Native platforms: render a simple summary card instead of an interactive Leaflet map.
export interface HeatmapPoint {
  id: string;
  status: "visitada" | "fechada";
  coordenadas: [number, number];
  bairro?: string | null;
  focos_count: number;
}

export interface MapHeatmapProps {
  geojson: { features: { properties: HeatmapPoint; geometry: { coordinates: [number, number] } }[] };
}

export default function MapHeatmap({ geojson }: MapHeatmapProps) {
  const total = geojson.features.length;
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="map-marker-radius" size={48} color={COLORS.primary} />
      <Text style={styles.title}>Mapa de Calor</Text>
      <Text style={styles.value}>{total}</Text>
      <Text style={styles.sub}>pontos georreferenciados</Text>
      <Text style={styles.hint}>(Visualização completa no navegador web)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 320, padding: 24, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", gap: 6,
  },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  value: { fontSize: 48, fontWeight: "900", color: COLORS.primary, marginTop: 8, letterSpacing: -1 },
  sub: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 13 },
  hint: { color: COLORS.textMuted, fontWeight: "500", fontSize: 11, marginTop: 8 },
});
