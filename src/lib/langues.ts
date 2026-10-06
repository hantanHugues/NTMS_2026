import * as en from "@/lib/content-en";
import * as fr from "@/lib/content";

/**
 * CE QUE LES DEUX CÔTÉS PARTAGENT.
 *
 * Ce fichier ne touche NI aux cookies NI aux en-têtes : un composant
 * client peut donc l'importer sans entraîner `next/headers` dans le
 * navigateur — ce qui casse la compilation. La lecture de la langue
 * demandée, elle, vit dans `contenu.ts`, côté serveur uniquement.
 */

export type Langue = "fr" | "en";

export const LANGUES: Langue[] = ["fr", "en"];
export const COOKIE_LANGUE = "ntms_langue";

export type Dictionnaire = typeof fr;

export const DICTIONNAIRES: Record<Langue, Dictionnaire> = { fr, en };

/** Garde-fou de compilation : l'anglais doit avoir toutes les clés. */
const _completude: Dictionnaire = en;
void _completude;

/** Le dictionnaire d'une langue donnée. */
export function dictionnaire(langue: Langue): Dictionnaire {
  return DICTIONNAIRES[langue];
}

/**
 * La langue préférée d'après l'en-tête du navigateur.
 *
 * `fr-FR,fr;q=0.9,en;q=0.8` se lit : français d'abord. On garde le
 * premier code reconnu ; tout le reste tombe sur le français, langue
 * de l'édition.
 */
export function languePreferee(entete: string): Langue {
  for (const morceau of entete.split(",")) {
    const code = morceau.trim().slice(0, 2).toLowerCase();
    if (code === "en") return "en";
    if (code === "fr") return "fr";
  }
  return "fr";
}

/**
 * Ce qui traverse vers les composants clients.
 *
 * Uniquement du texte : les icônes de `solution`, `cta` et `values`
 * sont des composants React, qui ne franchissent pas la frontière
 * serveur/client. Les sections qui les affichent sont de toute façon
 * rendues côté serveur.
 */
export type DictionnaireClient = {
  langue: Langue;
  navItems: Dictionnaire["navItems"];
  event: Dictionnaire["event"];
  boutonPhase: Dictionnaire["boutonPhase"];
  inscription: Dictionnaire["inscription"];
  paiement: Dictionnaire["paiement"];
  contact: Dictionnaire["contact"];
  legal: Dictionnaire["legal"];
};

export function pourLeClient(langue: Langue): DictionnaireClient {
  const d = DICTIONNAIRES[langue];
  return {
    langue,
    navItems: d.navItems,
    event: d.event,
    boutonPhase: d.boutonPhase,
    inscription: d.inscription,
    paiement: d.paiement,
    contact: d.contact,
    legal: d.legal,
  };
}
