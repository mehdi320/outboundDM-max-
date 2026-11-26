import type { Prospect } from "@shared/types";

export type TemplateVar = "prenom" | "detail";

export interface RenderResult {
  texte: string;
  // variables utilisées par le script mais vides pour ce prospect
  manquantes: TemplateVar[];
}

// Retire un placeholder vide avec l'espace qui le précède, sans toucher au reste
// du message (les espaces français avant ? ! : ; sont conservés) :
// "Salut {prenom}, ça va ?" -> "Salut, ça va ?"
function removePlaceholder(text: string, placeholder: string): string {
  return text.replaceAll(` ${placeholder}`, "").replaceAll(placeholder, "");
}

export function renderTemplateDetailed(contenu: string, prospect: Prospect, produitNom: string): RenderResult {
  const manquantes: TemplateVar[] = [];
  let texte = contenu.replaceAll("{produit}", produitNom);

  const prenom = prospect.prenom?.trim();
  if (texte.includes("{prenom}")) {
    if (prenom) texte = texte.replaceAll("{prenom}", prenom);
    else {
      manquantes.push("prenom");
      texte = removePlaceholder(texte, "{prenom}");
    }
  }

  const detail = prospect.detail_personnalisation?.trim();
  if (texte.includes("{detail}")) {
    if (detail) texte = texte.replaceAll("{detail}", detail);
    else {
      manquantes.push("detail");
      texte = removePlaceholder(texte, "{detail}");
    }
  }

  return { texte, manquantes };
}

export function renderTemplate(contenu: string, prospect: Prospect, produitNom: string): string {
  return renderTemplateDetailed(contenu, prospect, produitNom).texte;
}
