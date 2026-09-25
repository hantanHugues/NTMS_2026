"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Home,
  LifeBuoy,
  Mail,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { contact, event, inscription, legal } from "@/lib/content";
import {
  ChoixPays,
  ListeDeroulante,
} from "@/components/site/listes-inscription";
import {
  PROFIL_BENIN,
  PROFIL_ETRANGER,
  PROFIL_EXTERNE,
  VIDE,
  elaguer,
  exempleNumero,
  problemeEtape,
  type Donnees,
} from "@/lib/inscription-regles";
import { cn } from "@/lib/utils";

/**
 * Le formulaire d'inscription, en trois étapes.
 *
 * Neuf questions et deux embranchements sur une seule page, c'est un
 * mur sur téléphone. Découpé, chaque écran tient sous le pouce et
 * l'avancement se voit.
 *
 * DEUX MISES EN PAGE, une seule logique :
 *   – ORDINATEUR : une carte posée sous le titre de la page.
 *   – TÉLÉPHONE : un écran d'application. Barre fixée en haut (retour et
 *     avancement), questions qui défilent, bouton d'action collé en bas,
 *     toujours sous le pouce. Pas de carte, pas de marges perdues.
 *
 * Les champs conditionnels n'apparaissent que s'ils s'appliquent :
 *   AIESECer au Bénin → MC ou LC → rôle (et comité local pour le LC)
 *   AIESECer d'un autre pays → poste et pays, saisis librement
 *   Pas AIESECer → comment la personne a connu le NTMS
 * Les règles (format du numéro, de l'e-mail…) vivent dans
 * `inscription-regles.ts`, partagé avec le serveur.
 *
 * L'écran de fin affiche le lien du groupe WhatsApp IMMÉDIATEMENT. Le
 * mail peut tomber en indésirables ou n'être jamais ouvert ; le clic
 * doit se faire tant que la personne est encore là.
 *
 * FIABILITÉ
 *   - Un identifiant d'envoi est tiré UNE fois par formulaire. Si la
 *     réponse se perd et que la personne revalide, le script reconnaît
 *     l'envoi et renvoie la même référence : ni doublon, ni second mail.
 *   - Changer de profil ou répondre « Non » à l'allergie vide les champs
 *     devenus sans objet : ils ne partent pas avec l'envoi.
 *   - Un champ invisible piège les robots ; un humain ne le voit pas.
 *
 * ACCESSIBILITÉ — chaque groupe de choix est un `radiogroup` relié à sa
 * question, chaque option annonce si elle est cochée, et le titre de
 * l'étape reçoit le focus quand on avance ou recule.
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

/**
 * Un groupe de choix.
 *
 * Sur ordinateur, des pastilles à la suite. Sur téléphone, des lignes
 * pleine largeur — deux par rangée quand les intitulés sont courts :
 * on vise sans effort, et l'œil lit une liste, pas un nuage.
 */
function Choix({
  options,
  valeur,
  onChange,
  etiquette,
}: {
  options: readonly string[];
  valeur: string;
  onChange: (v: string) => void;
  etiquette: string;
}) {
  const courts = options.every((o) => o.length <= 10);
  return (
    <div
      role="radiogroup"
      aria-labelledby={etiquette}
      aria-required="true"
      className={cn(
        "flex flex-wrap gap-2",
        courts ? "max-sm:grid max-sm:grid-cols-2" : "max-sm:flex-col"
      )}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={valeur === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-4 py-3 text-sm transition-colors",
            "max-sm:flex max-sm:min-h-13 max-sm:items-center max-sm:justify-between max-sm:gap-2 max-sm:rounded-2xl max-sm:text-left max-sm:text-base",
            valeur === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary/40"
          )}
        >
          {option}
          <Check
            aria-hidden
            className={cn(
              "hidden size-5 shrink-0 max-sm:block",
              valeur === option ? "opacity-100" : "opacity-0"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Le lien du groupe, sur UNE ligne, coupé à la largeur de la carte :
 * personne ne le lit, tout le monde le copie. Le bouton copie le lien
 * entier ; l'adresse reste sélectionnable à la main si besoin.
 */
function LienACopier({ lien }: { lien: string }) {
  const [copie, setCopie] = React.useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers refusé : le lien reste sélectionnable à la main.
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md text-left">
      <p className="text-xs text-muted-foreground">Ou copie ce lien :</p>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background py-2 pr-2 pl-3">
        <span className="min-w-0 flex-1 truncate text-sm select-all">
          {lien.replace(/^https?:\/\//, "")}
        </span>
        <button
          type="button"
          onClick={copier}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-primary/10 active:bg-primary/10"
        >
          {copie ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copie ? "Copié" : "Copier"}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {copie ? "Lien copié" : ""}
      </span>
    </div>
  );
}

/**
 * Une phrase d'accord dont un morceau est un lien. Le clic sur le lien
 * ne coche pas la case : il ouvre le document, dans un autre onglet.
 */
function TexteAvecLien({
  texte,
  lien,
  href,
}: {
  texte: string;
  lien: string;
  href: string;
}) {
  const i = texte.indexOf(lien);
  if (i < 0) return <>{texte}</>;
  return (
    <>
      {texte.slice(0, i)}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
      >
        {lien}
      </a>
      {texte.slice(i + lien.length)}
    </>
  );
}

/**
 * L'écran d'attente pendant l'envoi.
 *
 * L'aller-retour passe par notre serveur, puis par Google : trois à dix
 * secondes, parfois plus depuis un téléphone. Sans rien à l'écran, on
 * croit que le bouton n'a pas pris et on recommence. Les phrases se
 * succèdent pour montrer que ça avance vraiment.
 */
export function EcranEnvoi() {
  const etapes = [
    "On enregistre ton inscription…",
    "On prépare ton mail de confirmation…",
    "Le serveur répond, encore un instant…",
  ];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const minuteur = window.setInterval(
      () => setI((n) => Math.min(n + 1, etapes.length - 1)),
      3500
    );
    return () => window.clearInterval(minuteur);
    // Les phrases ne changent jamais : une seule minuterie pour la vie
    // de l'écran.
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
        Ne ferme pas cette page : ton inscription part en ce moment.
      </p>
    </div>
  );
}

/**
 * Ce qu'on affiche quand l'envoi a échoué. On ne sait pas toujours
 * pourquoi — réseau coupé, service Google indisponible — alors on donne
 * les deux portes ouvertes : WhatsApp et le mail du comité, avec le
 * message d'erreur déjà recopié dedans.
 */
export function SecoursContact({
  donnees,
  erreur,
}: {
  donnees: Donnees;
  erreur: string | null;
}) {
  const details =
    `Bonjour,

Je n'arrive pas à finaliser mon inscription au NTMS 2026 ` +
    `depuis le site.

` +
    `Nom : ${donnees.nom}
Prénom : ${donnees.prenom}
` +
    `E-mail : ${donnees.email}
WhatsApp : ${donnees.telephone}

` +
    `Message affiché : ${erreur ?? "aucun"}
`;

  const lienMail =
    `mailto:${event.email}` +
    `?subject=${encodeURIComponent("NTMS 2026 — problème d'inscription")}` +
    `&body=${encodeURIComponent(details)}`;
  const lienWhatsApp = `${contact.whatsappLien}?text=${encodeURIComponent(details)}`;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-left max-sm:mx-5">
      <p className="flex items-start gap-2.5 text-sm font-medium">
        <LifeBuoy className="mt-0.5 size-4 shrink-0 text-primary" />
        Réessaie dans un instant. Si ça recommence, écris-nous : on
        t&apos;inscrit à la main, ta place n&apos;est pas perdue.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          nativeButton={false}
          variant="outline"
          className="h-12 w-full rounded-full has-data-[icon=inline-start]:pl-4 max-sm:h-13 sm:flex-1"
          render={
            <a href={lienWhatsApp} target="_blank" rel="noopener noreferrer" />
          }
        >
          <MessageCircle data-icon="inline-start" />
          {contact.whatsappLabel}
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-12 w-full rounded-full has-data-[icon=inline-start]:pl-4 max-sm:h-13 sm:flex-1"
          render={<a href={lienMail} />}
        >
          <Mail data-icon="inline-start" />
          Écrire par mail
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {contact.whatsappNumero} · {event.email}
      </p>
    </div>
  );
}

/**
 * L'écran de fin. Le titre prend le focus à l'affichage : un lecteur
 * d'écran annonce alors le résultat, au lieu de rester sur le bouton
 * qui vient de disparaître.
 */
export function EcranSucces() {
  const titre = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    titre.current?.focus();
  }, []);

  return (
    <div className="flex flex-col rounded-3xl bg-card text-center shadow-md max-sm:min-h-svh max-sm:rounded-none max-sm:bg-background max-sm:shadow-none">
      {/* TÉLÉPHONE — sans cette barre, l'écran de fin est un
          cul-de-sac : plus d'en-tête de site, plus de retour. */}
      <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:hidden">
        <Image
          src="/ntms-logo.png"
          alt={event.name}
          width={1699}
          height={1267}
          className="h-7 w-auto"
        />
        <Link
          href="/"
          className="-mr-2 flex items-center gap-1.5 rounded-full px-2 py-2 text-sm text-muted-foreground"
        >
          <Home className="size-4" />
          Accueil
        </Link>
      </div>

      <div className="p-8 sm:p-12 max-sm:flex max-sm:flex-1 max-sm:flex-col max-sm:justify-center max-sm:px-5 max-sm:py-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Check className="size-6" />
      </span>
      <h2
        ref={titre}
        tabIndex={-1}
        className="font-heading mt-6 text-2xl font-extrabold tracking-tight text-balance outline-none sm:text-3xl"
      >
        {inscription.succesTitre}
      </h2>
      <p className="mx-auto mt-5 max-w-md leading-relaxed text-pretty text-muted-foreground">
        {inscription.succesTexte}
      </p>

      {inscription.lienWhatsApp ? (
        <>
          <Button
            nativeButton={false}
            size="lg"
            className="mt-8 h-13 rounded-full px-8 text-base has-data-[icon=inline-start]:pl-7 max-sm:h-14 max-sm:w-full max-sm:px-6"
            render={
              <a
                href={inscription.lienWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle data-icon="inline-start" />
            {inscription.succesBouton}
          </Button>
          <LienACopier lien={inscription.lienWhatsApp} />
        </>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Le lien du groupe t&apos;est envoyé par mail.
        </p>
      )}

      {/* Pour qui ne rejoint pas le groupe tout de suite : une sortie,
          plutôt qu'un écran sans issue. Sur ordinateur, l'en-tête de
          la page joue déjà ce rôle. */}
      <Link
        href="/"
        className="mx-auto mt-10 flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-muted-foreground transition-colors active:bg-primary/10 sm:hidden"
      >
        <ArrowLeft className="size-4" />
        Revenir à l&apos;accueil
      </Link>
      </div>
    </div>
  );
}

export function FormulaireInscription() {
  const [etape, setEtape] = React.useState(0);
  const [donnees, setDonnees] = React.useState<Donnees>(VIDE);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, setEnvoi] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  // Vrai quand l'envoi lui-même a échoué (réseau, service) — pas quand
  // c'est une réponse manquante dans le formulaire.
  const [echec, setEchec] = React.useState(false);
  const [piege, setPiege] = React.useState("");

  // Tiré une seule fois : il identifie CE formulaire, même si la
  // personne valide plusieurs fois après une erreur réseau.
  const [idEnvoi] = React.useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(36).slice(2)
  );

  const titreEtape = React.useRef<HTMLHeadingElement>(null);
  const boiteErreur = React.useRef<HTMLParagraphElement>(null);
  const premierRendu = React.useRef(true);

  React.useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    // Changer d'étape ramène en haut : sur téléphone, on reprendrait
    // sinon la nouvelle question au milieu du défilement précédent.
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    titreEtape.current?.focus();
  }, [etape]);

  // Un refus doit se voir : le bouton est en bas de l'écran, le message
  // juste au-dessus, mais la question fautive peut être plus haut.
  React.useEffect(() => {
    if (erreur) boiteErreur.current?.scrollIntoView({ block: "center" });
  }, [erreur]);

  const set = (cle: keyof Donnees) => (valeur: string) =>
    setDonnees((d) => {
      const suivant = { ...d, [cle]: valeur };
      // Changer de branche repart d'un rôle vierge ; les champs d'une
      // branche abandonnée ne doivent pas rester.
      if (cle === "profil" && valeur !== d[cle]) {
        suivant.role = "";
      }
      return elaguer(suivant);
    });

  const valider = () => problemeEtape(donnees, etape);
  const exemple = exempleNumero(donnees.pays_tel);

  async function envoyer() {
    const probleme = valider();
    if (probleme) return setErreur(probleme);

    setEnvoi(true);
    setErreur(null);
    setEchec(false);
    try {
      const reponse = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...donnees, id_envoi: idEnvoi, site_web: piege }),
      });
      let resultat: { ok?: boolean; message?: string; reference?: string };
      try {
        resultat = await reponse.json();
      } catch {
        throw new Error("Le service ne répond pas. Réessaie dans un instant.");
      }
      if (!resultat.ok) {
        throw new Error(resultat.message || "Envoi impossible. Réessaie.");
      }
      setReference(resultat.reference ?? "");
    } catch (err) {
      setErreur(
        err instanceof Error ? err.message : "Envoi impossible. Réessaie."
      );
      setEchec(true);
    } finally {
      setEnvoi(false);
    }
  }

  function suivant() {
    const probleme = valider();
    if (probleme) return setErreur(probleme);
    setErreur(null);
    setEtape((n) => n + 1);
  }

  function precedent() {
    setErreur(null);
    setEtape((n) => n - 1);
  }

  if (reference !== null) return <EcranSucces />;

  const dernier = etape === inscription.etapes.length - 1;

  return (
    <div className="relative flex flex-1 flex-col rounded-3xl bg-card p-6 shadow-md sm:p-10 max-sm:rounded-none max-sm:bg-background max-sm:p-0 max-sm:shadow-none">
      {/* TÉLÉPHONE — la barre d'application : retour, étape, avancement.
          Elle reste visible pendant le défilement. */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur sm:hidden">
        <div className="flex h-14 items-center gap-1 px-2">
          {etape > 0 ? (
            <button
              type="button"
              onClick={precedent}
              aria-label="Étape précédente"
              className="flex size-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-primary/10"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Revenir à l'accueil"
              className="flex size-11 shrink-0 items-center justify-center rounded-full transition-colors active:bg-primary/10"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold">
              {inscription.titre}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Étape {etape + 1} sur {inscription.etapes.length}
            </p>
          </div>
          <Image
            src="/ntms-logo.png"
            alt=""
            width={1699}
            height={1267}
            priority
            className="mr-2 h-7 w-auto shrink-0"
          />
        </div>
        <div className="flex gap-1.5 px-4 pb-2.5">
          {inscription.etapes.map((titre, i) => (
            <div
              key={titre}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= etape ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* ORDINATEUR — le même avancement, dans la carte. */}
      <div className="flex items-center gap-2 max-sm:hidden">
        {inscription.etapes.map((titre, i) => (
          <div key={titre} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-colors duration-300",
                i <= etape ? "bg-primary" : "bg-border"
              )}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground max-sm:hidden">
        Étape {etape + 1} sur {inscription.etapes.length}
      </p>

      <h2
        ref={titreEtape}
        tabIndex={-1}
        className="font-heading mt-1 text-2xl font-extrabold tracking-tight outline-none max-sm:mt-0 max-sm:px-5 max-sm:pt-6 max-sm:text-[1.75rem] max-sm:leading-tight"
      >
        {inscription.etapes[etape]}
      </h2>

      {/* Pot de miel : hors écran, hors tabulation, ignoré des lecteurs
          d'écran. Un humain ne le remplit jamais. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input
            tabIndex={-1}
            autoComplete="off"
            value={piege}
            onChange={(e) => setPiege(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-6 max-sm:mt-6 max-sm:flex-1 max-sm:gap-7 max-sm:px-5">
        {etape === 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 max-sm:gap-7">
              <label>
                <Libelle obligatoire>Prénom</Libelle>
                <input
                  className={CHAMP}
                  value={donnees.prenom}
                  onChange={(e) => set("prenom")(e.target.value)}
                  autoComplete="given-name"
                  maxLength={100}
                  aria-required="true"
                />
              </label>
              <label>
                <Libelle obligatoire>Nom</Libelle>
                <input
                  className={CHAMP}
                  value={donnees.nom}
                  onChange={(e) => set("nom")(e.target.value)}
                  autoComplete="family-name"
                  maxLength={100}
                  aria-required="true"
                />
              </label>
            </div>
            <label>
              <Libelle obligatoire>Adresse e-mail</Libelle>
              <input
                className={CHAMP}
                type="email"
                inputMode="email"
                value={donnees.email}
                onChange={(e) => set("email")(e.target.value)}
                autoComplete="email"
                maxLength={200}
                aria-required="true"
                placeholder="prenom.nom@exemple.bj"
              />
            </label>
            <div>
              <Libelle obligatoire id="q-whatsapp">Numéro WhatsApp</Libelle>
              {/* Sur téléphone, l'indicatif tient dans une case étroite à
                  gauche du numéro : le schéma de toutes les messageries. */}
              <div className="grid gap-2 grid-cols-[6.5rem_1fr] sm:grid-cols-[15rem_1fr]">
                <ChoixPays
                  etiquette="q-whatsapp"
                  valeur={donnees.pays_tel}
                  onChange={set("pays_tel")}
                />
                <input
                  className={CHAMP}
                  type="tel"
                  inputMode="tel"
                  value={donnees.telephone}
                  onChange={(e) =>
                    set("telephone")(e.target.value.replace(/[^\d\s().-]/g, ""))
                  }
                  autoComplete="tel-national"
                  maxLength={20}
                  aria-labelledby="q-whatsapp"
                  aria-required="true"
                  placeholder={exemple}
                />
              </div>
              <span className="mt-2 block text-xs text-muted-foreground">
                {exemple ? <>Format attendu : {exemple}. </> : null}
                C&apos;est ce numéro qui sera ajouté au groupe de
                l&apos;édition.
              </span>
            </div>
            <div>
              <Libelle obligatoire id="q-sexe">Sexe</Libelle>
              <Choix
                etiquette="q-sexe"
                options={inscription.sexes}
                valeur={donnees.sexe}
                onChange={set("sexe")}
              />
              <span className="mt-2 block text-xs text-muted-foreground">
                Utilisé uniquement pour l&apos;attribution des chambres.
              </span>
            </div>
          </>
        ) : null}

        {etape === 1 ? (
          <>
            <div>
              <Libelle obligatoire id="q-profil">Tu es…</Libelle>
              <Choix
                etiquette="q-profil"
                options={inscription.profils}
                valeur={donnees.profil}
                onChange={set("profil")}
              />
            </div>

            {donnees.profil === PROFIL_BENIN ? (
              <>
                <div>
                  <Libelle obligatoire id="q-role">Ton rôle</Libelle>
                  <ListeDeroulante
                    etiquette="q-role"
                    options={inscription.roles}
                    valeur={donnees.role}
                    onChange={set("role")}
                    indication="Choisis ton rôle"
                  />
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {inscription.noteMC}
                  </span>
                </div>

                <div>
                  <Libelle obligatoire id="q-lc">Ton comité local</Libelle>
                  <ListeDeroulante
                    etiquette="q-lc"
                    options={inscription.comites}
                    valeur={donnees.lc}
                    onChange={set("lc")}
                    indication="Choisis ton comité"
                  />
                </div>
              </>
            ) : null}

            {donnees.profil === PROFIL_ETRANGER ? (
              <div className="grid gap-6 sm:grid-cols-2 max-sm:gap-7">
                <label>
                  <Libelle obligatoire>Ton poste</Libelle>
                  <input
                    className={CHAMP}
                    value={donnees.role}
                    onChange={(e) => set("role")(e.target.value)}
                    maxLength={100}
                  />
                </label>
                <label>
                  <Libelle obligatoire>Ton pays</Libelle>
                  <input
                    className={CHAMP}
                    value={donnees.pays}
                    onChange={(e) => set("pays")(e.target.value)}
                    autoComplete="country-name"
                    maxLength={100}
                  />
                </label>
              </div>
            ) : null}

            {donnees.profil === PROFIL_EXTERNE ? (
              <label>
                <Libelle obligatoire>
                  Comment as-tu entendu parler du NTMS ?
                </Libelle>
                <textarea
                  className={cn(CHAMP, "min-h-28 resize-y")}
                  value={donnees.source}
                  onChange={(e) => set("source")(e.target.value)}
                  maxLength={1000}
                />
              </label>
            ) : null}
          </>
        ) : null}

        {etape === 2 ? (
          <>
            <div>
              <Libelle obligatoire id="q-chambre">
                {inscription.chambreQuestion}
              </Libelle>
              <Choix
                etiquette="q-chambre"
                options={inscription.chambres}
                valeur={donnees.chambre}
                onChange={set("chambre")}
              />
              <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                {inscription.chambreAide}
              </span>
            </div>

            <div>
              <Libelle obligatoire id="q-allergie">
                Es-tu allergique à un aliment particulier ?
              </Libelle>
              <Choix
                etiquette="q-allergie"
                options={inscription.ouiNon}
                valeur={donnees.allergie}
                onChange={set("allergie")}
              />
            </div>

            {donnees.allergie === "Oui" ? (
              <label>
                <Libelle obligatoire>À quoi ?</Libelle>
                <input
                  className={CHAMP}
                  value={donnees.allergie_detail}
                  onChange={(e) => set("allergie_detail")(e.target.value)}
                  maxLength={500}
                />
              </label>
            ) : null}

            <label>
              <Libelle>Attentes en matière de restauration</Libelle>
              <textarea
                className={cn(CHAMP, "min-h-24 resize-y")}
                value={donnees.restauration}
                onChange={(e) => set("restauration")(e.target.value)}
                maxLength={1000}
                placeholder="Facultatif"
              />
            </label>

            {/* Les deux accords : la case et son texte forment une seule
                cible, assez haute pour le pouce. */}
            <div className="flex flex-col gap-1 border-t border-border pt-6 max-sm:gap-2">
              {(
                [
                  ["consentement_groupe", inscription.consentementGroupe],
                  ["consentement_photos", inscription.consentementPhotos],
                  [
                    "consentement_politique",
                    <TexteAvecLien
                      key="politique"
                      texte={inscription.consentementPolitique.texte}
                      lien={inscription.consentementPolitique.lien}
                      href={legal.url}
                    />,
                  ],
                ] as [keyof Donnees, React.ReactNode][]
              ).map(([cle, texte]) => (
                <label
                  key={cle}
                  className="-mx-2 flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 text-sm transition-colors active:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    className="mt-px size-6 shrink-0 accent-primary"
                    checked={donnees[cle] === "oui"}
                    onChange={(e) => set(cle)(e.target.checked ? "oui" : "")}
                  />
                  <span className="leading-relaxed text-muted-foreground">
                    {texte}
                  </span>
                </label>
              ))}
            </div>
          </>
        ) : null}

        {/* Rappel discret, posé en bas de l'étape, juste au-dessus du
            bouton, quelle que soit la longueur des questions. */}
        <p className="mt-auto pt-2 text-xs text-muted-foreground sm:hidden">
          {event.dates} · {event.city}
        </p>
      </div>

      {envoi ? <EcranEnvoi /> : null}

      {erreur ? (
        <p
          ref={boiteErreur}
          role="alert"
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground max-sm:mx-5 max-sm:mt-4"
        >
          {erreur}
        </p>
      ) : null}

      {echec ? <SecoursContact donnees={donnees} erreur={erreur} /> : null}

      {/* L'action, collée en bas de l'écran sur téléphone : jamais à
          chercher, quelle que soit la longueur de l'étape. */}
      <div className="mt-8 flex items-center gap-3 max-sm:sticky max-sm:bottom-0 max-sm:z-20 max-sm:mt-4 max-sm:border-t max-sm:border-border max-sm:bg-background/95 max-sm:px-5 max-sm:pt-3 max-sm:pb-[max(0.875rem,env(safe-area-inset-bottom))] max-sm:backdrop-blur">
        {etape > 0 ? (
          <Button
            variant="outline"
            className="h-12 rounded-full px-5 has-data-[icon=inline-start]:pl-4 max-sm:hidden"
            onClick={precedent}
          >
            <ArrowLeft data-icon="inline-start" />
            Retour
          </Button>
        ) : null}

        {!dernier ? (
          <Button
            className="h-12 flex-1 rounded-full text-base sm:flex-none sm:px-8 sm:has-data-[icon=inline-end]:pr-7 max-sm:h-14 max-sm:w-full"
            onClick={suivant}
          >
            Continuer
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          // Tant que la politique n'est pas acceptée, le bouton reste
          // gris : l'accord est juste au-dessus, le lien entre les deux
          // se lit sans message d'erreur.
          <Button
            className="h-12 flex-1 rounded-full text-base sm:flex-none sm:px-8 max-sm:h-14 max-sm:w-full"
            disabled={envoi || donnees.consentement_politique !== "oui"}
            onClick={envoyer}
          >
            {envoi ? "Envoi…" : inscription.boutonFinal}
          </Button>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground max-sm:hidden">
        {event.dates} · {event.city}
      </p>
    </div>
  );
}
