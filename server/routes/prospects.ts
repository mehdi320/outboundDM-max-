import { Router } from "express";
import { db } from "../db.js";
import { mapLog } from "../helpers.js";
import type { NewProspect, UpdateProspect, Prospect, Statut, Platform } from "../../shared/types.js";

export const prospectsRouter = Router();

const VALID_PLATFORMS: Platform[] = ["Instagram", "Threads", "Twitter"];
const VALID_STATUTS: Statut[] = ["a_contacter", "contacte", "repondu", "close", "ignore"];

// mapping statut -> flags à appliquer sur le log de contact le plus récent du prospect
const STATUT_LOG_FLAGS: Record<Statut, { reponse: 0 | 1; close: 0 | 1 } | null> = {
  a_contacter: null,
  contacte: { reponse: 0, close: 0 },
  repondu: { reponse: 1, close: 0 },
  close: { reponse: 1, close: 1 },
  ignore: null,
};

prospectsRouter.get("/", (req, res) => {
  const { produit_id, plateforme, statut } = req.query;
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (produit_id) {
    clauses.push("produit_id = ?");
    params.push(Number(produit_id));
  }
  if (plateforme) {
    clauses.push("plateforme = ?");
    params.push(String(plateforme));
  }
  if (statut) {
    clauses.push("statut = ?");
    params.push(String(statut));
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const prospects = db
    .prepare(`SELECT * FROM prospects ${where} ORDER BY date_ajout ASC, id ASC`)
    .all(...params) as Prospect[];
  res.json(prospects);
});

prospectsRouter.post("/", (req, res) => {
  const body = req.body as NewProspect;
  if (!body.produit_id || !body.pseudo || !body.pseudo.trim() || !body.plateforme) {
    return res.status(400).json({ error: "produit_id, pseudo et plateforme sont requis." });
  }
  if (!VALID_PLATFORMS.includes(body.plateforme)) {
    return res.status(400).json({ error: "plateforme invalide." });
  }
  try {
    const result = db
      .prepare(
        "INSERT INTO prospects (produit_id, pseudo, plateforme, detail_personnalisation) VALUES (?, ?, ?, ?)"
      )
      .run(body.produit_id, body.pseudo.trim(), body.plateforme, body.detail_personnalisation ?? null);
    const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(prospect);
  } catch (err) {
    res.status(400).json({ error: "Ce prospect existe déjà pour ce produit et cette plateforme." });
  }
});

interface BulkProspect {
  pseudo: string;
  plateforme: Platform;
  detail_personnalisation: string | null;
}

prospectsRouter.post("/bulk", (req, res) => {
  const { produit_id, prospects } = req.body as { produit_id: number; prospects: BulkProspect[] };
  if (!produit_id || !Array.isArray(prospects)) {
    return res.status(400).json({ error: "produit_id et prospects (tableau) sont requis." });
  }

  const insert = db.prepare(
    "INSERT OR IGNORE INTO prospects (produit_id, pseudo, plateforme, detail_personnalisation) VALUES (?, ?, ?, ?)"
  );

  const run = db.transaction((rows: BulkProspect[]) => {
    let inserted = 0;
    for (const row of rows) {
      if (!row.pseudo?.trim() || !VALID_PLATFORMS.includes(row.plateforme)) continue;
      const result = insert.run(produit_id, row.pseudo.trim(), row.plateforme, row.detail_personnalisation ?? null);
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });

  const inserted = run(prospects);
  res.status(201).json({ inserted, ignored: prospects.length - inserted });
});

prospectsRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM prospects WHERE id = ?").get(id) as Prospect | undefined;
  if (!existing) return res.status(404).json({ error: "Prospect introuvable." });

  const body = req.body as UpdateProspect;
  if (body.statut !== undefined && !VALID_STATUTS.includes(body.statut)) {
    return res.status(400).json({ error: "statut invalide." });
  }
  if (body.plateforme !== undefined && !VALID_PLATFORMS.includes(body.plateforme)) {
    return res.status(400).json({ error: "plateforme invalide." });
  }

  const merged = {
    pseudo: body.pseudo !== undefined ? body.pseudo.trim() : existing.pseudo,
    plateforme: body.plateforme ?? existing.plateforme,
    detail_personnalisation:
      body.detail_personnalisation !== undefined ? body.detail_personnalisation : existing.detail_personnalisation,
    statut: body.statut ?? existing.statut,
  };

  const update = db.transaction(() => {
    db.prepare(
      "UPDATE prospects SET pseudo = ?, plateforme = ?, detail_personnalisation = ?, statut = ? WHERE id = ?"
    ).run(merged.pseudo, merged.plateforme, merged.detail_personnalisation, merged.statut, id);

    if (body.statut !== undefined) {
      const flags = STATUT_LOG_FLAGS[body.statut];
      if (flags) {
        const latestLog = db
          .prepare("SELECT id FROM logs WHERE prospect_id = ? ORDER BY id DESC LIMIT 1")
          .get(id) as { id: number } | undefined;
        if (latestLog) {
          db.prepare("UPDATE logs SET reponse = ?, close = ? WHERE id = ?").run(
            flags.reponse,
            flags.close,
            latestLog.id
          );
        }
      }
    }
  });
  update();

  const updated = db.prepare("SELECT * FROM prospects WHERE id = ?").get(id);
  res.json(updated);
});

prospectsRouter.post("/:id/contact", (req, res) => {
  const id = Number(req.params.id);
  const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(id) as Prospect | undefined;
  if (!prospect) return res.status(404).json({ error: "Prospect introuvable." });

  const { script_id, date } = req.body as { script_id: number; date?: string };
  if (!script_id) return res.status(400).json({ error: "script_id est requis." });

  const contactDate = date ?? new Date().toISOString().slice(0, 10);

  const run = db.transaction(() => {
    db.prepare("UPDATE prospects SET statut = 'contacte' WHERE id = ?").run(id);
    const result = db
      .prepare(
        `INSERT INTO logs (produit_id, script_id, prospect_id, plateforme, date, envoye, reponse, close)
         VALUES (?, ?, ?, ?, ?, 1, 0, 0)`
      )
      .run(prospect.produit_id, script_id, id, prospect.plateforme, contactDate);
    return result.lastInsertRowid;
  });

  const logId = run();
  const updatedProspect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(id) as Prospect;
  const log = db.prepare("SELECT * FROM logs WHERE id = ?").get(logId);
  res.status(201).json({ prospect: updatedProspect, log: mapLog(log as Parameters<typeof mapLog>[0]) });
});

prospectsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM prospects WHERE id = ?").run(id);
  res.status(204).end();
});
