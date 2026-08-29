export type Platform = "Instagram" | "Threads" | "Twitter";

export const PLATFORMS: Platform[] = ["Instagram", "Threads", "Twitter"];

export type Statut = "a_contacter" | "contacte" | "repondu" | "close" | "ignore";

export const STATUTS: Statut[] = ["a_contacter", "contacte", "repondu", "close", "ignore"];

export const STATUT_LABELS: Record<Statut, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  repondu: "Répondu",
  close: "Closé",
  ignore: "Ignoré",
};

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
  actif: boolean;
  created_at: string;
}

export interface Prospect {
  id: number;
  produit_id: number;
  pseudo: string;
  plateforme: Platform;
  detail_personnalisation: string | null;
  statut: Statut;
  date_ajout: string;
  created_at: string;
}

export interface Log {
  id: number;
  produit_id: number;
  script_id: number;
  prospect_id: number | null;
  plateforme: Platform;
  date: string; // YYYY-MM-DD
  envoye: boolean;
  reponse: boolean;
  close: boolean;
  note: string | null;
  created_at: string;
}

export type NewProduct = Pick<Product, "nom">;
export type UpdateProduct = Partial<Pick<Product, "nom" | "objectif_dm_jour">>;

export type NewScript = Pick<Script, "produit_id" | "label" | "contenu">;
export type UpdateScript = Partial<Pick<Script, "label" | "contenu" | "actif">>;

export type NewProspect = Pick<Prospect, "produit_id" | "pseudo" | "plateforme" | "detail_personnalisation">;
export type UpdateProspect = Partial<Pick<Prospect, "pseudo" | "plateforme" | "detail_personnalisation" | "statut">>;

export type NewLog = Omit<Log, "id" | "created_at">;
export type UpdateLog = Partial<NewLog>;

export interface ContactResult {
  prospect: Prospect;
  log: Log;
}

export interface BackupPayload {
  version: 2;
  exported_at: string;
  products: Product[];
  scripts: Script[];
  prospects: Prospect[];
  logs: Log[];
}

export type Longueur = "courte" | "developpee";

// 3 structures d'ouverture (issu du skill dm-prospecting). Le ton (formel/familier)
// est un axe séparé : on ne fait jamais varier le ton seul entre deux variantes
// de même longueur/structure — ce ne serait pas un vrai test A/B, juste du bruit.
export type Structure = "question_ouverte" | "affirmation_directe" | "reference_activite";

export const STRUCTURE_LABELS: Record<Structure, string> = {
  question_ouverte: "Question ouverte",
  affirmation_directe: "Affirmation directe",
  reference_activite: "Référence à l'activité",
};

export type Tone = "neutre" | "formel" | "familier";

export const TONE_LABELS: Record<Tone, string> = {
  neutre: "Ton d'origine",
  formel: "Ton formel",
  familier: "Ton familier",
};

export interface GeneratedVariant {
  texte: string;
  structure: Structure;
  longueur: Longueur;
  tone: Tone;
}
