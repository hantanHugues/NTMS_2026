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
  // Ajoutees APRES les autres : un onglet existant garde ses colonnes.
  "pack",
  "montant_du",
  "tranche",
];

/**
 * LES PACKS. Un onglet « packs » (nom, prix), cree avec ces trois lignes
 * s'il n'existe pas. Le comite change les noms et les prix dans
 * l'onglet : le site les lit a chaque visite, rien a redeployer.
 * Le prix du pack est recopie sur la premiere ligne de la personne :
 * un changement de tarif ne touche pas les inscrits existants.
 */
var PACKS_PAR_DEFAUT = [
  ["Pack 1", 5000],
  ["Pack 2", 10000],
  ["Pack 3", 15000],
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
  // Avant de payer : qui est cette personne, que lui reste-t-il a payer ?
  if (String(donnees.type || "") === "situation") {
    return situationPaiement(donnees);
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
  // Onglet plus ancien que les colonnes pack / montant_du / tranche :
  // on pose seulement les en-tetes vides, sans rien deplacer.
  for (var k = 0; k < COLONNES_PAIEMENT.length; k++) {
    if (entete[k] === "" || entete[k] === undefined) {
      feuille.getRange(1, k + 1).setValue(COLONNES_PAIEMENT[k]);
    }
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

/** Les chiffres seuls : « +229 01 97 12 34 56 » -> « 2290197123456 ». */
function chiffres(v) {
  return String(v === null || v === undefined ? "" : v).replace(/\D/g, "");
}

/** Un montant ecrit « 10 000 » ou « 10000 FCFA » -> 10000. */
function enMontant(v) {
  var n = parseInt(chiffres(v), 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Les packs proposes, lus dans l'onglet « packs » (tout onglet dont le
 * nom contient « pack »). Sans onglet, on le cree avec les valeurs par
 * defaut.
 *
 * Trois colonnes : A le nom (« Delegate - Package 3 »), B le prix, C la
 * description (facultative) : un element par virgule ou par ligne, que
 * le site affiche en points. Une ligne sans description reste valable.
 */
function lirePacks() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var feuilles = classeur.getSheets();
  var feuille = null;
  for (var i = 0; i < feuilles.length && !feuille; i++) {
    if (normaliser(feuilles[i].getName()).indexOf("pack") !== -1) feuille = feuilles[i];
  }
  if (!feuille) {
    feuille = classeur.insertSheet("packs");
    feuille.appendRow(["nom", "prix", "description"]);
    PACKS_PAR_DEFAUT.forEach(function (l) { feuille.appendRow(l); });
    feuille.setFrozenRows(1);
  }
  var valeurs = feuille.getDataRange().getValues();
  var packs = [];
  for (var r = 1; r < valeurs.length; r++) {
    var nom = String(valeurs[r][0]).trim();
    var prix = enMontant(valeurs[r][1]);
    if (nom && prix > 0) {
      packs.push({ nom: nom, prix: prix, description: String(valeurs[r][2] || "").trim() });
    }
  }
  return packs;
}

/**
 * L'ONGLET « participants » : UNE LIGNE PAR PERSONNE.
 *
 * Calcule par le script a partir de l'onglet des paiements, jamais saisi
 * a la main : nom, pack, montant du, total valide, reste a payer,
 * nombre de tranches et statut. Il est refait a chaque declaration, a
 * chaque modification de la colonne « statut » et depuis le menu NTMS.
 * Une personne = un e-mail + un numero.
 */
var COLONNES_PARTICIPANTS = [
  "nom", "email", "numero", "pack", "montant_du", "total_valide",
  "en_attente", "reste_a_payer", "tranches", "statut", "dernier_paiement",
];

function feuilleParticipants() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var feuilles = classeur.getSheets();
  for (var i = 0; i < feuilles.length; i++) {
    if (normaliser(feuilles[i].getName()).indexOf("particip") !== -1) return feuilles[i];
  }
  return classeur.insertSheet("participants");
}

function recalculerParticipants() {
  var paiements = feuillePaiements().getDataRange().getValues();
  var i0 = indexColonnesPaiement();
  var groupes = {};
  var ordre = [];

  for (var i = 1; i < paiements.length; i++) {
    var email = String(paiements[i][i0.email]).trim().toLowerCase();
    if (!email) continue;
    var cle = email + "|" + chiffres(paiements[i][i0.numero]);
    var g = groupes[cle];
    if (!g) {
      g = groupes[cle] = {
        nom: String(paiements[i][i0.nom]),
        email: email,
        numero: String(paiements[i][i0.numero]),
        pack: "", du: 0, valide: 0, attente: 0, tranches: 0, dernier: null,
      };
      ordre.push(cle);
    }
    var statut = String(paiements[i][i0.statut]).trim().toLowerCase();
    if (statut === "refuse") continue;

    var pack = String(paiements[i][i0.pack] || "").trim();
    if (!g.pack && pack) {
      g.pack = pack;
      g.du = enMontant(paiements[i][i0.montant_du]);
    }
    var montant = enMontant(paiements[i][i0.montant_declare]);
    if (statut === STATUT_VALIDE) g.valide += montant;
    else g.attente += montant;
    g.tranches++;
    var date = paiements[i][i0.horodatage];
    if (date instanceof Date && (!g.dernier || date > g.dernier)) g.dernier = date;
  }

  var lignes = ordre.map(function (cle) {
    var g = groupes[cle];
    var etat = g.du > 0 && g.valide >= g.du ? "Soldé"
      : g.valide > 0 ? "En cours"
      : "En attente de validation";
    return [
      g.nom, g.email, g.numero, g.pack, g.du || "", g.valide, g.attente,
      g.du > 0 ? g.du - g.valide : "", g.tranches, etat, g.dernier || "",
    ];
  });

  var feuille = feuilleParticipants();
  feuille.clearContents();
  feuille.getRange(1, 1, 1, COLONNES_PARTICIPANTS.length).setValues([COLONNES_PARTICIPANTS]);
  if (lignes.length) {
    feuille.getRange(2, 1, lignes.length, COLONNES_PARTICIPANTS.length).setValues(lignes);
  }
  feuille.setFrozenRows(1);
  feuille.getRange(1, 1).setNote(
    "Onglet calculé par le script à partir des paiements : ne pas le modifier à la main. " +
    "Menu NTMS → Recalculer les participants."
  );
}

/** Une modification de la colonne « statut » met les totaux a jour. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var feuille = e.range.getSheet();
    var nom = normaliser(feuille.getName());
    if (nom.indexOf("paie") === -1 && nom.indexOf("paye") === -1) return;
    recalculerParticipants();
  } catch (err) {
    console.error(err);
  }
}

/**
 * LA FACTURE — INDEPENDANTE DU MAIL.
 *
 * Trois chiffres, et rien d'autre :
 *
 *   paiement_actuel   ce paiement-ci
 *   total_paye        tout ce que la personne a paye, valide
 *   reste             ce qu'il lui reste a payer
 *
 * Ils sont lus dans l'onglet des paiements (le paiement actuel) ET dans
 * l'onglet « participants » (le total et le reste, calcules sur tous
 * les paiements valides). Le mail ne calcule RIEN : il recoit ces
 * variables toutes faites, et le comite en ecrit le texte comme il
 * veut dans « config recu ».
 *
 *   {{facture}}   le bloc des trois chiffres : paiement actuel, total
 *                 paye, puis « Reste a payer » — ou « Pack solde » quand
 *                 ce paiement solde le pack. Dans ce dernier cas le
 *                 bouton est celui de la colonne D (groupe WhatsApp).
 *   {{paiement_actuel}} {{total_paye}} {{reste}}   les chiffres seuls,
 *                 toujours remplis, pour un texte ecrit a la main.
 */

/** 10000 -> « 10 000 ». */
function montantLisible(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * L'onglet « participants » en memoire : une lecture pour tout l'envoi,
 * indexee par e-mail + numero comme partout ailleurs.
 */
function indexParticipants() {
  var valeurs = feuilleParticipants().getDataRange().getValues();
  var p0 = {};
  COLONNES_PARTICIPANTS.forEach(function (cle, i) { p0[cle] = i; });
  var index = {};
  for (var i = 1; i < valeurs.length; i++) {
    var email = String(valeurs[i][p0.email]).replace(/^'/, "").trim().toLowerCase();
    if (!email) continue;
    index[email + "|" + chiffres(valeurs[i][p0.numero])] = {
      pack: String(valeurs[i][p0.pack] || ""),
      montant_du: enMontant(valeurs[i][p0.montant_du]),
      total_valide: enMontant(valeurs[i][p0.total_valide]),
    };
  }
  return index;
}

/**
 * Les chiffres de la facture pour UNE ligne de l'onglet des paiements.
 * `index` vient de indexParticipants().
 */
function calculerFacture(ligne, i0, index) {
  var email = String(ligne[i0.email]).replace(/^'/, "").trim().toLowerCase();
  var part = index[email + "|" + chiffres(ligne[i0.numero])] || null;

  var actuel = enMontant(ligne[i0.montant_declare]);
  var du = (part && part.montant_du) || enMontant(ligne[i0.montant_du]);
  var total = part ? part.total_valide : actuel;
  return {
    paiement_actuel: actuel,
    total_paye: total,
    montant_du: du,
    reste: du > 0 ? Math.max(du - total, 0) : 0,
    pack: (part && part.pack) || String(ligne[i0.pack] || ""),
  };
}

/** Toutes les variables du mail de recu pour une ligne validee. */
function variablesRecu(ligne, i0, index) {
  var f = calculerFacture(ligne, i0, index);
  var soldee = f.montant_du > 0 && f.reste === 0;
  // Toujours un bloc : reste a payer tant qu'il y a un solde, « Pack
  // solde » au dernier paiement. La personne a TOUJOURS sa facture.
  var bloc =
    "Paiement actuel : " + montantLisible(f.paiement_actuel) + " FCFA\n" +
    "Total payé : " + montantLisible(f.total_paye) + " FCFA\n" +
    (soldee ? "Pack soldé ✓" : "Reste à payer : " + montantLisible(f.reste) + " FCFA");
  return {
    nom: String(ligne[i0.nom]),
    prenom: String(ligne[i0.nom]),
    reference: String(ligne[i0.reference_paiement]),
    moyen: String(ligne[i0.moyen]),
    pack: f.pack,
    tranche: String(ligne[i0.tranche] || ""),
    montant: montantLisible(f.paiement_actuel),
    montant_du: montantLisible(f.montant_du),
    paiement_actuel: montantLisible(f.paiement_actuel),
    total_paye: montantLisible(f.total_paye),
    total_valide: montantLisible(f.total_paye),
    reste: montantLisible(f.reste),
    facture: bloc,
    // « oui » quand ce paiement solde le pack : sert a retirer le
    // bouton « prochaine tranche », pas a remplir le mail.
    soldee: soldee ? "oui" : "",
  };
}

/**
 * Qui est cette personne, d'apres les paiements deja deposes ?
 *
 * Reconnue = l'e-mail ET le numero correspondent a une meme ligne.
 * Un seul des deux connu = « blocage » : on ne rattache rien et on ne
 * cree pas de doublon, le comite tranche. Les paiements refuses ne
 * comptent ni dans le total, ni dans les tranches.
 */
function trouverPersonne(valeurs, i0, email, numero) {
  var mail = String(email || "").trim().toLowerCase();
  var tel = chiffres(numero);
  var meme = { connu: false, blocage: false };
  var emailVu = false;
  var numeroVu = false;
  var premiere = null;
  var valide = 0;
  var attente = 0;
  var tranches = 0;

  for (var i = 1; i < valeurs.length; i++) {
    // Le « ' » de tete (marqueur de texte) n'est jamais dans la valeur
    // lue, mais on ne compte pas dessus.
    var e = String(valeurs[i][i0.email]).replace(/^'/, "").trim().toLowerCase();
    var n = chiffres(valeurs[i][i0.numero]);
    var memeMail = !!mail && e === mail;
    var memeNum = !!tel && n === tel;
    if (memeMail) emailVu = true;
    if (memeNum) numeroVu = true;
    if (!(memeMail && memeNum)) continue;

    var statut = String(valeurs[i][i0.statut]).trim().toLowerCase();
    if (statut === "refuse") continue;
    if (!premiere) premiere = valeurs[i];
    tranches++;
    var montant = enMontant(valeurs[i][i0.montant_declare]);
    if (statut === STATUT_VALIDE) valide += montant;
    else attente += montant;
  }

  if (!premiere) {
    // Personne n'a les deux : si l'un des deux existe ailleurs, on bloque.
    meme.blocage = emailVu || numeroVu;
    return meme;
  }
  var du = enMontant(premiere[i0.montant_du]);
  return {
    connu: true,
    blocage: false,
    nom: String(premiere[i0.nom]),
    pack: String(premiere[i0.pack] || "").trim(),
    montant_du: du,
    valide: valide,
    attente: attente,
    reste: du > 0 ? du - valide : 0,
    tranche: tranches + 1,
  };
}

function indexColonnesPaiement() {
  var i0 = {};
  COLONNES_PAIEMENT.forEach(function (cle, i) { i0[cle] = i; });
  return i0;
}

/**
 * Repond a l'ecran d'identification : les packs, et ce que l'on sait de
 * la personne. Ne renvoie QUE nom, pack et montants — jamais la preuve
 * ni le numero d'une autre personne.
 */
function situationPaiement(donnees) {
  try {
    var packs = lirePacks();
    var feuille = feuillePaiements();
    var valeurs = feuille.getDataRange().getValues();
    var s = trouverPersonne(valeurs, indexColonnesPaiement(), donnees.email, donnees.numero);
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        packs: packs,
        connu: !!s.connu,
        blocage: !!s.blocage,
        nom: s.nom || "",
        pack: s.pack || "",
        montant_du: s.montant_du || 0,
        valide: s.valide || 0,
        attente: s.attente || 0,
        reste: s.reste || 0,
        tranche: s.tranche || 1,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return reponse(false, "Erreur interne : " + (err && err.message ? err.message : err));
  }
}

/**
 * Enregistre une declaration de paiement.
 *
 * Elle arrive en « a_verifier » : le site ne decide de rien, il ne
 * fait que transmettre ce que la personne declare, preuve comprise.
 * C'est le comite qui tranche ensuite dans la colonne « statut ».
 *
 * Identite, pack et montant du ne viennent PAS du navigateur quand la
 * personne est deja connue : on reprend ce que le classeur sait d'elle.
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
    var i0 = indexColonnesPaiement();
    var valeurs = feuille.getDataRange().getValues();
    var s = trouverPersonne(valeurs, i0, donnees.email, donnees.numero);
    if (s.blocage) {
      return reponse(false, "Ces informations ne correspondent pas a un paiement deja enregistre.");
    }

    // Pack deja solde, ou couvert par des paiements en attente de
    // validation : on n'ajoute pas une ligne de plus. Si la finance
    // refuse un paiement en attente, la personne pourra de nouveau payer.
    if (s.connu && s.pack && s.montant_du > 0 &&
        s.valide + s.attente >= s.montant_du) {
      return reponse(false, "Pack deja solde ou couvert par des paiements en attente de validation.");
    }

    var nom = nettoyer(donnees.nom);
    var pack = "";
    var du = 0;
    var tranche = 1;
    if (s.connu && s.pack) {
      nom = s.nom;
      pack = s.pack;
      du = s.montant_du;
      tranche = s.tranche;
    } else {
      var voulu = nettoyer(donnees.pack);
      var packs = lirePacks();
      for (var p = 0; p < packs.length; p++) {
        if (packs[p].nom === voulu) {
          pack = packs[p].nom;
          du = packs[p].prix;
        }
      }
      if (!pack) return reponse(false, "Choisis un pack.");
      if (s.connu) tranche = s.tranche;
    }

    var reference = prochaineReferencePaiement();
    var preuve = rangerPreuve(donnees, reference);

    var ligne = COLONNES_PAIEMENT.map(function (cle) {
      if (cle === "horodatage") return new Date();
      if (cle === "reference_paiement") return reference;
      if (cle === "statut") return STATUT_DEPOT;
      if (cle === "preuve") return preuve;
      if (cle === "nom") return nom;
      if (cle === "pack") return pack;
      if (cle === "montant_du") return du;
      if (cle === "tranche") return tranche;
      // Colonnes tenues par le comite ou par le menu.
      if (cle === "recu_envoye" || cle === "recu_envoye_le" || cle === "erreur_recu") return "";
      return enTexte(donnees[cle]);
    });
    feuille.appendRow(ligne);
    try {
      recalculerParticipants();
    } catch (err) {
      console.error(err);
    }
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
function lireConfig(modele, colonne) {
  // Colonne lue : B (1) par defaut ; C (2) et D (3) servent au recu.
  var col = colonne || 1;
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
    var texte = valeurs[i].length > col ? String(valeurs[i][col]).trim() : "";
    var lien = "";
    try {
      var riche = riches[i][col];
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
    .addItem("Initialiser les onglets (packs, paiements, reçu)", "initialiserLesOnglets")
    .addItem("Recalculer les participants", "recalculerEtDire")
    .addSeparator()
    .addItem("Envoyer le mail manuel à tous les inscrits", "envoyerManuelTous")
    .addItem("Envoyer le mail manuel à ceux qui ne l'ont pas reçu", "envoyerManuelNonRecus")
    .addSeparator()
    .addItem("Envoyer le mail automatique à ceux qui ne l'ont pas reçu", "envoyerLesMailsEnAttente")
    .addSeparator()
    .addItem("Envoyer les mails de paiement (validés et refusés)", "envoyerLesRecus")
    .addSeparator()
    .addItem("M'envoyer un aperçu du mail automatique", "testerLeMail")
    .addItem("M'envoyer un aperçu du mail manuel", "testerLeMailManuel")
    .addSeparator()
    .addItem("M'envoyer un aperçu : paiement validé (il reste un solde)", "apercuRecuValide")
    .addItem("M'envoyer un aperçu : pack soldé", "apercuRecuSolde")
    .addItem("M'envoyer un aperçu : paiement non validé", "apercuRecuRefus")
    .addToUi();
}

/**
 * CREE TOUS LES ONGLETS DONT LE SITE A BESOIN, avec leurs lignes.
 *
 *   inscriptions   l'en-tete des inscrits
 *   payement       l'en-tete des paiements (avec pack, montant_du, tranche)
 *   packs          nom / prix, avec trois packs a modifier
 *   participants   une ligne par personne : total valide, reste a payer
 *   config recu    3 colonnes : valide, non valide, solde
 *
 * Sans danger a relancer : un onglet qui existe deja n'est jamais
 * ecrase, seuls les en-tetes vides sont completes.
 */
function initialiserLesOnglets() {
  var fait = [];
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var avant = classeur.getSheets().map(function (f) { return f.getName(); });

  try {
    var conf = {};
    try { conf = lireConfig(); } catch (e) { conf = {}; }
    feuilleDonnees(conf.nomfeuillebd);
  } catch (err) {
    fait.push("inscriptions : " + (err && err.message ? err.message : err));
  }

  var paiements = feuillePaiements();
  // « statut » en liste deroulante : « validé » avec un accent n'etait
  // pas reconnu et laissait le paiement en attente sans rien dire.
  paiements.getRange(2, COLONNES_PAIEMENT.indexOf("statut") + 1, paiements.getMaxRows() - 1, 1)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList([STATUT_DEPOT, STATUT_VALIDE, "refuse"], true)
        .setAllowInvalid(false)
        .build()
    );
  lirePacks();
  recalculerParticipants();

  var aUnRecu = false;
  classeur.getSheets().forEach(function (f) {
    var nom = normaliser(f.getName());
    if (nom.indexOf("config") !== -1 && nom.indexOf("recu") !== -1) aUnRecu = true;
  });
  if (!aUnRecu) {
    var f = classeur.insertSheet("config recu");
    f.appendRow(["champ", "paiement validé", "paiement non validé", "pack soldé"]);
    f.appendRow([
      "Objet",
      "Paiement validé — {{reference}} · NTMS 2026",
      "Paiement non validé — {{reference}} · NTMS 2026",
      "Pack soldé — {{reference}} · NTMS 2026",
    ]);
    f.appendRow([
      "Titre",
      "Merci {{nom}}, ton paiement est validé",
      "{{nom}}, ton paiement n'a pas pu être validé",
      "Merci {{nom}}, ton pack est soldé",
    ]);
    f.appendRow([
      "Corps",
      "Bonjour {{nom}},\n\nNous avons bien reçu et validé ton paiement ({{reference}}, {{pack}}).\n\n{{facture}}\n\nConserve ce mail : il vaut preuve de ton paiement.\n\nÀ très vite à Lokossa,\nL'équipe NTMS 2026",
      "Bonjour {{nom}},\n\nNous n'avons pas pu valider ton paiement ({{reference}}, {{pack}}).\n\n{{facture}}\n\nTu peux déclarer ton paiement de nouveau sur le site, avec une preuve lisible, ou nous écrire.\n\nL'équipe NTMS 2026",
      "Bonjour {{nom}},\n\nTon paiement ({{reference}}) est validé et ton pack {{pack}} est soldé.\n\n{{facture}}\n\nConserve ce mail : il vaut preuve de ton paiement.\n\nÀ très vite à Lokossa,\nL'équipe NTMS 2026",
    ]);
    f.appendRow(["Texte CTA", "Payer ma prochaine tranche", "Déclarer mon paiement", "Rejoindre le groupe WhatsApp"]);
    f.appendRow(["Lien CTA", "", "", ""]);
    f.appendRow(["Nom expéditeur", "AIESEC in Benin"]);
    f.setColumnWidth(2, 520);
    f.setColumnWidth(3, 520);
    f.setColumnWidth(4, 520);
    f.setColumnWidth(1, 160);
  }

  var apres = classeur.getSheets().map(function (f) { return f.getName(); });
  var crees = apres.filter(function (n) { return avant.indexOf(n) === -1; });
  var message =
    (crees.length
      ? "Onglets créés : " + crees.join(", ") + "."
      : "Tous les onglets existaient déjà : rien n'a été écrasé.") +
    (fait.length ? "\n\nÀ vérifier : " + fait.join(" | ") : "");
  try {
    SpreadsheetApp.getUi().alert("Initialisation", message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.log(message);
  }
}

function recalculerEtDire() {
  recalculerParticipants();
  SpreadsheetApp.getUi().alert("Participants", "L'onglet « participants » est à jour.", SpreadsheetApp.getUi().ButtonSet.OK);
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
 * LES TROIS MAILS DU RECU, dans l'onglet « config recu » :
 *
 *   colonne B   paiement valide, il reste un solde
 *   colonne C   paiement NON valide (statut « refuse »)
 *   colonne D   pack SOLDE par ce paiement
 *
 * Meme libelles en colonne A (Objet, Titre, Corps, Texte CTA, Lien CTA).
 * Nom expediteur, CC, BCC, Images et Pieces jointes se lisent en B pour
 * les trois. Colonne D : Objet, Titre et Corps reprennent ceux de B
 * s'ils sont vides ; le BOUTON ne vient que de D (Texte CTA + Lien CTA,
 * le groupe WhatsApp), jamais de B. Colonne C vide : aucun mail de
 * refus ne part.
 */
var CHAMPS_CONTENU = ["objet", "titre", "corps", "textecta", "liencta"];

/**
 * Les trois mails a partir des colonnes B, C et D. Une seule definition,
 * pour l'envoi reel ET pour les apercus du menu : ils ne peuvent pas
 * diverger.
 */
function preparerConfsRecu(b) {
  var c = lireConfig(MODELES.recu, 2);
  var d = lireConfig(MODELES.recu, 3);
  var solde = {};
  var refus = {};
  for (var cle in b) {
    solde[cle] = b[cle];
    refus[cle] = b[cle];
  }
  CHAMPS_CONTENU.forEach(function (champ) {
    if (d[champ]) solde[champ] = d[champ];
    refus[champ] = c[champ] || "";
  });
  // Le bouton du mail solde est CELUI DE D (le groupe WhatsApp), jamais
  // celui de B. Rien en D = pas de bouton.
  solde.textecta = d.textecta || "";
  solde.liencta = d.liencta || "";
  return { valide: b, solde: solde, refus: refus, refusActif: !!(refus.objet && refus.corps) };
}

/** Le bloc « facture » d'un paiement refuse. */
function factureRefus(v) {
  return "Paiement non retenu : " + v.paiement_actuel + " FCFA\n" +
    "Total payé : " + v.total_paye + " FCFA\n" +
    "Reste à payer : " + v.reste + " FCFA";
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
 * {{nom}}, {{reference}} (celle du paiement), {{moyen}}, {{pack}},
 * {{tranche}}, {{montant_du}}, et la FACTURE : {{paiement_actuel}},
 * {{total_paye}}, {{reste}}, ou le bloc {{facture}}. Voir « LA FACTURE ».
 * Au paiement qui solde le pack, le bouton est celui de la colonne D.
 */
function envoyerLesRecus() {
  var ui = SpreadsheetApp.getUi();
  var conf = lireConfig(MODELES.recu);
  if (!conf.objet || !conf.corps) {
    ui.alert("L'onglet « config recu » est incomplet : remplis Objet et Corps.");
    return;
  }
  var confs = preparerConfsRecu(conf);
  var confSolde = confs.solde;
  var confRefus = confs.refus;
  var refusActif = confs.refusActif;

  var feuille = feuillePaiements();
  var valeurs = feuille.getDataRange().getValues();
  var i0 = {};
  COLONNES_PAIEMENT.forEach(function (cle, i) {
    i0[cle] = i;
  });

  var aEnvoyer = 0;
  for (var i = 1; i < valeurs.length; i++) {
    var etat = String(valeurs[i][i0.statut]).trim().toLowerCase();
    if (etat !== STATUT_VALIDE && !(etat === "refuse" && refusActif)) continue;
    if (String(valeurs[i][i0.recu_envoye]).trim().toLowerCase() === "oui") continue;
    if (!valeurs[i][i0.email]) continue;
    aEnvoyer++;
  }
  if (!aEnvoyer) {
    ui.alert("Aucun paiement valide ou refuse en attente de mail.");
    return;
  }
  if (
    ui.alert(
      "Mails de paiement",
      "Envoyer " + aEnvoyer + " mail(s) (paiements valides ou refuses) ?",
      ui.ButtonSet.OK_CANCEL
    ) !== ui.Button.OK
  ) {
    return;
  }

  // Totaux a jour AVANT de lire : la validation vient peut-etre d'etre
  // cochee et l'onglet « participants » n'a pas encore bouge.
  recalculerParticipants();
  var indexFacture = indexParticipants();

  var verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  var envoyes = 0;
  var echecs = 0;
  var quota = false;
  try {
    for (var j = 1; j < valeurs.length; j++) {
      var statutLigne = String(valeurs[j][i0.statut]).trim().toLowerCase();
      var refuse = statutLigne === "refuse";
      if (statutLigne !== STATUT_VALIDE && !(refuse && refusActif)) continue;
      if (String(valeurs[j][i0.recu_envoye]).trim().toLowerCase() === "oui") continue;
      var destinataire = String(valeurs[j][i0.email]).trim();
      if (!destinataire) continue;

      // Les chiffres de la facture : voir « LA FACTURE ». Le mail ne
      // calcule rien, il recoit ces variables toutes faites.
      var variables = variablesRecu(valeurs[j], i0, indexFacture);
      // Quel des trois mails : refuse (C), solde (D) ou valide (B).
      var confLigne = conf;
      if (refuse) {
        confLigne = confRefus;
        variables.facture = factureRefus(variables);
      } else if (variables.soldee) {
        confLigne = confSolde;
      }

      if (quota || MailApp.getRemainingDailyQuota() < 1) {
        quota = true;
        continue;
      }
      try {
        MailApp.sendEmail({
          to: destinataire,
          subject: remplirTexte(confLigne.objet, variables),
          body: construireTexte(confLigne, variables),
          htmlBody: construireHtml(confLigne, variables),
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

/**
 * APERCUS DU RECU — t'envoient a toi le mail de chaque cas, avec des
 * chiffres d'exemple, par le MEME code que l'envoi reel (variablesRecu,
 * preparerConfsRecu). Rien n'est ecrit dans le classeur.
 *
 *   valide   Pack 2 = 10 000, ce paiement 4 000, reste 6 000
 *   solde    ce paiement 6 000 solde le pack (10 000 payes)
 *   refus    paiement de 5 000 non retenu, 4 000 deja valides
 */
function apercuRecu(cas) {
  var ui = SpreadsheetApp.getUi();
  var conf = lireConfig(MODELES.recu);
  if (!conf.objet || !conf.corps) {
    ui.alert("L'onglet « config recu » est incomplet : remplis Objet et Corps (colonne B).");
    return;
  }
  var confs = preparerConfsRecu(conf);
  var exemple = {
    valide: { actuel: 4000, valides: 4000 },
    solde: { actuel: 6000, valides: 10000 },
    refus: { actuel: 5000, valides: 4000 },
  }[cas];

  if (cas === "refus" && !confs.refusActif) {
    ui.alert("Colonne C vide : aucun mail de refus ne partira. Remplis Objet et Corps en colonne C.");
    return;
  }

  var i0 = indexColonnesPaiement();
  var ligne = COLONNES_PAIEMENT.map(function () { return ""; });
  ligne[i0.nom] = "Test Utilisateur";
  ligne[i0.email] = "test@example.com";
  ligne[i0.numero] = "+229 01 00 00 00 00";
  ligne[i0.reference_paiement] = "PAY-TEST";
  ligne[i0.moyen] = "MTN MoMo";
  ligne[i0.pack] = "Pack 2";
  ligne[i0.montant_du] = 10000;
  ligne[i0.tranche] = 2;
  ligne[i0.montant_declare] = exemple.actuel;
  var index = {};
  index["test@example.com|" + chiffres(ligne[i0.numero])] = {
    pack: "Pack 2", montant_du: 10000, total_valide: exemple.valides,
  };

  var variables = variablesRecu(ligne, i0, index);
  var confCas = cas === "refus" ? confs.refus : cas === "solde" ? confs.solde : confs.valide;
  if (cas === "refus") variables.facture = factureRefus(variables);

  var compte = Session.getEffectiveUser().getEmail();
  var soucis = [];
  var options = {
    to: compte,
    subject: "[TEST recu " + cas + "] " + remplirTexte(confCas.objet, variables),
    body: construireTexte(confCas, variables),
    htmlBody: construireHtml(confCas, variables),
    name: conf.nomexpediteur || "AIESEC in Benin",
  };
  var fichiers = piecesJointes(valeurPiecesJointes(conf), soucis);
  if (fichiers.length) options.attachments = fichiers;
  MailApp.sendEmail(options);
  ui.alert("Aperçu envoyé", "Le mail « " + cas + " » est parti vers " + compte + ".", ui.ButtonSet.OK);
}

function apercuRecuValide() { apercuRecu("valide"); }
function apercuRecuSolde() { apercuRecu("solde"); }
function apercuRecuRefus() { apercuRecu("refus"); }

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
    pack: "Pack 3", tranche: "2", montant_du: "15 000",
    paiement_actuel: "5 000", total_paye: "10 000", total_valide: "10 000", reste: "5 000",
    facture: "Paiement actuel : 5 000 FCFA\nTotal payé : 10 000 FCFA\nReste à payer : 5 000 FCFA",
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
