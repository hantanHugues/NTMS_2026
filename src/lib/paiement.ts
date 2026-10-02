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
 * Rien ici n'est secret. Le seul réglage est le montant attendu, lu
 * côté serveur pour que la page l'affiche.
 */

/** Les moyens proposés, dans l'ordre d'usage au Bénin. */
export const MOYENS = [
  "MTN MoMo",
  "Moov Money",
  "Celtiis Cash",
  "Wave",
  "Virement bancaire",
  "Espèces",
] as const;

/** Taille maximale d'une preuve, une fois encodée pour l'envoi. */
export const POIDS_MAX = 3 * 1024 * 1024;

/** Les formats acceptés pour la preuve. */
export const FORMATS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * Vrai quand la page de paiement doit exister.
 *
 * Tant que le montant n'est pas renseigné, elle répond 404 : une page
 * qui réclame de l'argent sans savoir combien n'a rien à faire en
 * ligne.
 */
export function billetterieEnService() {
  return montantOuNull() !== null;
}

function montantOuNull() {
  const brut = process.env.MONTANT_INSCRIPTION;
  const n = Number(brut);
  return brut && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Le montant attendu, en francs CFA. */
export function montantInscription() {
  const n = montantOuNull();
  if (n === null) throw new Error("MONTANT_INSCRIPTION absent ou illisible.");
  return n;
}
