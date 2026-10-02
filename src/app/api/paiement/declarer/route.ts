import { NextResponse } from "next/server";

import { enregistrerPaiement } from "@/lib/classeur";
import { emailValide, paiementsOuverts } from "@/lib/inscription-regles";
import {
  FORMATS,
  MOYENS,
  POIDS_MAX,
  billetterieEnService,
} from "@/lib/paiement";

/**
 * Reçoit une déclaration de paiement et la dépose dans le classeur.
 *
 * La preuve voyage encodée en base64, dans le même envoi que le reste :
 * c'est la seule forme qui traverse Apps Script, qui ne sait pas lire
 * un formulaire multipart.
 *
 * LE SITE NE VALIDE RIEN. Il vérifie la forme — champs présents,
 * fichier d'un format accepté et d'un poids raisonnable — et transmet.
 * C'est le comité qui regarde la preuve et décide, depuis le classeur.
 */

const MAX = 150;
const MAX_REMARQUE = 600;

function refus(message: string, code = 400) {
  return NextResponse.json({ ok: false, message }, { status: code });
}

export async function POST(request: Request) {
  if (!billetterieEnService()) {
    return NextResponse.json({ ok: false, message: "Introuvable." }, { status: 404 });
  }
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

  const lire = (cle: string, max = MAX) =>
    typeof entree[cle] === "string" ? (entree[cle] as string).trim().slice(0, max) : "";

  const nom = lire("nom");
  const email = lire("email").toLowerCase();
  const numero = lire("numero");
  const moyen = lire("moyen");
  const transaction = lire("numero_transaction");
  const montant = lire("montant_declare");
  const date = lire("date_paiement");
  const remarque = lire("remarque", MAX_REMARQUE);

  if (nom.length < 2) return refus("Ton nom, s'il te plaît.");
  if (!emailValide(email)) return refus("Cette adresse e-mail n'est pas valide.");
  if (numero.replace(/\D/g, "").length < 8)
    return refus("Ce numéro de téléphone n'est pas valide.");
  if (!(MOYENS as readonly string[]).includes(moyen))
    return refus("Choisis le moyen que tu as utilisé.");
  if (!montant.replace(/\D/g, ""))
    return refus("Indique le montant que tu as payé.");
  if (!date) return refus("Indique la date du paiement.");

  // La preuve : facultative à la forme, mais le comité la réclamera.
  const contenu = typeof entree.preuve_base64 === "string" ? entree.preuve_base64 : "";
  const type = lire("preuve_type");
  const nomFichier = lire("preuve_nom");

  if (contenu) {
    if (!FORMATS.includes(type)) {
      return refus("La preuve doit être une image (JPG, PNG, WEBP) ou un PDF.");
    }
    // Trois caractères encodés valent quatre octets transmis.
    if (contenu.length * 0.75 > POIDS_MAX) {
      return refus("La preuve est trop lourde : 3 Mo au maximum.");
    }
  } else {
    return refus("Joins une preuve de ton paiement.");
  }

  try {
    const resultat = await enregistrerPaiement({
      nom,
      email,
      numero,
      moyen,
      numero_transaction: transaction,
      montant_declare: montant,
      date_paiement: date,
      remarque,
      preuve_base64: contenu,
      preuve_type: type,
      preuve_nom: nomFichier,
    });
    if (!resultat.ok) {
      console.error("Déclaration refusée par le classeur :", resultat.message);
      return refus("Ta déclaration n'a pas pu être enregistrée. Réessaie.", 502);
    }
    return NextResponse.json({ ok: true, reference: resultat.reference ?? "" });
  } catch (err) {
    console.error("Déclaration de paiement impossible :", err);
    return refus("Le service est momentanément indisponible. Réessaie.", 504);
  }
}
