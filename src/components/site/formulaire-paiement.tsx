"use client";

import * as React from "react";
import Image from "next/image";
import {
  CalendarDays,
  Check,
  FileCheck2,
  Info,
  Mail,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChoixPays, ListeDeroulante } from "@/components/site/listes-inscription";
import { useContenu } from "@/components/site/langue";
import type { Situation } from "@/lib/classeur";
import {
  emailValide,
  numeroInternational,
  paysDepuisNumero,
} from "@/lib/inscription-regles";
import {
  FORMATS,
  MOYENS,
  analysePack,
  MOYEN_AUTRE,
  POIDS_MAX,
  fuseauPour,
  jourDans,
} from "@/lib/paiement";
import { cn } from "@/lib/utils";

/**
 * La déclaration de paiement.
 *
 * On ne demande que ce qui permet de RETROUVER le paiement dans les
 * relevés : qui paie, comment, combien, quand, et la preuve.
 *
 * LA PREUVE EST ALLÉGÉE DANS LE NAVIGATEUR. Une capture d'écran de
 * téléphone pèse souvent 4 ou 5 Mo, ce qui ne passe pas : l'image est
 * redessinée à 1600 px de large au plus, en JPEG, avant d'être
 * encodée. Un PDF, lui, part tel quel — on ne sait pas le compresser
 * ici, donc on le refuse au-delà de la limite plutôt que d'échouer à
 * l'envoi.
 */

const CHAMP =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary max-sm:min-h-13";

function Libelle({
  children,
  obligatoire,
  id,
}: {
  children: React.ReactNode;
  obligatoire?: boolean;
  id?: string;
}) {
  return (
    <span id={id} className="mb-2 block text-sm font-medium">
      {children}
      {obligatoire ? <span className="text-accent-text"> *</span> : null}
    </span>
  );
}

/** Redessine une image trop lourde ; renvoie le fichier tel quel sinon. */
async function alleger(fichier: File): Promise<Blob> {
  if (!fichier.type.startsWith("image/") || fichier.size < 900_000) return fichier;

  const source = await createImageBitmap(fichier);
  const cote = Math.max(source.width, source.height);
  const facteur = cote > 1600 ? 1600 / cote : 1;
  const toile = document.createElement("canvas");
  toile.width = Math.round(source.width * facteur);
  toile.height = Math.round(source.height * facteur);
  const pinceau = toile.getContext("2d");
  if (!pinceau) return fichier;
  pinceau.drawImage(source, 0, 0, toile.width, toile.height);

  const reduit = await new Promise<Blob | null>((resoudre) =>
    toile.toBlob(resoudre, "image/jpeg", 0.82)
  );
  // Une image déjà bien compressée peut ressortir plus lourde.
  return reduit && reduit.size < fichier.size ? reduit : fichier;
}

/** Le contenu d'un fichier, encodé pour voyager dans du JSON. */
function encoder(blob: Blob, erreur: string): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const resultat = String(lecteur.result);
      resoudre(resultat.slice(resultat.indexOf(",") + 1));
    };
    lecteur.onerror = () => rejeter(new Error(erreur));
    lecteur.readAsDataURL(blob);
  });
}

/**
 * La date, en calendrier.
 *
 * Deux mois seulement — octobre et novembre 2026, ceux de la
 * billetterie — et une année qui ne change pas. Le champ
 * `type="date"` natif propose toutes les années et impose son
 * habillage ; ici la personne voit le mois, touche un jour, c'est
 * tout. Les jours à venir sont grisés : on déclare un paiement fait.
 *
 * Le calendrier n'est PAS affiché en permanence : un champ montre la
 * date choisie, et le toucher ouvre le calendrier juste dessous. Il se
 * referme au choix d'un jour, à Échap, ou au clic à côté.
 */
const ANNEE_CALENDRIER = 2026;
const MOIS_CALENDRIER = [9, 10]; // octobre, novembre (0 = janvier)

function ChoixDate({
  valeur,
  onChange,
  etiquette,
  aujourdhui,
}: {
  /** Format ISO, « 2026-10-02 », ou chaîne vide. */
  valeur: string;
  onChange: (v: string) => void;
  etiquette: string;
  /** Le jour qu'il est pour la personne, format ISO. */
  aujourdhui: string;
}) {
  const { paiement, langue } = useContenu();
  const [ouvert, setOuvert] = React.useState(false);
  const racine = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: PointerEvent) => {
      if (!racine.current?.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  const moisDeValeur = valeur ? Number(valeur.split("-")[1]) - 1 : -1;
  const [mois, setMois] = React.useState(() =>
    MOIS_CALENDRIER.includes(moisDeValeur)
      ? moisDeValeur
      : Number(aujourdhui.slice(5, 7)) - 1 >= 10
        ? 10
        : 9
  );

  // Semaine du lundi au dimanche ; le 5 janvier 2026 est un lundi.
  const jours = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(langue, { weekday: "short" }).format(
      new Date(2026, 0, 5 + i)
    )
  );
  const decalage = (new Date(ANNEE_CALENDRIER, mois, 1).getDay() + 6) % 7;
  const nbJours = new Date(ANNEE_CALENDRIER, mois + 1, 0).getDate();
  const cases: (number | null)[] = [
    ...Array<null>(decalage).fill(null),
    ...Array.from({ length: nbJours }, (_, i) => i + 1),
  ];
  const iso = (j: number) =>
    `${ANNEE_CALENDRIER}-${String(mois + 1).padStart(2, "0")}-${String(j).padStart(2, "0")}`;

  const premier = mois === MOIS_CALENDRIER[0];
  const dernier = mois === MOIS_CALENDRIER[MOIS_CALENDRIER.length - 1];
  const navigation =
    "flex size-11 items-center justify-center rounded-full border border-border text-lg transition-colors enabled:hover:border-primary disabled:opacity-30";

  const [, moisChoisi, jourChoisi] = valeur ? valeur.split("-") : ["", "", ""];
  const lisible = valeur
    ? `${Number(jourChoisi)} ${paiement.mois[Number(moisChoisi) - 1]} ${ANNEE_CALENDRIER}`
    : "";

  return (
    <div ref={racine} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-labelledby={etiquette}
        onClick={() => setOuvert((o) => !o)}
        className={cn(CHAMP, "flex items-center justify-between text-left")}
      >
        <span className={cn(!lisible && "text-muted-foreground/60")}>
          {lisible || (langue === "fr" ? "Choisir une date" : "Pick a date")}
        </span>
        <CalendarDays className="size-5 text-muted-foreground" />
      </button>

      {ouvert ? (
    <div
      role="dialog"
      aria-labelledby={etiquette}
      className="absolute inset-x-0 z-30 mt-2 rounded-xl border border-border bg-background p-3 shadow-xl sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className={navigation}
          disabled={premier}
          onClick={() => setMois(MOIS_CALENDRIER[0])}
          aria-label={paiement.mois[MOIS_CALENDRIER[0]]}
        >
          ‹
        </button>
        <p className="font-medium capitalize" aria-live="polite">
          {paiement.mois[mois]} {ANNEE_CALENDRIER}
        </p>
        <button
          type="button"
          className={navigation}
          disabled={dernier}
          onClick={() => setMois(MOIS_CALENDRIER[MOIS_CALENDRIER.length - 1])}
          aria-label={paiement.mois[MOIS_CALENDRIER[MOIS_CALENDRIER.length - 1]]}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {jours.map((j) => (
          <span
            key={j}
            className="pb-1 text-xs capitalize text-muted-foreground"
          >
            {j.slice(0, 2)}
          </span>
        ))}
        {cases.map((j, i) => {
          if (j === null) return <span key={`vide-${i}`} />;
          const date = iso(j);
          const choisi = date === valeur;
          const futur = date > aujourdhui;
          return (
            <button
              key={date}
              type="button"
              disabled={futur}
              aria-pressed={choisi}
              onClick={() => {
                onChange(date);
                setOuvert(false);
              }}
              className={cn(
                "flex aspect-square min-h-10 items-center justify-center rounded-lg text-sm transition-colors",
                choisi
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "enabled:hover:bg-accent",
                futur && "cursor-not-allowed opacity-30",
                date === aujourdhui && !choisi && "border border-primary/60"
              )}
            >
              {j}
            </button>
          );
        })}
      </div>
    </div>
      ) : null}
    </div>
  );
}

const poidsLisible = (o: number, mega: string, kilo: string) =>
  o > 1_000_000
    ? (o / 1_000_000).toFixed(1) + " " + mega
    : Math.round(o / 1000) + " " + kilo;

/**
 * L'écran d'attente, le même que pour l'inscription : la preuve doit
 * monter, puis traverser Google. Sans rien à l'écran, on croit que le
 * bouton n'a pas pris.
 */
function EcranEnvoi() {
  const { paiement } = useContenu();
  const etapes = paiement.attente;
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const minuteur = window.setInterval(
      () => setI((n) => Math.min(n + 1, etapes.length - 1)),
      3500
    );
    return () => window.clearInterval(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 px-8 text-center backdrop-blur-sm"
    >
      <span className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-primary/15 border-t-primary" />
        <Image
          src="/ntms-logo.png"
          alt=""
          width={1699}
          height={1267}
          className="h-8 w-auto"
        />
      </span>
      <p className="font-heading text-lg font-extrabold tracking-tight text-balance">
        {etapes[i]}
      </p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        {paiement.attenteNote}
      </p>
    </div>
  );
}

export function FormulairePaiement({
  maintenant,
}: {
  /** L'heure du serveur à l'envoi de la page, en millisecondes. */
  maintenant: number;
}) {
  const { paiement, contact, event } = useContenu();
  const msg = paiement.erreurs;
  const [nom, setNom] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [paysTel, setPaysTel] = React.useState("BJ");
  const [numero, setNumero] = React.useState("");
  const [moyen, setMoyen] = React.useState("");
  const [moyenAutre, setMoyenAutre] = React.useState("");
  const [montantPaye, setMontantPaye] = React.useState("");
  // Ce que le classeur sait de la personne, une fois e-mail et numéro
  // donnés. Tant qu'il est null, seule l'identification s'affiche.
  const [situation, setSituation] = React.useState<Situation | null>(null);
  const [pack, setPack] = React.useState("");
  // Alumni ou Delegate : chacun ne voit que ses packs.
  const [profil, setProfil] = React.useState<"" | "alumni" | "delegate">("");
  const [verif, setVerif] = React.useState(false);
  // E-mail et numéro ne se correspondent pas : on montre le comité.
  const [aide, setAide] = React.useState(false);
  const [date, setDate] = React.useState("");
  const [remarque, setRemarque] = React.useState("");

  const [fichier, setFichier] = React.useState<File | null>(null);
  const [allege, setAllege] = React.useState<number | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, setEnvoi] = React.useState(false);
  const [envoye, setEnvoye] = React.useState(false);

  const champFichier = React.useRef<HTMLInputElement>(null);
  const fmt = (n: number) => new Intl.NumberFormat(paiement.locale).format(n);
  const identifie = situation !== null;
  // Déjà reconnue ET déjà dotée d'un pack : elle ne ressaisit rien.
  const reconnue = !!situation?.connu && !!situation.pack;
  const aDesCategories = !!situation?.packs.some((p) => p.categorie);
  const packsProfil = (situation?.packs ?? []).filter(
    (p) => !p.categorie || p.categorie === profil
  );
  const packChoisi = packsProfil.find((p) => p.nom === pack);
  const bilan = reconnue
    ? {
        nom: analysePack(situation!.pack).libelle,
        du: situation!.montant_du,
        valide: situation!.valide,
        attente: situation!.attente,
      }
    : packChoisi
      ? { nom: packChoisi.libelle, du: packChoisi.prix, valide: 0, attente: 0 }
      : null;
  // Tout le pack est déjà payé, ou couvert par des paiements encore
  // en attente de validation : rien de plus à déclarer.
  const couverte =
    reconnue &&
    situation!.montant_du > 0 &&
    situation!.valide + situation!.attente >= situation!.montant_du;
  const soldee = couverte && situation!.valide >= situation!.montant_du;
  const resteAvant = bilan ? Math.max(bilan.du - bilan.valide, 0) : 0;
  const montantNum = Number(montantPaye.replace(/\D/g, "")) || 0;
  const resteApres = bilan
    ? Math.max(resteAvant - bilan.attente - montantNum, 0)
    : 0;
  // Un paiement ne peut pas avoir eu lieu demain.
  // L'heure vient du serveur ; on ne garde de l'appareil que le temps
  // écoulé depuis l'ouverture de la page, pour que le jour change à
  // minuit même si la page reste ouverte.
  const [horloge, setHorloge] = React.useState(maintenant);
  React.useEffect(() => {
    const ecart = maintenant - Date.now();
    const minuteur = window.setInterval(
      () => setHorloge(Date.now() + ecart),
      30_000
    );
    return () => window.clearInterval(minuteur);
  }, [maintenant]);
  const aujourdhui = jourDans(horloge, fuseauPour(paysTel));

  async function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setAllege(null);
    if (!f) return setFichier(null);
    if (!FORMATS.includes(f.type)) {
      setFichier(null);
      return setErreur(msg.preuveFormat);
    }
    setErreur(null);
    setFichier(f);
    try {
      const reduit = await alleger(f);
      if (reduit.size < f.size) setAllege(reduit.size);
    } catch {
      // L'allègement est un confort : son échec n'empêche rien.
    }
  }

  /** Demande au classeur qui est cette personne, puis ouvre la suite. */
  async function verifier() {
    if (!emailValide(email.trim())) return setErreur(msg.email);
    const international = numeroInternational(paysTel, numero);
    if (!international) return setErreur(msg.numero);

    setErreur(null);
    setAide(false);
    setVerif(true);
    try {
      const reponse = await fetch("/api/paiement/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), numero: international }),
      });
      const s = (await reponse.json()) as Partial<Situation> & {
        ok?: boolean;
        message?: string;
      };
      if (!s.ok || !s.packs) throw new Error(s.message || msg.indisponible);
      if (s.blocage) {
        setAide(true);
        return setErreur(msg.identification);
      }
      const complet = s as Situation;
      setSituation(complet);
      setPack("");
      if (complet.connu) setNom(complet.nom);
      // Le montant n'est JAMAIS pré-rempli : la personne le saisit
      // elle-même.
      setMontantPaye("");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : msg.indisponible);
    } finally {
      setVerif(false);
    }
  }

  async function envoyer() {
    if (!situation) return verifier();
    if (!reconnue && nom.trim().length < 2) return setErreur(msg.nom);
    if (!reconnue && aDesCategories && !profil) return setErreur(msg.profil);
    if (!reconnue && !pack) return setErreur(msg.pack);
    if (!emailValide(email.trim()))
      return setErreur(msg.email);
    const international = numeroInternational(paysTel, numero);
    if (!international) return setErreur(msg.numero);
    if (!moyen) return setErreur(msg.moyen);
    if (moyen === MOYEN_AUTRE && moyenAutre.trim().length < 2)
      return setErreur(msg.moyenAutre);
    if (!montantPaye.replace(/\D/g, ""))
      return setErreur(msg.montant);
    if (!date) return setErreur(msg.date);
    if (date > aujourdhui)
      return setErreur(msg.dateFuture);
    if (!fichier) return setErreur(msg.preuveManquante);

    setErreur(null);
    setEnvoi(true);
    try {
      const charge = await alleger(fichier);
      if (charge.size > POIDS_MAX) {
        throw new Error(`${msg.preuveLourde} (${poidsLisible(charge.size, paiement.uniteMega, paiement.uniteKilo)})`);
      }
      const contenu = await encoder(charge, msg.preuveIllisible);

      const reponse = await fetch("/api/paiement/declarer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: reconnue ? situation.nom : nom,
          email,
          numero: international,
          pack: reconnue ? situation.pack : pack,
          moyen: moyen === MOYEN_AUTRE ? moyenAutre : moyen,
          montant_declare: montantPaye,
          date_paiement: date,
          remarque,
          preuve_base64: contenu,
          preuve_type: charge.type || fichier.type,
          preuve_nom: fichier.name,
        }),
      });
      const resultat = (await reponse.json()) as { ok?: boolean; message?: string };
      if (!resultat.ok) throw new Error(resultat.message || msg.enregistrement);
      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : msg.enregistrement);
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <div className="rounded-3xl bg-card p-8 text-center shadow-md sm:p-12 max-sm:rounded-none max-sm:bg-background max-sm:px-5 max-sm:shadow-none">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Check className="size-6" />
        </span>
        <h2 className="font-heading mt-6 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
          {paiement.succesTitre}
        </h2>
        <p className="mx-auto mt-5 max-w-md leading-relaxed text-pretty text-muted-foreground">
          {paiement.succesTexte}
        </p>

        {paiement.lienWhatsApp ? (
          <Button
            nativeButton={false}
            size="lg"
            className="mt-8 h-13 rounded-full px-8 text-base has-data-[icon=inline-start]:pl-7 max-sm:h-14 max-sm:w-full max-sm:px-6"
            render={
              <a
                href={paiement.lienWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle data-icon="inline-start" />
            {paiement.succesBouton}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-card p-6 shadow-md sm:p-10 max-sm:rounded-none max-sm:bg-background max-sm:p-5 max-sm:shadow-none">
      {envoi ? <EcranEnvoi /> : null}

      <p className="flex items-start gap-2.5 rounded-2xl bg-accent/60 px-4 py-3 text-sm leading-relaxed text-accent-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        {paiement.rappel}
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <label>
          <Libelle obligatoire>{paiement.libelleEmail}</Libelle>
          <input
            className={CHAMP}
            type="email"
            value={email}
            disabled={identifie}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={120}
            placeholder={paiement.placeholderEmail}
          />
        </label>

        {/* Même composition que l'inscription : l'indicatif à gauche,
            le numéro à droite, et la validation par pays. */}
        <div>
          <Libelle obligatoire id="q-tel-paiement">
            {paiement.libelleNumero}
          </Libelle>
          <div className="grid grid-cols-[6.5rem_1fr] gap-2 sm:grid-cols-[15rem_1fr]">
            <ChoixPays
              etiquette="q-tel-paiement"
              valeur={paysTel}
              onChange={(v) => {
                if (!identifie) setPaysTel(v);
              }}
            />
            <input
              className={CHAMP}
              disabled={identifie}
              type="tel"
              inputMode="tel"
              value={numero}
              onChange={(e) => {
                const brut = e.target.value.replace(/[^\d\s().+-]/g, "");
                // « 00229… » ou « +229… » : le pays suit l'indicatif tapé,
                // donc le fuseau et les dates possibles aussi.
                const lu = paysDepuisNumero(brut);
                if (lu) {
                  setPaysTel(lu.pays);
                  setNumero(lu.national);
                } else setNumero(brut.replace(/\+/g, ""));
              }}
              autoComplete="tel-national"
              maxLength={20}
              aria-labelledby="q-tel-paiement"
              placeholder="01 97 12 34 56"
            />
          </div>
        </div>


        {identifie ? (
          <button
            type="button"
            onClick={() => {
              setSituation(null);
              setPack("");
              setProfil("");
              setErreur(null);
              setAide(false);
            }}
            className="-my-2 flex min-h-11 w-fit items-center text-left text-sm font-medium text-primary underline underline-offset-4"
          >
            {paiement.modifier}
          </button>
        ) : null}

        {identifie ? (
          <>
            {reconnue ? (
              <p className="rounded-2xl bg-accent/60 px-4 py-3 text-sm leading-relaxed text-pretty text-accent-foreground max-sm:px-3.5">
                {paiement.retrouve} <strong>{situation!.nom}</strong>
              </p>
            ) : (
              <>
                <p className="rounded-2xl bg-accent/60 px-4 py-3 text-sm leading-relaxed text-pretty text-accent-foreground max-sm:px-3.5">
                  {paiement.premierPaiement}
                </p>
                <label>
                  <Libelle obligatoire>{paiement.libelleNom}</Libelle>
                  <input
                    className={CHAMP}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    autoComplete="name"
                    maxLength={100}
                  />
                </label>
                {aDesCategories ? (
                  <div>
                    <Libelle obligatoire id="q-profil">
                      {paiement.libelleProfil}
                    </Libelle>
                    <div
                      role="radiogroup"
                      aria-labelledby="q-profil"
                      className="grid grid-cols-2 gap-3"
                    >
                      {(["alumni", "delegate"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={profil === v}
                          onClick={() => {
                            setProfil(v);
                            setPack("");
                          }}
                          className={cn(
                            "min-h-12 rounded-xl border px-4 py-3 text-base font-medium transition-colors max-sm:min-h-13",
                            profil === v
                              ? "border-primary bg-primary/10 ring-1 ring-primary"
                              : "border-border bg-background hover:border-primary/50"
                          )}
                        >
                          {v === "alumni"
                            ? paiement.profilAlumni
                            : paiement.profilDelegate}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!aDesCategories || profil ? (
                  <div>
                    <Libelle obligatoire id="q-pack">
                      {paiement.libellePack}
                    </Libelle>
                    {packsProfil.length ? (
                      <div
                        role="radiogroup"
                        aria-labelledby="q-pack"
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        {packsProfil.map((p, i) => {
                          const actif = p.nom === pack;
                          const contenu = p.points;
                          return (
                            <button
                              key={`${i}-${p.nom}`}
                              type="button"
                              role="radio"
                              aria-checked={actif}
                              onClick={() => setPack(p.nom)}
                              className={cn(
                                "relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
                                actif
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "border-border bg-background hover:border-primary/50"
                              )}
                            >
                              <span className="text-sm text-muted-foreground">
                                {p.libelle}
                              </span>
                              <span className="font-heading text-2xl font-extrabold tracking-tight">
                                {fmt(p.prix)}
                                <span className="ml-1 text-sm font-medium text-muted-foreground">
                                  FCFA
                                </span>
                              </span>
                              {contenu ? (
                                <ul className="mt-2 space-y-1 border-t border-border pt-3">
                                  {contenu.map((ligne) => (
                                    <li
                                      key={ligne}
                                      className="flex items-start gap-2 text-sm text-foreground/80"
                                    >
                                      <Check
                                        aria-hidden
                                        className="mt-0.5 size-3.5 shrink-0 text-accent-text"
                                      />
                                      {ligne}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              {actif ? (
                                <Check
                                  aria-hidden
                                  className="absolute top-3 right-3 size-4 text-primary"
                                />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {paiement.aucunPack}
                      </p>
                    )}
                  </div>
                ) : null}
              </>
            )}

            {bilan && reconnue ? (
              <dl className="grid gap-2.5 rounded-2xl border border-border p-4 text-sm max-sm:p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">{paiement.recapPack}</dt>
                  <dd className="ml-auto text-right font-medium">{bilan.nom}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">{paiement.recapDu}</dt>
                  <dd className="ml-auto text-right font-medium">{fmt(bilan.du)} FCFA</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">{paiement.recapValide}</dt>
                  <dd className="ml-auto text-right font-medium">{fmt(bilan.valide)} FCFA</dd>
                </div>
                {bilan.attente > 0 ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <dt className="text-muted-foreground">{paiement.recapAttente}</dt>
                    <dd className="ml-auto text-right font-medium">{fmt(bilan.attente)} FCFA</dd>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-border pt-2.5">
                  <dt className="font-medium">{paiement.recapReste}</dt>
                  <dd className="font-heading ml-auto text-right text-xl font-extrabold">
                    {fmt(resteAvant)} FCFA
                  </dd>
                </div>
                {montantNum > 0 ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <dt className="text-muted-foreground">{paiement.recapApres}</dt>
                    <dd className="ml-auto text-right font-medium">
                      {resteApres > 0
                        ? `${fmt(resteApres)} FCFA`
                        : paiement.recapSolde}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            {couverte ? (
              <p
                role="status"
                className="rounded-2xl bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground"
              >
                {soldee ? paiement.packSolde : paiement.packCouvert}
              </p>
            ) : (
              <>
        <div>
          <Libelle obligatoire id="q-moyen">
            {paiement.libelleMoyen}
          </Libelle>
          <ListeDeroulante
            etiquette="q-moyen"
            options={MOYENS as readonly string[]}
            valeur={moyen}
            onChange={setMoyen}
            indication={paiement.indicationMoyen}
          />
        </div>

        {moyen === MOYEN_AUTRE ? (
          <label>
            <Libelle obligatoire>{paiement.libelleMoyenAutre}</Libelle>
            <input
              className={CHAMP}
              value={moyenAutre}
              onChange={(e) => setMoyenAutre(e.target.value)}
              maxLength={60}
              placeholder={paiement.placeholderMoyenAutre}
            />
          </label>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <label>
            <Libelle obligatoire>{paiement.libelleMontant}</Libelle>
            <input
              className={CHAMP}
              inputMode="numeric"
              value={montantPaye}
              onChange={(e) => setMontantPaye(e.target.value.replace(/[^\d\s]/g, ""))}
              maxLength={12}
            />
          </label>

          <div>
            <Libelle obligatoire id="q-date-paiement">
              {paiement.libelleDate}
            </Libelle>
            <ChoixDate
              etiquette="q-date-paiement"
              valeur={date}
              onChange={setDate}
              aujourdhui={aujourdhui}
            />
          </div>
        </div>
              </>
            )}
          </>
        ) : null}

        {identifie && !couverte ? (
          <>
        <div>
          <Libelle obligatoire>{paiement.libellePreuve}</Libelle>
          <input
            ref={champFichier}
            type="file"
            accept={FORMATS.join(",")}
            onChange={choisirFichier}
            className="sr-only"
          />
          {fichier ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
              <FileCheck2 className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {fichier.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {poidsLisible(fichier.size, paiement.uniteMega, paiement.uniteKilo)}
                  {allege ? ` · ${paiement.allege} ${poidsLisible(allege, paiement.uniteMega, paiement.uniteKilo)}` : null}
                </span>
              </span>
              <button
                type="button"
                aria-label={paiement.retirerPreuve}
                onClick={() => {
                  setFichier(null);
                  setAllege(null);
                  if (champFichier.current) champFichier.current.value = "";
                }}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => champFichier.current?.click()}
              className={cn(
                "flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-4 py-5",
                "text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <Paperclip className="size-4 text-primary" />
              {paiement.boutonPreuve}
            </button>
          )}
          <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
            {paiement.aidePreuve}
          </span>
        </div>

        <label>
          <Libelle>{paiement.libelleRemarque}</Libelle>
          <textarea
            className={cn(CHAMP, "min-h-24 resize-y")}
            value={remarque}
            onChange={(e) => setRemarque(e.target.value)}
            maxLength={600}
            placeholder={paiement.placeholderRemarque}
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            {paiement.aideRemarque}
          </span>
        </label>
          </>
        ) : null}
      </div>

      {erreur ? (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground"
        >
          {erreur}
        </p>
      ) : null}

      {/* Les mêmes contacts que l'écran de clôture : le WhatsApp et
          l'e-mail du comité. */}
      {aide ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            variant="outline"
            className="h-13 w-full rounded-full text-base has-data-[icon=inline-start]:pl-6 max-sm:h-14 sm:flex-1"
            render={
              <a
                href={contact.whatsappLien}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle data-icon="inline-start" />
            {contact.whatsappLabel}
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            className="h-13 w-full rounded-full text-base has-data-[icon=inline-start]:pl-6 max-sm:h-14 sm:flex-1"
            render={
              <a
                href={`mailto:${event.email}?subject=${encodeURIComponent(
                  contact.mailSubject
                )}`}
              />
            }
          >
            <Mail data-icon="inline-start" />
            {contact.buttonLabel}
          </Button>
        </div>
      ) : null}

      {couverte ? null : (
      <Button
        className="mt-8 h-13 w-full rounded-full text-base has-data-[icon=inline-start]:pl-6 max-sm:h-14"
        disabled={envoi || verif}
        onClick={identifie ? envoyer : verifier}
      >
        <Send data-icon="inline-start" />
        {identifie
          ? envoi
            ? paiement.enCours
            : paiement.bouton
          : verif
            ? paiement.verification
            : paiement.boutonContinuer}
      </Button>
      )}
    </div>
  );
}
