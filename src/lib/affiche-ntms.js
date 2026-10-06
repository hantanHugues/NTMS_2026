/**
 * MOTEUR DE L'AFFICHE « J'Y SERAI » — NTMS 2026
 *
 * Dessine le badge retenu (fond brique, motif orange, cordon crème,
 * tête orange, pied nuit) sur un canvas de 1080 × 1350, le format
 * portrait d'Instagram.
 *
 * Tout est dessiné au canvas, sans capture de HTML : le PNG obtenu est
 * le même dans tous les navigateurs, et rien ne dépend d'une
 * bibliothèque extérieure.
 *
 * Utilisation :
 *
 *   const ressources = await AfficheNTMS.charger(window.NTMS_RESSOURCES);
 *   // facultatif : { ..., polices: { texte: "...", titre: "..." } }
 *   AfficheNTMS.dessiner(canvas, {
 *     prenom: "Iris", nom: "Sossou", lc: "Cotonou", role: "TM",
 *     photo: imageChargee,          // un HTMLImageElement
 *     cadrage: { zoom: 1, x: 50, y: 22 },
 *     jySerai: "encreur",           // "encreur", "tampon" ou "pied"
 *   }, ressources);
 */
(function (global) {
  "use strict";

  const LARGEUR = 1080;
  const HAUTEUR = 1350;

  /** La charte NTMS. */
  const C = {
    nuit: "#001724",
    sarcelle: "#15676D",
    creme: "#FFEBD1",
    orange: "#FF7A00",
    brique: "#79280E",
  };

  /** Ce que porte le badge, hors données de la personne. */
  const TEXTES = {
    cordon: "NTMS 2026 · NTMS 2026 · NTMS 2026",
    // Le mot d'AIESEC pour un participant de conference. Le meme dans
    // les deux langues : l'affiche ne se traduit pas.
    statut: "Delegate",
    jySerai: "J'y serai",
    edition: "NTMS 2026",
    quandOu: "18–22 nov. · Lokossa",
  };

  /** Taille d'un carreau du motif, en pixels d'affiche. */
  const TAILLE_MOTIF = 1300;
  const OPACITE_MOTIF = 0.3;

  // Les familles de police. Réglables au chargement : sur le site,
  // next/font les renomme (« __Lato_1a2b3c »).
  let LATO = '"Lato", sans-serif';
  let TITRE = '"Bricolage Grotesque", sans-serif';

  const rad = (deg) => (deg * Math.PI) / 180;

  // ---------------------------------------------------------------
  // Chargement
  // ---------------------------------------------------------------

  function image(src) {
    return new Promise((ok, ko) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = () => ko(new Error("Image illisible : " + String(src).slice(0, 60)));
      im.src = src;
    });
  }

  /**
   * Charge les images et les polices, et prépare ce qui ne change
   * jamais : le motif teinté et le logo recoloré.
   */
  async function charger(sources) {
    if (sources.polices) {
      LATO = sources.polices.texte || LATO;
      TITRE = sources.polices.titre || TITRE;
    }
    const [logo, motif, exemple] = await Promise.all([
      image(sources.logo),
      image(sources.motif),
      sources.exemple ? image(sources.exemple) : null,
    ]);

    // Les polices doivent être prêtes AVANT le premier dessin, sinon le
    // canvas écrit avec la police de secours, sans prévenir.
    if (global.document && document.fonts) {
      await Promise.all([
        document.fonts.load(`800 96px ${TITRE}`),
        document.fonts.load(`900 34px ${LATO}`),
        document.fonts.load(`700 24px ${LATO}`),
        document.fonts.load(`400 26px ${LATO}`),
      ]).catch(() => {});
    }

    return {
      motif: motifTeinte(motif, C.orange, OPACITE_MOTIF),
      logoNuit: recolorer(logo, C.nuit),
      logoRatio: logo.width / logo.height,
      exemple,
    };
  }

  /**
   * Le motif est fait de lignes blanches sur fond noir. On le convertit
   * en lignes ORANGE sur fond TRANSPARENT : la luminosité de chaque
   * pixel devient son opacité.
   */
  function motifTeinte(source, couleur, opacite) {
    const largeur = TAILLE_MOTIF;
    const hauteur = Math.round((TAILLE_MOTIF * source.height) / source.width);
    const c = document.createElement("canvas");
    c.width = largeur;
    c.height = hauteur;
    const ctx = c.getContext("2d");
    ctx.drawImage(source, 0, 0, largeur, hauteur);

    const px = ctx.getImageData(0, 0, largeur, hauteur);
    const [r, g, b] = rvb(couleur);
    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = Math.round(lum * opacite * 255);
    }
    ctx.putImageData(px, 0, 0);
    return c;
  }

  /** Le logo, repeint d'une seule couleur en gardant sa forme. */
  function recolorer(source, couleur) {
    const c = document.createElement("canvas");
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = couleur;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function rvb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // ---------------------------------------------------------------
  // Outils de dessin
  // ---------------------------------------------------------------

  function rectArrondi(ctx, x, y, l, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, l, h, r);
  }

  /** Police, interlettrage et couleur en une fois. */
  function style(ctx, police, couleur, espacement = 0) {
    ctx.font = police;
    ctx.fillStyle = couleur;
    ctx.letterSpacing = espacement + "px";
  }

  /**
   * Écrit un texte en réduisant la police s'il dépasse la largeur
   * permise : un prénom long ne doit jamais déborder du badge.
   */
  function texteAjuste(ctx, texte, x, y, largeurMax, poids, taille, famille) {
    let t = taille;
    ctx.font = `${poids} ${t}px ${famille}`;
    while (ctx.measureText(texte).width > largeurMax && t > 12) {
      t -= 2;
      ctx.font = `${poids} ${t}px ${famille}`;
    }
    ctx.fillText(texte, x, y);
  }

  /** L'image recadrée façon `object-fit: cover`, avec zoom et point focal. */
  function photoCouvrante(ctx, im, x, y, l, h, cadrage) {
    const zoom = Math.max(1, cadrage.zoom || 1);
    const echelle = Math.max(l / im.width, h / im.height) * zoom;
    const lv = im.width * echelle;
    const hv = im.height * echelle;
    const px = (cadrage.x ?? 50) / 100;
    const py = (cadrage.y ?? 22) / 100;
    ctx.drawImage(im, x + (l - lv) * px, y + (h - hv) * py, lv, hv);
  }

  // ---------------------------------------------------------------
  // L'affiche
  // ---------------------------------------------------------------

  function dessiner(canvas, donnees, r) {
    canvas.width = LARGEUR;
    canvas.height = HAUTEUR;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "middle";

    const prenom = (donnees.prenom || "").trim();
    const nom = (donnees.nom || "").trim();
    const role = (donnees.role || "").trim();
    const lc = (donnees.lc || "").trim();
    // `affiliation` l'emporte ; sinon un comite local devient « LC X ».
    const affiliation = (donnees.affiliation || (lc ? "LC " + lc : "")).trim();
    const photo = donnees.photo || r.exemple;
    const cadrage = donnees.cadrage || {};
    const mode = donnees.jySerai || "encreur";
    const tampon = mode !== "pied";

    // 1. Le fond brique et son motif
    ctx.fillStyle = C.brique;
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);
    ctx.fillStyle = ctx.createPattern(r.motif, "repeat");
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

    // 2. Le cordon, crème comme la zone du nom
    ctx.save();
    ctx.translate(540, 47);
    ctx.rotate(rad(-3));
    ctx.fillStyle = C.creme;
    ctx.fillRect(-54, -150, 108, 300);
    ctx.rotate(rad(90));
    style(ctx, `900 24px ${LATO}`, C.nuit, 4.5);
    ctx.textAlign = "left";
    // Le texte demarre au ras du bord haut : « NTMS » est toujours
    // entier, c'est l'annee qui se fait couper par le badge.
    ctx.fillText(TEXTES.cordon, -41, 0);
    ctx.restore();

    // 3. Le badge, légèrement penché
    ctx.save();
    ctx.translate(540, 698);
    ctx.rotate(rad(-3));
    // Le badge grandit plutot que de redescendre : les marges du haut
    // et du bas se resserrent toutes les deux, sans toucher a une
    // seule coordonnee de son contenu.
    ctx.scale(1.074, 1.074);
    ctx.translate(-380, -495); // origine : coin haut gauche du badge

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
    ctx.shadowBlur = 70;
    ctx.shadowOffsetY = 40;
    ctx.fillStyle = C.creme;
    rectArrondi(ctx, 0, 0, 760, 990, 40);
    ctx.fill();
    ctx.restore();

    rectArrondi(ctx, 0, 0, 760, 990, 40);
    ctx.clip();

    // 3a. La tête orange
    ctx.fillStyle = C.orange;
    ctx.fillRect(0, 0, 760, 200);
    ctx.fillStyle = C.brique; // la fente du cordon
    rectArrondi(ctx, 315, 34, 130, 24, 12);
    ctx.fill();
    const hLogo = 82;
    ctx.drawImage(r.logoNuit, 24, 164 - hLogo, hLogo * r.logoRatio, hLogo);
    style(ctx, `900 24px ${LATO}`, C.nuit, 4.8);
    ctx.textAlign = "right";
    ctx.fillText(TEXTES.statut.toUpperCase(), 736 + 4.8, 150);

    // 3b. La photo, cerclée d'orange
    ctx.fillStyle = C.orange;
    rectArrondi(ctx, 180, 238, 400, 400, 40);
    ctx.fill();
    ctx.save();
    rectArrondi(ctx, 190, 248, 380, 380, 30);
    ctx.clip();
    ctx.fillStyle = C.nuit;
    ctx.fillRect(190, 248, 380, 380);
    if (photo) photoCouvrante(ctx, photo, 190, 248, 380, 380, cadrage);
    ctx.restore();

    if (mode === "tampon") dessinerTampon(ctx, 572, 556);
    if (mode === "encreur") dessinerEncreur(ctx, 536, 622);

    // 3c. Le prénom, le nom, le rôle
    ctx.textAlign = "center";
    style(ctx, `800 96px ${TITRE}`, C.nuit, -3.36);
    texteAjuste(ctx, prenom, 380, 722, 660, 800, 96, TITRE);

    style(ctx, `900 34px ${LATO}`, C.brique, 4.76);
    texteAjuste(ctx, nom.toUpperCase(), 380 + 2.4, 797, 660, 900, 34, LATO);

    ecrireRole(ctx, role, affiliation);

    // 3d. Le pied nuit
    ctx.fillStyle = C.nuit;
    ctx.fillRect(0, 898, 760, 92);
    style(ctx, `900 27px ${LATO}`, C.orange, 2.7);
    ctx.textAlign = "left";
    // Avec le tampon, le pied ne répète pas « J'y serai ».
    ctx.fillText((tampon ? TEXTES.edition : TEXTES.jySerai).toUpperCase(), 48, 945);
    style(ctx, `400 23px ${LATO}`, C.orange, 0.92);
    ctx.textAlign = "right";
    ctx.fillText(TEXTES.quandOu, 712 + 0.92, 945);

    ctx.restore();

    // 4. La pince, par-dessus le badge
    ctx.save();
    ctx.translate(540, 180);
    ctx.rotate(rad(-3));
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    const degrade = ctx.createLinearGradient(0, -35, 0, 35);
    degrade.addColorStop(0, "#d9dee0");
    degrade.addColorStop(1, "#9aa2a6");
    ctx.fillStyle = degrade;
    rectArrondi(ctx, -85, -35, 170, 70, 16);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Le tampon « J'y serai », posé sur le coin de la photo comme un
   * cachet sur un billet. (x, y) : son centre, dans le repère du badge.
   */
  function dessinerTampon(ctx, x, y) {
    const r = 104;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rad(-14));

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = C.creme;
    ctx.beginPath();
    ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = C.nuit;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // L'anneau pointillé intérieur, qui fait « cachet »
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, r - 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = "center";
    style(ctx, `800 60px ${TITRE}`, C.orange, -2);
    ctx.fillText("J'y", -1, -24);
    ctx.fillText("serai", -1, 30);
    ctx.restore();
  }

  /**
   * Le coup de tampon encreur : un cadre double, « J'Y SERAI » en
   * capitales, encre brique avec ses manques. Posé de travers sur le
   * bas de la photo, comme tamponné à la main.
   */
  function dessinerEncreur(ctx, x, y) {
    const l = 240;
    const h = 86;
    const marge = 20;

    // L'encre est dessinée à part pour pouvoir y creuser le grain sans
    // toucher au fond crème.
    const encre = document.createElement("canvas");
    encre.width = l + marge * 2;
    encre.height = h + marge * 2;
    const e = encre.getContext("2d");
    e.translate(encre.width / 2, encre.height / 2);
    e.strokeStyle = C.brique;
    e.lineWidth = 6;
    e.beginPath();
    e.roundRect(-l / 2, -h / 2, l, h, 10);
    e.stroke();
    e.lineWidth = 2;
    e.beginPath();
    e.roundRect(-l / 2 + 10, -h / 2 + 10, l - 20, h - 20, 5);
    e.stroke();
    e.textAlign = "center";
    e.textBaseline = "middle";
    style(e, `900 38px ${LATO}`, C.brique, 3.5);
    e.fillText(TEXTES.jySerai.toUpperCase(), 1.75, 2);

    // Le grain : des manques d'encre, toujours les mêmes d'une affiche
    // à l'autre (tirage pseudo-aléatoire à graine fixe).
    const hasard = graine(2026);
    e.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 800; i++) {
      e.globalAlpha = 0.25 + hasard() * 0.6;
      e.beginPath();
      e.arc((hasard() - 0.5) * encre.width, (hasard() - 0.5) * encre.height, 0.5 + hasard() * 1.7, 0, Math.PI * 2);
      e.fill();
    }
    e.globalAlpha = 0.35;
    for (let i = 0; i < 6; i++) {
      e.fillRect((hasard() - 0.5) * encre.width, (hasard() - 0.5) * encre.height, 30 + hasard() * 60, 1.5 + hasard() * 2);
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rad(-9));
    ctx.fillStyle = "rgba(255, 235, 209, 0.9)";
    rectArrondi(ctx, -l / 2, -h / 2, l, h, 10);
    ctx.fill();
    ctx.globalAlpha = 0.94;
    ctx.drawImage(encre, -encre.width / 2, -encre.height / 2);
    ctx.restore();
  }

  /** Tirage pseudo-aléatoire reproductible (mulberry32). */
  function graine(n) {
    return function () {
      n |= 0;
      n = (n + 0x6d2b79f5) | 0;
      let t = Math.imul(n ^ (n >>> 15), 1 | n);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * « TM · LC Cotonou », le rôle en gras, centré d'un bloc.
   *
   * Le second morceau est LIBRE : « LC Cotonou » pour un AIESECer du
   * Bénin, « AIESEC in Togo » pour celui d'un autre pays. Les deux
   * vides, la ligne disparaît — c'est le cas de quelqu'un qui n'est
   * pas AIESECer, et un badge sans affiliation se lit très bien.
   */
  function ecrireRole(ctx, role, affiliation) {
    const gras = `900 26px ${LATO}`;
    const normal = `400 26px ${LATO}`;
    const suite = affiliation ? (role ? " · " : "") + affiliation : "";
    ctx.letterSpacing = "0px";
    ctx.font = gras;
    const l1 = ctx.measureText(role).width;
    ctx.font = normal;
    const l2 = ctx.measureText(suite).width;
    let x = 380 - (l1 + l2) / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = C.sarcelle;
    ctx.font = gras;
    ctx.fillText(role, x, 851);
    ctx.font = normal;
    ctx.fillText(suite, x + l1, 851);
  }

  global.AfficheNTMS = { LARGEUR, HAUTEUR, COULEURS: C, TEXTES, charger, dessiner, image };
})(typeof window !== "undefined" ? window : globalThis);

// --- Ajout pour le site : le moteur s'importe comme un module.
// Le fichier est la copie conforme de `generateur-affiche/affiche.js` ;
// toute correction se fait LA-BAS, puis se recopie ici.
export default globalThis.AfficheNTMS;
