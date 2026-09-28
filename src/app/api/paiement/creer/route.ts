import { NextResponse } from "next/server";

import { creerPaiement, montantInscription } from "@/lib/paiement";
import { emailValide } from "@/lib/inscription-regles";
import { paiementsOuverts } from "@/lib/inscription-regles";

/**
 * Ouvre un paiement et renvoie l'adresse où envoyer la personne.
 *
 * Le navigateur n'apprend jamais l'adresse d'API de Money Fusion, qui
 * tient lieu de clé : il ne reçoit que l'adresse de la page de
 * paiement, qui est publique par nature.
 *
 * LE MONTANT NE VIENT PAS DU FORMULAIRE. Il est lu ici, côté serveur.
 * Un champ caché, même bien élevé, se modifie en trois secondes dans
 * les outils du navigateur.
 */

const MAX = 120;

function refus(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (!paiementsOuverts()) {
    return refus("Les paiements sont clos.", 403);
  }

  let brut: unknown;
  try {
    brut = await request.json();
  } catch {
    return refus("Requête illisible.");
  }
  if (!brut || typeof brut !== "object") return refus("Requête illisible.");
  const entree = brut as Record<string, unknown>;

  const lire = (cle: string) =>
    typeof entree[cle] === "string" ? (entree[cle] as string).trim().slice(0, MAX) : "";

  const nom = lire("nom");
  const email = lire("email").toLowerCase();
  // Money Fusion attend le numéro tel qu'il se compose localement.
  const numero = lire("numero").replace(/\D/g, "");
  const reference = lire("reference");

  if (nom.length < 2) return refus("Ton nom, s'il te plaît.");
  if (!emailValide(email)) return refus("Cette adresse e-mail n'est pas valide.");
  if (numero.length < 8 || numero.length > 12) {
    return refus("Ce numéro mobile money n'est pas valide.");
  }

  try {
    const { token, url } = await creerPaiement({ nom, numero, email, reference });
    return NextResponse.json({ ok: true, token, url, montant: montantInscription() });
  } catch (err) {
    console.error("Création du paiement impossible :", err);
    return refus(
      "Le service de paiement ne répond pas. Réessaie dans un instant.",
      502
    );
  }
}
