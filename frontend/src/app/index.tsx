import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme";

export default function Index() {
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role === "gestor") router.replace("/dashboard");
    else router.replace("/home");
  }, [loading, user]);

  return (
    <View style={styles.container} testID="boot-splash">
      <Text style={styles.brand}>VigiAr</Text>
      <Text style={styles.sub}>Vigilância de Endemias</Text>
      <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  brand: { fontSize: 36, fontWeight: "900", color: COLORS.primary, letterSpacing: -1 },
  sub: { marginTop: 8, fontSize: 14, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 2, textTransform: "uppercase" },
});
