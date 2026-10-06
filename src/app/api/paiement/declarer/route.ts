import { NextResponse } from "next/server";

import { enregistrerPaiement } from "@/lib/classeur";
import { contenu as dictionnaire } from "@/lib/contenu";
import { emailValide, paiementsOuverts } from "@/lib/inscription-regles";
import { FORMATS, POIDS_MAX, billetterieEnService } from "@/lib/paiement";

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
  // Les refus parlent la langue du visiteur, comme le formulaire.
  const { paiement } = await dictionnaire();
  const msg = paiement.erreurs;
  if (!billetterieEnService()) {
    return NextResponse.json({ ok: false, message: "Introuvable." }, { status: 404 });
  }
  if (!paiementsOuverts()) {
    return refus(msg.clos, 403);
  }

  let brut: unknown;
  try {
    brut = await request.json();
  } catch {
    return refus(msg.illisible);
  }
  if (!brut || typeof brut !== "object") return refus(msg.illisible);
  const entree = brut as Record<string, unknown>;

  const lire = (cle: string, max = MAX) =>
    typeof entree[cle] === "string" ? (entree[cle] as string).trim().slice(0, max) : "";

  const nom = lire("nom");
  const email = lire("email").toLowerCase();
  const numero = lire("numero");
  const moyen = lire("moyen");
  const montant = lire("montant_declare");
  const date = lire("date_paiement");
  const remarque = lire("remarque", MAX_REMARQUE);

  if (nom.length < 2) return refus(msg.nom);
  if (!emailValide(email)) return refus(msg.email);
  if (numero.replace(/\D/g, "").length < 8)
    return refus(msg.numero);
  // « Autre » ouvre un champ libre : on accepte donc tout moyen écrit
  // à la main, du moment qu'il ressemble à quelque chose.
  if (moyen.length < 2 || moyen.length > 60)
    return refus(msg.moyen);
  if (!montant.replace(/\D/g, ""))
    return refus(msg.montant);
  if (!date) return refus(msg.date);

  // La preuve : facultative à la forme, mais le comité la réclamera.
  const contenu = typeof entree.preuve_base64 === "string" ? entree.preuve_base64 : "";
  const type = lire("preuve_type");
  const nomFichier = lire("preuve_nom");

  if (contenu) {
    if (!FORMATS.includes(type)) {
      return refus(msg.preuveFormat);
    }
    // Trois caractères encodés valent quatre octets transmis.
    if (contenu.length * 0.75 > POIDS_MAX) {
      return refus(msg.preuveLourde);
    }
  } else {
    return refus(msg.preuveManquante);
  }

  try {
    const resultat = await enregistrerPaiement({
      nom,
      email,
      numero,
      moyen,
      montant_declare: montant,
      date_paiement: date,
      remarque,
      preuve_base64: contenu,
      preuve_type: type,
      preuve_nom: nomFichier,
    });
    if (!resultat.ok) {
      console.error("Déclaration refusée par le classeur :", resultat.message);
      return refus(msg.enregistrement, 502);
    }
    return NextResponse.json({ ok: true, reference: resultat.reference ?? "" });
  } catch (err) {
    console.error("Déclaration de paiement impossible :", err);
    return refus(msg.indisponible, 504);
  }
}
