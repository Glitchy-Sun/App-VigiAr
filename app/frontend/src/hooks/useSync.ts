import { useCallback, useEffect, useState } from "react";
import { localDB, PendingVisita } from "../db/localdb";
import { api, ApiError } from "../api/client";
import { useNetwork } from "./useNetwork";

interface SyncResult {
  aceitas: number;
  duplicadas: number;
  falhas: number;
}

export function useSync() {
  const online = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPendingCount(await localDB.count());
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  const sync = useCallback(async () => {
    setLastError(null);
    const items: PendingVisita[] = await localDB.list();
    if (items.length === 0) {
      setLastResult({ aceitas: 0, duplicadas: 0, falhas: 0 });
      return { aceitas: 0, duplicadas: 0, falhas: 0 };
    }
    setSyncing(true);
    try {
      const payload = {
        visitas: items.map((v) => ({
          client_id: v.client_id,
          status: v.status,
          coordenadas: v.coordenadas ?? undefined,
          gps_precisao: v.gps_precisao ?? undefined,
          gps_disponivel: v.gps_disponivel,
          setor_manual: v.setor_manual ?? undefined,
          bairro: v.bairro ?? undefined,
          focos: v.focos,
          observacoes: v.observacoes,
          registrado_em: v.registrado_em,
        })),
      };
      const res = await api<{
        aceitas: number;
        duplicadas: number;
        falhas: number;
        detalhes: { client_id: string; status: string }[];
      }>("/sync", { method: "POST", body: payload, timeoutMs: 30000 });
      const okIds = res.detalhes
        .filter((d) => d.status === "aceita" || d.status === "duplicada")
        .map((d) => d.client_id);
      await localDB.removeByClientIds(okIds);
      setLastResult({ aceitas: res.aceitas, duplicadas: res.duplicadas, falhas: res.falhas });
      await refresh();
      return res;
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Falha de rede";
      setLastError(msg);
      throw e;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  // Auto-sync when going online
  useEffect(() => {
    if (online && pendingCount > 0 && !syncing) {
      void sync().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return { online, pendingCount, syncing, lastResult, lastError, sync, refresh };
}