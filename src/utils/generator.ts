import type { Angle, GeneratedVariant, Longueur, Structure } from "@shared/types";

interface Template {
  structure: Structure;
  longueur: Longueur;
  build: (produit: string) => string;
}

// Banque de templates de copywriting par angle. {prenom} et {detail} restent
// des variables littérales : elles ne sont remplies qu'au moment de l'envoi
// (dans la file d'exécution), pas à la génération.
const TEMPLATES: Record<Angle, Template[]> = {
  douleur: [
    {
      structure: "question_ouverte",
      longueur: "courte",
      build: () => "Salut {prenom}, question rapide : {detail}, c'est encore un vrai casse-tête pour toi en ce moment ?",
    },
    {
      structure: "affirmation_directe",
      longueur: "courte",
      build: (p) => `Hey {prenom}, je vois beaucoup de monde galérer avec {detail} — c'est exactement ce que ${p} résout.`,
    },
    {
      structure: "reference_activite",
      longueur: "courte",
      build: () => "Salut {prenom}, en regardant {detail} je me suis dit que tu perdais sûrement du temps sur un truc qui devrait être simple.",
    },
    {
      structure: "ton_formel",
      longueur: "developpee",
      build: (p) =>
        `Bonjour {prenom},\n\nJe me permets de vous contacter car j'ai remarqué {detail}. C'est un point sur lequel beaucoup de personnes dans votre situation rencontrent des difficultés récurrentes.\n\n${p} a été pensé spécifiquement pour éviter ce genre de blocage. Est-ce un sujet qui vous parle actuellement ?`,
    },
    {
      structure: "ton_familier",
      longueur: "developpee",
      build: (p) =>
        `Yo {prenom} !\n\nJe suis tombé sur {detail} et franchement ça m'a parlé, parce que c'est LE truc qui bloque la plupart des gens à ce stade.\n\nJ'ai justement bossé sur ${p} pour régler ce problème précis. Ça fait écho à ce que tu vis en ce moment ou pas du tout ?`,
    },
    {
      structure: "question_ouverte",
      longueur: "developpee",
      build: () =>
        "Salut {prenom},\n\nEn voyant {detail}, une question m'est venue : qu'est-ce qui te bloque le plus aujourd'hui là-dessus ? Le temps, la méthode, ou autre chose ?\n\nJe demande parce que c'est un problème que je vois passer très souvent, et j'ai peut-être un angle qui peut t'aider.",
    },
  ],
  benefice: [
    {
      structure: "affirmation_directe",
      longueur: "courte",
      build: (p) => `Salut {prenom}, avec ${p} on aide des gens comme toi à gagner un temps fou sur {detail}.`,
    },
    {
      structure: "question_ouverte",
      longueur: "courte",
      build: () => "Hey {prenom}, ça t'intéresserait de savoir comment simplifier {detail} en beaucoup moins de temps ?",
    },
    {
      structure: "ton_familier",
      longueur: "courte",
      build: (p) => `Yo {prenom}, ${p} pourrait clairement t'aider sur {detail} — je t'explique en 2 min si ça te dit ?`,
    },
    {
      structure: "reference_activite",
      longueur: "developpee",
      build: (p) =>
        `Salut {prenom},\n\nJ'ai vu {detail} et je pense que ${p} pourrait vraiment t'apporter un plus sur ce point précis.\n\nEn résumé : ça permet de gagner du temps, d'y voir plus clair, et d'avoir des résultats plus rapidement sans changer toute ta façon de faire.\n\nJe t'en dis plus si tu veux ?`,
    },
    {
      structure: "ton_formel",
      longueur: "developpee",
      build: (p) =>
        `Bonjour {prenom},\n\nAu vu de {detail}, je pense que ${p} pourrait constituer un vrai levier pour vous.\n\nLes personnes qui l'utilisent gagnent généralement un temps considérable et obtiennent des résultats plus rapidement, sans bouleverser leur organisation actuelle.\n\nSeriez-vous ouvert(e) à en discuter brièvement ?`,
    },
  ],
  curiosite: [
    {
      structure: "question_ouverte",
      longueur: "courte",
      build: () => "Salut {prenom}, petite question random : tu as déjà essayé de régler {detail} autrement ?",
    },
    {
      structure: "ton_familier",
      longueur: "courte",
      build: () => "Yo {prenom}, je suis tombé sur ton profil et {detail} m'a intrigué — tu bosses sur quoi en ce moment exactement ?",
    },
    {
      structure: "affirmation_directe",
      longueur: "courte",
      build: () => "Hey {prenom}, j'ai un truc en lien avec {detail} qui pourrait bien te surprendre. Je t'en parle ?",
    },
    {
      structure: "reference_activite",
      longueur: "developpee",
      build: () =>
        "Salut {prenom},\n\nEn regardant {detail}, je me suis posé une question : est-ce que tu as déjà testé une approche complètement différente pour ça ?\n\nJ'ai vu passer quelque chose qui sort un peu du lot sur ce sujet, et ça m'a fait penser à toi. Je te partage si ça t'intrigue ?",
    },
    {
      structure: "ton_formel",
      longueur: "developpee",
      build: () =>
        "Bonjour {prenom},\n\nEn découvrant {detail}, une question m'est venue à l'esprit concernant votre approche actuelle.\n\nJe préfère ne pas vous submerger d'informations d'entrée de jeu : simplement, seriez-vous curieux(se) d'en savoir plus sur une méthode alternative qui commence à faire parler d'elle ?",
    },
  ],
  preuve_sociale: [
    {
      structure: "affirmation_directe",
      longueur: "courte",
      build: (p) => `Salut {prenom}, plusieurs personnes dans ton domaine utilisent déjà ${p} pour {detail}, avec de bons résultats.`,
    },
    {
      structure: "ton_familier",
      longueur: "courte",
      build: (p) => `Yo {prenom}, pas mal de monde comme toi est passé sur ${p} récemment pour {detail} — ça matche avec ce que tu fais ?`,
    },
    {
      structure: "question_ouverte",
      longueur: "courte",
      build: () => "Hey {prenom}, ça t'intéresse de voir comment d'autres ont réglé {detail} récemment ?",
    },
    {
      structure: "reference_activite",
      longueur: "developpee",
      build: (p) =>
        `Salut {prenom},\n\nEn voyant {detail}, ça m'a rappelé plusieurs personnes qu'on a accompagnées récemment sur des problématiques très similaires avec ${p}.\n\nLes retours sont plutôt bons : gain de temps concret et résultats visibles en quelques semaines. Je t'en montre un exemple si tu veux ?`,
    },
    {
      structure: "ton_formel",
      longueur: "developpee",
      build: (p) =>
        `Bonjour {prenom},\n\nPlusieurs clients confrontés à une situation proche de {detail} ont récemment obtenu de bons résultats grâce à ${p}.\n\nJe serais ravi(e) de vous partager quelques retours concrets si le sujet vous intéresse. Est-ce pertinent pour vous actuellement ?`,
    },
  ],
};

const TARGET_VARIANT_COUNT = 5;

export function generateVariants(produitNom: string, angle: Angle): GeneratedVariant[] {
  const pool = TEMPLATES[angle];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const selected: Template[] = [];
  const usedStructures = new Set<Structure>();

  // priorité à la diversité de structure
  for (const tpl of shuffled) {
    if (selected.length >= TARGET_VARIANT_COUNT) break;
    if (!usedStructures.has(tpl.structure)) {
      selected.push(tpl);
      usedStructures.add(tpl.structure);
    }
  }
  // complète avec le reste du pool si besoin (sans dépasser la taille du pool)
  for (const tpl of shuffled) {
    if (selected.length >= TARGET_VARIANT_COUNT) break;
    if (!selected.includes(tpl)) selected.push(tpl);
  }

  return selected.map((tpl) => ({
    texte: tpl.build(produitNom),
    angle,
    structure: tpl.structure,
    longueur: tpl.longueur,
  }));
}
