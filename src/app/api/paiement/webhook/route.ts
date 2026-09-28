import { NextResponse } from "next/server";

import { enregistrerPaiement } from "@/lib/classeur";
import { verifierPaiement } from "@/lib/paiement";

/**
 * Ce que Money Fusion appelle quand un paiement change d'état.
 *
 * ON NE CROIT PAS CE QU'ON REÇOIT. N'importe qui peut poster ici : le
 * corps du message sert uniquement à repérer le jeton, puis on demande
 * l'état réel à Money Fusion. C'est cette réponse-là qui est écrite
 * dans le classeur.
 *
 * Money Fusion peut appeler PLUSIEURS FOIS pour le même paiement
 * (`pending`, puis `completed`). Le classeur reconnaît le jeton et met
 * la ligne à jour au lieu d'en ajouter une.
 *
 * On répond toujours 200 : un webhook en erreur est réessayé, et rien
 * de ce qui se passe ici ne doit faire boucler leur système. Ce qui
 * cloche part dans les journaux.
 */
export async function POST(request: Request) {
  let charge: Record<string, unknown> = {};
  try {
    charge = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const donnees = (charge.data ?? charge) as Record<string, unknown>;
  const jeton =
    (typeof donnees.tokenPay === "string" && donnees.tokenPay) ||
    (typeof donnees.token === "string" && donnees.token) ||
    "";

  if (!jeton) {
    console.error("Webhook Money Fusion sans jeton :", JSON.stringify(charge).slice(0, 300));
    return NextResponse.json({ ok: true });
  }

  try {
    const paiement = await verifierPaiement(jeton);
    if (!paiement) {
      console.error("Webhook : jeton inconnu de Money Fusion :", jeton);
      return NextResponse.json({ ok: true });
    }
    const personnel = paiement.personnel as Record<string, string>;
    await enregistrerPaiement({
      token: paiement.token,
      statut: paiement.statut,
      montant: String(paiement.montant),
      frais: String(paiement.frais),
      moyen: paiement.moyen,
      numero_transaction: paiement.numeroTransaction,
      nom: paiement.nom,
      numero: paiement.numero,
      email: String(personnel?.email ?? ""),
      reference_inscription: String(personnel?.reference ?? ""),
      evenement: String(personnel?.evenement ?? ""),
      source: "webhook",
    });
  } catch (err) {
    console.error("Webhook Money Fusion, enregistrement impossible :", err);
  }

  return NextResponse.json({ ok: true });
}

/** Ouvrir l'adresse dans un navigateur doit montrer que le service vit. */
export function GET() {
  return NextResponse.json({ ok: true, message: "Webhook paiement NTMS 2026 actif." });
}
