import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
// Dynamically require expo-location so TypeScript/TS server won't fail when
// the module or its types are not available in some environments.
// Keep Location as `any` to avoid type errors when the package is missing.
let Location: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Location = require("expo-location");
} catch {
  Location = {};
}

export interface CapturedLocation {
  coordenadas: [number, number] | null; // [lng, lat]
  precisao: number | null;
  obtido_em: string | null;
  fonte: "live" | "last_known" | "none";
}

export interface LocationState extends CapturedLocation {
  permissao: "granted" | "denied" | "undetermined";
  carregando: boolean;
  erro: string | null;
  recapturar: () => Promise<void>;
}

/** Captures GPS coordinates passively, with graceful fallback. */
export function useLocation(autoStart = true): LocationState {
  const [state, setState] = useState<CapturedLocation>({
    coordenadas: null,
    precisao: null,
    obtido_em: null,
    fonte: "none",
  });
  const [permissao, setPermissao] = useState<LocationState["permissao"]>("undetermined");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const capture = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      if (Platform.OS === "web") {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          throw new Error("Geolocalização não suportada neste navegador");
        }
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!mountedRef.current) return resolve();
              setPermissao("granted");
              setState({
                coordenadas: [pos.coords.longitude, pos.coords.latitude],
                precisao: pos.coords.accuracy,
                obtido_em: new Date().toISOString(),
                fonte: "live",
              });
              resolve();
            },
            (err) => {
              if (!mountedRef.current) return resolve();
              setPermissao(err.code === 1 ? "denied" : "undetermined");
              setErro(err.message || "Falha ao capturar GPS");
              resolve();
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
          );
        });
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissao(status === "denied" ? "denied" : "undetermined");
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last) {
          setState({
            coordenadas: [last.coords.longitude, last.coords.latitude],
            precisao: last.coords.accuracy ?? null,
            obtido_em: new Date(last.timestamp).toISOString(),
            fonte: "last_known",
          });
        }
        setErro("Permissão de GPS negada");
        return;
      }
      setPermissao("granted");
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setState({
          coordenadas: [pos.coords.longitude, pos.coords.latitude],
          precisao: pos.coords.accuracy ?? null,
          obtido_em: new Date(pos.timestamp).toISOString(),
          fonte: "live",
        });
      } catch {
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last) {
          setState({
            coordenadas: [last.coords.longitude, last.coords.latitude],
            precisao: last.coords.accuracy ?? null,
            obtido_em: new Date(last.timestamp).toISOString(),
            fonte: "last_known",
          });
        } else {
          setErro("GPS indisponível");
        }
      }
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao capturar GPS");
    } finally {
      if (mountedRef.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (autoStart) void capture();
  }, [autoStart, capture]);

  return { ...state, permissao, carregando, erro, recapturar: capture };
}
