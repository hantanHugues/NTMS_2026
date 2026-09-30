/**
 * Le dialogue avec Money Fusion (Fusion Pay).
 *
 * CE QUI TIENT LIEU DE CLÉ — il n'y a pas de jeton dans les en-têtes :
 * c'est l'ADRESSE de l'application, donnée par le tableau de bord, qui
 * autorise l'appel. Elle ne doit donc jamais atteindre le navigateur.
 * Elle est lue dans `process.env` sans préfixe `NEXT_PUBLIC_`, donc
 * introuvable côté client ; ce fichier n'est importé que par des
 * routes et des pages serveur.
 *
 * LE PARCOURS
 *   1. le site crée le paiement (POST) et reçoit `{token, url}` ;
 *   2. la personne est renvoyée vers `url`, chez Money Fusion, où elle
 *      paie par mobile money ;
 *   3. elle revient sur `return_url`, et Money Fusion appelle de son
 *      côté `webhook_url` ;
 *   4. le site VÉRIFIE le statut auprès de Money Fusion. Ce qui revient
 *      par le navigateur ne prouve rien — une adresse se réécrit à la
 *      main. Seule cette vérification fait foi.
 */

/** Les états rendus par Money Fusion. */
export type StatutPaiement = "paid" | "pending" | "failure" | "no paid";

export type Paiement = {
  token: string;
  statut: StatutPaiement;
  montant: number;
  frais: number;
  moyen: string;
  numeroTransaction: string;
  nom: string;
  numero: string;
  /** Données que nous avions jointes à la création. */
  personnel: Record<string, unknown>;
  creeLe: string;
};

const VERIFICATION = "https://pay.moneyfusion.net/paiementNotif/";

/**
 * Vrai quand la billetterie est en service.
 *
 * Tant que l'adresse d'API n'est pas renseignée, les pages de paiement
 * répondent 404 : une fonctionnalité a moitié née ne doit pas être
 * visible de qui tape l'adresse a la main. Elle réapparaît d'elle-même
 * le jour où la variable est posée chez l'hébergeur.
 */
export function billetterieEnService() {
  return Boolean(process.env.MONEYFUSION_API_URL);
}

/** L'adresse de notre application chez Money Fusion. */
function adresseApi() {
  const url = process.env.MONEYFUSION_API_URL;
  if (!url) throw new Error("MONEYFUSION_API_URL absent.");
  return url;
}

/**
 * L'adresse publique du site, pour construire le retour et le webhook.
 * Money Fusion appelle ces deux adresses : elles doivent être absolues
 * et joignables depuis l'extérieur.
 */
export function adresseSite() {
  const explicite = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicite) return explicite.replace(/\/$/, "");
  // Vercel renseigne l'hôte du déploiement en cours.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Le montant à encaisser, en francs CFA. Jamais lu depuis le navigateur. */
export function montantInscription() {
  const brut = process.env.MONTANT_INSCRIPTION;
  const n = Number(brut);
  if (!brut || !Number.isFinite(n) || n <= 0) {
    throw new Error("MONTANT_INSCRIPTION absent ou illisible.");
  }
  return Math.round(n);
}

type ReponseCreation = {
  statut?: boolean;
  token?: string;
  message?: string;
  url?: string;
};

/**
 * Crée le paiement et renvoie l'adresse vers laquelle envoyer la
 * personne. Le montant vient du serveur, jamais du formulaire : sinon
 * n'importe qui paierait le prix qu'il veut.
 */
export async function creerPaiement(client: {
  nom: string;
  numero: string;
  email: string;
  reference?: string;
}): Promise<{ token: string; url: string }> {
  const montant = montantInscription();
  const site = adresseSite();

  const reponse = await fetch(adresseApi(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      totalPrice: montant,
      // Le détail de ce qui est payé, tel que Money Fusion l'attend.
      article: [{ "Participation NTMS 2026": montant }],
      // Nos propres repères, rendus tels quels à la vérification.
      personal_Info: [
        {
          email: client.email,
          reference: client.reference ?? "",
          evenement: "NTMS 2026",
        },
      ],
      numeroSend: client.numero,
      nomclient: client.nom,
      return_url: `${site}/paiement/retour`,
      webhook_url: `${site}/api/paiement/webhook`,
    }),
    cache: "no-store",
  });

  const charge = (await reponse.json().catch(() => null)) as ReponseCreation | null;
  if (!reponse.ok || !charge || charge.statut !== true || !charge.url || !charge.token) {
    throw new Error(
      "Money Fusion a refusé la création du paiement : " +
        (charge?.message ?? `réponse ${reponse.status}`)
    );
  }
  // L'adresse rendue porte le nom de la boutique en clair, espaces
  // compris : « …/250/site d'inscription pour la conferences… ». Tous
  // les navigateurs ne les encodent pas de la meme facon, et une
  // redirection vers une adresse a espaces casse chez certains.
  return { token: charge.token, url: charge.url.replace(/ /g, "%20") };
}

type ReponseVerification = {
  statut?: boolean;
  data?: {
    tokenPay?: string;
    numeroTransaction?: string;
    Montant?: number;
    frais?: number;
    statut?: string;
    moyen?: string;
    nomclient?: string;
    numeroSend?: string;
    personal_Info?: Record<string, unknown>[];
    createdAt?: string;
  };
};

const ETATS: StatutPaiement[] = ["paid", "pending", "failure", "no paid"];

/** L'état réel d'un paiement, demandé à Money Fusion. */
export async function verifierPaiement(token: string): Promise<Paiement | null> {
  const reponse = await fetch(VERIFICATION + encodeURIComponent(token), {
    cache: "no-store",
  });
  if (!reponse.ok) return null;

  const charge = (await reponse.json().catch(() => null)) as ReponseVerification | null;
  const d = charge?.data;
  if (!d) return null;

  const brut = String(d.statut ?? "").toLowerCase();
  const statut = (ETATS.find((e) => e === brut) ?? "pending") as StatutPaiement;

  return {
    token: String(d.tokenPay ?? token),
    statut,
    montant: Number(d.Montant ?? 0),
    frais: Number(d.frais ?? 0),
    moyen: String(d.moyen ?? ""),
    numeroTransaction: String(d.numeroTransaction ?? ""),
    nom: String(d.nomclient ?? ""),
    numero: String(d.numeroSend ?? ""),
    personnel: (d.personal_Info && d.personal_Info[0]) || {},
    creeLe: String(d.createdAt ?? ""),
  };
}
