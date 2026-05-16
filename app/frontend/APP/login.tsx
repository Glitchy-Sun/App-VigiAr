import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { ApiError } from "../src/api/client";
import { COLORS, RADIUS, SPACING } from "../src/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!matricula.trim() || !password) {
      setError("Informe matrícula e senha.");
      return;
    }
    setSubmitting(true);
    try {
      const u = await login(matricula.trim().toUpperCase(), password);
      router.replace(u.role === "gestor" ? "/dashboard" : "/home");
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Falha ao entrar";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <MaterialIcons name="health-and-safety" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.brand}>SaúdeFoco</Text>
          <Text style={styles.sub}>Combate ao Aedes aegypti</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>MATRÍCULA</Text>
          <TextInput
            testID="input-matricula"
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Ex.: ACE001"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: SPACING.md }]}>SENHA</Text>
          <TextInput
            testID="input-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Sua senha"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          {error ? (
            <View style={styles.errorBox} testID="login-error">
              <MaterialIcons name="error-outline" size={18} color={COLORS.dangerText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            testID="login-submit"
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [styles.submit, pressed && styles.submitActive, submitting && { opacity: 0.7 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitText}>ENTRAR</Text>
                <MaterialIcons name="arrow-forward" size={22} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
            
        <View style={styles.hint}>
          <Text style={styles.hintTitle}>Acesso de teste</Text>
          <Text style={styles.hintLine}>Agente:  ACE001 / agente123</Text>
          <Text style={styles.hintLine}>Gestor:  GESTOR001 / gestor123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: 64, paddingBottom: SPACING.lg },
  header: { alignItems: "center", marginBottom: SPACING.xl },
  logo: {
    width: 80, height: 80, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md,
    borderWidth: 2, borderColor: COLORS.primary,
  },
  brand: { fontSize: 36, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -1 },
  sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", fontSize: 12 },
  card: {
    backgroundColor: COLORS.bg, padding: SPACING.lg, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.border,
  },
  label: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: COLORS.textSecondary },
  input: {
    marginTop: 6, height: 56, borderWidth: 2, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, fontSize: 18, fontWeight: "600", color: COLORS.textPrimary, backgroundColor: COLORS.bg,
  },
  submit: {
    marginTop: SPACING.lg, height: 64, borderRadius: RADIUS.md, backgroundColor: COLORS.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  submitActive: { backgroundColor: COLORS.primaryActive },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  errorBox: {
    marginTop: SPACING.md, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.dangerSoft,
    flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: COLORS.danger,
  },
  errorText: { color: COLORS.dangerText, fontWeight: "700", flex: 1 },
  hint: {
    marginTop: SPACING.xl, padding: SPACING.md, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  hintTitle: { fontWeight: "800", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: COLORS.textSecondary, marginBottom: 6 },
  hintLine: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", color: COLORS.textSecondary, fontSize: 13 },
});
