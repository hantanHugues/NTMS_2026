import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import exemples from "libphonenumber-js/mobile/examples";

import { event, inscription } from "@/lib/content";

/**
 * Les règles d'inscription, partagées par le formulaire ET par la route
 * serveur. Un seul endroit : le navigateur guide la personne, le
 * serveur refuse ce qui n'aurait jamais dû passer, et les deux disent
 * la même chose.
 *
 * Le téléphone est vérifié avec libphonenumber, la base de numérotation
 * maintenue à partir de celle de Google : longueur ET préfixes valides
 * pays par pays (au Bénin, les 10 chiffres commençant par 01).
 */

export type Donnees = {
  nom: string;
  prenom: string;
  email: string;
  pays_tel: string;
  telephone: string;
  sexe: string;
  profil: string;
  niveau: string;
  role: string;
  lc: string;
  pays: string;
  source: string;
  chambre: string;
  allergie: string;
  allergie_detail: string;
  restauration: string;
  consentement_groupe: string;
  consentement_photos: string;
  consentement_politique: string;
};

export const VIDE: Donnees = {
  nom: "",
  prenom: "",
  email: "",
  pays_tel: "BJ",
  telephone: "",
  sexe: "",
  profil: "",
  niveau: "",
  role: "",
  lc: "",
  pays: "",
  source: "",
  chambre: "",
  allergie: "",
  allergie_detail: "",
  restauration: "",
  consentement_groupe: "",
  consentement_photos: "",
  consentement_politique: "",
};

export const [PROFIL_BENIN, PROFIL_ETRANGER, PROFIL_EXTERNE] = inscription.profils;

/** Lettres, chiffres et . _ % + - avant l'arobase ; un domaine avec au
 *  moins un point et une extension alphabétique de 2 lettres ou plus. */
const EMAIL =
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9_%+-])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

export function emailValide(email: string) {
  return EMAIL.test(email) && !email.includes("..");
}

export type Pays = { code: CountryCode; nom: string; indicatif: string };

/**
 * Tous les pays, dans la langue demandée, le Bénin en tête.
 *
 * Les noms viennent de la table du système : « Allemagne » en
 * français, « Germany » en anglais. Le tri suit la même langue, sans
 * quoi la liste anglaise resterait rangée à la française.
 *
 * Les listes sont construites une fois puis gardées : parcourir les
 * 245 pays à chaque rendu du formulaire ne sert à rien.
 */
const listes = new Map<string, Pays[]>();

export function paysDe(langue: string = "fr"): Pays[] {
  const connue = listes.get(langue);
  if (connue) return connue;

  const noms = new Intl.DisplayNames([langue], { type: "region" });
  const liste = getCountries()
    .map((code) => ({
      code,
      nom: noms.of(code) ?? code,
      indicatif: getCountryCallingCode(code),
    }))
    .sort((a, b) =>
      a.code === "BJ"
        ? -1
        : b.code === "BJ"
          ? 1
          : a.nom.localeCompare(b.nom, langue)
    );
  listes.set(langue, liste);
  return liste;
}

/** La liste française, pour le serveur et par défaut. */
export const PAYS: Pays[] = getCountries()
  .map((code) => ({
    code,
    nom: new Intl.DisplayNames(["fr"], { type: "region" }).of(code) ?? code,
    indicatif: getCountryCallingCode(code),
  }))
  .sort((a, b) =>
    a.code === "BJ" ? -1 : b.code === "BJ" ? 1 : a.nom.localeCompare(b.nom, "fr")
  );

export function paysParCode(code: string) {
  return PAYS.find((p) => p.code === code);
}

/** Un numéro d'exemple au format local, pour le texte d'aide. */
export function exempleNumero(code: string) {
  const pays = paysParCode(code);
  if (!pays) return "";
  return getExampleNumber(pays.code, exemples)?.formatNational() ?? "";
}

/** Le numéro au format international (« +229 01 97 12 34 56 »), ou
 *  null s'il ne correspond pas au format du pays choisi. */
export function numeroInternational(code: string, numero: string) {
  const pays = paysParCode(code);
  if (!pays || !numero.trim()) return null;
  const tel = parsePhoneNumberFromString(numero, pays.code);
  if (!tel || !tel.isValid() || tel.country !== pays.code) return null;
  return tel.formatInternational();
}

const valeurs = (liste: readonly { valeur: string }[]) => liste.map((r) => r.valeur);
const dans = (liste: readonly string[], v: string) => liste.includes(v);

/**
 * Vrai tant qu'on peut s'inscrire.
 *
 * La date de fermeture est celle du compte à rebours, sauf réglage
 * séparé. Une date illisible laisse le formulaire OUVERT : mieux vaut
 * une inscription de trop qu'une page fermée sur une faute de frappe.
 */
export function inscriptionsOuvertes(maintenant = Date.now()) {
  const fin = Date.parse(event.finInscriptions);
  return Number.isNaN(fin) || maintenant < fin;
}

/**
 * Vrai tant qu'on peut payer sa place.
 *
 * Seconde date, indépendante de la première : le formulaire peut être
 * clos alors que la billetterie reste ouverte quelques jours.
 */
export function paiementsOuverts(maintenant = Date.now()) {
  const fin = Date.parse(event.finPaiements);
  return Number.isNaN(fin) || maintenant < fin;
}

/**
 * Où en est l'édition, des deux dates de clôture :
 *
 *   inscription — le formulaire est ouvert, la place est gratuite
 *   paiement    — le formulaire est clos, il reste à régler sa place
 *   clos        — plus rien à faire sur le site
 *
 * Une seule fonction pour tout le site : le bouton de l'en-tête, celui
 * du hero et la carte d'appel à l'action doivent dire la même chose au
 * même moment.
 */
export type Phase = "inscription" | "paiement" | "clos";

export function phase(maintenant = Date.now()): Phase {
  if (inscriptionsOuvertes(maintenant)) return "inscription";
  if (paiementsOuverts(maintenant)) return "paiement";
  return "clos";
}

/**
 * Le premier problème de l'étape, ou null.
 *
 * Les messages viennent du dictionnaire : le site existe en deux
 * langues, et un refus doit parler celle du lecteur. Par défaut, le
 * français — c'est ce que fait tout appel qui ne précise rien.
 */
export type MessagesInscription = typeof inscription.erreurs;

export function problemeEtape(
  d: Donnees,
  etape: number,
  messages: MessagesInscription = inscription.erreurs
): string | null {
  if (etape === 0) {
    if (!d.prenom.trim() || !d.nom.trim()) return messages.nom;
    if (!emailValide(d.email.trim())) return messages.email;
    if (!paysParCode(d.pays_tel)) return messages.pays;
    if (!numeroInternational(d.pays_tel, d.telephone)) {
      const pays = paysParCode(d.pays_tel)!;
      const ex = exempleNumero(d.pays_tel);
      const quel =
        pays.nom === "Bénin"
          ? messages.numeroBenin
          : `${messages.numeroPays} (${pays.nom})`;
      return `${messages.numero} ${quel}${ex ? `. ${messages.numeroExemple} : ${ex}` : ""}.`;
    }
    if (!dans(inscription.sexes, d.sexe)) return messages.sexe;
  }

  if (etape === 1) {
    if (!dans(inscription.profils, d.profil)) return messages.profil;
    if (d.profil === PROFIL_BENIN) {
      if (!dans(valeurs(inscription.roles), d.role)) return messages.role;
      if (!dans(inscription.comites, d.lc)) return messages.lc;
    }
    if (d.profil === PROFIL_ETRANGER) {
      if (!d.role.trim()) return messages.poste;
      if (!d.pays.trim()) return messages.paysLibre;
    }
    if (d.profil === PROFIL_EXTERNE && !d.source.trim()) return messages.source;
  }

  if (etape === 2) {
    if (!dans(inscription.chambres, d.chambre)) return messages.chambre;
    if (!dans(inscription.ouiNon, d.allergie)) return messages.allergie;
    if (d.allergie === "Oui" && !d.allergie_detail.trim())
      return messages.allergieDetail;
    if (d.consentement_groupe !== "oui") return messages.consentementGroupe;
    if (d.consentement_politique !== "oui") return messages.consentementPolitique;
  }
  return null;
}

/**
 * Vide les champs des branches non retenues. Appelé à chaque saisie
 * dans le formulaire, et une dernière fois par le serveur.
 */
export function elaguer(d: Donnees): Donnees {
  const r = { ...d };
  if (r.profil !== PROFIL_BENIN) {
    r.niveau = "";
    r.lc = "";
  }
  if (r.profil !== PROFIL_ETRANGER) r.pays = "";
  if (r.profil !== PROFIL_EXTERNE) {
    r.source = "";
  } else {
    r.role = "";
  }
  if (r.profil === PROFIL_BENIN) {
    // La colonne « niveau » de la feuille existe toujours : on la
    // remplit nous-mêmes, puisque seuls les LC s'inscrivent.
    r.niveau = "LC";
    if (!dans(valeurs(inscription.roles), r.role)) r.role = "";
  }
  if (r.allergie !== "Oui") r.allergie_detail = "";
  return r;
}
