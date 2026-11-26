// Enregistrement de l'état dans la base de la page claude.ai (capability `db`).
// Chaque table est découpée en blocs de ~180 Ko (limite : 256 Ko par document) ;
// seuls les blocs modifiés sont réécrits, puis le document `tables/meta` sert de
// validation (compte des blocs, compteurs d'id, révision).
import type { Persistence, StoreState, TableName } from "@/api/memoryBackend";

type DbError = { code: string; message: string };
interface DocSnap {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
interface DocRef {
  get(): Promise<DocSnap>;
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(next: (s: DocSnap) => void, error?: (e: DbError) => void): () => void;
}
interface DB {
  doc(path: string): DocRef;
}
declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

export type StorageStatus = "loading" | "ok" | "unavailable" | "stale" | "error";

let status: StorageStatus = "loading";
const listeners = new Set<(s: StorageStatus) => void>();
function setStatus(s: StorageStatus) {
  status = s;
  listeners.forEach((fn) => fn(s));
}
export function getStorageStatus() {
  return status;
}
export function onStorageStatus(fn: (s: StorageStatus) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const TABLES: TableName[] = ["products", "scripts", "prospects", "logs"];
const MAX_CHUNK_BYTES = 180_000;
const SESSION = Math.random().toString(36).slice(2);

interface Meta {
  counts: Record<TableName, number>;
  nextId: StoreState["nextId"];
  rev: number;
  writer: string;
}

function chunk(rows: { id: number }[]): string[] {
  const sorted = [...rows].sort((a, b) => a.id - b.id);
  const chunks: string[] = [];
  let current: string[] = [];
  let size = 2;
  for (const row of sorted) {
    const json = JSON.stringify(row);
    if (current.length && size + json.length + 1 > MAX_CHUNK_BYTES) {
      chunks.push(`[${current.join(",")}]`);
      current = [];
      size = 2;
    }
    current.push(json);
    size += json.length + 1;
  }
  if (current.length) chunks.push(`[${current.join(",")}]`);
  return chunks;
}

const chunkPath = (t: TableName, i: number) => `tables/${t}-${i}`;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if ((e as DbError)?.code !== "unavailable") throw e;
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
    return fn();
  }
}

function describe(e: unknown): Error {
  const err = e as DbError;
  if (err?.code === "quota_exceeded") {
    return new Error("Espace de stockage plein : supprime d'anciens prospects ou logs, puis réessaie.");
  }
  if (err?.code === "invalid_argument") {
    return new Error("Tu n'as pas le droit de modifier ces données (seul le propriétaire de la page peut écrire).");
  }
  return new Error("Échec de l'enregistrement : " + (err?.message ?? "erreur inconnue") + ". Réessaie.");
}

export function createArtifactPersistence(): Persistence {
  let db: DB | null = null;
  let meta: Meta | null = null;
  // contenu actuellement enregistré, par bloc : évite de réécrire ce qui n'a pas changé
  const written = new Map<string, string>();

  return {
    async load() {
      db = ((await window.claude?.use("db")) as DB | null | undefined) ?? null;
      if (!db) {
        setStatus("unavailable");
        return null;
      }
      try {
        const metaSnap = await withRetry(() => db!.doc("tables/meta").get());
        let state: StoreState | null = null;
        if (metaSnap.exists) {
          meta = metaSnap.data() as unknown as Meta;
          const loaded: Record<string, unknown[]> = {};
          for (const t of TABLES) {
            loaded[t] = [];
            const snaps = await Promise.all(
              Array.from({ length: meta.counts[t] ?? 0 }, (_, i) => withRetry(() => db!.doc(chunkPath(t, i)).get()))
            );
            snaps.forEach((snap, i) => {
              const json = (snap.data()?.rows as string | undefined) ?? "[]";
              written.set(chunkPath(t, i), json);
              loaded[t].push(...(JSON.parse(json) as unknown[]));
            });
          }
          state = { ...(loaded as unknown as Omit<StoreState, "nextId">), nextId: meta.nextId };
        }

        // un autre appareil (ou onglet) qui enregistre rend cet état périmé
        db.doc("tables/meta").onSnapshot(
          (snap) => {
            const m = snap.data() as unknown as Meta | undefined;
            // seulement une révision PLUS RÉCENTE : une copie en cache d'une visite
            // précédente ne doit pas déclencher l'alerte
            if (m && m.writer !== SESSION && m.rev > (meta?.rev ?? 0)) setStatus("stale");
          },
          () => undefined
        );

        setStatus("ok");
        return state;
      } catch (e) {
        setStatus("error");
        throw describe(e);
      }
    },

    async save(state, changed) {
      if (status === "unavailable") return;
      if (status === "stale") {
        throw new Error("Données modifiées depuis un autre appareil : recharge la page avant de continuer.");
      }
      if (!db) throw new Error("Stockage indisponible.");

      const counts = { ...(meta?.counts ?? { products: 0, scripts: 0, prospects: 0, logs: 0 }) };
      try {
        for (const t of changed) {
          const chunks = chunk(state[t] as { id: number }[]);
          for (let i = 0; i < chunks.length; i++) {
            const path = chunkPath(t, i);
            if (written.get(path) === chunks[i]) continue;
            await withRetry(() => db!.doc(path).set({ rows: chunks[i] }));
            written.set(path, chunks[i]);
          }
          for (let i = chunks.length; i < (counts[t] ?? 0); i++) {
            const path = chunkPath(t, i);
            await withRetry(() => db!.doc(path).delete());
            written.delete(path);
          }
          counts[t] = chunks.length;
        }
        const next: Meta = { counts, nextId: state.nextId, rev: (meta?.rev ?? 0) + 1, writer: SESSION };
        await withRetry(() => db!.doc("tables/meta").set(next as unknown as Record<string, unknown>));
        meta = next;
      } catch (e) {
        throw describe(e);
      }
    },
  };
}
