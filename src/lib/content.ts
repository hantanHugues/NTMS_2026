import {
  CheckCircle2,
  ClipboardList,
  Compass,
  GraduationCap,
  MessageCircle,
  Plane,
  Users,
  HeartHandshake,
  MessagesSquare,
  Rocket,
} from "lucide-react";

export const event = {
  name: "NTMS 2026",
  organisation: "AIESEC in Benin",
  // Vocabulaire officiel AIESEC. Le site affichait « New Team Members
  // Seminar », ce qui etait faux et tirait tout le texte vers le
  // recrutement.
  baseline: "National Training and Motivation Seminar",
  // THEME OFFICIEL, arrete par le comite et communique tel quel par
  // l'utilisateur. A ne pas reformuler : c'est la seule information de
  // contenu validee du projet, tout le reste (dates, places, programme)
  // reste une proposition a confirmer.
  theme: "20 ans d'existence : élever nos standards pour un meilleur impact.",
  themeSubject: "20 ans d'existence",
  themeAngle: "élever nos standards pour un meilleur impact.",
  dates: "18 – 22 novembre 2026",
  // Vers quoi pointe le compte a rebours. Se change sans toucher au
  // code, par NEXT_PUBLIC_DATE_NTMS dans .env.local et chez l'hebergeur
  // (valeur inseree AU MOMENT DU BUILD : redeployer apres un changement).
  startsAt: process.env.NEXT_PUBLIC_DATE_NTMS ?? "2026-11-18T09:00:00+01:00",
  // Fin des inscriptions. Par defaut la meme date : quand le compte a
  // rebours tombe a zero, le formulaire ferme et « Je m'inscris » mene
  // a l'ecran de cloture. NEXT_PUBLIC_FIN_INSCRIPTIONS permet de
  // fermer plus tot, sans toucher au compte a rebours.
  finInscriptions:
    process.env.NEXT_PUBLIC_FIN_INSCRIPTIONS ??
    process.env.NEXT_PUBLIC_DATE_NTMS ??
    "2026-11-18T09:00:00+01:00",
  // LIEU OFFICIEL, communique par l'utilisateur. Comme le theme, c'est
  // une information validee — a distinguer des dates et du nombre de
  // places, qui restent des propositions.
  city: "Lokossa, Bénin",
  cityShort: "Lokossa",
  seats: 180,
  email: "aibconferences@gmail.com",
};

// Le programme et la FAQ ont ete retires de la landing : le programme
// detaille ne sera pas publie, et la FAQ part sur la page de paiement.
export const navItems = [
  { href: "#constat", label: "20 ans" },
  { href: "#solution", label: "La solution" },
  { href: "#preuve", label: "La preuve" },
  { href: "#contact", label: "Contactez-nous" },
];

/**
 * Le titre du hero.
 *
 * Les verbes defilent, comme avant — c'est le dispositif retenu. Ils
 * changent de famille : ils disaient la survie face au marche de
 * l'emploi, ils disent maintenant la duree. Chacun s'accroche a
 * « AIESEC in Benin, vingt ans a… » sans casser la phrase — le sujet
 * est nomme pour qu'on ne croie pas que le NTMS a vingt ans. La ligne
 * du bas pose le
 * theme de l'edition.
 */
export const hero = {
  amorce: "AIESEC in Benin, vingt ans à",
  chute: "Cette année, on élève le niveau.",
};

export const rotatingVerbs = [
  "former",
  "transmettre",
  "oser",
  "recommencer",
  "durer",
];

export const skillTags = [
  "Leadership",
  "Cotonou",
  "Développement personnel",
  "Parakou",
  "Travail en équipe",
  "Porto-Novo",
  "Entrepreneuriat",
  "Abomey-Calavi",
  "Prise de parole",
  "Vingt ans de relais",
];


/**
 * SECTION 1 — Vingt ans, et ce qu'ils obligent.
 *
 * Le theme de l'edition a change en cours de route : la conference ne
 * parle plus d'employabilite mais des VINGT ANS d'AIESEC in Benin,
 * atteints en 2025 et celebres cette annee. La section ne pose donc
 * plus un probleme exterieur, elle pose un SOCLE.
 *
 * DEUX PUBLICS, UN SEUL TEXTE. L'externe lit une preuve de serieux —
 * vingt ans, quatre villes, un reseau mondial. L'AIESECer lit un
 * heritage qui le designe. Aucune phrase ne s'adresse a l'un plutot
 * qu'a l'autre, chacun prend sa lecture.
 *
 * CHIFFRES. Les deux colonnes portent les seuls nombres beninois
 * verifiables, communiques par l'utilisateur : vingt ans, quatre
 * comites locaux. Le reseau mondial ne prend pas une troisieme
 * colonne, il descend dans la ligne de bas de section — on garde deux
 * chiffres, sans perdre l'argument international.
 *
 * Aucune recherche publique n'a donne de donnee beninoise
 * supplementaire : ni effectif, ni date de creation, ni nombre
 * d'echanges. Les chiffres mondiaux viennent d'aiesec.org/about-us.
 *
 * La version precedente reposait sur un sondage Afrobarometer
 * (51 % de chomage chez les 18-35 ans). Elle n'a plus d'objet.
 */
export const constat = {
  question: "Vingt ans qu'AIESEC in Benin forme des jeunes.",
  probe: "Deux décennies de comités, de projets et de promotions qui se sont passé le relais.",
  intro: "AIESEC in Benin, aujourd'hui :",
  columns: [
    {
      value: "20",
      label: "ans d'AIESEC in Benin.",
      // L'annee de fondation n'est pas confirmee : on date le jalon,
      // pas la creation.
      detail: "Vingt ans atteints en 2025.",
    },
    {
      value: "4",
      label: "représentations locales.",
      detail: "Cotonou, Parakou, Porto-Novo, Abomey-Calavi.",
    },
    {
      // Chiffre communique par le comite, comme les deux precedents.
      value: "1000+",
      label: "jeunes touchés.",
      detail: "",
    },
  ],
  level: "Le relais ne s'est jamais arrêté.",
  gap: "Chaque promotion a reçu quelque chose, et l'a passé plus haut.",
  closing: "Vingt ans nous obligent.",
  closingAccent: "Il est temps d'élever le niveau.",
  // Occupe la ligne qui portait la source du sondage. Fait officiel,
  // verifie sur aiesec.org.
  source: "AIESEC, présent dans plus de 100 pays depuis 1948.",
};

/**
 * SECTION 2 — La solution : le NTMS lui-meme.
 *
 * Le titre RAPPELLE le probleme avant d'annoncer la reponse. Une
 * version precedente disait « le NTMS existe pour ca » : on change de
 * section, le lecteur a perdu le fil, et « ca » ne renvoyait a rien.
 *
 * Le theme est desormais les VINGT ANS d'AIESEC in Benin et
 * l'elevation des standards. Les quatre cadrans repondent donc a
 * « ce qu'on eleve » et non plus a « ce que tu gagnes ».
 *
 * Le troisieme cadran repose sur un fait confirme par l'utilisateur :
 * les alumni des vingt dernieres annees viennent prendre la parole.
 * L'effectif de la salle, lui, n'est pas confirme — il a ete retire
 * plutot qu'invente.
 *
 * Ecriture : aucune tournure du type « pas X, c'est Y ». C'est la
 * construction que les modeles produisent en boucle, et elle avait
 * reussi a revenir dans l'accroche.
 *
 * La date et le lieu sont replaces ici — ils avaient quitte le hero
 * sans retrouver de place.
 */
export const solution = {
  themeLabel: "Thème de l'édition",
  lead: "Cinq jours à Lokossa, du 18 au 22 novembre 2026. Des ateliers, des mises en situation, et les alumni des vingt dernières années dans la salle.",
  offers: [
    {
      icon: GraduationCap,
      title: "Des compétences qui ne périment pas",
      body: "Leadership, développement personnel, entrepreneuriat, travail en équipe. Ce que tu apprends ici ne dépend ni d'un poste ni d'un secteur.",
    },
    {
      icon: Plane,
      title: "Des portes que tu n'ouvriras pas seul",
      body: "Volontariat à l'étranger, stages, projets locaux. AIESEC donne accès à des expériences qui ne se trouvent pas sur une plateforme d'offres.",
    },
    {
      icon: Users,
      title: "Vingt promotions dans la même salle",
      body: "Les alumni des vingt dernières années viennent parler. Ce qu'ils ont construit, ils te disent comment.",
    },
    {
      icon: Compass,
      title: "Savoir de quoi tu es capable",
      body: "Cinq jours à te voir travailler sous contrainte, avec des inconnus. Tu apprends plus sur toi que pendant un semestre entier.",
    },
  ],
  closing: "Tu repars avec des compétences, un réseau,",
  closingAccent: "et un niveau plus haut.",
};

/**
 * SECTION 3 — La preuve.
 *
 * ROLE sous le theme des vingt ans : les photos ne rassurent plus un
 * futur recrute, elles rendent VISIBLE le chiffre annonce plus haut.
 * Le titre reprend le relais evoque en section 1, l'accroche enumere
 * des gestes concrets (le micro, le petit groupe, le passage devant la
 * salle) plutot que des qualites.
 *
 * Photos reelles d'evenements AIESEC in Benin, fournies par
 * l'utilisateur. Le texte ne pretend PAS qu'il s'agit d'editions
 * precedentes du NTMS — il parle des rencontres AIESEC en general,
 * ce qui est exact.
 *
 * Les 12 premieres alimentent la galerie 3D (3 colonnes de 4), les
 * suivantes le bandeau defilant.
 */
export const preuve = {
  title: "Vingt générations d'AIESECers qui se sont succédé.",
  // Deux phrases pleines, sans liste ni deux-points : l'enumeration est
  // portee par les verbes, ce sont les membres qui font les actions.
  // La seconde phrase referme sur le lecteur — formulation choisie par
  // l'utilisateur.
  lead: "Depuis vingt ans, les membres d'AIESEC in Benin se retrouvent en atelier, prennent la parole devant la salle, travaillent en petits groupes et présentent leurs restitutions. Joins-toi à nous pour vivre cette expérience.",
  columns: [
    [
      { src: "/photos/prise-parole-01.jpg", alt: "Un membre prend la parole au micro devant le groupe" },
      { src: "/photos/public-01.jpg", alt: "Participantes attentives pendant une session" },
      { src: "/photos/atelier-01.jpg", alt: "Session de travail avec projection" },
      { src: "/photos/promo-01.jpg", alt: "La promotion réunie, bras levés" },
    ],
    [
      { src: "/photos/public-02.jpg", alt: "Une participante dans l'assistance" },
      { src: "/photos/prise-parole-02.jpg", alt: "Une membre au micro devant la bannière AIESEC" },
      { src: "/photos/groupe-01.jpg", alt: "Le groupe en extérieur au bord de l'eau" },
      { src: "/photos/public-03.jpg", alt: "Une participante suit la présentation" },
    ],
    [
      { src: "/photos/atelier-02.jpg", alt: "Diapositive d'atelier sur l'image de soi" },
      { src: "/photos/public-04.jpg", alt: "Une participante dans la salle" },
      { src: "/photos/soiree-01.jpg", alt: "Soirée de clôture" },
      { src: "/photos/prise-parole-03.jpg", alt: "Passage de micro entre membres" },
    ],
  ],
};

/**
 * SECTION 4 — Le bandeau.
 *
 * Section autonome, avec son propre contenu : elle vivait auparavant
 * sous `preuve`, ce qui la faisait passer pour un appendice de la
 * galerie alors qu'elle a son fond, son titre et son rythme a elle.
 *
 * ROLE dans l'enchainement : la section precedente montre qu'on
 * FORME. Celle-ci montre tout le reste — ce qu'il y a a VIVRE, et des
 * gens contents d'y etre. Les deux ensemble repondent a « qu'est-ce
 * que j'y gagne ». Le texte ne DIT pas cette intention, il se contente
 * de la porter : des salles pleines, des soirees, des gens qui
 * reviennent.
 *
 * Deux rangees qui defilent en sens contraire. Les photos sont
 * reparties pour qu'aucune ne se retrouve face a elle-meme.
 */
export const bandeau = {
  kicker: "Pour les curieux",
  title: "Des salles pleines,",
  titleAccent: "et des gens qui reviennent.",
  // « Photos de promo » a ete retire : le mot renvoie a la photo de fin
  // d'annee scolaire, un registre academique qu'on nous a reproche.
  lead: "Soirées, sorties, photos de groupe. Vingt ans que le leadership se transmet au sein d'AIESEC in Benin, en vivant des expériences ensemble.",
  // Le bandeau n'utilise AUCUNE photo du mur de la section precedente :
  // on passe de l'une a l'autre sans revoir les memes visages.
  rows: [
    [
      "/photos/bandeau-01.jpg",
      "/photos/bandeau-02.jpg",
      "/photos/bandeau-03.jpg",
      "/photos/bandeau-04.jpg",
      "/photos/bandeau-05.jpg",
      "/photos/bandeau-06.jpg",
      "/photos/bandeau-07.jpg",
    ],
    [
      "/photos/bandeau-08.jpg",
      "/photos/bandeau-09.jpg",
      "/photos/bandeau-10.jpg",
      "/photos/bandeau-11.jpg",
      "/photos/bandeau-12.jpg",
      "/photos/bandeau-13.jpg",
      "/photos/bandeau-14.jpg",
    ],
  ],
};

/**
 * SECTION 5 — L'appel a l'action.
 *
 * DERNIERE section du corps de page : ni « l'experience » ni les
 * « infos pratiques » ne seront publiees, l'utilisateur les a
 * abandonnees. Tout ce qui devait y figurer et qui compte encore est
 * donc rappele ici en une ligne.
 *
 * AUCUN formulaire. L'inscription se fait sur des pages dediees, et
 * elle ne se limite pas a une adresse mail : on s'inscrit, puis on
 * rejoint le groupe WhatsApp. Les trois etapes sont ecrites noir sur
 * blanc — quelqu'un qui sait ce qui l'attend clique plus volontiers.
 *
 * `href` reste une ancre interne tant que l'URL des pages de
 * formulaire n'est pas connue.
 */
export const cta = {
  seatsLabel: "places",
  title: "Inscris-toi au",
  titleAccent: "NTMS 2026",
  // Trois verbes a l'imperatif : l'accroche pousse au clic au lieu de
  // decrire un mecanisme. Formulation donnee par l'utilisateur.
  lead: "Rejoins l'aventure, réserve ta place, et reste informé jusqu'au départ pour Lokossa.",
  steps: [
    {
      icon: ClipboardList,
      title: "Tu remplis le formulaire",
      body: "Ton nom, ton contact, et de quoi te connaître un peu.",
    },
    {
      icon: CheckCircle2,
      title: "Tu reçois ta confirmation",
      body: "Par mail, avec le lien du groupe de la promotion.",
    },
    {
      icon: MessageCircle,
      title: "Tu rejoins le groupe WhatsApp",
      // Le formulaire sert a amener les inscrits dans le groupe : c'est
      // LA qu'arrivent le programme et les tarifs, pas sur la landing.
      body: "Programme, informations pratiques et tarifs y sont annoncés.",
    },
  ],
  button: "Réserve ta place gratuitement",
  href: "/inscription",
};

/**
 * SECTION 6 — Contact.
 *
 * Placee APRES l'appel a l'action et AVANT la section Instagram, le
 * pied de page fermant la marche.
 *
 * Un seul canal pour l'instant : l'adresse mail du comite. Le numero
 * WhatsApp et le compte Instagram manquent — ils seront ajoutes ici
 * des que l'utilisateur les aura communiques, plutot que d'etre
 * inventes.
 */
/**
 * SECTION 6 — Instagram.
 *
 * Placee AVANT « Contactez-nous » (l'ordre a change en cours de
 * route), le pied de page fermant toujours la marche.
 *
 * ATTENTION : ce n'est PAS un flux en direct. Afficher les vraies
 * publications demande l'API Graph de Meta, donc un jeton d'acces et
 * une application declaree. La grille montre des photos du projet et
 * renvoie sur le compte ; rien dans le texte ne pretend qu'il s'agit
 * des dernieres publications.
 *
 * Le lien a ete debarrasse de son parametre `?stkn=` — c'est un jeton
 * de partage lie a la session de celui qui a copie l'adresse.
 */
export const instagram = {
  kicker: "Nos réseaux",
  // Seul endroit du site qui vouvoie. C'est un choix de l'utilisateur,
  // assume : l'invitation s'adresse a tout le monde, pas au lecteur
  // qu'on tutoie depuis le debut du parcours.
  title: "Suivez-nous sur nos réseaux",
  titleAccent: "pour ne rien rater.",
  // Formulation NEUTRE tant que le jeton n'est pas la : sans lui, les
  // vignettes sont des photos du projet, et « nos dernieres
  // publications » serait faux.
  lead: "Annonces, coulisses, photos de groupe. Le compte publie toute l'année, entre deux éditions comprises.",
  handle: "@beninnationalconference",
  url: "https://www.instagram.com/beninnationalconference",
  button: "Suivre le compte",
  // Photo de profil du compte, telechargee et servie en local : les
  // adresses du CDN Instagram sont signees et expirent.
  avatar: "/brand/ig-avatar.jpg",
};

export const contact = {
  kicker: "Une question",
  title: "Contactez-nous",
  titleAccent: "pour en savoir plus.",
  lead: "Une question avant de t'inscrire ? Le comité d'organisation répond directement, sans passer par un formulaire.",
  mailLabel: "Écris-nous",
  // Objet pre-rempli du message. Le CORPS reste vide : c'est au lecteur
  // d'ecrire sa question, un texte deja tape serait a effacer.
  mailSubject: "NTMS 2026 — Question",
  buttonLabel: "Écrire au comité",
  // Numero beninois du comite (format a 10 chiffres depuis 2024).
  // `wa.me` ouvre la discussion dans l'application WhatsApp sur
  // telephone, et WhatsApp Web sur ordinateur.
  whatsappLabel: "Écrire sur WhatsApp",
  whatsappNumero: "+229 01 62 55 52 20",
  whatsappLien: "https://wa.me/2290162555220",
  topicsLabel: "Ce qu'on nous demande le plus",
  topics: [
    "Le programme des cinq jours",
    "Le trajet jusqu'à Lokossa",
    "L'hébergement et les repas",
    "Les tarifs",
  ],
};

/**
 * SECTION 7 — La page d'inscription.
 *
 * Les champs viennent du comite. Trois ajouts de ma part, signales a
 * l'utilisateur : le SEXE, sans lequel « chambre non mixte » est
 * inexploitable ; et deux consentements, l'ajout au groupe WhatsApp et
 * l'usage des photos, puisque le site en publie.
 *
 * Les positions sont saisies librement tant que le comite n'a pas
 * fourni la liste officielle.
 */
/**
 * Les CGU et la politique de confidentialité d'AIESEC in Benin,
 * publiées comme document Google. Une seule adresse pour tout le
 * site : le pied de page et la case à cocher du formulaire pointent
 * ici. C'est ce document-là qu'on fait accepter, mentions légales
 * comprises (il porte l'identification de l'éditeur).
 */
export const legal = {
  label: "CGU et politique de confidentialité",
  url: "https://docs.google.com/document/d/e/2PACX-1vTcsG7n-UwpY3Isj276rO8qLYK4cETA7T0Tke2V0m8yN1-wGsUF3Mh4GWeNDo9uYpSUSK3TByhPVYuI/pub",
};

export const inscription = {
  titre: "Inscription au NTMS 2026",
  chapo: "Cinq jours à Lokossa, du 18 au 22 novembre 2026. Quelques minutes pour t'inscrire.",
  etapes: ["Qui es-tu ?", "Ton lien avec AIESEC", "Ton séjour"],
  /** [0] = AIESECer au Bénin, [1] = d'un autre pays, [2] = pas AIESECer. */
  profils: ["AIESECer au Bénin", "AIESECer d'un autre pays", "Pas AIESECer"],
  // Les membres du MC organisent l'edition : ils ne s'inscrivent pas.
  // Un AIESECer du Benin qui s'inscrit est donc forcement en LC, et la
  // question du niveau n'a plus lieu d'etre.
  noteMC: "Les membres du MC n'ont pas à s'inscrire.",
  /** `valeur` part dans la base ; `libelle` s'affiche dans la liste. */
  roles: [
    { valeur: "LCP", libelle: "LCP · Local Committee President" },
    { valeur: "LCVP", libelle: "LCVP · Local Committee Vice President" },
    { valeur: "TL", libelle: "TL · Team Leader" },
    { valeur: "TM", libelle: "TM · Team Member" },
  ],
  comites: ["Cotonou", "Parakou", "Porto-Novo", "Abomey-Calavi"],
  sexes: ["Femme", "Homme"],
  // Les valeurs partent telles quelles dans la feuille, qui les
  // controle par une liste deroulante : on ne les renomme pas. C'est
  // la question et l'explication qui portent la clarte.
  chambreQuestion: "Avec qui partages-tu ta chambre ?",
  chambres: ["Chambre mixte", "Chambre non mixte"],
  chambreAide:
    "Chambre mixte : filles et garçons peuvent loger dans la même chambre. Chambre non mixte : uniquement des personnes du même sexe que toi.",
  ouiNon: ["Oui", "Non"],
  consentementGroupe:
    "J'accepte d'être ajouté au groupe WhatsApp de l'édition, où sont annoncés le programme, les informations pratiques et les tarifs.",
  consentementPhotos:
    "J'accepte d'apparaître sur les photos et vidéos prises pendant l'événement et publiées par AIESEC in Benin.",
  // `lien` doit apparaître mot pour mot dans `texte` : c'est ce
  // morceau-là que le formulaire transforme en lien.
  consentementPolitique: {
    texte:
      "J'ai lu et j'accepte les conditions générales d'utilisation et la politique de confidentialité d'AIESEC in Benin.",
    lien: "conditions générales d'utilisation et la politique de confidentialité",
  },
  boutonFinal: "Valider mon inscription",
  // Affiche a la place du formulaire une fois la date passee.
  closesTitre: "Les inscriptions sont closes.",
  closesTexte:
    "Le formulaire est fermé. Si tu t'es inscrit et que tu n'as rien reçu, ou si tu veux être de la prochaine édition, écris au comité : quelqu'un te répond directement.",
  succesTitre: "Ton inscription est enregistrée.",
  succesTexte:
    "Rejoins le groupe WhatsApp maintenant : c'est là qu'arrivent le programme, les informations pratiques et les tarifs. Tu reçois aussi une confirmation par mail.",
  succesBouton: "Rejoindre le groupe WhatsApp",
  // Renseigner NEXT_PUBLIC_LIEN_WHATSAPP pour afficher le bouton.
  lienWhatsApp: process.env.NEXT_PUBLIC_LIEN_WHATSAPP ?? "",
};

export const programme = [
  {
    value: "j1",
    day: "Jour 1",
    title: "Le choc",
    subtitle: "Regarder le marché en face",
    sessions: [
      { time: "09:00", label: "Ouverture et brise-glace", tag: "Plénière" },
      { time: "10:30", label: "Le marché de l'emploi en 2030", tag: "Keynote" },
      { time: "14:00", label: "Cartographie de tes compétences", tag: "Atelier" },
      { time: "17:00", label: "Table ronde recruteurs", tag: "Panel" },
    ],
  },
  {
    value: "j2",
    day: "Jour 2",
    title: "L'outillage",
    subtitle: "Construire la boîte à outils",
    sessions: [
      { time: "09:00", label: "Pensée critique et résolution", tag: "Atelier" },
      { time: "11:00", label: "IA au quotidien : usages concrets", tag: "Lab" },
      { time: "14:00", label: "Communication et prise de parole", tag: "Atelier" },
      { time: "17:00", label: "Simulation d'entretien", tag: "Pratique" },
    ],
  },
  {
    value: "j3",
    day: "Jour 3",
    title: "La preuve",
    subtitle: "Livrer sous contrainte",
    sessions: [
      { time: "08:30", label: "Lancement du défi 24 h", tag: "Challenge" },
      { time: "13:00", label: "Mentorat par les alumni", tag: "Coaching" },
      { time: "16:00", label: "Pitchs devant jury", tag: "Restitution" },
      { time: "19:00", label: "Soirée culturelle", tag: "Réseau" },
    ],
  },
  {
    value: "j4",
    day: "Jour 4",
    title: "La suite",
    subtitle: "Repartir avec un cap",
    sessions: [
      { time: "09:00", label: "Plan personnel à 90 jours", tag: "Atelier" },
      { time: "11:00", label: "Choisir son comité et son rôle", tag: "Matching" },
      { time: "14:00", label: "Engagements et clôture", tag: "Plénière" },
      { time: "16:00", label: "Photo de promotion", tag: "Rituel" },
    ],
  },
];

export const faq = [
  {
    value: "q1",
    question: "À qui s'adresse le NTMS ?",
    answer:
      "Aux nouveaux membres d'AIESEC in Benin recrutés pour le mandat en cours. Aucune expérience préalable n'est demandée : le séminaire est justement conçu comme point d'entrée.",
  },
  {
    value: "q2",
    question: "Pourquoi un thème sur l'adaptabilité ?",
    answer:
      "Parce que la compétence la plus demandée par les recruteurs n'est plus un savoir technique précis, mais la capacité à en acquérir de nouveaux vite. Le NTMS 2026 entraîne cette capacité plutôt que d'en parler.",
  },
  {
    value: "q3",
    question: "Combien coûte la participation ?",
    answer:
      "Les frais couvrent l'hébergement, la restauration et le matériel. Le montant exact et les facilités de paiement sont communiqués à la confirmation de ton inscription.",
  },
  {
    value: "q4",
    question: "Que faut-il apporter ?",
    answer:
      "De quoi noter, une tenue confortable pour les ateliers, une tenue formelle pour la soirée de clôture, et ton ordinateur ou téléphone pour les sessions outils.",
  },
  {
    value: "q5",
    question: "Y a-t-il une suite après le séminaire ?",
    answer:
      "Oui. Tu repars avec un rôle dans un comité local et un plan à 90 jours suivi par ton team leader. Le NTMS est le début du parcours, pas un événement isolé.",
  },
];

export const values = [
  { icon: HeartHandshake, label: "Activating Leadership" },
  { icon: MessagesSquare, label: "Living Diversity" },
  { icon: Rocket, label: "Striving for Excellence" },
];
