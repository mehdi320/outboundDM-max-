export type Platform = "Instagram" | "Threads" | "Twitter";

export const PLATFORMS: Platform[] = ["Instagram", "Threads", "Twitter"];

export interface Product {
  id: number;
  nom: string;
  objectif_dm_jour: number | null;
  created_at: string;
}

export interface Script {
  id: number;
  produit_id: number;
  label: string;
  contenu: string | null;
  created_at: string;
}

export interface Entry {
  id: number;
  produit_id: number;
  script_id: number;
  plateforme: Platform;
  date: string; // YYYY-MM-DD
  nb_dm_envoyes: number;
  nb_reponses: number;
  nb_deals_closes: number;
  note: string | null;
  created_at: string;
}

export type NewProduct = Pick<Product, "nom">;
export type UpdateProduct = Partial<Pick<Product, "nom" | "objectif_dm_jour">>;
export type NewScript = Pick<Script, "produit_id" | "label" | "contenu">;
export type NewEntry = Omit<Entry, "id" | "created_at">;
export type UpdateEntry = Partial<NewEntry>;

export interface BackupPayload {
  version: 1;
  exported_at: string;
  products: Product[];
  scripts: Script[];
  entries: Entry[];
}
