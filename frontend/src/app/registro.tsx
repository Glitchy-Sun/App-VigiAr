import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CriadouroTipo, localDB, PendingVisita } from "../db/localdb";
import { useLocation } from "../hooks/useLocation";
import { COLORS, RADIUS, SPACING } from "../theme";

type Step = "status" | "focos" | "confirmar";

function uuid(): string {
  // RFC4122 v4
  const cryptoRef: Crypto | undefined =
    typeof globalThis !== "undefined" && (globalThis as { crypto?: Crypto }).crypto
      ? (globalThis as { crypto?: Crypto }).crypto
      : undefined;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") return cryptoRef.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface CriadouroOpt {
  key: CriadouroTipo;
  label: string;
  icon: React.ReactNode;
}

const CRIADOUROS: CriadouroOpt[] = [
  { key: "calha", label: "Calha", icon: <MaterialCommunityIcons name= "home-roof" size={26} color={COLORS.textPrimary} /> },
  { key: "pneu", label: "Pneu", icon: <MaterialCommunityIcons name= "tire" size={26} color={COLORS.textPrimary} /> },
  { key: "caixa_dagua", label: "Caixa d'água", icon: <MaterialCommunityIcons name= "water" size={26} color={COLORS.textPrimary} /> },
  { key: "vasos", label: "Vasos / Plantas", icon: <MaterialCommunityIcons name= "flower" size={26} color={COLORS.textPrimary} /> },
  { key: "lixo", label: "Lixo / Entulho", icon: <MaterialCommunityIcons name= "delete" size={26} color={COLORS.textPrimary} /> },
  { key: "outros", label: "Outros", icon: <MaterialIcons name= "more-horiz" size={26} color={COLORS.textPrimary} /> },
];

const SETORES_FALLBACK = [ "Boa Viagem", "Pina", "Casa Forte", "Santo Amaro", "Recife Antigo" ];

export default function RegistroScreen() {
  const loc = useLocation(true);
  const [step, setStep] = useState<Step>("status");
  const [status, setStatus] = useState<"visitada" | "fechada" | null>(null);
  const [focos, setFocos] = useState<CriadouroTipo[]>([]);
  const [setorManual, setSetorManual] = useState<string | null>(null);
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleFoco = (k: CriadouroTipo) => {
    setFocos((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const gpsOk = loc.coordenadas != null && (loc.precisao == null || loc.precisao < 50);

  const headerSub = useMemo(() => {
    if (loc.carregando) return "Capturando GPS...";
    if (loc.coordenadas) {
      const [lng, lat] = loc.coordenadas;
      const prec = loc.precisao != null ? `±${Math.round(loc.precisao)}m` : "";
      return `GPS ${loc.fonte === "live" ? "ativo" : "último conhecido"} ${prec} • ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return "GPS indisponível — informe o setor manualmente";
  }, [loc]);

  const save = async (closedShortcut = false) => {
    const finalStatus = closedShortcut ? "fechada" : status;
    if (!finalStatus) {
      Alert.alert("Selecione o status", "Marque [Visitado] ou [Fechado].");
      return;
    }
    setSaving(true);
    try {
      const visita: PendingVisita = {
        client_id: uuid(),
        status: finalStatus,
        coordenadas: loc.coordenadas,
        gps_precisao: loc.precisao,
        gps_disponivel: loc.coordenadas != null && loc.fonte === "live",
        setor_manual: setorManual,
        bairro: setorManual,
        focos: finalStatus === "visitada" ? focos.map((t) => ({ tipo_criadouro: t })) : [],
        observacoes: obs.trim() || undefined,
        registrado_em: new Date().toISOString(),
      };
      await localDB.enqueue(visita);
      router.replace("/home");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable testID= "back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name= "arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Novo Registro</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{headerSub}</Text>
        </View>
        <View
          testID= "gps-indicator"
          style={[
            styles.gpsChip,
            { backgroundColor: gpsOk ? COLORS.visitadoSoft : COLORS.fechadoSoft, borderColor: gpsOk ? COLORS.visitado : COLORS.fechado },
          ]}
        >
          <MaterialIcons name={gpsOk ? "gps-fixed" : "gps-off"} size={16} color={gpsOk ? COLORS.visitadoText : COLORS.fechadoText} />
          <Text style={{ fontWeight: "800", fontSize: 11, color: gpsOk ? COLORS.visitadoText : COLORS.fechadoText }}>
            {gpsOk ? "OK" : "FRACO"}
          </Text>
        </View>
      </View>

      {!gpsOk && loc.coordenadas == null ? (
        <View style={styles.warnBox} testID= "gps-warning">
          <MaterialIcons name= "info-outline" size={18} color={COLORS.fechadoText} />
          <Text style={styles.warnText}>
            GPS indisponível. Selecione o setor manualmente para registrar a visita.
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step 1: status */}
        <Text style={styles.sectionLabel}>1. STATUS DO IMÓVEL</Text>
        <View style={styles.statusRow}>
          <Pressable
            testID= "status-visitada "
            onPress={() => { setStatus("visitada"); setStep("focos"); }}
            style={[
              styles.statusBtn,
              status === "visitada" && { backgroundColor: COLORS.visitadoSoft, borderColor: COLORS.visitado },
            ]}
          >
            <MaterialIcons name= "check-circle" size={36} color={COLORS.visitado} />
            <Text style={[styles.statusText, { color: COLORS.visitadoText }]}>VISITADO</Text>
          </Pressable>
          <Pressable
            testID= "status-fechada"
            onPress={() => { setStatus("fechada"); }}
            style={[
              styles.statusBtn,
              status === "fechada" && { backgroundColor: COLORS.fechadoSoft, borderColor: COLORS.fechado },
            ]}
          >
            <MaterialIcons name= "lock-outline" size={36} color={COLORS.fechado} />
            <Text style={[styles.statusText, { color: COLORS.fechadoText }]}>FECHADO</Text>
          </Pressable>
        </View>

        {/* Step 2: focos (apenas se visitada) */}
        {status === "visitada" ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>2. FOCOS / CRIADOUROS</Text>
            <Text style={styles.helper}>Toque nos tipos encontrados. Deixe vazio se não houver foco.</Text>
            <View style={styles.gridFocos}>
              {CRIADOUROS.map((c) => {
                const active = focos.includes(c.key);
                return (
                  <Pressable
                    key={c.key}
                    testID={`foco-${c.key}`}
                    onPress={() => toggleFoco(c.key)}
                    style={[styles.focoChip, active && styles.focoChipActive]}
                  >
                    {c.icon}
                    <Text style={[styles.focoText, active && { color: COLORS.primary }]}>{c.label}</Text>
                    {active ? (
                      <MaterialIcons name= "check" size={16} color={COLORS.primary} style={{ position: "absolute", top: 6, right: 6 }} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* Setor manual (fallback) */}
        {!gpsOk ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>SETOR / BAIRRO</Text>
            <View style={styles.setorRow}>
              {SETORES_FALLBACK.map((s) => (
                <Pressable
                  key={s}
                  testID={`setor-${s}`}
                  onPress={() => setSetorManual(s)}
                  style={[styles.setorChip, setorManual === s && styles.setorChipActive]}
                >
                  <Text style={[styles.setorText, setorManual === s && { color: COLORS.primary }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {/* Observações */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>OBSERVAÇÕES (opcional)</Text>
        <TextInput
          testID= "input-obs"
          value={obs}
          onChangeText={setObs}
          placeholder= "Anotações da visita..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
          style={styles.textarea}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomBar}>
        {status === "fechada" ? (
          <Pressable
            testID= "save-fechada"
            onPress={() => save(true)}
            disabled={saving}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: COLORS.fechado }, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name= "lock" size={26} color= "#fff" />
            <Text style={styles.primaryText}>CONFIRMAR FECHADO</Text>
          </Pressable>
        ) : (
          <Pressable
            testID= "save-visitada"
            onPress={() => save(false)}
            disabled={saving || !status}
            style={({ pressed }) => [
              styles.primaryBtn,
              !status && { opacity: 0.4 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <MaterialIcons name= "save" size={26} color= "#fff" />
            <Text style={styles.primaryText}>{saving ?  "SALVANDO..." : "SALVAR REGISTRO"}</Text>
          </Pressable>
        )}
      </View>
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
  subtitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", marginTop: 2 },
  gpsChip: {
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: RADIUS.pill, borderWidth: 2,
  },
  warnBox: {
    margin: SPACING.md, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.fechadoSoft,
    flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: COLORS.fechado,
  },
  warnText: { color: COLORS.fechadoText, fontWeight: "700", flex: 1, fontSize: 13 },
  content: { padding: SPACING.lg },
  sectionLabel: { fontWeight: "900", fontSize: 12, letterSpacing: 1.5, color: COLORS.textSecondary, marginBottom: SPACING.md },
  helper: { fontSize: 13, color: COLORS.textMuted, marginTop: -8, marginBottom: SPACING.md, fontWeight: "500" },
  statusRow: { flexDirection: "row", gap: 12 },
  statusBtn: {
    flex: 1, height: 110, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", gap: 6,
  },
  statusText: { fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  gridFocos: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  focoChip: {
    width: "47%", minHeight: 80, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 4,
  },
  focoChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  focoText: { fontWeight: "800", fontSize: 13, color: COLORS.textPrimary, textAlign: "center" },
  setorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  setorChip: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.pill, borderWidth: 2,
    borderColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  setorChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  setorText: { fontWeight: "800", fontSize: 13, color: COLORS.textPrimary },
  textarea: {
    minHeight: 80, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.bg,
    textAlignVertical: "top",
  },
  bottomBar: {
    padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  primaryBtn: {
    height: 76, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12,
  },
  primaryText: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 1 },
});
