/**
 * NTMS 2026 — registre maitre des inscriptions.
 *
 * A COLLER dans le projet Apps Script du classeur MAITRE
 * (Extensions > Apps Script), puis deployer en application web.
 * Le projet doit tourner sur le moteur V8 (Parametres du projet >
 * « Activer l'environnement d'execution Chrome V8 »).
 *
 * ROLE DE CE CLASSEUR, et rien d'autre :
 *   1. recevoir une inscription envoyee par le site ;
 *   2. l'ecrire dans l'onglet des inscrits ;
 *   3. envoyer a l'inscrit le mail defini dans l'onglet « config ».
 *
 * ONGLET « config » — une colonne de libelles (A), une de valeurs (B) :
 *
 *   Objet              objet du mail
 *   Titre              titre affiche en tete du mail
 *   Corps              texte du mail ; variables {{prenom}} {{nom}}
 *                      {{reference}} {{lc}}
 *                      {{role}} ; une ligne vide = paragraphe
 *   Texte CTA          libelle du bouton
 *   Lien CTA           adresse du bouton (le groupe WhatsApp)
 *   Nom expéditeur     nom affiche comme expediteur
 *   CC                 adresses separees par des virgules
 *   BCC                adresses separees par des virgules
 *   Images             adresses d'images publiques, separees par des
 *                      virgules, affichees en tete du mail
 *   Pieces jointes     fichiers joints au mail : liens Google Drive ou
 *                      adresses https, separes par des virgules
 *   Nom feuille (BD)   onglet ou ecrire les inscrits
 *
 * Les libelles sont reconnus sans tenir compte des majuscules, des
 * accents ni de la ponctuation.
 *
 * PROTECTIONS :
 *   1. SECRET PARTAGE — seul le site, qui connait SECRET, peut ecrire.
 *      L'adresse /exec seule ne suffit pas a remplir la feuille ni a
 *      faire envoyer des mails.
 *   2. VERROU — deux inscriptions simultanees sont mises en file.
 *   3. PAS DE DOUBLON AU RENVOI — chaque envoi porte un identifiant.
 *      Si la reponse se perd et que la personne revalide, on renvoie la
 *      reference deja attribuee, sans nouvelle ligne ni nouveau mail.
 *   4. LA LIGNE D'ABORD, LE MAIL ENSUITE — un echec d'envoi, ou une
 *      config illisible, ne fait jamais perdre l'inscription.
 *   5. REFERENCE UNIQUE — un compteur persistant, qui ne recule jamais,
 *      meme si des lignes sont supprimees.
 *   6. SAISIE NEUTRALISEE — chaque valeur est ecrite comme TEXTE : un
 *      prenom commencant par « = » ne devient pas une formule, et un
 *      numero comme 0197123456 garde son zero et son « + ». Les champs
 *      sont echappes avant d'entrer dans le mail HTML.
 *   7. INTERRUPTEUR — ENVOI_ACTIF = false coupe les mails, les
 *      inscriptions continuent d'etre enregistrees.
 *
 * EXPEDITEUR — par defaut le compte qui a deploye en « Execute as: Me ».
 * Un autre compte peut prendre le relais depuis le classeur, menu
 * NTMS > « Envoyer les mails depuis ce compte » (voir plus bas).
 *
 * A CHAQUE MODIFICATION DU CODE : Deploy > Manage deployments >
 * crayon > Version : New version > Deploy. Sinon l'adresse /exec
 * continue de servir l'ancien code.
 */

/** Coupe l'envoi des mails sans toucher a l'enregistrement. */
var ENVOI_ACTIF = true;

/**
 * Le secret partage n'est PAS dans ce code, qui est public sur GitHub.
 * Il est range dans les proprietes du projet Apps Script :
 * Parametres du projet (roue dentee) > Proprietes du script >
 * propriete « SECRET », valeur IDENTIQUE a INSCRIPTION_SECRET dans le
 * .env du site. Sans cette propriete, toute inscription est refusee.
 */
function secretAttendu() {
  return PropertiesService.getScriptProperties().getProperty("SECRET") || "";
}

/**
 * LES DEUX MAILS DU CLASSEUR
 *
 * « auto »   : part tout seul a l'inscription. Son contenu se change
 *              dans l'onglet « config auto » selon la periode ; le site
 *              appelle toujours la meme chose.
 * « manuel » : ne part QUE sur clic, menu NTMS. Contenu dans l'onglet
 *              « config manuel ».
 *
 * Chaque modele a ses propres colonnes de suivi : un inscrit peut avoir
 * recu l'un sans l'autre. « onglets » liste les noms acceptes, dans
 * l'ordre : l'ancien nom « config » reste valable pour l'automatique.
 */
var MODELES = {
  auto: {
    nom: "automatique",
    onglets: ["config auto", "config"],
    etat: "mail_envoye",
    date: "mail_envoye_le",
    erreur: "erreur_mail",
  },
  manuel: {
    nom: "manuel",
    onglets: ["config manuel"],
    etat: "mail_manuel",
    date: "mail_manuel_le",
    erreur: "erreur_mail_manuel",
  },
  // Le recu de paiement. Il vit dans l'onglet des PAIEMENTS, pas dans
  // celui des inscrits : ses colonnes de suivi sont celles-la.
  recu: {
    nom: "recu",
    onglets: ["config recu"],
    etat: "recu_envoye",
    date: "recu_envoye_le",
    erreur: "erreur_recu",
  },
};
var ONGLET_PAR_DEFAUT = "inscriptions";

/** Longueur maximale conservee pour un champ saisi. */
var LONGUEUR_MAX = 1000;

/**
 * L'ordre des colonnes. Ne jamais reordonner : ecriture par position.
 * Le script VERIFIE l'en-tete avant chaque ecriture et refuse d'ecrire
 * s'il ne correspond pas : mieux vaut une inscription refusee (visible
 * dans les journaux du site) que des colonnes decalees en silence.
 *
 *   profil   AIESECer au Benin / AIESECer d'un autre pays / Pas AIESECer
 *   niveau   MC ou LC (AIESECer au Benin)
 *   role     MCP, MCVP, LCP, LCVP, TL, TM, le role saisi si « Autre »,
 *            ou le poste saisi par un AIESECer d'un autre pays
 *   lc       comite local (niveau LC)
 *   pays     pays saisi par un AIESECer d'un autre pays
 *   source   comment un non-AIESECer a connu le NTMS
 *   whatsapp au format international : +229 01 97 12 34 56
 */
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
  "mail_envoye",
  "mail_envoye_le",
  "erreur_mail",
  "id_envoi",
  "mail_manuel",
  "mail_manuel_le",
  "erreur_mail_manuel",
];

/**
 * L'ONGLET DES PAIEMENTS.
 *
 * Le site n'encaisse pas : la personne paie par ses propres moyens
 * (MTN MoMo, Moov, Celtiis, Wave, especes…), puis DECLARE son paiement
 * sur le site en joignant une preuve. Le comite verifie, puis envoie
 * un recu.
 *
 *   statut        a_verifier (depose par le site), valide, refuse
 *                 — c'est le COMITE qui ecrit valide ou refuse
 *   preuve        lien vers le fichier depose, range dans un dossier
 *                 Drive cree par le script
 *   recu_envoye   oui / non, rempli par le menu NTMS
 *
 * La colonne « statut » est la seule que le comite modifie a la main.
 */
var COLONNES_PAIEMENT = [
  "horodatage",
  "reference_paiement",
  "statut",
  "nom",
  "email",
  "numero",
  "reference_inscription",
  "moyen",
  "numero_transaction",
  "montant_declare",
  "date_paiement",
  "preuve",
  "remarque",
  "recu_envoye",
  "recu_envoye_le",
  "erreur_recu",
];

/** Etat d'une declaration au depot : rien n'est verifie encore. */
var STATUT_DEPOT = "a_verifier";

/** Ce que le comite ecrit pour declencher l'envoi du recu. */
var STATUT_VALIDE = "valide";

/** Colonnes remplies par le script, jamais par le formulaire. */
var COLONNES_SCRIPT = [
  "horodatage", "reference",
  "mail_envoye", "mail_envoye_le", "erreur_mail",
  "mail_manuel", "mail_manuel_le", "erreur_mail_manuel",
];

var REQUIS = ["nom", "prenom", "profil", "email", "whatsapp"];

// ---------------------------------------------------------------------
// Points d'entree web
// ---------------------------------------------------------------------

/** Ouvrir l'adresse /exec dans un navigateur doit afficher ceci. */
function doGet() {
  return reponse(true, "Service d'inscription NTMS 2026 actif.");
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
  var secret = secretAttendu();
  if (!secret || donnees._secret !== secret) {
    return reponse(false, "Acces refuse.");
  }

  // Un paiement n'a ni prenom ni profil : il part dans son propre
  // onglet, avec ses propres regles.
  if (String(donnees.type || "") === "paiement") {
    return enregistrerPaiement(donnees);
  }

  var manquant = champManquant(donnees);
  if (manquant) return reponse(false, "Champ manquant : " + manquant);

  var verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(30000);
  } catch (err) {
    return reponse(false, "Serveur occupe, reessaie dans un instant.");
  }

  try {
    // Une config illisible ne doit pas empecher l'enregistrement.
    var conf = {};
    try {
      conf = lireConfig();
    } catch (err) {
      conf = {};
    }

    var feuille = feuilleDonnees(conf.nomfeuillebd);

    // Meme identifiant d'envoi deja present : la personne a revalide
    // apres une reponse perdue. On renvoie ce qui existe deja.
    var idEnvoi = nettoyer(donnees.id_envoi);
    if (idEnvoi) {
      var existante = referenceDejaAttribuee(feuille, idEnvoi);
      if (existante) return reponse(true, "Inscription deja enregistree.", existante);
    }

    var reference = prochaineReference(feuille);

    var ligne = COLONNES.map(function (cle) {
      if (cle === "horodatage") return new Date();
      if (cle === "reference") return reference;
      if (COLONNES_SCRIPT.indexOf(cle) !== -1) return "";
      return enTexte(donnees[cle]);
    });
    feuille.appendRow(ligne);
    var numeroLigne = feuille.getLastRow();

    // Le mail vient APRES l'ecriture, et part TOUT DE SUITE, au nom du
    // compte qui a deploye le script (le proprietaire du classeur).
    envoyerMail(feuille, numeroLigne, donnees, reference, conf);

    return reponse(true, "Inscription enregistree.", reference);
  } catch (err) {
    console.error(err);
    // Le detail remonte au serveur du site (journaux), pas a l'inscrit.
    return reponse(false, "Erreur interne : " + (err && err.message ? err.message : err));
  } finally {
    verrou.releaseLock();
  }
}

// ---------------------------------------------------------------------
// Donnees
// ---------------------------------------------------------------------

function nettoyer(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim().slice(0, LONGUEUR_MAX);
}

/**
 * Force l'ecriture en TEXTE : l'apostrophe initiale est invisible dans
 * la feuille et absente de getValues(). Sans elle, « =… » deviendrait
 * une formule et 0197123456 perdrait son zero.
 */
function enTexte(v) {
  var t = nettoyer(v);
  return t === "" ? "" : "'" + t;
}

/** Comme `nettoyer`, mais sans couper : un fichier encode est long. */
function nettoyerLong(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function champManquant(d) {
  for (var i = 0; i < REQUIS.length; i++) {
    if (nettoyer(d[REQUIS[i]]) === "") return REQUIS[i];
  }
  return null;
}

function feuilleDonnees(nom) {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var nomOnglet = nom && String(nom).trim() ? String(nom).trim() : ONGLET_PAR_DEFAUT;
  var feuille = classeur.getSheetByName(nomOnglet);
  if (!feuille) feuille = classeur.insertSheet(nomOnglet);

  // Onglet vide (ou vide de tout, en-tete compris) : on pose l'en-tete.
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
        "En-tete de l'onglet « " + nomOnglet + " » incorrect en colonne " + (i + 1) +
        " : « " + entete[i] + " » au lieu de « " + COLONNES[i] + " »."
      );
    }
  }
  return feuille;
}

/**
 * L'onglet des paiements, quel que soit son nom.
 *
 * Tolerant comme pour la configuration : tout onglet dont le nom
 * contient « paie » ou « paye » fait l'affaire — « paiements »,
 * « payement », « Paiements 2026 ». Sans onglet, on le cree.
 */
function feuillePaiements() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var feuilles = classeur.getSheets();
  var feuille = null;
  for (var i = 0; i < feuilles.length && !feuille; i++) {
    var nom = normaliser(feuilles[i].getName());
    if (nom.indexOf("paie") !== -1 || nom.indexOf("paye") !== -1) feuille = feuilles[i];
  }
  // Aucun onglet de paiements : on le cree, sous le nom que le
  // classeur de test utilise deja.
  if (!feuille) feuille = classeur.insertSheet("payement");

  if (feuille.getLastRow() === 0) {
    feuille.appendRow(COLONNES_PAIEMENT);
    feuille.setFrozenRows(1);
    return feuille;
  }

  // En-tete absent ou incomplet : on le pose, sans toucher aux lignes
  // deja presentes. Contrairement aux inscriptions, un onglet de
  // paiements cree a la main ne doit pas bloquer un encaissement.
  var entete = feuille
    .getRange(1, 1, 1, COLONNES_PAIEMENT.length)
    .getValues()[0]
    .map(function (v) { return String(v).trim(); });
  var pareil = true;
  for (var c = 0; c < COLONNES_PAIEMENT.length; c++) {
    if (entete[c] !== COLONNES_PAIEMENT[c]) pareil = false;
  }
  if (!pareil && feuille.getLastRow() <= 1) {
    feuille.getRange(1, 1, 1, COLONNES_PAIEMENT.length).setValues([COLONNES_PAIEMENT]);
    feuille.setFrozenRows(1);
  }
  return feuille;
}

/**
 * Le dossier Drive des preuves de paiement.
 *
 * Cree a la premiere declaration et retenu dans les proprietes du
 * script : aucun identifiant a renseigner a la main. Il appartient au
 * compte qui a deploye le script, donc au proprietaire du classeur.
 */
function dossierPreuves() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("dossier_preuves");
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      // Dossier supprime ou hors de portee : on en refait un.
    }
  }
  var dossier = DriveApp.createFolder("NTMS 2026 — preuves de paiement");
  props.setProperty("dossier_preuves", dossier.getId());
  return dossier;
}

/**
 * Range la preuve envoyee par le site et renvoie son adresse.
 *
 * Le fichier arrive encode en base64 — c'est la seule facon de le
 * faire passer dans du JSON. Un envoi sans fichier n'est pas une
 * erreur : la declaration vaut d'etre enregistree, le comite reclamera
 * la preuve.
 */
function rangerPreuve(donnees, reference) {
  var contenu = nettoyerLong(donnees.preuve_base64);
  if (!contenu) return "";
  try {
    var type = nettoyer(donnees.preuve_type) || "application/octet-stream";
    var nom = nettoyer(donnees.preuve_nom) || "preuve";
    var blob = Utilities.newBlob(
      Utilities.base64Decode(contenu),
      type,
      reference + " — " + nom
    );
    var fichier = dossierPreuves().createFile(blob);
    return fichier.getUrl();
  } catch (err) {
    return "Preuve non enregistree : " + (err && err.message ? err.message : err);
  }
}

/** PAY-0001, PAY-0002… Compteur a part, comme pour les inscriptions. */
function prochaineReferencePaiement() {
  var props = PropertiesService.getScriptProperties();
  var n = parseInt(props.getProperty("dernier_paiement") || "", 10);
  if (isNaN(n)) n = 0;
  n += 1;
  props.setProperty("dernier_paiement", String(n));
  return "PAY-" + ("0000" + n).slice(-4);
}

/**
 * Enregistre une declaration de paiement.
 *
 * Elle arrive en « a_verifier » : le site ne decide de rien, il ne
 * fait que transmettre ce que la personne declare, preuve comprise.
 * C'est le comite qui tranche ensuite dans la colonne « statut ».
 */
function enregistrerPaiement(donnees) {
  var verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(30000);
  } catch (err) {
    return reponse(false, "Serveur occupe, reessaie dans un instant.");
  }

  try {
    var feuille = feuillePaiements();
    var reference = prochaineReferencePaiement();
    var preuve = rangerPreuve(donnees, reference);

    var ligne = COLONNES_PAIEMENT.map(function (cle) {
      if (cle === "horodatage") return new Date();
      if (cle === "reference_paiement") return reference;
      if (cle === "statut") return STATUT_DEPOT;
      if (cle === "preuve") return preuve;
      // Colonnes tenues par le comite ou par le menu.
      if (cle === "recu_envoye" || cle === "recu_envoye_le" || cle === "erreur_recu") return "";
      return enTexte(donnees[cle]);
    });
    feuille.appendRow(ligne);
    return reponse(true, "Declaration enregistree.", reference);
  } catch (err) {
    console.error(err);
    return reponse(false, "Erreur interne : " + (err && err.message ? err.message : err));
  } finally {
    verrou.releaseLock();
  }
}

function referenceDejaAttribuee(feuille, idEnvoi) {
  var derniere = feuille.getLastRow();
  if (derniere < 2) return null;
  var colId = COLONNES.indexOf("id_envoi") + 1;
  var colRef = COLONNES.indexOf("reference") + 1;
  var ids = feuille.getRange(2, colId, derniere - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === idEnvoi) {
      return String(feuille.getRange(i + 2, colRef).getValue());
    }
  }
  return null;
}

/**
 * NTMS-0001, NTMS-0002… Un compteur conserve dans les proprietes du
 * script, incremente sous le verrou. Il ne recule JAMAIS : supprimer
 * des lignes de test ne fait pas reattribuer un numero deja envoye par
 * mail. A la premiere execution, il repart du plus grand numero present
 * dans la feuille.
 */
function prochaineReference(feuille) {
  var props = PropertiesService.getScriptProperties();
  var n = parseInt(props.getProperty("dernier_numero") || "", 10);

  if (isNaN(n)) {
    n = 0;
    var derniere = feuille.getLastRow();
    if (derniere > 1) {
      var col = COLONNES.indexOf("reference") + 1;
      var valeurs = feuille.getRange(2, col, derniere - 1, 1).getValues();
      for (var i = 0; i < valeurs.length; i++) {
        var m = String(valeurs[i][0]).match(/(\d+)$/);
        if (m) n = Math.max(n, parseInt(m[1], 10));
      }
    }
  }

  n += 1;
  props.setProperty("dernier_numero", String(n));
  return "NTMS-" + ("0000" + n).slice(-4);
}

// ---------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------

/** « Nom expéditeur » -> « nomexpediteur ». */
function normaliser(libelle) {
  return String(libelle)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Lit l'onglet de reglage d'un modele (MODELES.auto par defaut).
 *
 * La recherche est VOLONTAIREMENT tolerante : tout onglet dont le nom
 * contient « config » est un onglet de reglage, majuscules, accents,
 * espaces et fautes de frappe compris (« Configue Auto » marche). Parmi
 * eux, celui qui contient « manuel » est le mail manuel, les autres
 * l'automatique. Un nom mal ecrit a deja coute une serie de mails.
 */
function lireConfig(modele) {
  var vise = (modele || MODELES.auto).nom;
  var feuille = null;
  var feuilles = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var f = 0; f < feuilles.length; f++) {
    var nom = normaliser(feuilles[f].getName());
    if (nom.indexOf("config") === -1) continue;
    // Trois familles, reconnues au mot-cle present dans le nom.
    var famille = "automatique";
    if (nom.indexOf("manuel") !== -1 || nom.indexOf("manual") !== -1) famille = "manuel";
    else if (nom.indexOf("recu") !== -1 || nom.indexOf("recu") !== -1) famille = "recu";
    if (famille !== vise) continue;
    // A defaut, le premier trouve ; mais « auto » l'emporte pour le
    // modele automatique si plusieurs onglets correspondent.
    if (!feuille || (vise === "automatique" && nom.indexOf("auto") !== -1)) feuille = feuilles[f];
  }
  var conf = {};
  if (!feuille) return conf;
  var plage = feuille.getDataRange();
  var valeurs = plage.getValues();
  // Une adresse collee dans une cellule devient souvent un LIEN : le
  // texte affiche peut alors etre vide, ou porter le titre du fichier.
  // On recupere donc aussi l'adresse du lien.
  var riches = plage.getRichTextValues();
  for (var i = 0; i < valeurs.length; i++) {
    var cle = normaliser(valeurs[i][0]);
    if (!cle) continue;
    var texte = valeurs[i].length > 1 ? String(valeurs[i][1]).trim() : "";
    var lien = "";
    try {
      var riche = riches[i][1];
      lien = (riche && riche.getLinkUrl()) || "";
      if (!lien && riche) {
        // Lien pose sur une partie du texte seulement.
        var morceaux = riche.getRuns();
        for (var r = 0; r < morceaux.length && !lien; r++) {
          lien = morceaux[r].getLinkUrl() || "";
        }
      }
    } catch (err) {
      lien = "";
    }
    // Le lien l'emporte quand la cellule n'affiche pas deja une adresse.
    conf[cle] = lien && texte.indexOf("http") !== 0 ? lien : texte || lien;
  }
  return conf;
}

/**
 * La valeur de la ligne des pieces jointes, quel que soit le libelle
 * ecrit en colonne A : « Pieces jointes », « Piece jointe », « Fichier
 * joint », « PJ »… Toute ligne dont le libelle contient « joint » ou
 * vaut « pj » fait l'affaire.
 */
function valeurPiecesJointes(conf) {
  for (var cle in conf) {
    if (cle.indexOf("joint") !== -1 || cle === "pj") {
      if (conf[cle]) return conf[cle];
    }
  }
  return "";
}

/**
 * Les fichiers a joindre, d'apres la ligne « Pieces jointes » du
 * reglage : liens Google Drive (le fichier doit etre lisible par le
 * compte qui envoie) ou adresses https directes, separes par des
 * virgules. Un fichier introuvable n'empeche pas le mail de partir : il
 * est signale dans `erreurs`.
 *
 * Google limite un mail a 25 Mo, pieces comprises.
 */
function piecesJointes(texte, erreurs) {
  // Decoupage sur les virgules et les retours a la ligne UNIQUEMENT :
  // un nom de fichier contient souvent des espaces.
  return String(texte || "")
    .split(/[,;\n]+/)
    .map(function (u) {
      return u.trim();
    })
    .filter(function (u) {
      return u;
    })
    .map(function (u) {
      var identifiant = (u.match(/[-\w]{25,}/) || [])[0];
      var estDrive = u.indexOf("drive.google.com") !== -1 || u.indexOf("docs.google.com") !== -1;

      // D'ABORD un simple telechargement : aucune autorisation Drive
      // n'est alors necessaire, le fichier devant etre accessible par
      // lien. DriveApp ne sert que de secours, pour un fichier prive.
      if (estDrive && identifiant) {
        var recu = telecharger(
          "https://drive.google.com/uc?export=download&id=" + identifiant
        );
        if (recu) return recu;
      } else if (/^https?:\/\//.test(u)) {
        var direct = telecharger(u);
        if (direct) return direct;
        erreurs.push("Piece jointe ignoree (" + u + ") : telechargement impossible.");
        return null;
      }

      try {
        return DriveApp.getFileById(identifiant || u).getBlob();
      } catch (err) {
        erreurs.push("Piece jointe ignoree (" + u + ") : " + err);
        return null;
      }
    })
    .filter(function (b) {
      return b;
    });
}

/**
 * Telecharge une adresse et renvoie le fichier, ou null. Une page de
 * connexion Google (du HTML) n'est pas un fichier : on la refuse, pour
 * ne pas joindre une page web a la place du document.
 */
function telecharger(adresse) {
  try {
    var reponse = UrlFetchApp.fetch(adresse, { muteHttpExceptions: true, followRedirects: true });
    if (reponse.getResponseCode() !== 200) return null;
    var blob = reponse.getBlob();
    if (String(blob.getContentType()).indexOf("text/html") === 0) return null;

    // Nom du fichier, tel que le serveur l'annonce.
    var entetes = reponse.getAllHeaders();
    var disposition = entetes["Content-Disposition"] || entetes["content-disposition"] || "";
    var nom = String(disposition).match(/filename\*?=(?:UTF-8'')?"?([^";]+)/);
    if (nom) blob.setName(decodeURIComponent(nom[1]));
    return blob;
  } catch (err) {
    return null;
  }
}

/** « a@b.cd, e@f.gh » -> « a@b.cd,e@f.gh », vide si rien de valable. */
function listeAdresses(texte) {
  return String(texte || "")
    .split(/[,;\s]+/)
    .filter(function (a) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a);
    })
    .join(",");
}

// ---------------------------------------------------------------------
// Mail
// ---------------------------------------------------------------------

function echapper(texte) {
  return String(texte === undefined || texte === null ? "" : texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Variables pour du TEXTE BRUT (objet, version texte) : pas d'echappement. */
function remplirTexte(gabarit, valeurs) {
  return String(gabarit || "").replace(/\{\{\s*(\w+)\s*\}\}/g, function (_, cle) {
    return valeurs[cle] === undefined || valeurs[cle] === null ? "" : String(valeurs[cle]);
  });
}

/** Variables pour du HTML : gabarit echappe, puis valeurs echappees. */
function remplirHtml(gabarit, valeurs) {
  return echapper(gabarit).replace(/\{\{\s*(\w+)\s*\}\}/g, function (_, cle) {
    return valeurs[cle] === undefined || valeurs[cle] === null ? "" : echapper(valeurs[cle]);
  });
}

/**
 * HABILLAGE — tous les mails partent dans le meme cadre : en-tete
 * brique a motif avec le logo, bouton orange, pied de page brique uni.
 *
 * Le CONTENU n'impose ni fond ni couleur de texte : il prend ceux de la
 * boite mail du lecteur, blanc en theme clair, noir en theme sombre.
 * C'est la seule facon de suivre le theme partout, Gmail compris.
 * Seul le CONTENU vient de l'onglet config (Images, Titre, Corps,
 * bouton) ; la reference s'affiche quand elle existe.
 *
 * Les images sont servies depuis le depot GitHub public du site : elles
 * n'apparaissent qu'une fois le dossier public/mail pousse. Sans elles,
 * le mail reste lisible : fond brique uni, « NTMS 2026 » en texte.
 * URL_IMAGES = "" force cette version sans image.
 *
 * Mise en page en TABLEAUX et styles en ligne : c'est la seule forme
 * que Gmail, Outlook et les applis de telephone respectent toutes.
 */
var URL_IMAGES = "https://raw.githubusercontent.com/hantanHugues/NTMS_2026/main/public/mail/";

var CHARTE = {
  brique: "#562213",
  orange: "#FF7A00",
  nuit: "#001724",
  creme: "#FFEBD1",
  // Lisibles sur fond clair ET sur fond sombre : le contenu prend les
  // couleurs de la boite mail du lecteur.
  libelle: "#E06A00",
  filet: "rgba(128,128,128,0.3)",
  police: "Lato,'Helvetica Neue',Helvetica,Arial,sans-serif",
};

var EVENEMENT = {
  dates: "18 – 22 novembre 2026",
  datesCourtes: "18 – 22 nov. 2026",
  lieu: "Lokossa, Bénin",
  theme: "20 ans d'existence : élever nos standards pour un meilleur impact.",
  // Le mail de la conference : c'est lui qui recoit les reponses.
  email: "aibconferences@gmail.com",
  // Et l'organisation derriere l'edition, telle qu'elle se presente sur
  // aiesec.bj. Le pied du mail signe AIESEC in Benin, pas la conference.
  organisation: "AIESEC in Benin",
  site: "aiesec.bj",
  lienSite: "https://www.aiesec.bj/",
  emailOrganisation: "benin@aiesec.net",
  telephone: "+229 01 69 01 63 83",
  instagram: "@aiesecinbenin",
  lienInstagram: "https://www.instagram.com/aiesecinbenin/",
  facebook: "AIESEC in Benin",
  lienFacebook: "https://www.facebook.com/AIESECinBENIN",
  lienLinkedin: "https://www.linkedin.com/company/aiesecinbenin",
};

function construireHtml(conf, valeurs) {
  var C = CHARTE;
  var E = EVENEMENT;
  var police = "font-family:" + C.police + ";";

  var images = String(conf.images || "")
    .split(/[,\s]+/)
    .filter(function (u) {
      return /^https?:\/\//.test(u);
    })
    .map(function (u) {
      return '<tr><td style="padding:0 0 28px"><img src="' + echapper(u) + '" alt="" width="496" ' +
        'style="display:block;width:100%;max-width:496px;height:auto;border:0;border-radius:12px"></td></tr>';
    })
    .join("");

  var titre = conf.titre
    ? '<tr><td style="' + police + 'padding:0 0 18px;font-size:22px;line-height:1.3;font-weight:900">' + remplirHtml(conf.titre, valeurs) + "</td></tr>"
    : "";

  var corps = remplirHtml(conf.corps || "", valeurs)
    .split(/\n\s*\n/)
    .map(function (bloc) {
      return '<tr><td style="' + police + 'padding:0 0 18px;font-size:16px;line-height:1.7">' +
        bloc.replace(/\n/g, "<br>") + "</td></tr>";
    })
    .join("");

  // Bouton « a l'epreuve des balles » : la couleur est sur la CELLULE,
  // le lien la remplit. Outlook affiche un bouton, sans les arrondis.
  var bouton = conf.liencta && conf.textecta
    ? '<tr><td style="padding:14px 0 10px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td bgcolor="' + C.orange + '" style="border-radius:999px">' +
      '<a href="' + echapper(conf.liencta) + '" target="_blank" style="' + police +
      "display:inline-block;padding:15px 28px;font-size:16px;font-weight:900;color:" + C.nuit +
      ';text-decoration:none;border-radius:999px">' + echapper(conf.textecta) + "</a></td></tr></table></td></tr>" +
      // Le lien en toutes lettres, pour qui prefere le copier ou dont la
      // boite mail bloque le bouton.
      '<tr><td style="' + police + 'padding:4px 0 18px;font-size:13px;line-height:1.6;opacity:0.8">' +
      "Ou copie ce lien :<br>" +
      '<a href="' + echapper(conf.liencta) + '" target="_blank" style="color:' + C.libelle +
      ';word-break:break-all">' + echapper(conf.liencta) + "</a></td></tr>"
    : "";

  function info(libelle, valeur) {
    return '<td class="colonne" valign="top" style="' + police + 'padding:0 12px 12px 0">' +
      '<div style="font-size:12px;font-weight:700;color:' + C.libelle + '">' + libelle + "</div>" +
      '<div style="font-size:14px;font-weight:700;padding-top:2px">' + echapper(valeur) + "</div></td>";
  }
  var infos = info("Quand", E.datesCourtes) + info("Où", E.lieu) +
    (valeurs.reference ? info("Référence", valeurs.reference) : "");

  // Debut du corps, affiche par les boites mail a cote de l'objet.
  var apercu = echapper(remplirTexte(conf.corps || "", valeurs).replace(/\s+/g, " ").slice(0, 120));

  var logo = URL_IMAGES
    ? '<img src="' + URL_IMAGES + 'logo-blanc.png" alt="NTMS 2026" width="80" style="' + police +
      'display:block;width:80px;height:auto;border:0;color:#FFFFFF;font-size:20px;font-weight:900">'
    : '<span style="' + police + 'font-size:22px;font-weight:900;color:#FFFFFF">NTMS 2026</span>';
  var motif = URL_IMAGES
    ? "background-image:url(" + URL_IMAGES + "motif-brique.jpg);background-size:550px auto;background-repeat:repeat;"
    : "";

  return (
    '<!doctype html><html lang="fr"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">' +
    '<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&amp;display=swap" rel="stylesheet">' +
    "<style>@media only screen and (max-width:620px){" +
    ".cadre{width:100%!important}" +
    ".marge{padding-left:24px!important;padding-right:24px!important}" +
    ".colonne{display:block!important;width:100%!important}" +
    ".droite{text-align:left!important;padding-top:14px!important}" +
    "}</style></head>" +
    '<body style="margin:0;padding:0">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + apercu + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:32px 12px">' +
    '<table role="presentation" class="cadre" width="600" cellpadding="0" cellspacing="0" border="0" ' +
    'style="width:600px;max-width:600px;border-radius:16px;overflow:hidden">' +

    // En-tete : brique et motif
    '<tr><td class="marge" bgcolor="' + C.brique + '" style="background-color:' + C.brique + ";" + motif +
    'padding:30px 52px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td class="colonne" valign="middle">' + logo + "</td>" +
    '<td class="colonne droite" valign="middle" align="right" style="' + police +
    "font-size:13px;line-height:1.5;color:" + C.creme + '">' + echapper(E.dates) + "<br>" + echapper(E.lieu) + "</td>" +
    "</tr></table></td></tr>" +

    // Contenu (config)
    '<tr><td class="marge" style="padding:44px 52px 22px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    images + titre + corps + bouton + "</table></td></tr>" +

    // Bande d'informations
    '<tr><td class="marge" style="padding:0 52px 40px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ' +
    C.filet + ";border-bottom:1px solid " + C.filet + '"><tr><td style="padding:20px 0 8px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + infos +
    "</tr></table></td></tr></table></td></tr>" +

    // Pied de page : brique uni
    '<tr><td class="marge" bgcolor="' + C.brique + '" style="' + police + "background-color:" + C.brique +
    ';padding:30px 52px 34px;font-size:12px;line-height:1.6;color:#F3D9C4">' +
    '<div style="font-size:14px;font-weight:700;color:' + C.creme + ';padding-bottom:10px">' + echapper(E.theme) + "</div>" +
    // L'organisation d'abord : site, mail et numero d'AIESEC in Benin.
    '<a href="' + E.lienSite + '" style="color:' + C.orange + ';text-decoration:none">' + E.organisation +
    " &middot; " + E.site + "</a><br>" +
    '<a href="mailto:' + E.emailOrganisation + '" style="color:' + C.orange + ';text-decoration:none">' +
    E.emailOrganisation + "</a> &middot; " + E.telephone + "<br>" +
    '<a href="' + E.lienInstagram + '" style="color:' + C.orange + ';text-decoration:none">Instagram ' +
    E.instagram + "</a> &middot; " +
    '<a href="' + E.lienFacebook + '" style="color:' + C.orange + ';text-decoration:none">Facebook</a> &middot; ' +
    '<a href="' + E.lienLinkedin + '" style="color:' + C.orange + ';text-decoration:none">LinkedIn</a>' +
    // La conference garde sa propre adresse : c'est elle qui repond aux
    // questions sur l'edition.
    '<div style="padding-top:10px">Questions sur le NTMS 2026 : ' +
    '<a href="mailto:' + E.email + '" style="color:' + C.orange + ';text-decoration:none">' + E.email +
    "</a></div></td></tr>" +

    "</table></td></tr></table></body></html>"
  );
}

/** Version texte, envoyee avec la version HTML : meilleur accueil anti-spam. */
function construireTexte(conf, valeurs) {
  var morceaux = [];
  if (conf.titre) morceaux.push(remplirTexte(conf.titre, valeurs));
  morceaux.push(remplirTexte(conf.corps || "", valeurs));
  if (conf.liencta && conf.textecta) morceaux.push(conf.textecta + " : " + conf.liencta);
  morceaux.push("Référence : " + valeurs.reference);
  return morceaux.join("\n\n");
}

/**
 * Envoie le mail d'une ligne et renvoie ce qui s'est passe : "oui",
 * "non" (echec, voir erreur_mail), "desactive", ou "quota" quand le
 * quota du jour est epuise. Le detail de chaque ligne se lit dans la
 * feuille.
 */
function envoyerMail(feuille, numeroLigne, donnees, reference, conf, modele) {
  modele = modele || MODELES.auto;
  var colEnvoye = COLONNES.indexOf(modele.etat) + 1;
  var colDate = COLONNES.indexOf(modele.date) + 1;
  var colErreur = COLONNES.indexOf(modele.erreur) + 1;

  if (!ENVOI_ACTIF) {
    feuille.getRange(numeroLigne, colEnvoye).setValue("desactive");
    return "desactive";
  }
  if (!conf.objet || !conf.corps) {
    feuille.getRange(numeroLigne, colEnvoye).setValue("non");
    feuille.getRange(numeroLigne, colErreur).setValue(
      "Onglet « " + modele.onglets[0] + " » incomplet : Objet et Corps sont obligatoires."
    );
    return "non";
  }

  var valeurs = {
    prenom: nettoyer(donnees.prenom),
    nom: nettoyer(donnees.nom),
    lc: nettoyer(donnees.lc),
    role: nettoyer(donnees.role),
    reference: reference,
  };

  try {
    var options = {
      to: nettoyer(donnees.email),
      subject: remplirTexte(conf.objet, valeurs),
      body: construireTexte(conf, valeurs),
      htmlBody: construireHtml(conf, valeurs),
      name: conf.nomexpediteur || "AIESEC in Benin",
    };
    var cc = listeAdresses(conf.cc);
    var bcc = listeAdresses(conf.bcc);
    if (cc) options.cc = cc;
    if (bcc) options.bcc = bcc;

    var soucis = [];
    var fichiers = piecesJointes(valeurPiecesJointes(conf), soucis);
    if (fichiers.length) options.attachments = fichiers;

    // Le quota se compte en destinataires : l'inscrit, plus CC et BCC.
    var destinataires = 1 + (cc ? cc.split(",").length : 0) + (bcc ? bcc.split(",").length : 0);
    if (MailApp.getRemainingDailyQuota() < destinataires) {
      feuille.getRange(numeroLigne, colEnvoye).setValue("non");
      feuille.getRange(numeroLigne, colErreur).setValue(
        "Quota de mails du jour atteint : relancer l'envoi demain depuis le menu NTMS."
      );
      return "quota";
    }

    MailApp.sendEmail(options);
    feuille.getRange(numeroLigne, colEnvoye).setValue("oui");
    feuille.getRange(numeroLigne, colDate).setValue(new Date());
    // Le mail est parti ; une piece jointe manquante est signalee ici.
    feuille.getRange(numeroLigne, colErreur).setValue(soucis.join(" | "));
    return "oui";
  } catch (err) {
    feuille.getRange(numeroLigne, colEnvoye).setValue("non");
    feuille.getRange(numeroLigne, colErreur).setValue(String(err));
    return "non";
  }
}

// ---------------------------------------------------------------------
// Envois a la demande, depuis le menu NTMS
// ---------------------------------------------------------------------

/**
 * QUI ENVOIE — le compte qui a deploye le script (proprietaire du
 * classeur) pour le mail d'inscription, et le compte qui clique pour
 * les envois du menu. Aucune tache automatique : tout part tout de
 * suite.
 *
 * QUOTA — 1 500 destinataires par jour sur un compte Google Workspace,
 * 100 sur un compte Gmail ordinaire. Au-dela, le script s'arrete, le
 * dit, et les lignes non servies portent l'explication dans leur
 * colonne d'erreur. Il suffit de relancer le lendemain.
 */

/** Ajoute le menu NTMS a l'ouverture du classeur. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("NTMS")
    .addItem("Envoyer le mail manuel à tous les inscrits", "envoyerManuelTous")
    .addItem("Envoyer le mail manuel à ceux qui ne l'ont pas reçu", "envoyerManuelNonRecus")
    .addSeparator()
    .addItem("Envoyer le mail automatique à ceux qui ne l'ont pas reçu", "envoyerLesMailsEnAttente")
    .addSeparator()
    .addItem("Envoyer les reçus aux paiements validés", "envoyerLesRecus")
    .addSeparator()
    .addItem("M'envoyer un aperçu du mail automatique", "testerLeMail")
    .addItem("M'envoyer un aperçu du mail manuel", "testerLeMailManuel")
    .addItem("M'envoyer un aperçu du reçu", "testerLeRecu")
    .addToUi();
}

function envoyerManuelTous() {
  demanderPuisEnvoyer(MODELES.manuel, function () {
    return true;
  }, "Envoyer le mail manuel à TOUS les inscrits, y compris ceux à qui il a déjà été envoyé ?");
}

/** Le mail manuel a ceux qui ne l'ont pas encore recu. */
function envoyerManuelNonRecus() {
  demanderPuisEnvoyer(MODELES.manuel, nonRecu,
    "Envoyer le mail manuel aux inscrits qui ne l'ont pas encore reçu ?");
}

/** Le mail d'inscription a ceux dont il n'est pas parti : echec, quota. */
function envoyerLesMailsEnAttente() {
  demanderPuisEnvoyer(MODELES.auto, nonRecu,
    "Envoyer le mail automatique aux inscrits qui ne l'ont pas reçu ?");
}

/**
 * LES RECUS DE PAIEMENT.
 *
 * Le site ne decide de rien : il depose des declarations en
 * « a_verifier ». Le comite regarde la preuve, puis ecrit « valide »
 * dans la colonne « statut ». Ce bouton envoie alors le recu a TOUS
 * les paiements valides qui n'en ont pas encore recu — pas de
 * selection ligne par ligne, on trie par la colonne.
 *
 * Le contenu du recu se regle dans l'onglet « config recu », avec les
 * memes libelles que les autres mails. Variables disponibles :
 * {{nom}}, {{reference}} (celle du paiement), {{montant}}, {{moyen}}.
 */
function envoyerLesRecus() {
  var ui = SpreadsheetApp.getUi();
  var conf = lireConfig(MODELES.recu);
  if (!conf.objet || !conf.corps) {
    ui.alert("L'onglet « config recu » est incomplet : remplis Objet et Corps.");
    return;
  }

  var feuille = feuillePaiements();
  var valeurs = feuille.getDataRange().getValues();
  var i0 = {};
  COLONNES_PAIEMENT.forEach(function (cle, i) {
    i0[cle] = i;
  });

  var aEnvoyer = 0;
  for (var i = 1; i < valeurs.length; i++) {
    if (String(valeurs[i][i0.statut]).trim().toLowerCase() !== STATUT_VALIDE) continue;
    if (String(valeurs[i][i0.recu_envoye]).trim().toLowerCase() === "oui") continue;
    if (!valeurs[i][i0.email]) continue;
    aEnvoyer++;
  }
  if (!aEnvoyer) {
    ui.alert("Aucun paiement valide en attente de recu.");
    return;
  }
  if (
    ui.alert(
      "Recus de paiement",
      "Envoyer le recu a " + aEnvoyer + " paiement(s) valide(s) ?",
      ui.ButtonSet.OK_CANCEL
    ) !== ui.Button.OK
  ) {
    return;
  }

  var verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  var envoyes = 0;
  var echecs = 0;
  var quota = false;
  try {
    for (var j = 1; j < valeurs.length; j++) {
      if (String(valeurs[j][i0.statut]).trim().toLowerCase() !== STATUT_VALIDE) continue;
      if (String(valeurs[j][i0.recu_envoye]).trim().toLowerCase() === "oui") continue;
      var destinataire = String(valeurs[j][i0.email]).trim();
      if (!destinataire) continue;

      var variables = {
        nom: String(valeurs[j][i0.nom]),
        prenom: String(valeurs[j][i0.nom]),
        reference: String(valeurs[j][i0.reference_paiement]),
        montant: String(valeurs[j][i0.montant_declare]),
        moyen: String(valeurs[j][i0.moyen]),
      };

      if (quota || MailApp.getRemainingDailyQuota() < 1) {
        quota = true;
        continue;
      }
      try {
        MailApp.sendEmail({
          to: destinataire,
          subject: remplirTexte(conf.objet, variables),
          body: construireTexte(conf, variables),
          htmlBody: construireHtml(conf, variables),
          name: conf.nomexpediteur || "AIESEC in Benin",
        });
        feuille.getRange(j + 1, i0.recu_envoye + 1).setValue("oui");
        feuille.getRange(j + 1, i0.recu_envoye_le + 1).setValue(new Date());
        feuille.getRange(j + 1, i0.erreur_recu + 1).setValue("");
        envoyes++;
      } catch (err) {
        feuille.getRange(j + 1, i0.recu_envoye + 1).setValue("non");
        feuille.getRange(j + 1, i0.erreur_recu + 1).setValue(String(err));
        echecs++;
      }
    }
  } finally {
    verrou.releaseLock();
  }

  ui.alert(
    "Recus envoyes : " + envoyes +
    (echecs ? "\nEchecs : " + echecs + " (voir la colonne d'erreur)" : "") +
    (quota ? "\n\nQuota du jour atteint : relance demain, les recus deja envoyes ne repartiront pas." : "")
  );
}

/** Le meme apercu que pour les autres mails, pour le recu. */
function testerLeRecu() {
  testerLeMail(MODELES.recu);
}

/** Tout ce qui n'est pas « oui » reste a envoyer. */
function nonRecu(etat) {
  return etat !== "oui";
}

/** Confirme, envoie, puis dit ce qui s'est passe. */
function demanderPuisEnvoyer(modele, aTraiter, question) {
  var ui = SpreadsheetApp.getUi();
  var conf = lireConfig(modele);
  if (!conf.objet || !conf.corps) {
    ui.alert("L'onglet de réglage du mail " + modele.nom + " est incomplet : remplis Objet et Corps.");
    return;
  }
  if (ui.alert("Mail " + modele.nom, question, ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;

  var bilan = envoyerAChacun(modele, aTraiter, conf);
  if (bilan.envoyes + bilan.echecs + bilan.restants === 0) {
    ui.alert("Aucun inscrit concerné : rien n'a été envoyé.");
    return;
  }
  ui.alert(
    "Mails envoyés : " + bilan.envoyes +
    (bilan.echecs ? "\nÉchecs : " + bilan.echecs + " (voir la colonne d'erreur)" : "") +
    (bilan.quota
      ? "\n\nQuota du jour atteint : " + bilan.restants + " inscrit(s) n'ont rien reçu. " +
        "Relance demain le même envoi, en choisissant « … à ceux qui ne l'ont pas reçu »."
      : "")
  );
}

/**
 * Envoie le mail a chaque ligne retenue, une par une. S'arrete net si le
 * quota du jour est epuise, et dit combien de lignes restaient.
 */
function envoyerAChacun(modele, aTraiter, conf) {
  var verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  var bilan = { envoyes: 0, echecs: 0, quota: false, restants: 0 };
  try {
    var feuille = feuilleDonnees(lireConfig(MODELES.auto).nomfeuillebd);
    var valeurs = feuille.getDataRange().getValues();
    var i0 = {};
    COLONNES.forEach(function (cle, i) {
      i0[cle] = i;
    });

    for (var i = 1; i < valeurs.length; i++) {
      if (!valeurs[i][i0.email]) continue;
      if (!aTraiter(String(valeurs[i][i0[modele.etat]]).toLowerCase())) continue;

      if (bilan.quota) {
        bilan.restants++;
        continue;
      }
      var donnees = {};
      COLONNES.forEach(function (cle) {
        donnees[cle] = valeurs[i][i0[cle]];
      });
      var etat = envoyerMail(feuille, i + 1, donnees, donnees.reference, conf, modele);
      if (etat === "oui") bilan.envoyes++;
      else if (etat === "quota") {
        bilan.quota = true;
        bilan.restants++;
      } else bilan.echecs++;
    }
  } finally {
    verrou.releaseLock();
  }
  return bilan;
}

// ---------------------------------------------------------------------
// Outils a lancer depuis l'editeur (bouton Run)
// ---------------------------------------------------------------------

/**
 * A LANCER UNE FOIS AVANT TOUT TEST.
 * Declenche la demande d'autorisation (feuille, proprietes, envoi de
 * mail) et s'envoie le mail a soi-meme pour en voir le rendu.
 */
function testerLeMail(modele) {
  modele = modele || MODELES.auto;
  var conf = lireConfig(modele);
  if (!conf.objet || !conf.corps) {
    throw new Error("Onglet de réglage du mail " + modele.nom + " incomplet : Objet et Corps sont obligatoires.");
  }
  var valeurs = {
    prenom: "Test", nom: "Utilisateur", lc: "Cotonou", role: "TM",
    reference: modele === MODELES.recu ? "PAY-TEST" : "NTMS-TEST",
    montant: "15000", moyen: "MTN MoMo",
  };
  var compte = Session.getEffectiveUser().getEmail();
  var soucis = [];
  var options = {
    to: compte,
    subject: "[TEST " + modele.nom + "] " + remplirTexte(conf.objet, valeurs),
    body: construireTexte(conf, valeurs),
    htmlBody: construireHtml(conf, valeurs),
    name: conf.nomexpediteur || "AIESEC in Benin",
  };
  var fichiers = piecesJointes(valeurPiecesJointes(conf), soucis);
  if (fichiers.length) options.attachments = fichiers;
  MailApp.sendEmail(options);
  if (soucis.length) Logger.log(soucis.join(" | "));
  Logger.log("Mail " + modele.nom + " envoye a " + compte + ". Quota restant aujourd'hui : " +
    MailApp.getRemainingDailyQuota() + " destinataires.");
}

/** Le meme apercu, pour le mail manuel. */
function testerLeMailManuel() {
  testerLeMail(MODELES.manuel);
}

function reponse(ok, message, reference) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: ok, message: message, reference: reference || null })
  ).setMimeType(ContentService.MimeType.JSON);
}
