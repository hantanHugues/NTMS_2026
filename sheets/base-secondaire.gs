/**
 * NTMS 2026 — base secondaire des inscriptions.
 *
 * A COLLER dans le projet Apps Script du SECOND classeur
 * (Extensions > Apps Script), puis deployer en application web.
 *
 * ROLE : recevoir une copie de chaque inscription et l'ecrire, rien de
 * plus. Aucun mail ne part d'ici, aucune reference n'est attribuee.
 *
 * POURQUOI UN SCRIPT SEPARE — le compte qui tient le registre maitre
 * n'a PAS acces a ce classeur, et ce compte-ci n'a pas acces au
 * registre maitre. Chacun ecrit chez lui ; c'est le site qui envoie
 * l'inscription aux deux.
 *
 * REGLAGE, une seule fois :
 *   1. Parametres du projet > Proprietes du script > ajouter la
 *      propriete « SECRET », avec la MEME valeur que celle du registre
 *      maitre (INSCRIPTION_SECRET du site) ;
 *   2. Deploy > New deployment > Web app,
 *      « Execute as : Me », « Who has access : Anyone » ;
 *   3. donner l'adresse /exec obtenue a celui qui tient le site, pour
 *      la variable INSCRIPTION_MIROIR_URL.
 *
 * PROTECTIONS :
 *   - SECRET partage : sans lui, rien n'est ecrit.
 *   - Verrou : deux copies simultanees sont mises en file.
 *   - Pas de doublon : une reference deja presente est ignoree.
 *   - Saisie neutralisee : chaque valeur est ecrite en TEXTE, donc un
 *     champ commencant par « = » ne devient pas une formule.
 *
 * A CHAQUE MODIFICATION DU CODE : Deploy > Manage deployments >
 * crayon > Version : New version > Deploy.
 */

var ONGLET = "inscriptions";
var LONGUEUR_MAX = 1000;

/** L'ordre des colonnes. Le suivi des mails reste au registre maitre. */
var COLONNES = [
  "horodatage",
  "reference",
  "nom",
  "prenom",
  "email",
  "whatsapp",
  "sexe",
  "profil",
  "niveau",
  "role",
  "lc",
  "pays",
  "source",
  "chambre",
  "allergie",
  "allergie_detail",
  "restauration",
  "consentement_groupe",
  "consentement_photos",
  "id_envoi",
];

function doGet() {
  return reponse(true, "Base secondaire NTMS 2026 active.");
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return reponse(false, "Requete vide.");
  }

  var donnees;
  try {
    donnees = JSON.parse(e.postData.contents);
  } catch (err) {
    return reponse(false, "Requete illisible.");
  }
  if (!donnees || typeof donnees !== "object") {
    return reponse(false, "Requete illisible.");
  }

  var secret = PropertiesService.getScriptProperties().getProperty("SECRET") || "";
  if (!secret || donnees._secret !== secret) {
    return reponse(false, "Acces refuse.");
  }

  var verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(30000);
  } catch (err) {
    return reponse(false, "Serveur occupe, reessaie dans un instant.");
  }

  try {
    var feuille = feuilleDonnees();

    // Deja copiee : le site a reessaye, ou l'inscrit a revalide.
    var reference = nettoyer(donnees.reference);
    if (reference && dejaPresente(feuille, reference)) {
      return reponse(true, "Copie deja presente.", reference);
    }

    feuille.appendRow(
      COLONNES.map(function (cle) {
        if (cle === "horodatage") return new Date();
        return enTexte(donnees[cle]);
      })
    );
    return reponse(true, "Copie enregistree.", reference);
  } catch (err) {
    console.error(err);
    return reponse(false, "Erreur interne : " + (err && err.message ? err.message : err));
  } finally {
    verrou.releaseLock();
  }
}

function nettoyer(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim().slice(0, LONGUEUR_MAX);
}

/** Ecriture en TEXTE : « =… » ne devient pas une formule. */
function enTexte(v) {
  var t = nettoyer(v);
  return t === "" ? "" : "'" + t;
}

function feuilleDonnees() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var feuille = classeur.getSheetByName(ONGLET) || classeur.insertSheet(ONGLET);
  if (feuille.getLastRow() === 0) {
    feuille.appendRow(COLONNES);
    feuille.setFrozenRows(1);
    return feuille;
  }

  var entete = feuille
    .getRange(1, 1, 1, COLONNES.length)
    .getValues()[0]
    .map(function (v) { return String(v).trim(); });
  for (var i = 0; i < COLONNES.length; i++) {
    if (entete[i] !== COLONNES[i]) {
      throw new Error(
        "En-tete incorrect en colonne " + (i + 1) +
        " : « " + entete[i] + " » au lieu de « " + COLONNES[i] + " »."
      );
    }
  }
  return feuille;
}

function dejaPresente(feuille, reference) {
  var derniere = feuille.getLastRow();
  if (derniere < 2) return false;
  var col = COLONNES.indexOf("reference") + 1;
  var valeurs = feuille.getRange(2, col, derniere - 1, 1).getValues();
  for (var i = valeurs.length - 1; i >= 0; i--) {
    if (String(valeurs[i][0]) === reference) return true;
  }
  return false;
}

function reponse(ok, message, reference) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: ok, message: message, reference: reference || null })
  ).setMimeType(ContentService.MimeType.JSON);
}
