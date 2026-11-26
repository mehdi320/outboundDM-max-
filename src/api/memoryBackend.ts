// Implémentation navigateur de l'API (même contrat que le serveur Express +
// SQLite), utilisée par la version hébergée sur claude.ai. L'état complet vit
// en mémoire ; après chaque modification, il est enregistré via `Persistence`.
import type {
  BackupPayload,
  ContactResult,
  Log,
  NewLog,
  NewProduct,
  NewProspect,
  NewScript,
  Platform,
  Product,
  Prospect,
  Script,
  Statut,
  UpdateLog,
  UpdateProduct,
  UpdateProspect,
  UpdateScript,
} from "@shared/types";
import { PLATFORMS, STATUTS } from "@shared/types";

export interface StoreState {
  products: Product[];
  scripts: Script[];
  prospects: Prospect[];
  logs: Log[];
  nextId: { products: number; scripts: number; prospects: number; logs: number };
}

export type TableName = "products" | "scripts" | "prospects" | "logs";

export interface Persistence {
  load(): Promise<StoreState | null>;
  save(state: StoreState, changed: TableName[]): Promise<void>;
}

export function emptyState(): StoreState {
  return {
    products: [],
    scripts: [],
    prospects: [],
    logs: [],
    nextId: { products: 1, scripts: 1, prospects: 1, logs: 1 },
  };
}

// même format que datetime('now') de SQLite (UTC)
function sqlNow(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function fail(message: string): never {
  throw new Error(message);
}

const STATUT_LOG_FLAGS: Record<Statut, { reponse: boolean; close: boolean } | null> = {
  a_contacter: null,
  contacte: { reponse: false, close: false },
  repondu: { reponse: true, close: false },
  close: { reponse: true, close: true },
  ignore: null,
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// clé de dédoublonnage : les pseudos Instagram/Threads/X ne sont pas sensibles à la casse
const prospectKey = (produitId: number, pseudo: string, plateforme: Platform) =>
  `${produitId}|${pseudo.toLowerCase()}|${plateforme}`;

export function createMemoryBackend(persistence: Persistence) {
  let state = emptyState();
  const ready = persistence.load().then((loaded) => {
    if (loaded) state = loaded;
  });

  // une mutation à la fois : chaque écriture part de l'état laissé par la précédente
  let chain: Promise<unknown> = Promise.resolve();

  function read<T>(fn: (s: StoreState) => T): Promise<T> {
    return ready.then(() => clone(fn(state)));
  }

  function mutate<T>(changed: TableName[], fn: (draft: StoreState) => T): Promise<T> {
    const run = chain.then(async () => {
      await ready;
      const draft = clone(state);
      const result = fn(draft);
      await persistence.save(draft, changed);
      state = draft;
      return clone(result);
    });
    chain = run.catch(() => undefined);
    return run;
  }

  const byId = <T extends { id: number }>(rows: T[], id: number) => rows.find((r) => r.id === id);

  return {
    ready,

    products: {
      list: () => read((s) => [...s.products].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)),
      create: (data: NewProduct) =>
        mutate(["products"], (s) => {
          const nom = data.nom?.trim();
          if (!nom) fail("Le nom du produit est requis.");
          if (s.products.some((p) => p.nom === nom)) fail("Ce produit existe déjà.");
          const product: Product = { id: s.nextId.products++, nom, objectif_dm_jour: null, created_at: sqlNow() };
          s.products.push(product);
          return product;
        }),
      update: (id: number, data: UpdateProduct) =>
        mutate(["products"], (s) => {
          const p = byId(s.products, id) ?? fail("Produit introuvable.");
          const nom = data.nom !== undefined ? data.nom.trim() : p.nom;
          if (!nom) fail("Le nom du produit est requis.");
          if (s.products.some((o) => o.id !== id && o.nom === nom)) fail("Ce nom de produit existe déjà.");
          p.nom = nom;
          if (data.objectif_dm_jour !== undefined) p.objectif_dm_jour = data.objectif_dm_jour;
          return p;
        }),
      remove: (id: number) =>
        mutate(["products", "scripts", "prospects", "logs"], (s) => {
          s.products = s.products.filter((p) => p.id !== id);
          s.scripts = s.scripts.filter((x) => x.produit_id !== id);
          s.prospects = s.prospects.filter((x) => x.produit_id !== id);
          s.logs = s.logs.filter((x) => x.produit_id !== id);
        }),
    },

    scripts: {
      list: (produitId?: number) =>
        read((s) =>
          s.scripts
            .filter((x) => !produitId || x.produit_id === produitId)
            .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
        ),
      create: (data: NewScript) =>
        mutate(["scripts"], (s) => {
          const label = data.label?.trim();
          if (!data.produit_id || !label) fail("produit_id et label sont requis.");
          const script: Script = {
            id: s.nextId.scripts++,
            produit_id: data.produit_id,
            label,
            contenu: data.contenu ?? null,
            actif: true,
            created_at: sqlNow(),
          };
          s.scripts.push(script);
          return script;
        }),
      update: (id: number, data: UpdateScript) =>
        mutate(["scripts"], (s) => {
          const sc = byId(s.scripts, id) ?? fail("Script introuvable.");
          const label = data.label !== undefined ? data.label.trim() : sc.label;
          if (!label) fail("Le label est requis.");
          sc.label = label;
          if (data.contenu !== undefined) sc.contenu = data.contenu;
          if (data.actif !== undefined) sc.actif = data.actif;
          return sc;
        }),
      remove: (id: number) =>
        mutate(["scripts", "logs"], (s) => {
          s.scripts = s.scripts.filter((x) => x.id !== id);
          s.logs = s.logs.filter((l) => l.script_id !== id);
        }),
    },

    prospects: {
      list: (filters?: { produitId?: number; plateforme?: Platform; statut?: Statut }) =>
        read((s) =>
          s.prospects
            .filter(
              (p) =>
                (!filters?.produitId || p.produit_id === filters.produitId) &&
                (!filters?.plateforme || p.plateforme === filters.plateforme) &&
                (!filters?.statut || p.statut === filters.statut)
            )
            .sort((a, b) => a.date_ajout.localeCompare(b.date_ajout) || a.id - b.id)
        ),
      create: (data: NewProspect) =>
        mutate(["prospects"], (s) => {
          const pseudo = data.pseudo?.trim().replace(/^@/, "");
          if (!data.produit_id || !pseudo || !data.plateforme) fail("produit_id, pseudo et plateforme sont requis.");
          if (!PLATFORMS.includes(data.plateforme)) fail("plateforme invalide.");
          const key = prospectKey(data.produit_id, pseudo, data.plateforme);
          if (s.prospects.some((p) => prospectKey(p.produit_id, p.pseudo, p.plateforme) === key)) {
            fail("Ce prospect existe déjà pour ce produit et cette plateforme.");
          }
          const now = sqlNow();
          const prospect: Prospect = {
            id: s.nextId.prospects++,
            produit_id: data.produit_id,
            pseudo,
            prenom: data.prenom?.trim() || null,
            plateforme: data.plateforme,
            detail_personnalisation: data.detail_personnalisation ?? null,
            statut: "a_contacter",
            date_ajout: now,
            created_at: now,
          };
          s.prospects.push(prospect);
          return prospect;
        }),
      bulkCreate: (produitId: number, rows: NewProspect[]) =>
        mutate(["prospects"], (s) => {
          if (!produitId || !Array.isArray(rows)) fail("produit_id et prospects (tableau) sont requis.");
          const existing = new Set(s.prospects.map((p) => prospectKey(p.produit_id, p.pseudo, p.plateforme)));
          const now = sqlNow();
          let inserted = 0;
          for (const row of rows) {
            const pseudo = row.pseudo?.trim().replace(/^@/, "");
            if (!pseudo || !PLATFORMS.includes(row.plateforme)) continue;
            const key = prospectKey(produitId, pseudo, row.plateforme);
            if (existing.has(key)) continue;
            existing.add(key);
            s.prospects.push({
              id: s.nextId.prospects++,
              produit_id: produitId,
              pseudo,
              prenom: row.prenom?.trim() || null,
              plateforme: row.plateforme,
              detail_personnalisation: row.detail_personnalisation ?? null,
              statut: "a_contacter",
              date_ajout: now,
              created_at: now,
            });
            inserted++;
          }
          return { inserted, ignored: rows.length - inserted };
        }),
      update: (id: number, data: UpdateProspect) =>
        mutate(["prospects", "logs"], (s) => {
          const p = byId(s.prospects, id) ?? fail("Prospect introuvable.");
          if (data.statut !== undefined && !STATUTS.includes(data.statut)) fail("statut invalide.");
          if (data.plateforme !== undefined && !PLATFORMS.includes(data.plateforme)) fail("plateforme invalide.");
          if (data.pseudo !== undefined) p.pseudo = data.pseudo.trim();
          if (data.prenom !== undefined) p.prenom = data.prenom?.trim() || null;
          if (data.plateforme !== undefined) p.plateforme = data.plateforme;
          if (data.detail_personnalisation !== undefined) p.detail_personnalisation = data.detail_personnalisation;
          if (data.statut !== undefined) {
            p.statut = data.statut;
            const flags = STATUT_LOG_FLAGS[data.statut];
            if (flags) {
              const latest = s.logs.filter((l) => l.prospect_id === id).sort((a, b) => b.id - a.id)[0];
              if (latest) Object.assign(latest, flags);
            }
          }
          return p;
        }),
      contact: (id: number, scriptId: number, date?: string) =>
        mutate(["prospects", "logs"], (s): ContactResult => {
          const p = byId(s.prospects, id) ?? fail("Prospect introuvable.");
          if (!scriptId) fail("script_id est requis.");
          p.statut = "contacte";
          const log: Log = {
            id: s.nextId.logs++,
            produit_id: p.produit_id,
            script_id: scriptId,
            prospect_id: id,
            plateforme: p.plateforme,
            date: date ?? new Date().toISOString().slice(0, 10),
            envoye: true,
            reponse: false,
            close: false,
            note: null,
            created_at: sqlNow(),
          };
          s.logs.push(log);
          return { prospect: p, log };
        }),
      remove: (id: number) =>
        mutate(["prospects", "logs"], (s) => {
          s.prospects = s.prospects.filter((p) => p.id !== id);
          for (const l of s.logs) if (l.prospect_id === id) l.prospect_id = null;
        }),
    },

    logs: {
      list: (filters?: { produitId?: number; plateforme?: Platform; prospectId?: number }) =>
        read((s) =>
          s.logs
            .filter(
              (l) =>
                (!filters?.produitId || l.produit_id === filters.produitId) &&
                (!filters?.plateforme || l.plateforme === filters.plateforme) &&
                (!filters?.prospectId || l.prospect_id === filters.prospectId)
            )
            .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        ),
      create: (data: NewLog) =>
        mutate(["logs"], (s) => {
          if (!data.produit_id || !data.script_id || !data.plateforme || !data.date) {
            fail("produit_id, script_id, plateforme et date sont requis.");
          }
          const log: Log = {
            id: s.nextId.logs++,
            produit_id: data.produit_id,
            script_id: data.script_id,
            prospect_id: data.prospect_id ?? null,
            plateforme: data.plateforme,
            date: data.date,
            envoye: data.envoye ?? true,
            reponse: data.reponse ?? false,
            close: data.close ?? false,
            note: data.note ?? null,
            created_at: sqlNow(),
          };
          s.logs.push(log);
          return log;
        }),
      update: (id: number, data: UpdateLog) =>
        mutate(["logs"], (s) => {
          const l = byId(s.logs, id) ?? fail("Log introuvable.");
          for (const k of ["script_id", "plateforme", "date", "envoye", "reponse", "close", "note"] as const) {
            if (data[k] !== undefined) (l as unknown as Record<string, unknown>)[k] = data[k];
          }
          return l;
        }),
      remove: (id: number) =>
        mutate(["logs"], (s) => {
          s.logs = s.logs.filter((l) => l.id !== id);
        }),
    },

    exportCsv: () =>
      read((s) => {
        const esc = (v: string | number | null) => {
          if (v === null || v === undefined) return "";
          const str = String(v);
          return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };
        const header = ["date", "produit", "script", "prospect", "plateforme", "envoye", "reponse", "close", "note"];
        const lines = [...s.logs]
          .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
          .map((l) =>
            [
              l.date,
              byId(s.products, l.produit_id)?.nom ?? "",
              byId(s.scripts, l.script_id)?.label ?? "",
              l.prospect_id ? byId(s.prospects, l.prospect_id)?.pseudo ?? "" : "",
              l.plateforme,
              l.envoye ? 1 : 0,
              l.reponse ? 1 : 0,
              l.close ? 1 : 0,
              l.note ?? "",
            ]
              .map(esc)
              .join(",")
          );
        return "﻿" + [header.join(","), ...lines].join("\n");
      }),

    exportJson: () =>
      read(
        (s): BackupPayload => ({
          version: 2,
          exported_at: new Date().toISOString(),
          products: s.products,
          scripts: s.scripts,
          prospects: s.prospects,
          logs: s.logs,
        })
      ),

    importJson: (payload: BackupPayload) =>
      mutate(["products", "scripts", "prospects", "logs"], (s) => {
        if (![payload.products, payload.scripts, payload.prospects, payload.logs].every(Array.isArray)) {
          fail("Fichier de sauvegarde invalide (version incompatible ?).");
        }
        s.products = payload.products;
        s.scripts = payload.scripts.map((x) => ({ ...x, actif: Boolean(x.actif) }));
        s.prospects = payload.prospects.map((x) => ({ ...x, prenom: x.prenom ?? null }));
        s.logs = payload.logs.map((l) => ({ ...l, envoye: !!l.envoye, reponse: !!l.reponse, close: !!l.close }));
        const next = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
        s.nextId = {
          products: next(s.products),
          scripts: next(s.scripts),
          prospects: next(s.prospects),
          logs: next(s.logs),
        };
        return {
          ok: true as const,
          products: s.products.length,
          scripts: s.scripts.length,
          prospects: s.prospects.length,
          logs: s.logs.length,
        };
      }),
  };
}
