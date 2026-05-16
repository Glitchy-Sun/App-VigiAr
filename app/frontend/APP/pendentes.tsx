import React, { useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { localDB, PendingVisita } from "../src/db/localdb";
import { useSync } from "../src/hooks/useSync";
import { COLORS, RADIUS, SPACING } from "../src/theme";

export default function PendentesScreen() {
  const [items, setItems] = useState<PendingVisita[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { sync, syncing, online } = useSync();

  const load = async () => {
    const list = await localDB.list();
    setItems(list);
  };

  useEffect(() => {
    void load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Registros Pendentes</Text>
      </View>

      <FlatList
        testID="pendentes-list"
        data={items}
        keyExtractor={(item) => item.client_id}
        contentContainerStyle={{ padding: SPACING.lg, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="check-circle-outline" size={48} color={COLORS.visitado} />
            <Text style={styles.emptyTitle}>Tudo sincronizado!</Text>
            <Text style={styles.emptyText}>Não há registros aguardando envio.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isVis = item.status === "visitada";
          return (
            <View style={[styles.card, { borderColor: isVis ? COLORS.visitado : COLORS.fechado }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialIcons
                    name={isVis ? "check-circle" : "lock-outline"}
                    size={22}
                    color={isVis ? COLORS.visitado : COLORS.fechado}
                  />
                  <Text style={[styles.cardTitle, { color: isVis ? COLORS.visitadoText : COLORS.fechadoText }]}>
                    {isVis ? "VISITADO" : "FECHADO"}
                  </Text>
                </View>
                {item.coordenadas ? (
                  <Text style={styles.cardMeta}>📍 {item.coordenadas[1].toFixed(5)}, {item.coordenadas[0].toFixed(5)}</Text>
                ) : (
                  <Text style={styles.cardMeta}>📍 Setor: {item.setor_manual ?? "—"}</Text>
                )}
                {item.focos.length > 0 ? (
                  <Text style={styles.cardMeta}>🦟 {item.focos.length} foco(s): {item.focos.map((f) => f.tipo_criadouro).join(", ")}</Text>
                ) : null}
                <Text style={styles.cardTime}>{new Date(item.registrado_em).toLocaleString("pt-BR")}</Text>
              </View>
            </View>
          );
        }}
      />

      {items.length > 0 ? (
        <View style={styles.bottomBar}>
          <Pressable
            testID="sync-now-btn"
            onPress={() => sync().catch(() => undefined)}
            disabled={syncing || !online}
            style={({ pressed }) => [
              styles.primaryBtn,
              (!online || syncing) && { opacity: 0.5 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <MaterialIcons name="cloud-upload" size={26} color="#fff" />
            <Text style={styles.primaryText}>
              {!online ? "AGUARDANDO REDE" : syncing ? "SINCRONIZANDO..." : `SINCRONIZAR ${items.length}`}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg,
  },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -0.5 },
  card: {
    padding: 14, borderRadius: RADIUS.md, borderWidth: 2, backgroundColor: COLORS.surface,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  cardTitle: { fontWeight: "900", letterSpacing: 1, fontSize: 13 },
  cardMeta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, fontWeight: "500" },
  cardTime: { color: COLORS.textMuted, fontSize: 11, marginTop: 6, fontWeight: "600" },
  empty: { alignItems: "center", padding: SPACING.xl, gap: 8, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  bottomBar: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg },
  primaryBtn: {
    height: 64, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12,
  },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 1 },
});
