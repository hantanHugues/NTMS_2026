/**
 * Le paiement de la place, version DÉCLARATION.
 *
 * Le site n'encaisse rien. La personne paie par ses propres moyens —
 * MTN MoMo, Moov, Celtiis, Wave, espèces — puis déclare son paiement
 * ici en joignant une preuve. Le comité vérifie, puis envoie un reçu
 * depuis le classeur.
 *
 * C'est volontaire : les agrégateurs disponibles ne couvrent pas tous
 * les opérateurs du pays, et une chaîne qui refuse la moitié des
 * paiements vaut moins qu'un formulaire honnête.
 *
 * Rien ici n'est secret. Les packs et leurs prix sont dans le classeur.
 */

/**
 * Les moyens proposés, dans l'ordre d'usage au Bénin.
 *
 * « Autre » ferme la liste : on ne peut pas tout prévoir, et mieux
 * vaut une déclaration avec un moyen écrit à la main qu'une personne
 * bloquée devant une liste qui ne la concerne pas.
 */
export const MOYENS = [
  "MTN MoMo",
  "Moov Money",
  "Celtiis Cash",
  "Espèces",
  "Autre",
] as const;

/** Le dernier choix ouvre un champ libre. */
export const MOYEN_AUTRE = "Autre";

/** Taille maximale d'une preuve, une fois encodée pour l'envoi. */
export const POIDS_MAX = 3 * 1024 * 1024;

/** Les formats acceptés pour la preuve. */
export const FORMATS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Le fuseau du Bénin (UTC+1, sans heure d'été). */
export const FUSEAU_BENIN = "Africa/Porto-Novo";

/**
 * Les fuseaux des pays à fuseau unique les plus probables ici
 * (Afrique de l'Ouest et centrale d'abord). Un pays absent, ou qui
 * en compte plusieurs, retombe sur le fuseau de l'appareil.
 */
const FUSEAUX: Record<string, string> = {
  BJ: FUSEAU_BENIN,
  TG: "Africa/Lome",
  NE: "Africa/Niamey",
  NG: "Africa/Lagos",
  GH: "Africa/Accra",
  BF: "Africa/Ouagadougou",
  CI: "Africa/Abidjan",
  ML: "Africa/Bamako",
  SN: "Africa/Dakar",
  GN: "Africa/Conakry",
  CM: "Africa/Douala",
  GA: "Africa/Libreville",
  CG: "Africa/Brazzaville",
  TD: "Africa/Ndjamena",
  MA: "Africa/Casablanca",
  DZ: "Africa/Algiers",
  TN: "Africa/Tunis",
  FR: "Europe/Paris",
  BE: "Europe/Brussels",
  CH: "Europe/Zurich",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
};

/**
 * Le jour (« 2026-10-13 ») qu'il est à l'instant `maintenant`, dans le
 * fuseau demandé. Les secondes écoulées viennent du SERVEUR, pas de
 * l'horloge du téléphone, qui peut être déréglée.
 */
export function jourDans(maintenant: number, fuseau: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: fuseau,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(maintenant);
  } catch {
    return new Date(maintenant).toISOString().slice(0, 10);
  }
}

/**
 * Le fuseau du pays du numéro (00229 / +229 → Bénin). Pays inconnu
 * ou à plusieurs fuseaux : celui de l'appareil, c'est-à-dire l'endroit
 * où la personne se trouve.
 */
export function fuseauPour(paysTel: string) {
  if (FUSEAUX[paysTel]) return FUSEAUX[paysTel];
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FUSEAU_BENIN;
  } catch {
    return FUSEAU_BENIN;
  }
}

/**
 * ALUMNI OU DELEGATE : la categorie d'un pack est lue dans son NOM,
 * dans l'onglet « packs » du classeur. Aucun changement au script.
 *
 *   « Alumni - Pack 1 »     → categorie alumni,   libelle « Pack 1 »
 *   « Delegate : Pack 3 »   → categorie delegate, libelle « Pack 3 »
 *   « Pack 2 »              → aucune categorie : propose a tout le monde
 *
 * Le nom ENTIER (« Alumni - Pack 1 ») reste ce qui part au classeur et
 * s'y enregistre : deux packs de meme libelle dans deux categories ne
 * se melangent donc jamais.
 */
export type Categorie = "alumni" | "delegate" | "";

export function analysePack(nom: string): { categorie: Categorie; libelle: string } {
  const sansAccent = nom.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const m = sansAccent.match(/^\s*(alumni|alumnie|alumnus|delegate|delegue)\b[\s\-–—:·|/]*/);
  if (!m) return { categorie: "", libelle: nom };
  const reste = nom.slice(m[0].length).trim();
  return {
    categorie: m[1].startsWith("alum") ? "alumni" : "delegate",
    libelle: reste || nom,
  };
}

/**
 * La cle qui relie un pack de l'onglet a son descriptif (le contenu
 * affiche sur la carte, dans `content.ts`) :
 *
 *   « Alumni - Package 3 » → « alumni-3 »
 *   « Delegate - Package 1 » → « delegate-1 »
 *   « Delegate - Standard » → « delegate-standard »
 *
 * Un pack sans descriptif s'affiche simplement avec son prix.
 */
export function clePack(categorie: Categorie, libelle: string) {
  const numero = libelle.match(/\d+/)?.[0];
  const mot = libelle
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${categorie || "tous"}-${numero ?? mot}`;
}
