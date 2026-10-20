/**
 * LES TROIS DATES DU SITE — a modifier ICI, puis commiter et pousser :
 * le site se redeploie tout seul. Plus rien a regler chez l'hebergeur.
 *
 * Format : date ISO avec le decalage horaire du Benin (+01:00).
 *   « 2026-10-24T23:59:00+01:00 » = le 24 octobre 2026 a 23h59.
 *
 * Une date illisible laisse le site OUVERT : mieux vaut une inscription
 * de trop qu'une page fermee sur une faute de frappe.
 */
export const DATES = {
  /** Debut de l'edition : cible du compte a rebours. */
  evenement: "2026-11-18T09:00:00+01:00",

  /** Derniere minute pour s'inscrire. Apres, le formulaire se ferme. */
  finInscriptions: "2026-10-24T23:59:00+01:00",

  /** Derniere minute pour payer. Apres, la page de paiement se ferme. */
  finPaiements: "2026-11-18T09:00:00+01:00",
} as const;
