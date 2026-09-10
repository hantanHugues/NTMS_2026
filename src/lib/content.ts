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
  baseline: "New Team Members Seminar",
  // THEME OFFICIEL, arrete par le comite et communique tel quel par
  // l'utilisateur. A ne pas reformuler : c'est la seule information de
  // contenu validee du projet, tout le reste (dates, places, programme)
  // reste une proposition a confirmer.
  theme: "Jeunesse & employabilité : s'adapter aux nouvelles exigences du marché de l'emploi",
  themeSubject: "Jeunesse & employabilité",
  themeAngle: "s'adapter aux nouvelles exigences du marché de l'emploi",
  dates: "19 – 22 novembre 2026",
  startsAt: "2026-11-19T09:00:00+01:00",
  // LIEU OFFICIEL, communique par l'utilisateur. Comme le theme, c'est
  // une information validee — a distinguer des dates et du nombre de
  // places, qui restent des propositions.
  city: "Lokossa, Bénin",
  cityShort: "Lokossa",
  seats: 180,
  email: "benin@aiesec.net",
};

// Le programme et la FAQ ont ete retires de la landing : le programme
// detaille ne sera pas publie, et la FAQ part sur la page de paiement.
export const navItems = [
  { href: "#constat", label: "Le constat" },
  { href: "#solution", label: "La solution" },
  { href: "#preuve", label: "La preuve" },
  { href: "#contact", label: "Contactez-nous" },
];

/** Les verbes qui défilent dans le titre : le mouvement EST le message. */
export const rotatingVerbs = [
  "s'adapter",
  "se réinventer",
  "désapprendre",
  "rebondir",
  "durer",
];

export const skillTags = [
  "Pensée critique",
  "Adaptabilité",
  "IA & outils",
  "Leadership",
  "Communication",
  "Résilience",
  "Travail en équipe",
  "Gestion de projet",
  "Curiosité",
  "Intelligence culturelle",
];


/**
 * SECTION 1 — Le problème, et ce qu'il coûte.
 *
 * La section ne vise PAS que ceux qui cherchent du travail. Les membres
 * AIESEC sont aussi des gens deja en poste, et l'argument vaut autant
 * pour eux : la question n'est pas d'avoir un emploi, c'est de le
 * garder dans un marche qui bouge plus vite qu'eux.
 *
 * D'ou la forme : deux colonnes de meme poids, 51 face a 49, reunies
 * par un filet et une seule phrase. La mise en page dit ce que dit le
 * texte — les deux groupes sont au meme niveau.
 *
 * Une version precedente representait les 100 personnes en semis de
 * points. Abandonnee : les deux teintes ne se distinguaient pas, le
 * decalage empechait de compter, et le dispositif demandait un effort
 * d'interpretation pour rien.
 *
 * Chiffre sourcé : Afrobarometer PP105, aout 2026 (Round 10) — 51 %
 * des 18-35 ans se declarent sans emploi et a la recherche d'un
 * travail.
 */
export const constat = {
  question: "Ton diplôme te garantit un travail ?",
  probe: "Pose la question autour de toi. Compte le temps que les gens mettent à répondre.",
  intro: "Sur 100 Béninois de 18 à 35 ans :",
  columns: [
    {
      value: "51",
      label: "cherchent du travail.",
      // « Malgre leur diplome » est une lecture, pas une donnee : le
      // sondage ne dit pas que ces 51 sont tous diplomes. La formule
      // reste juste pour le public vise, qui est etudiant.
      detail: "Malgré leur diplôme.",
    },
    {
      value: "49",
      label: "en ont un.",
      // Formule volontairement non chiffree : aucune enquete ne mesure
      // ce que ces 49 ressentent. En revanche « sans garantie » est
      // etaye — 90 % des emplois beninois sont informels (DTDA).
      detail: "Sans aucune garantie de le garder.",
    },
  ],
  level: "Personne n'est tranquille.",
  gap: "Le marché a changé de règles pendant que tu révisais, et il n'a pas fini.",
  closing: "On te dira que ça va aller.",
  closingAccent: "Ça n'ira pas tout seul.",
  source: "Afrobarometer PP105, août 2026",
};

/**
 * SECTION 2 — La solution : le NTMS lui-meme.
 *
 * Le titre RAPPELLE le probleme avant d'annoncer la reponse. Une
 * version precedente disait « le NTMS existe pour ca » : on change de
 * section, le lecteur a perdu le fil, et « ca » ne renvoyait a rien.
 *
 * Le theme est l'ADAPTABILITE au marche de l'emploi, pas
 * l'entrepreneuriat.
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
  lead: "Quatre jours à Lokossa, du 19 au 22 novembre 2026. Des ateliers, des mises en situation, et 180 membres qui traversent la même chose que toi.",
  offers: [
    {
      icon: GraduationCap,
      title: "Des compétences qui ne périment pas",
      body: "Communication, résolution de problèmes, travail en équipe, outils numériques. Ce que tu apprends ici ne dépend ni d'un poste ni d'un secteur.",
    },
    {
      icon: Plane,
      title: "Des portes que tu n'ouvriras pas seul",
      body: "Volontariat à l'étranger, stages, projets locaux. AIESEC donne accès à des expériences qui ne se trouvent pas sur une plateforme d'offres.",
    },
    {
      icon: Users,
      title: "Des gens qui avancent",
      body: "180 membres, des alumni déjà en poste, des professionnels invités. Tu repars avec des numéros que tu utiliseras vraiment.",
    },
    {
      icon: Compass,
      title: "Savoir de quoi tu es capable",
      body: "Quatre jours à te voir travailler sous contrainte, avec des inconnus. Tu apprends plus sur toi que pendant un semestre entier.",
    },
  ],
  closing: "Tu repars avec des compétences, un réseau,",
  closingAccent: "et une idée claire de ce que tu vaux.",
};

/**
 * SECTION 3 — La preuve.
 *
 * ROLE : on vient d'annoncer le NTMS comme une conference. Ici on
 * montre COMMENT ca se passe, de l'interieur — la preuve qu'on forme
 * vraiment, pas qu'on fait asseoir des gens dans une salle. D'ou un
 * texte qui enumere des gestes concrets (le micro, le petit groupe,
 * le passage devant la salle) plutot que des qualites.
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
  title: "Avant toi, ils y étaient.",
  // Deux phrases pleines, sans liste ni deux-points : l'enumeration est
  // portee par les verbes, ce sont les membres qui font les actions.
  // La seconde phrase referme sur le lecteur — formulation choisie par
  // l'utilisateur.
  lead: "Chaque année, nos membres se retrouvent en atelier, prennent la parole devant la salle, travaillent en petits groupes et présentent leurs restitutions. Joins-toi à nous pour vivre cette expérience.",
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
  // La formation par l'experience vecue est la pedagogie reelle
  // d'AIESEC, pas une formule : on la nomme telle quelle plutot que de
  // la deviner en creux.
  lead: "Soirées, sorties, photos de promo. Chez AIESEC on se forme en vivant les choses, et ça ne s'oublie pas.",
  rows: [
    [
      "/photos/promo-01.jpg",
      "/photos/prise-parole-01.jpg",
      "/photos/groupe-01.jpg",
      "/photos/public-01.jpg",
      "/photos/soiree-01.jpg",
      "/photos/atelier-01.jpg",
      "/photos/prise-parole-02.jpg",
    ],
    [
      "/photos/public-03.jpg",
      "/photos/atelier-02.jpg",
      "/photos/portrait-01.jpg",
      "/photos/prise-parole-03.jpg",
      "/photos/public-04.jpg",
      "/photos/public-02.jpg",
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
  href: "#inscription",
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
  kicker: "Instagram",
  title: "Suis la conférence",
  titleAccent: "au jour le jour.",
  // Formulation NEUTRE tant que le jeton n'est pas la : sans lui, les
  // vignettes sont des photos du projet, et « nos dernieres
  // publications » serait faux.
  lead: "Annonces, coulisses, photos de promotion. Le compte publie toute l'année, entre deux éditions comprises.",
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
  topicsLabel: "Ce qu'on nous demande le plus",
  topics: [
    "Le programme des quatre jours",
    "Le trajet jusqu'à Lokossa",
    "L'hébergement et les repas",
    "Les tarifs",
  ],
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
