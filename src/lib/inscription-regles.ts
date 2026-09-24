import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import exemples from "libphonenumber-js/mobile/examples";

import { inscription } from "@/lib/content";

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

const nomsPays = new Intl.DisplayNames(["fr"], { type: "region" });

export type Pays = { code: CountryCode; nom: string; indicatif: string };

/** Tous les pays, triés par nom français, le Bénin en tête. */
export const PAYS: Pays[] = getCountries()
  .map((code) => ({
    code,
    nom: nomsPays.of(code) ?? code,
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

/** Le premier problème de l'étape, ou null. Messages destinés à l'inscrit. */
export function problemeEtape(d: Donnees, etape: number): string | null {
  if (etape === 0) {
    if (!d.prenom.trim() || !d.nom.trim())
      return "Ton nom et ton prénom, s'il te plaît.";
    if (!emailValide(d.email.trim()))
      return "Cette adresse e-mail n'est pas valide. Exemple : prenom.nom@gmail.com";
    if (!paysParCode(d.pays_tel)) return "Choisis le pays de ton numéro.";
    if (!numeroInternational(d.pays_tel, d.telephone)) {
      const pays = paysParCode(d.pays_tel)!;
      const ex = exempleNumero(d.pays_tel);
      return `Ce numéro ne correspond pas au format ${pays.nom === "Bénin" ? "béninois" : "de ce pays (" + pays.nom + ")"}${ex ? ". Exemple : " + ex : ""}.`;
    }
    if (!dans(inscription.sexes, d.sexe))
      return "Indique ton sexe : il sert à attribuer les chambres.";
  }

  if (etape === 1) {
    if (!dans(inscription.profils, d.profil)) return "Dis-nous qui tu es.";
    if (d.profil === PROFIL_BENIN) {
      if (!dans(valeurs(inscription.roles), d.role)) return "Choisis ton rôle.";
      if (!dans(inscription.comites, d.lc)) return "Choisis ton comité local.";
    }
    if (d.profil === PROFIL_ETRANGER) {
      if (!d.role.trim()) return "Indique ton poste.";
      if (!d.pays.trim()) return "Indique ton pays.";
    }
    if (d.profil === PROFIL_EXTERNE && !d.source.trim())
      return "Dis-nous comment tu as entendu parler du NTMS.";
  }

  if (etape === 2) {
    if (!dans(inscription.chambres, d.chambre)) return "Choisis un type de chambre.";
    if (!dans(inscription.ouiNon, d.allergie))
      return "Réponds à la question sur les allergies.";
    if (d.allergie === "Oui" && !d.allergie_detail.trim())
      return "Précise à quoi tu es allergique.";
    if (d.consentement_groupe !== "oui")
      return "L'ajout au groupe WhatsApp est nécessaire pour suivre l'édition.";
    if (d.consentement_politique !== "oui")
      return "Il faut accepter la politique de confidentialité pour t'inscrire.";
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
