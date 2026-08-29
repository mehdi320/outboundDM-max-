import { Router } from "express";
import { db } from "../db.js";
import type { NewProduct, Product } from "../../shared/types.js";

export const productsRouter = Router();

productsRouter.get("/", (_req, res) => {
  const products = db
    .prepare("SELECT * FROM products ORDER BY created_at ASC")
    .all() as Product[];
  res.json(products);
});

productsRouter.post("/", (req, res) => {
  const body = req.body as NewProduct;
  if (!body.nom || !body.nom.trim()) {
    return res.status(400).json({ error: "Le nom du produit est requis." });
  }
  try {
    const result = db
      .prepare("INSERT INTO products (nom) VALUES (?)")
      .run(body.nom.trim());
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(result.lastInsertRowid) as Product;
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: "Ce produit existe déjà." });
  }
});

productsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  res.status(204).end();
});
