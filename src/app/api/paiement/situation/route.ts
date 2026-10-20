import { NextResponse } from "next/server";

import { situationPaiement } from "@/lib/classeur";
import { emailValide, paiementsOuverts } from "@/lib/inscription-regles";

/**
 * Avant de payer : le site demande au classeur qui est cette personne.
 *
 * Reconnue = e-mail ET numéro d'une même ligne. On ne renvoie que le
 * nom, le pack et les montants : jamais la preuve ni le numéro d'une
 * autre personne.
 */

function refus(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (!paiementsOuverts()) return refus("Les paiements sont clos.", 403);

  let brut: unknown;
  try {
    brut = await request.json();
  } catch {
    return refus("Requête illisible.");
  }
  const entree = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
  const email =
    typeof entree.email === "string" ? entree.email.trim().toLowerCase().slice(0, 150) : "";
  const numero =
    typeof entree.numero === "string" ? entree.numero.trim().slice(0, 40) : "";

  if (!emailValide(email)) return refus("Cette adresse e-mail n'est pas valide.");
  if (numero.replace(/\D/g, "").length < 8)
    return refus("Ce numéro de téléphone n'est pas valide.");

  try {
    const s = await situationPaiement(email, numero);
    return NextResponse.json({ ok: true, ...s });
  } catch (err) {
    console.error("Situation de paiement impossible :", err);
    return refus("Le service est momentanément indisponible. Réessaie.", 504);
  }
}
