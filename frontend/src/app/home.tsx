import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useSync } from "../hooks/useSync";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { online, pendingCount, syncing, sync, lastResult, lastError } = useSync();

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top", "left", "right"]}>
      <View testID= "sync-bar" style={[styles.syncBar, { backgroundColor: online ? COLORS.syncOnline : COLORS.syncOffline }]}>
        <MaterialCommunityIcons name={online ? "wifi" : "wifi-off"} size={14} color= "#fff" />
        <Text style={styles.syncText}>{online ? "ONLINE" : "OFFLINE"}</Text>
        {pendingCount > 0 ? <Text style={styles.syncText}>• {pendingCount} pendente(s)</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>Olá, {user.nome.split(" ")[0]}</Text>
            <Text style={styles.role}>{user.matricula} • {user.setor}</Text>
          </View>
          <Pressable
            testID= "logout-btn"
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
            style={styles.iconBtn}
          >
            <MaterialIcons name= "logout" size={22} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue} testID= "pending-count">{pendingCount}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary }]}>
            <MaterialIcons name= "health-and-safety" size={28} color={COLORS.primary} />
            <Text style={[styles.statLabel, { color: COLORS.primary, marginTop: 4 }]}>Em campo</Text>
          </View>
        </View>

        {lastError ? (
          <View style={styles.errorBox}>
            <MaterialIcons name= "error-outline" size={18} color={COLORS.dangerText} />
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        ) : null}
        {lastResult && lastResult.aceitas + lastResult.duplicadas > 0 ? (
          <View style={styles.okBox} testID= "sync-result">
            <MaterialIcons name= "check-circle-outline" size={18} color={COLORS.visitadoText} />
            <Text style={styles.okText}>
              Sincronizado: {lastResult.aceitas} novo(s), {lastResult.duplicadas} já existia(m).
            </Text>
          </View>
        ) : null}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Action zone — botões grandes na metade inferior */}
      <View style={styles.actionZone}>
        <Pressable
          testID= "open-pendentes"
          onPress={() => router.push("/pendentes")}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name= "list-alt" size={22} color={COLORS.textPrimary} />
          <Text style={styles.secondaryText}>VER PENDENTES ({pendingCount})</Text>
        </Pressable>

        <Pressable
          testID= "sync-btn"
          onPress={() => sync().catch(() => undefined)}
          disabled={syncing || pendingCount === 0}
          style={({ pressed }) => [
            styles.secondaryBtn,
            (syncing || pendingCount === 0) && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <MaterialCommunityIcons name= "cloud-upload-outline" size={22} color={COLORS.textPrimary} />
          <Text style={styles.secondaryText}>{syncing ? "SINCRONIZANDO..." : "SINCRONIZAR AGORA"}</Text>
        </Pressable>

        <Pressable
          testID= "open-registro"
          onPress={() => router.push("/registro")}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnActive]}
        >
          <MaterialIcons name="add-circle-outline" size={32} color= "#fff" />
          <Text style={styles.primaryText}>NOVO REGISTRO</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  syncBar: {
    height: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  syncText: { color: "#fff", fontWeight: "800", letterSpacing: 1.5, fontSize: 11, textTransform: "uppercase" },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.md },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.lg },
  greet: { fontSize: 26, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -0.5 },
  role: { fontSize: 13, color: COLORS.textMuted, fontWeight: "700", marginTop: 2 },
  iconBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg,
  },
  statsRow: { flexDirection: "row", gap: SPACING.md },
  statCard: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, minHeight: 92, justifyContent: "center", alignItems: "center",
  },
  statValue: { fontSize: 40, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -1 },
  statLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, color: COLORS.textMuted, textTransform: "uppercase" },
  errorBox: {
    marginTop: SPACING.md, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.dangerSoft,
    flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: COLORS.danger,
  },
  errorText: { color: COLORS.dangerText, fontWeight: "700", flex: 1 },
  okBox: {
    marginTop: SPACING.md, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.visitadoSoft,
    flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: COLORS.visitado,
  },
  okText: { color: COLORS.visitadoText, fontWeight: "700", flex: 1 },
  actionZone: {
    padding: SPACING.lg, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  primaryBtn: {
    height: 84, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12,
  },
  primaryBtnActive: { backgroundColor: COLORS.primaryActive },
  primaryText: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  secondaryBtn: {
    height: 56, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.bg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  secondaryText: { fontSize: 15, fontWeight: "900", letterSpacing: 1, color: COLORS.textPrimary },
});
