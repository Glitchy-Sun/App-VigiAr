import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { api } from "../src/api/client";
import { COLORS, RADIUS, SPACING } from "../src/theme";
import MapHeatmap from "../src/components/MapHeatmap";

interface Stats {
  total_visitas: number;
  imoveis_visitados: number;
  imoveis_fechados: number;
  focos_total: number;
  focos_por_tipo: { tipo: string; total: number }[];
  agentes_ativos: number;
  taxa_fechamento: number;
}

interface ZonaRisco {
  bairro: string;
  fechadas: number;
  visitas: number;
  focos: number;
  risco_score: number;
  nivel: "alto" | "medio" | "baixo";
}

interface HeatmapResponse {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: {
      id: string;
      status: "visitada" | "fechada";
      bairro?: string | null;
      focos_count: number;
      agente?: string;
      registrado_em?: string | null;
      coordenadas: [number, number];
    };
  }[];
}

const TIPOS = ["todos", "calha", "pneu", "caixa_dagua", "vasos", "lixo", "outros"] as const;
type Tipo = (typeof TIPOS)[number];

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse>({ type: "FeatureCollection", features: [] });
  const [zonas, setZonas] = useState<ZonaRisco[]>([]);
  const [bairros, setBairros] = useState<string[]>([]);
  const [filtroBairro, setFiltroBairro] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<Tipo>("todos");
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState("Alerta: foco de dengue na sua região. Elimine focos de água parada e procure a UBS se houver sintomas.");
  const [dispatching, setDispatching] = useState<string | null>(null);

  // Redirect non-gestor away
  useEffect(() => {
    if (user && user.role !== "gestor") {
      router.replace("/home");
    } else if (!user) {
      router.replace("/login");
    }
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = {
        bairro: filtroBairro === "todos" ? undefined : filtroBairro,
        tipo: filtroTipo === "todos" ? undefined : filtroTipo,
      };
      const [s, h, z, bs] = await Promise.all([
        api<Stats>("/dashboard/stats", { query: q }),
        api<HeatmapResponse>("/dashboard/heatmap", { query: q }),
        api<ZonaRisco[]>("/dashboard/zonas-risco"),
        api<string[]>("/bairros"),
      ]);
      setStats(s);
      setHeatmap(h);
      setZonas(z);
      setBairros(bs);
    } catch (e) {
      console.error("dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  }, [filtroBairro, filtroTipo]);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh a cada 5s para atender ao KPI de latência < 5s
  useEffect(() => {
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const dispatchAlert = useCallback(async (bairro: string) => {
    setDispatching(bairro);
    try {
      const res = await api<{ destinatarios_estimados: number; canal: string }>("/dashboard/alertas", {
        method: "POST",
        body: { bairro, canal: "sms", mensagem: alertMsg },
      });
      const ok = `Alerta disparado (MOCK) para ${res.destinatarios_estimados} moradores em ${bairro}.`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(ok);
      } else {
        Alert.alert("Alerta enviado", ok);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDispatching(null);
    }
  }, [alertMsg]);

  const kpiCards = useMemo(() => {
    if (!stats) return null;
    return (
      <View style={styles.kpiRow}>
        <KPI label="Total de Visitas" value={stats.total_visitas} icon="clipboard-check-outline" color={COLORS.primary} />
        <KPI label="Imóveis Visitados" value={stats.imoveis_visitados} icon="home-search-outline" color={COLORS.visitado} />
        <KPI label="Imóveis Fechados" value={stats.imoveis_fechados} icon="lock-outline" color={COLORS.fechado} />
        <KPI label="Focos Encontrados" value={stats.focos_total} icon="bug-outline" color={COLORS.danger} />
        <KPI label="Agentes Ativos" value={stats.agentes_ativos} icon="account-group-outline" color="#0F172A" />
        <KPI label="Taxa Fechamento" value={`${stats.taxa_fechamento}%`} icon="chart-donut" color={COLORS.fechado} />
      </View>
    );
  }, [stats]);

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandSmall}>SaúdeFoco · Painel do Gestor</Text>
            <Text style={styles.title}>Vigilância de Endemias</Text>
            <Text style={styles.subtitle}>Olá, {user.nome} — {user.setor}</Text>
          </View>
          <Pressable
            testID="logout-btn"
            onPress={async () => { await logout(); router.replace("/login"); }}
            style={styles.logoutBtn}
          >
            <MaterialIcons name="logout" size={18} color={COLORS.textPrimary} />
            <Text style={styles.logoutText}>SAIR</Text>
          </Pressable>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>FILTRAR:</Text>
          <View style={styles.filterChipsRow}>
            <Pressable
              testID="filter-bairro-todos"
              onPress={() => setFiltroBairro("todos")}
              style={[styles.chip, filtroBairro === "todos" && styles.chipActive]}
            >
              <Text style={[styles.chipText, filtroBairro === "todos" && styles.chipTextActive]}>Todos bairros</Text>
            </Pressable>
            {bairros.map((b) => (
              <Pressable
                key={b}
                testID={`filter-bairro-${b}`}
                onPress={() => setFiltroBairro(b)}
                style={[styles.chip, filtroBairro === b && styles.chipActive]}
              >
                <Text style={[styles.chipText, filtroBairro === b && styles.chipTextActive]}>{b}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>TIPO:</Text>
          <View style={styles.filterChipsRow}>
            {TIPOS.map((t) => (
              <Pressable
                key={t}
                testID={`filter-tipo-${t}`}
                onPress={() => setFiltroTipo(t)}
                style={[styles.chip, filtroTipo === t && styles.chipActive]}
              >
                <Text style={[styles.chipText, filtroTipo === t && styles.chipTextActive]}>
                  {t === "todos" ? "Todos" : t.replace("_", " ")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* KPIs */}
        {kpiCards}

        {/* Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mapa de Calor — Focos</Text>
          <Text style={styles.sectionHint}>
            {heatmap.features.length} pontos · 🔴 com focos · 🟢 sem focos · 🟠 imóvel fechado
          </Text>
          <View style={{ height: 12 }} />
          <MapHeatmap geojson={heatmap} />
        </View>

        {/* Zonas de risco */}
        <View style={styles.section}>
          <View style={styles.alertHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Zonas de Alto Risco</Text>
              <Text style={styles.sectionHint}>Bairros priorizados por imóveis fechados + focos</Text>
            </View>
          </View>

          <View style={styles.alertMsgWrap}>
            <Text style={styles.filterLabel}>MENSAGEM DO ALERTA (SMS/WhatsApp)</Text>
            <TextInput
              testID="alert-message"
              value={alertMsg}
              onChangeText={setAlertMsg}
              multiline
              style={styles.alertInput}
            />
          </View>

          {loading && zonas.length === 0 ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
          ) : zonas.length === 0 ? (
            <Text style={styles.empty}>Sem dados suficientes para ranquear zonas.</Text>
          ) : (
            <View style={styles.zonasList}>
              {zonas.map((z) => (
                <View key={z.bairro} style={styles.zonaRow} testID={`zona-${z.bairro}`}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.zonaName}>{z.bairro}</Text>
                      <View
                        style={[
                          styles.nivelBadge,
                          z.nivel === "alto" ? { backgroundColor: COLORS.dangerSoft, borderColor: COLORS.danger } :
                          z.nivel === "medio" ? { backgroundColor: COLORS.fechadoSoft, borderColor: COLORS.fechado } :
                          { backgroundColor: COLORS.visitadoSoft, borderColor: COLORS.visitado },
                        ]}
                      >
                        <Text
                          style={[
                            styles.nivelText,
                            z.nivel === "alto" ? { color: COLORS.dangerText } :
                            z.nivel === "medio" ? { color: COLORS.fechadoText } :
                            { color: COLORS.visitadoText },
                          ]}
                        >
                          {z.nivel.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.zonaMeta}>
                      {z.visitas} visitas · {z.fechadas} fechados · {z.focos} focos · score {z.risco_score}
                    </Text>
                  </View>
                  <Pressable
                    testID={`alerta-btn-${z.bairro}`}
                    disabled={dispatching === z.bairro}
                    onPress={() => dispatchAlert(z.bairro)}
                    style={({ pressed }) => [
                      styles.alertBtn,
                      dispatching === z.bairro && { opacity: 0.6 },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <MaterialCommunityIcons name="message-alert-outline" size={18} color="#fff" />
                    <Text style={styles.alertBtnText}>
                      {dispatching === z.bairro ? "ENVIANDO..." : "DISPARAR ALERTA"}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.footer}>SaúdeFoco · MVP · {new Date().getFullYear()} · MOCK SMS/WhatsApp</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function KPI({ label, value, icon, color }: { label: string; value: number | string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <View style={styles.kpiCard} testID={`kpi-${label}`}>
      <MaterialCommunityIcons name={icon} size={26} color={color} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, gap: 16, maxWidth: 1280, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  brandSmall: { color: COLORS.primary, fontWeight: "900", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" },
  title: { fontSize: 32, fontWeight: "900", color: "#0F172A", letterSpacing: -1, marginTop: 4 },
  subtitle: { color: "#475569", fontWeight: "600", marginTop: 4, fontSize: 14 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 36,
    borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  logoutText: { fontWeight: "900", fontSize: 12, letterSpacing: 1.5, color: COLORS.textPrimary },
  filterRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 4 },
  filterLabel: { fontWeight: "900", fontSize: 11, color: "#475569", letterSpacing: 1.5 },
  filterChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, height: 32, borderRadius: 999, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontWeight: "700", fontSize: 12, color: "#0F172A", textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiCard: {
    flexGrow: 1, flexBasis: 180, minHeight: 110, padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF", justifyContent: "space-between",
  },
  kpiValue: { fontSize: 32, fontWeight: "900", color: "#0F172A", letterSpacing: -1, marginTop: 6 },
  kpiLabel: { fontSize: 12, fontWeight: "800", color: "#475569", letterSpacing: 0.5, marginTop: 4, textTransform: "uppercase" },
  section: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: "#CBD5E1", marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A", letterSpacing: -0.5 },
  sectionHint: { color: "#475569", fontSize: 13, marginTop: 2, fontWeight: "500" },
  alertHeader: { flexDirection: "row", alignItems: "center" },
  alertMsgWrap: { marginTop: 12, gap: 6 },
  alertInput: { minHeight: 64, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: RADIUS.md, padding: 12, fontSize: 13, color: "#0F172A", backgroundColor: "#F8FAFC", textAlignVertical: "top" },
  zonasList: { marginTop: 12, gap: 8 },
  zonaRow: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 14,
    borderRadius: RADIUS.md, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
  },
  zonaName: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  zonaMeta: { fontSize: 12, color: "#475569", marginTop: 4, fontWeight: "600" },
  nivelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  nivelText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  alertBtn: {
    height: 40, paddingHorizontal: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.danger,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  alertBtnText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  empty: { color: "#64748B", fontSize: 14, textAlign: "center", padding: 24 },
  footer: { textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 24, fontWeight: "600" },
});
