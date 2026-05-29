// Offline-first local queue for "visitas" pending sync.
// Storage-backed (AsyncStorage on native, localStorage on web) JSON array.
import { storage } from "../utils";

const QUEUE_KEY = "vigiar.pending.visitas";

export type CriadouroTipo = "calha" | "pneu" | "caixa_dagua" | "vasos" | "lixo" | "outros";
export type VisitaStatus = "visitada" | "fechada";

export interface PendingVisita {
  client_id: string; // UUID device-side, used as idempotency key
  status: VisitaStatus;
  coordenadas: [number, number] | null; // [lng, lat]
  gps_precisao: number | null;
  gps_disponivel: boolean;
  setor_manual: string | null;
  bairro: string | null;
  focos: { tipo_criadouro: CriadouroTipo; acao_tomada?: string }[];
  observacoes?: string;
  registrado_em: string; // ISO
}

async function readQueue(): Promise<PendingVisita[]> {
  const raw = await storage.getItem<string>(QUEUE_KEY, "");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingVisita[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingVisita[]): Promise<void> {
  await storage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export const localDB = {
  async enqueue(v: PendingVisita): Promise<void> {
    const q = await readQueue();
    q.push(v);
    await writeQueue(q);
  },
  async list(): Promise<PendingVisita[]> {
    return readQueue();
  },
  async count(): Promise<number> {
    return (await readQueue()).length;
  },
  async removeByClientIds(ids: string[]): Promise<void> {
    const set = new Set(ids);
    const q = await readQueue();
    await writeQueue(q.filter((v) => !set.has(v.client_id)));
  },
  async clear(): Promise<void> {
    await writeQueue([]);
  },
};
