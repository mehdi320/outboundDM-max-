import type { Platform } from "@shared/types";

// Segments de chemin qui ne sont jamais des pseudos (liens vers un post, une
// story, une recherche...). Si le premier segment matche un de ces mots-clés,
// ce n'est pas un lien de profil.
const NON_PROFILE_SEGMENTS = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "accounts",
  "direct",
  "tv",
  "i",
  "home",
  "search",
  "intent",
  "hashtag",
  "notifications",
  "messages",
  "settings",
  "status",
]);

export interface ParsedProfileLink {
  pseudo: string;
  plateforme: Platform;
}

interface PlatformMatcher {
  plateforme: Platform;
  hostPattern: RegExp;
  pathPattern: RegExp;
}

const MATCHERS: PlatformMatcher[] = [
  {
    plateforme: "Threads",
    hostPattern: /(^|\.)threads\.(net|com)$/i,
    pathPattern: /^@([a-zA-Z0-9._]+)/,
  },
  {
    plateforme: "Instagram",
    hostPattern: /(^|\.)instagram\.com$/i,
    pathPattern: /^@?([a-zA-Z0-9._]+)/,
  },
  {
    plateforme: "Twitter",
    hostPattern: /(^|\.)(twitter|x)\.com$/i,
    pathPattern: /^@?([a-zA-Z0-9_]+)/,
  },
];

// Extrait pseudo + plateforme depuis un lien de profil collé. Retourne null
// si ce n'est pas une URL reconnue ou si ça pointe vers autre chose qu'un
// profil (un post, une story...). Aucune requête réseau : uniquement du
// parsing de la structure de l'URL.
export function parseProfileLink(input: string): ParsedProfileLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const matcher = MATCHERS.find((m) => m.hostPattern.test(url.hostname));
  if (!matcher) return null;

  const firstSegment = url.pathname.split("/").filter(Boolean)[0];
  if (!firstSegment) return null;

  const match = firstSegment.match(matcher.pathPattern);
  if (!match) return null;

  const pseudo = match[1];
  if (NON_PROFILE_SEGMENTS.has(pseudo.toLowerCase())) return null;

  return { pseudo, plateforme: matcher.plateforme };
}
