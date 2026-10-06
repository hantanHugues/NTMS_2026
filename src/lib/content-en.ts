import * as fr from "@/lib/content";

/**
 * LE SITE EN ANGLAIS.
 *
 * Même forme que `content.ts`, mot pour mot : les deux fichiers sont
 * interchangeables, et un contrôle de type (en bas de `contenu.ts`)
 * refuse la compilation s'il manque une clé ici.
 *
 * TOUT CE QUI N'EST PAS DU TEXTE VIENT DU FRANÇAIS — images, adresses,
 * icônes, dates de configuration, numéros. Une photo renommée ou un
 * lien corrigé n'a ainsi pas à être reporté deux fois, et les deux
 * versions ne peuvent pas diverger en silence.
 *
 * CE QUI RESTE EN FRANÇAIS, VOLONTAIREMENT : les valeurs écrites dans
 * le classeur. Un « Homme » reste « Homme » dans la feuille même si la
 * personne a rempli le formulaire en anglais — sinon la base mélange
 * deux langues et devient impossible à trier.
 */

export const event = {
  ...fr.event,
  dates: "November 18 – 22, 2026",
  city: "Lokossa, Benin",
  // Le theme officiel, traduit : c'est une phrase de communication,
  // pas une valeur de base.
  theme: "20 years of existence: raising our standards for greater impact.",
  themeSubject: "20 years of existence",
  themeAngle: "raising our standards for greater impact.",
};

export const navItems = [
  { href: "#constat", label: "20 years" },
  { href: "#solution", label: "The seminar" },
  { href: "#preuve", label: "The proof" },
  { href: "#contact", label: "Contact us" },
];

export const hero = {
  amorce: "AIESEC in Benin, twenty years of",
  chute: "This year, we raise the bar.",
  bouton: "Book my seat",
  contact: "Contact us",
  unites: {
    jours: "d",
    heures: "h",
    minutes: "min",
    secondes: "s",
    libelle: "Time left before the opening",
  },
};

export const rotatingVerbs = [
  "training",
  "passing on",
  "daring",
  "starting over",
  "lasting",
];

export const skillTags = [
  "Leadership",
  "Cotonou",
  "Personal development",
  "Parakou",
  "Teamwork",
  "Porto-Novo",
  "Entrepreneurship",
  "Abomey-Calavi",
  "Public speaking",
  "Twenty years of relay",
];

export const constat = {
  question: "AIESEC in Benin has been training young people for twenty years.",
  probe:
    "Two decades of committees, projects and generations handing over the baton.",
  intro: "AIESEC in Benin, today:",
  columns: [
    {
      value: "20",
      label: "years of AIESEC in Benin.",
      detail: "Twenty years reached in 2025.",
    },
    {
      value: "4",
      label: "local chapters.",
      detail: "Cotonou, Parakou, Porto-Novo, Abomey-Calavi.",
    },
    {
      value: "1000+",
      label: "young people reached.",
      detail: "",
    },
  ],
  level: "The relay never stopped.",
  gap: "Every generation received something, and passed it on higher.",
  closing: "Twenty years come with a duty.",
  closingAccent: "It is time to raise the bar.",
  source: "AIESEC, present in more than 100 countries since 1948.",
};

export const solution = {
  themeLabel: "This year's theme",
  lead: "Five days in Lokossa, November 18 – 22, 2026. Workshops, hands-on situations, and twenty years of alumni in the room.",
  offers: [
    {
      icon: fr.solution.offers[0].icon,
      title: "Skills that do not expire",
      body: "Leadership, personal development, entrepreneurship, teamwork. What you learn here depends neither on a job title nor on an industry.",
    },
    {
      icon: fr.solution.offers[1].icon,
      title: "Doors you will not open alone",
      body: "Volunteering abroad, internships, local projects. AIESEC opens experiences you will not find on a job board.",
    },
    {
      icon: fr.solution.offers[2].icon,
      title: "Twenty generations in one room",
      body: "Alumni from the past twenty years come to speak. Whatever they built, they tell you how.",
    },
    {
      icon: fr.solution.offers[3].icon,
      title: "Finding out what you are capable of",
      body: "Five days watching yourself work under pressure, with strangers. You learn more about yourself than in a whole semester.",
    },
  ],
  closing: "You leave with skills, a network,",
  closingAccent: "and a higher standard.",
};

export const preuve = {
  title: "Twenty generations of AIESECers, one after another.",
  lead: "For twenty years, AIESEC in Benin members have met in workshops, spoken in front of the room, worked in small groups and presented their work. Join us and live it too.",
  // Les photos et leurs descriptions alternatives, traduites.
  columns: [
    [
      { src: "/photos/prise-parole-01.jpg", alt: "A member speaking into the microphone in front of the group" },
      { src: "/photos/public-01.jpg", alt: "Participants listening during a session" },
      { src: "/photos/atelier-01.jpg", alt: "Working session with a projection" },
      { src: "/photos/promo-01.jpg", alt: "The whole group, arms raised" },
    ],
    [
      { src: "/photos/public-02.jpg", alt: "A participant in the audience" },
      { src: "/photos/prise-parole-02.jpg", alt: "A member at the microphone in front of the AIESEC banner" },
      { src: "/photos/groupe-01.jpg", alt: "The group outdoors by the water" },
      { src: "/photos/public-03.jpg", alt: "A participant following the presentation" },
    ],
    [
      { src: "/photos/atelier-02.jpg", alt: "Workshop slide on self-image" },
      { src: "/photos/public-04.jpg", alt: "A participant in the room" },
      { src: "/photos/soiree-01.jpg", alt: "Closing evening" },
      { src: "/photos/prise-parole-03.jpg", alt: "Members passing the microphone" },
    ],
  ],
};

export const bandeau = {
  ...fr.bandeau,
  kicker: "For the curious",
  title: "Full rooms,",
  titleAccent: "and people who come back.",
  lead: "Evenings, outings, group photos. Twenty years of leadership passed on inside AIESEC in Benin, by living things together.",
};

export const cta = {
  seatsLabel: "seats",
  title: "Register for the",
  titleAccent: "NTMS 2026",
  lead: "Join the adventure, book your seat, and stay posted until we leave for Lokossa.",
  steps: [
    {
      icon: fr.cta.steps[0].icon,
      title: "You fill in the form",
      body: "Your name, your contact, and enough to get to know you.",
    },
    {
      icon: fr.cta.steps[1].icon,
      title: "You get your confirmation",
      body: "By email, with the link to the group of your generation.",
    },
    {
      icon: fr.cta.steps[2].icon,
      title: "You join the WhatsApp group",
      body: "Schedule, practical information and fees are announced there.",
    },
  ],
  button: "Book your seat for free",
  href: "/inscription",
};

export const ctaPaiement = {
  ...cta,
  title: "Pay for your seat at the",
  lead: "Registration is closed. Payment is what keeps your seat for this edition.",
  steps: [
    {
      icon: fr.ctaPaiement.steps[0].icon,
      title: "You pay for your seat",
      body: "By MTN MoMo, Moov Money, Celtiis Cash or cash, in one go.",
    },
    {
      icon: fr.ctaPaiement.steps[1].icon,
      title: "You get your confirmation",
      body: "By email, once the committee has checked your proof.",
    },
    {
      icon: fr.ctaPaiement.steps[2].icon,
      title: "You join the WhatsApp group",
      body: "Schedule, practical information and the trip to Lokossa.",
    },
  ],
  button: "Pay for my seat",
  href: "/paiement",
};

export const ctaClos = {
  ...cta,
  title: "This edition is closed —",
  lead: "Registration and payment are both closed. Write to us if you think this is a mistake, or follow the account for the next edition.",
  button: "Write to the committee",
  href: "#contact",
};

export const boutonPhase = {
  inscription: { label: "Register", href: "#inscription" },
  paiement: { label: "Pay for my seat", href: "/paiement" },
  clos: { label: "Contact us", href: "#contact" },
};

export const instagram = {
  ...fr.instagram,
  kicker: "Our socials",
  title: "Follow us",
  titleAccent: "so you miss nothing.",
  lead: "Announcements, behind the scenes, group photos. The account posts all year long, between editions included.",
  button: "Follow the account",
};

export const contact = {
  ...fr.contact,
  kicker: "A question",
  title: "Contact us",
  titleAccent: "to know more.",
  lead: "A question before you register? The organising committee answers directly, no form in between.",
  mailLabel: "Write to us",
  mailSubject: "NTMS 2026 — Question",
  buttonLabel: "Write to the committee",
  whatsappLabel: "Message us on WhatsApp",
  topicsLabel: "What people ask us most",
  topics: [
    "The five-day schedule",
    "Getting to Lokossa",
    "Accommodation and meals",
    "The fees",
  ],
};

export const pied = {
  presentation:
    "Twenty years of AIESEC in Benin, and five days to raise our standards.",
  navigation: "Navigation",
  edition: "This edition",
  places: "seats",
};

export const legal = {
  ...fr.legal,
  label: "Terms of use and privacy policy",
};

export const paiement = {
  ...fr.paiement,
  titre: "Declare your payment",
  chapo:
    "Have you paid for your seat? Tell us here with a proof. The committee checks it, then sends you your receipt by email.",
  rappel:
    "The website does not take payments: you pay the way you usually do, then you declare it here.",
  libelleNom: "Full name",
  libelleEmail: "Email address",
  libelleNumero: "Phone number",
  libelleMoyen: "How did you pay?",
  libelleMoyenAutre: "Tell us which",
  libelleMontant: "Amount paid",
  libelleDate: "Date of payment",
  libellePreuve: "Proof of payment",
  aidePreuve:
    "A screenshot of the SMS, the operator's receipt, or a photo of the slip. Image or PDF, 3 MB at most.",
  libelleRemarque: "Note",
  aideRemarque: "Optional — anything that would help us find your payment.",
  allege: "Image compressed for sending.",
  placeholderEmail: "firstname.lastname@example.com",
  indicationMoyen: "Choose how you paid",
  placeholderMoyenAutre: "Western Union, branch deposit…",
  placeholderRemarque: "Optional",
  boutonPreuve: "Choose an image or a PDF",
  montantManquant:
    "The ticket desk is not set up yet: the amount is missing. Write to us at",
  retirerPreuve: "Remove the proof",
  dateJour: "Day",
  dateMois: "Month",
  dateAnnee: "Year",
  mois: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  attente: [
    "Sending your proof…",
    "Recording your declaration…",
    "A few more seconds…",
  ],
  attenteNote: "Do not close this page: your declaration is being sent.",
  locale: "en-GB",
  uniteMega: "MB",
  uniteKilo: "KB",
  bouton: "Send my declaration",
  enCours: "Sending…",
  succesTitre: "Your declaration is recorded.",
  succesTexte:
    "The committee checks your proof, then sends you your receipt by email. Nothing else to do on your side.",
  succesBouton: "Join the participants' group",
  erreurs: {
    clos: "Payments are closed.",
    illisible: "Unreadable request.",
    preuveIllisible: "This file could not be read. Pick another one.",
    nom: "Your name, please.",
    email: "This email address is not valid.",
    numero: "This phone number is not valid.",
    moyen: "Choose the method you used.",
    moyenAutre: "Tell us which method you used.",
    montant: "Tell us the amount you paid.",
    date: "Tell us the date of the payment.",
    dateFuture: "This date is in the future: check the day of the payment.",
    preuveFormat: "The proof must be an image (JPG, PNG, WEBP) or a PDF.",
    preuveLourde: "This proof is too heavy: 3 MB at most.",
    preuveManquante: "Attach a proof of your payment.",
    enregistrement: "Your declaration could not be recorded. Try again.",
    indisponible: "The service is momentarily unavailable. Try again.",
  },
  closTitre: "Payments are closed.",
  closTexte:
    "The ticket desk for this edition is closed. Write to us if you think this is a mistake.",
};


export const inscription = {
  ...fr.inscription,
  titre: "Register for NTMS 2026",
  chapo: "Five days in Lokossa, November 18 – 22, 2026. A few minutes to sign up.",
  etapes: ["Who are you?", "Your link with AIESEC", "Your stay"],
  noteMC: "MC members do not need to register.",
  chambreQuestion: "Who do you share your room with?",
  chambreAide:
    "Mixed room: girls and boys may share the same room. Single-gender room: only people of the same gender as you.",
  consentementGroupe:
    "I agree to be added to the edition's WhatsApp group, where the schedule, practical information and fees are announced.",
  consentementPhotos:
    "I agree to appear in photos and videos taken during the event and published by AIESEC in Benin.",
  consentementPolitique: {
    texte:
      "I have read and accept the terms of use and the privacy policy of AIESEC in Benin.",
    lien: "terms of use and the privacy policy",
  },
  formulaire: {
    prenom: "First name",
    nom: "Last name",
    email: "Email address",
    emailExemple: "firstname.lastname@example.com",
    whatsapp: "WhatsApp number",
    whatsappAide: "This is the number that will be added to the edition's group.",
    formatAttendu: "Expected format",
    sexe: "Gender",
    sexeAide: "Used only to assign rooms.",
    profil: "You are…",
    role: "Your role",
    roleIndication: "Choose your role",
    lc: "Your local committee",
    lcIndication: "Choose your committee",
    poste: "Your position",
    pays: "Your country",
    source: "How did you hear about NTMS?",
    allergieQuestion: "Are you allergic to any food?",
    allergieQuoi: "To what?",
    restauration: "Anything we should know about meals",
    facultatif: "Optional",
    etapeSur: "Step {n} of {m}",
    continuer: "Continue",
    retour: "Back",
    etapePrecedente: "Previous step",
    accueil: "Home",
    revenirAccueil: "Back to home",
    envoiEnCours: "Sending…",
    copier: "Copy",
    copie: "Copied",
    ouCopier: "Or copy this link:",
    lienParMail: "The group link is sent to you by email.",
    attente: [
      "Recording your registration…",
      "Preparing your confirmation email…",
      "A few more seconds…",
    ],
    neFermePas: "Do not close this page: your registration is on its way.",
    secours:
      "Try again in a moment. If it happens again, write to us: we will register you by hand, your seat is not lost.",
    secoursMail: "Write by email",
    secoursObjet: "NTMS 2026 — registration problem",
    secoursCorps:
      "Hello,\n\nI cannot complete my NTMS 2026 registration from the website.",
    erreurReseau: "The service is not responding. Try again in a moment.",
    erreurEnvoi: "Could not send. Try again.",
  },
  boutonFinal: "Confirm my registration",
  // La VALEUR reste francaise — c'est elle qui part dans le classeur ;
  // seul l'affichage change.
  libelles: {
    "AIESECer au Bénin": "AIESECer in Benin",
    "AIESECer d'un autre pays": "AIESECer from another country",
    "Pas AIESECer": "Not an AIESECer",
    Femme: "Female",
    Homme: "Male",
    "Chambre mixte": "Mixed room",
    "Chambre non mixte": "Single-gender room",
    Oui: "Yes",
    Non: "No",
  } as Record<string, string>,
  erreurs: {
    nom: "Your first and last name, please.",
    email: "This email address is not valid. Example: firstname.lastname@gmail.com",
    pays: "Choose the country of your number.",
    numero: "This number does not match the format",
    numeroBenin: "for Benin",
    numeroPays: "for this country",
    numeroExemple: "Example",
    sexe: "Tell us your gender: it is used to assign rooms.",
    profil: "Tell us who you are.",
    role: "Choose your role.",
    lc: "Choose your local committee.",
    poste: "Tell us your position.",
    paysLibre: "Tell us your country.",
    source: "Tell us how you heard about NTMS.",
    chambre: "Choose a room type.",
    allergie: "Answer the question about allergies.",
    allergieDetail: "Tell us what you are allergic to.",
    consentementGroupe:
      "Joining the WhatsApp group is required to follow this edition.",
    consentementPolitique:
      "You must accept the terms of use and the privacy policy to register.",
    service: "The registration service is unavailable. Please write to us.",
    illisible: "Unreadable request.",
    closes: "Registrations are closed.",
    enregistrement: "Your registration could not be recorded. Try again.",
    indisponible: "The service is momentarily unavailable. Try again.",
  },
  closesTitre: "Registration is closed.",
  closesTexte:
    "The form is closed. If you registered and received nothing, or if you want to be part of the next edition, write to the committee: someone answers directly.",
  succesTitre: "Your registration is recorded.",
  succesTexte:
    "Join the WhatsApp group now: that is where the schedule, practical information and fees arrive. You also get a confirmation by email.",
  succesBouton: "Join the WhatsApp group",
};

export const programme = fr.programme.map((jour, i) => ({
  ...jour,
  day: ["Day 1", "Day 2", "Day 3", "Day 4"][i],
  title: ["The wake-up call", "The toolbox", "The proof", "What comes next"][i],
  subtitle: [
    "Looking the market in the eye",
    "Building your toolbox",
    "Delivering under pressure",
    "Leaving with a direction",
  ][i],
}));

export const faq = [
  {
    value: "q1",
    question: "Who is the NTMS for?",
    answer:
      "For new AIESEC in Benin members recruited for the current term. No prior experience is required: the seminar is designed as the entry point.",
  },
  {
    value: "q2",
    question: "Why a theme on adaptability?",
    answer:
      "Because the skill recruiters ask for most is no longer one precise technique, but the ability to pick up new ones quickly. NTMS 2026 trains that ability instead of talking about it.",
  },
  {
    value: "q3",
    question: "How much does it cost?",
    answer:
      "The fee covers accommodation, meals and materials. The exact amount and the payment options are shared when your registration is confirmed.",
  },
  {
    value: "q4",
    question: "What should I bring?",
    answer:
      "Something to write with, comfortable clothes for the workshops, formal wear for the closing evening, and your laptop or phone for the tool sessions.",
  },
  {
    value: "q5",
    question: "Is there anything after the seminar?",
    answer:
      "Yes. You leave with a role in a local committee and a 90-day plan followed by your team leader. NTMS is the start of the journey, not a one-off event.",
  },
];

export const values = fr.values;
