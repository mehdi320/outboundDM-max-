import type { Prospect } from "@shared/types";

export function renderTemplate(contenu: string, prospect: Prospect, produitNom: string): string {
  return contenu
    .replaceAll("{prenom}", prospect.pseudo)
    .replaceAll("{detail}", prospect.detail_personnalisation ?? "")
    .replaceAll("{produit}", produitNom);
}
