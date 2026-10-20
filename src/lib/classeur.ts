/**
 * L'appel au classeur Google (Apps Script), partagé par l'inscription
 * et le paiement.
 *
 * DEUX PIÈGES, appris à l'usage :
 *   – Apps Script répond par une REDIRECTION qu'il faut suivre à la
 *     main, en GET propre : laissée à `fetch`, elle finit en 404 ;
 *   – quand quelque chose cloche côté Google (mauvais déploiement, page
 *     de connexion, panne), la réponse n'est pas du JSON mais une page
 *     HTML. On en extrait le texte, car c'est là que Google écrit la
 *     cause réelle.
 */

import { analysePack, type Categorie } from "@/lib/paiement";

export type ReponseClasseur = {
  ok?: boolean;
  message?: string;
  reference?: string | null;
};

export async function appelerScript(
  url: string,
  corps: Record<string, string>
): Promise<ReponseClasseur> {
  const signal = AbortSignal.timeout(45000);
  const premier = await fetch(url, {
    method: "POST",
    // `text/plain` évite la requête préliminaire qu'Apps Script ne sait
    // pas traiter.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(corps),
    redirect: "manual",
    signal,
  });

  let reponse = premier;
  if (premier.status >= 300 && premier.status < 400) {
    const suite = premier.headers.get("location");
    if (!suite) throw new Error("Redirection d'Apps Script sans adresse.");
    reponse = await fetch(suite, { method: "GET", signal });
  }

  const texte = await reponse.text();
  try {
    return JSON.parse(texte) as ReponseClasseur;
  } catch {
    const lisible = texte
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    throw new Error(
      `Réponse non JSON d'Apps Script (HTTP ${reponse.status}) : ${lisible.slice(0, 600)}`
    );
  }
}

/**
 * Dépose une déclaration de paiement dans le classeur.
 *
 * La preuve voyage encodée dans le même envoi : Apps Script ne sait
 * pas lire un formulaire multipart, et c'est lui qui range le fichier
 * dans Drive, sous le compte propriétaire du classeur.
 */
export async function enregistrerPaiement(champs: Record<string, string>) {
  const url = process.env.INSCRIPTION_WEBAPP_URL;
  const secret = process.env.INSCRIPTION_SECRET;
  if (!url || !secret) throw new Error("Classeur non configuré.");
  return appelerScript(url, { ...champs, type: "paiement", _secret: secret });
}

/** `nom` est le nom ENTIER de l'onglet ; `libelle` et `categorie` en sont tires. */
export type Pack = { nom: string; prix: number; categorie: Categorie; libelle: string };

/** Ce que le classeur sait d'une personne avant qu'elle paie. */
export type Situation = {
  packs: Pack[];
  connu: boolean;
  /** E-mail ou numéro déjà connu, mais pas les deux ensemble. */
  blocage: boolean;
  nom: string;
  pack: string;
  montant_du: number;
  valide: number;
  attente: number;
  reste: number;
  tranche: number;
};

export async function situationPaiement(
  email: string,
  numero: string
): Promise<Situation> {
  const url = process.env.INSCRIPTION_WEBAPP_URL;
  const secret = process.env.INSCRIPTION_SECRET;
  if (!url || !secret) throw new Error("Classeur non configuré.");
  const r = (await appelerScript(url, {
    type: "situation",
    email,
    numero,
    _secret: secret,
  })) as unknown as Partial<Omit<Situation, "packs">> & {
    ok?: boolean;
    message?: string;
    packs?: { nom: string; prix: number }[];
  };
  if (!r.ok || !Array.isArray(r.packs)) {
    throw new Error(r.message || "Situation illisible.");
  }
  return {
    packs: r.packs.map((p) => ({ ...p, ...analysePack(p.nom) })),
    connu: !!r.connu,
    blocage: !!r.blocage,
    nom: r.nom ?? "",
    pack: r.pack ?? "",
    montant_du: Number(r.montant_du) || 0,
    valide: Number(r.valide) || 0,
    attente: Number(r.attente) || 0,
    reste: Number(r.reste) || 0,
    tranche: Number(r.tranche) || 1,
  };
}
