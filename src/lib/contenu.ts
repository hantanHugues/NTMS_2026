import { cookies, headers } from "next/headers";

import {
  COOKIE_LANGUE,
  DICTIONNAIRES,
  languePreferee,
  type Dictionnaire,
  type Langue,
} from "@/lib/langues";

/**
 * LA LANGUE SERVIE, CÔTÉ SERVEUR.
 *
 * Pas de segment `/en` dans l'adresse : la langue tient dans un
 * COOKIE. Trois conséquences qui expliquent tout le reste :
 *
 *   1. Au PREMIER passage il n'y a pas de cookie. On regarde alors
 *      l'en-tête `Accept-Language` et on rend directement la bonne
 *      version : la page n'est jamais servie en français puis
 *      retraduite sous les yeux du lecteur.
 *   2. Le sélecteur écrit le cookie et redemande la page. Le choix
 *      tient ensuite sur tout le site.
 *   3. Lire un cookie rend la page DYNAMIQUE : elle n'est plus figée
 *      au build. C'est le prix de cette approche, modeste ici.
 *
 * Ce fichier importe `next/headers` : il ne doit JAMAIS être importé
 * par un composant client, qui entraînerait toute la chaîne dans le
 * navigateur. Les types et les dictionnaires vivent dans `langues.ts`,
 * que les deux côtés peuvent lire.
 */

export type { Dictionnaire, Langue };

/** La langue à servir : le choix enregistré, sinon celle du navigateur. */
export async function langueActive(): Promise<Langue> {
  const choisie = (await cookies()).get(COOKIE_LANGUE)?.value;
  if (choisie === "fr" || choisie === "en") return choisie;
  return languePreferee((await headers()).get("accept-language") ?? "");
}

/** Le dictionnaire de la langue en cours, pour un composant serveur. */
export async function contenu(): Promise<Dictionnaire> {
  return DICTIONNAIRES[await langueActive()];
}
