import { NextResponse } from "next/server";

import {
  VIDE,
  elaguer,
  inscriptionsOuvertes,
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

type Reponse = { ok?: boolean; message?: string; reference?: string | null };

/**
 * La réponse du script n'a pas pu être LUE.
 *
 * Distincte d'une panne ordinaire, parce qu'elle ne dit rien de ce que
 * le script a fait : il a peut-être écrit la ligne avant que la lecture
 * échoue. C'est ce cas, et lui seul, qui autorise une reprise.
 */
class ReponsePerdue extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReponsePerdue";
  }
}

/** Le texte d'une page HTML de Google, débarrassé de ses balises. */
function lisible(texte: string) {
  return texte
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

const attendre = (ms: number) => new Promise((suite) => setTimeout(suite, ms));

/**
 * Appelle une application web Apps Script et lit sa réponse.
 *
 * Apps Script répond en DEUX temps : le POST exécute le script et
 * renvoie une redirection 302 ; la réponse JSON se lit ensuite par un
 * GET sur l'adresse indiquée.
 *
 * La redirection est suivie À LA MAIN. Suivie automatiquement, elle
 * repartait avec les en-têtes du POST et Google répondait 404 : le
 * script avait bien écrit la ligne, mais le site ne recevait jamais la
 * confirmation et affichait un échec.
 *
 * Ce GET d'écho échoue parfois de lui-même, sur une page « Page Not
 * Found » de Drive, alors que le script a travaillé. Il est donc tenté
 * DEUX fois : il ne relance pas le script, le rejouer ne coûte rien.
 */
async function appelerScript(
  url: string,
  corps: Record<string, string>
): Promise<Reponse> {
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

  // Réponse directe, sans redirection : on la lit telle quelle.
  if (premier.status < 300 || premier.status >= 400) {
    const texte = await premier.text();
    try {
      return JSON.parse(texte) as Reponse;
    } catch {
      throw new ReponsePerdue(
        `Réponse non JSON d'Apps Script (HTTP ${premier.status}) : ${lisible(texte)}`
      );
    }
  }

  const suite = premier.headers.get("location");
  if (!suite) throw new ReponsePerdue("Redirection d'Apps Script sans adresse.");

  let dernier = "";
  for (let essai = 0; essai < 2; essai++) {
    if (essai) await attendre(1200);
    const reponse = await fetch(suite, { method: "GET", signal });
    const texte = await reponse.text();
    try {
      return JSON.parse(texte) as Reponse;
    } catch {
      // Page HTML de Google : mauvais déploiement, page de connexion, ou
      // panne passagère. On garde le texte lisible, pas le HTML : c'est là
      // que Google écrit la cause.
      dernier = `HTTP ${reponse.status} : ${lisible(texte)}`;
    }
  }
  throw new ReponsePerdue(`Réponse non JSON d'Apps Script (${dernier})`);
}

/**
 * Le même appel, avec une reprise quand la réponse s'est perdue.
 *
 * Le script reconnaît un identifiant d'envoi déjà vu et renvoie la
 * référence existante SANS réécrire la ligne ni renvoyer de mail : la
 * reprise ne crée donc pas de doublon, et coûte quelques secondes là
 * où le premier appel en prend des dizaines.
 *
 * Sans identifiant d'envoi, pas de reprise : rien ne distinguerait
 * alors une seconde tentative d'une seconde inscription.
 */
async function appelerAvecReprise(
  url: string,
  corps: Record<string, string>
): Promise<Reponse> {
  try {
    return await appelerScript(url, corps);
  } catch (err) {
    if (!(err instanceof ReponsePerdue) || !corps.id_envoi) throw err;
    console.error("Réponse perdue, reprise de l'appel :", err.message);
    return await appelerScript(url, corps);
  }
}

/**
 * Le motif technique d'un refus, mais UNIQUEMENT en test.
 *
 * Un inscrit n'a que faire d'un en-tête de colonne ou d'un secret ;
 * pendant la mise au point, en revanche, chercher la raison dans les
 * journaux de l'hébergeur fait perdre un temps fou. INSCRIPTION_DEBUG=1
 * fait remonter la vraie phrase jusqu'au navigateur. À ne jamais
 * laisser allumé une fois les inscriptions ouvertes au public.
 */
function detail(message: string): string | null {
  return process.env.INSCRIPTION_DEBUG === "1" ? message : null;
}

export async function POST(request: Request) {
  const url = process.env.INSCRIPTION_WEBAPP_URL;
  const secret = process.env.INSCRIPTION_SECRET;
  if (!url || !secret) {
    const manque = !url ? "INSCRIPTION_WEBAPP_URL" : "INSCRIPTION_SECRET";
    console.error(manque + " absent.");
    // Le message disait « pas encore ouvertes » : trompeur, il envoyait
    // chercher une date de clôture alors qu'il manque un réglage.
    return refus(
      detail(`Réglage du serveur incomplet : ${manque} manque.`) ??
        "Le service d'inscription est indisponible. Écris-nous.",
      503
    );
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

  // Les inscriptions closes : le formulaire ne s'affiche plus, mais
  // rien n'empêche d'appeler cette adresse directement.
  if (!inscriptionsOuvertes()) {
    return refus("Les inscriptions sont closes.");
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
  // numéro est réécrit au format international (+229 01 97 12 34 56).
  const donnees = {
    nom: d.nom,
    prenom: d.prenom,
    email: d.email.toLowerCase(),
    whatsapp: numeroInternational(d.pays_tel, d.telephone) ?? "",
    sexe: d.sexe,
    profil: d.profil,
    niveau: d.niveau,
    role: d.role,
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
    const resultat = await appelerAvecReprise(url, { ...donnees, _secret: secret });
    if (!resultat.ok) {
      console.error("Refus d'Apps Script :", resultat.message);
      return refus(
        detail("Le classeur a refusé : " + resultat.message) ??
          "L'inscription n'a pas pu être enregistrée. Réessaie.",
        502
      );
    }

    const reference = resultat.reference ?? "";

    // La COPIE dans la base secondaire, s'il y en a une. Elle part après
    // coup et n'a aucun droit de faire échouer une inscription : le
    // registre maître fait foi. Une copie manquée se voit dans les
    // journaux du site.
    const miroir = process.env.INSCRIPTION_MIROIR_URL;
    // Par défaut, le même secret que le registre maître : un seul à
    // retenir. INSCRIPTION_MIROIR_SECRET n'est là que si un jour les
    // deux classeurs doivent en avoir chacun un.
    const miroirSecret = process.env.INSCRIPTION_MIROIR_SECRET || secret;
    if (miroir) {
      try {
        const copie = await appelerScript(miroir, {
          ...donnees,
          reference,
          _secret: miroirSecret,
        });
        if (!copie.ok) console.error("Base secondaire, refus :", copie.message);
      } catch (err) {
        console.error("Base secondaire injoignable :", err);
      }
    }

    return NextResponse.json({ ok: true, reference });
  } catch (err) {
    console.error("Appel Apps Script impossible :", err);
    return refus(
      detail("Appel du classeur impossible : " + String(err)) ??
        "Le service est momentanément indisponible. Réessaie.",
      504
    );
  }
}
