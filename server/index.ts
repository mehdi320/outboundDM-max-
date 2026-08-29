import express from "express";
import cors from "cors";
import "./db.js";
import { productsRouter } from "./routes/products.js";
import { scriptsRouter } from "./routes/scripts.js";
import { entriesRouter } from "./routes/entries.js";
import { exportRouter } from "./routes/export.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/scripts", scriptsRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/export", exportRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[server] DM Tracker API sur http://localhost:${PORT}`);
});
