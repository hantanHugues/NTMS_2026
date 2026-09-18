import { NextResponse } from "next/server";

import {
  VIDE,
  elaguer,
  numeroInternational,
  problemeEtape,
  type Donnees,
} from "@/lib/inscription-regles";

/**
 * Relais entre le formulaire et le classeur Google.
 *
 * Le navigateur ne parle jamais directement à Apps Script : l'adresse
 * du script et le secret partagé restent côté serveur, il n'y a aucun
 * blocage inter-domaines, et les données sont validées ICI avant
 * d'entrer dans la base — les mêmes règles que le formulaire, parce
 * qu'on ne fait pas confiance au navigateur.
 *
 * Le secret prouve au script que l'appel vient du site. Sans lui,
 * n'importe qui connaissant l'adresse /exec pourrait remplir la
 * feuille et faire envoyer des mails au nom d'AIESEC in Benin.
 */

// Verrou d'Apps Script (jusqu'à 30 s) + envoi du mail.
export const maxDuration = 60;

const LONGUEUR_MAX = 200;
const LONGUEUR_MAX_TEXTE = 1000;
const CHAMPS_LONGS = new Set(["source", "restauration", "allergie_detail"]);

function refus(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const url = process.env.INSCRIPTION_WEBAPP_URL;
  const secret = process.env.INSCRIPTION_SECRET;
  if (!url || !secret) {
    console.error("INSCRIPTION_WEBAPP_URL ou INSCRIPTION_SECRET absent.");
    return refus("Les inscriptions ne sont pas encore ouvertes.", 503);
  }

  let brut: unknown;
  try {
    brut = await request.json();
  } catch {
    return refus("Requête illisible.");
  }
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) {
    return refus("Requête illisible.");
  }
  const entree = brut as Record<string, unknown>;

  // Pot de miel : un champ invisible pour un humain. S'il est rempli,
  // c'est un robot — on répond « enregistré » sans rien transmettre,
  // pour ne pas lui apprendre qu'il a été détecté.
  if (typeof entree.site_web === "string" && entree.site_web.trim() !== "") {
    return NextResponse.json({ ok: true, reference: "" });
  }

  // On ne lit QUE les champs attendus, nettoyés et bornés.
  const saisie = { ...VIDE };
  for (const champ of Object.keys(VIDE) as (keyof Donnees)[]) {
    const v = entree[champ];
    const max = CHAMPS_LONGS.has(champ) ? LONGUEUR_MAX_TEXTE : LONGUEUR_MAX;
    saisie[champ] = typeof v === "string" ? v.trim().slice(0, max) : "";
  }
  // Les champs de la branche non retenue ne partent pas.
  const d = elaguer(saisie);

  // Mêmes règles que le formulaire, étape par étape.
  for (const etape of [0, 1, 2]) {
    const erreur = problemeEtape(d, etape);
    if (erreur) return refus(erreur);
  }

  // Ce qui part vers la feuille, dans les noms de ses colonnes. Le
  // numéro est réécrit au format international (+229 01 97 12 34 56),
  // un « Autre » est remplacé par le rôle saisi.
  const donnees = {
    nom: d.nom,
    prenom: d.prenom,
    email: d.email.toLowerCase(),
    whatsapp: numeroInternational(d.pays_tel, d.telephone) ?? "",
    sexe: d.sexe,
    profil: d.profil,
    niveau: d.niveau,
    role: d.role === "Autre" ? d.role_autre : d.role,
    lc: d.lc,
    pays: d.pays,
    source: d.source,
    chambre: d.chambre,
    allergie: d.allergie,
    allergie_detail: d.allergie_detail,
    restauration: d.restauration,
    consentement_groupe: d.consentement_groupe,
    consentement_photos: d.consentement_photos,
    id_envoi:
      typeof entree.id_envoi === "string" ? entree.id_envoi.slice(0, LONGUEUR_MAX) : "",
  };

  try {
    const signal = AbortSignal.timeout(45000);

    // Apps Script répond en DEUX temps : le POST exécute le script et
    // renvoie une redirection 302 ; la réponse JSON se lit ensuite par
    // un GET sur l'adresse indiquée.
    //
    // La redirection est suivie À LA MAIN. Suivie automatiquement, elle
    // repartait avec les en-têtes du POST et Google répondait 404 : le
    // script avait bien écrit la ligne, mais le site ne recevait jamais
    // la confirmation et affichait un échec.
    const premier = await fetch(url, {
      method: "POST",
      // `text/plain` évite la requête préliminaire qu'Apps Script ne
      // sait pas traiter.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...donnees, _secret: secret }),
      redirect: "manual",
      signal,
    });

    let reponse = premier;
    if (premier.status >= 300 && premier.status < 400) {
      const suite = premier.headers.get("location");
      if (!suite) {
        console.error("Redirection d'Apps Script sans adresse.");
        return refus("Le service d'inscription ne répond pas correctement.", 502);
      }
      reponse = await fetch(suite, { method: "GET", signal });
    }

    const texte = await reponse.text();
    let resultat: { ok?: boolean; message?: string; reference?: string | null };
    try {
      resultat = JSON.parse(texte);
    } catch {
      // Page HTML de Google : mauvais déploiement, page de connexion…
      // Le texte lisible de la page, pas son HTML : c'est là que
      // Google écrit la cause (erreur du script, délai, autorisation).
      const lisible = texte
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      console.error(
        `Réponse non JSON d'Apps Script (HTTP ${reponse.status}) :`,
        lisible.slice(0, 600)
      );
      return refus("Le service d'inscription ne répond pas correctement.", 502);
    }

    if (!resultat.ok) {
      console.error("Refus d'Apps Script :", resultat.message);
      return refus("L'inscription n'a pas pu être enregistrée. Réessaie.", 502);
    }
    return NextResponse.json({ ok: true, reference: resultat.reference ?? "" });
  } catch (err) {
    console.error("Appel Apps Script impossible :", err);
    return refus("Le service est momentanément indisponible. Réessaie.", 504);
  }
}
