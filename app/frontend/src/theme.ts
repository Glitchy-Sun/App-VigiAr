"/ Centralized color/spacing tokens — derived from /app/design_guidelines.json"
export const COLORS = {
  // Mobile (high-contrast, sunlight-safe)
  bg: "#FFFFFF",
  surface: "#F3F4F6",
  textPrimary: "#000000",
  textSecondary: "#111827",
  textMuted: "#4B5563",
  border: "#9CA3AF",
  borderStrong: "#000000",

  primary: "#1D4ED8",
  primaryActive: "#1E3A8A",
  primarySoft: "#EFF6FF",

  visitado: "#16A34A",
  visitadoSoft: "#DCFCE7",
  visitadoText: "#166534",

  fechado: "#D97706",
  fechadoSoft: "#FEF3C7",
  fechadoText: "#92400E",

  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  dangerText: "#991B1B",

  syncOnline: "#16A34A",
  syncOffline: "#4B5563",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
