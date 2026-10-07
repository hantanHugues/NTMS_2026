"use client";

import * as React from "react";
import { Download, ShieldCheck, Share2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useContenu } from "@/components/site/langue";
import AfficheNTMS from "@/lib/affiche-ntms";
import { cn } from "@/lib/utils";

/**
 * LE GÉNÉRATEUR D'AFFICHE « J'Y SERAI ».
 *
 * Le dessin est fait par `affiche-ntms.js`, copié du dossier
 * `generateur-affiche` : un canvas de 1080 × 1350, sans dépendance.
 * Ce composant ne fait que lui donner les champs et récupérer le PNG.
 *
 * LA PHOTO NE QUITTE JAMAIS LE TÉLÉPHONE. Elle est lue par le
 * navigateur, dessinée sur le canvas, téléchargée. Aucun envoi, aucun
 * stockage, rien à effacer ensuite.
 */

/** Ce que l'inscription laisse pour la page, le temps d'un onglet. */
export const CLE_AFFICHE = "ntms_affiche";

export type DonneesAffiche = {
  prenom: string;
  nom: string;
  role: string;
  affiliation: string;
};

/** Pas d'abonnement : ces valeurs ne changent pas en cours de visite. */
const abonnementVide = () => () => {};

/** Ce que l'écran de fin d'inscription a laissé, s'il est passé par là. */
function depotInscription(): Partial<DonneesAffiche> {
  try {
    const brut = sessionStorage.getItem(CLE_AFFICHE);
    return brut ? (JSON.parse(brut) as Partial<DonneesAffiche>) : {};
  } catch {
    // Stockage refusé (navigation privée) : rien à récupérer.
    return {};
  }
}

/** Le partage de fichier : des téléphones, et presque rien d'autre. */
function peutPartager(): boolean {
  try {
    const essai = new File([""], "t.png", { type: "image/png" });
    return Boolean(navigator.canShare?.({ files: [essai] }));
  } catch {
    return false;
  }
}

const CHAMP =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary max-sm:min-h-13";

/**
 * Un réglage du cadrage : son nom à gauche, sa valeur à droite, la
 * glissière dessous. La valeur affichée évite de bouger à l'aveugle.
 */
function Reglage({
  libelle,
  valeur,
  min,
  max,
  step,
  onChange,
  inerte = false,
  aideInerte,
}: {
  libelle: string;
  valeur: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** L'axe n'a aucun jeu : bouger le curseur ne changerait rien. */
  inerte?: boolean;
  aideInerte?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", inerte && "opacity-55")}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{libelle}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {inerte
            ? aideInerte
            : step < 1
              ? valeur.toFixed(2) + " ×"
              : Math.round(valeur) + " %"}
        </span>
      </div>
      <Slider
        value={valeur}
        min={min}
        max={max}
        step={step}
        disabled={inerte}
        onValueChange={(v) => onChange(typeof v === "number" ? v : v[0])}
      />
    </div>
  );
}

export function GenerateurAffiche() {
  const { affiche } = useContenu();
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const champFichier = React.useRef<HTMLInputElement>(null);
  const apercu = React.useRef<HTMLDivElement>(null);

  const [prenom, setPrenom] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [role, setRole] = React.useState("");
  const [affiliation, setAffiliation] = React.useState("");
  const [photo, setPhoto] = React.useState<HTMLImageElement | null>(null);
  const [nomPhoto, setNomPhoto] = React.useState("");
  const [zoom, setZoom] = React.useState(1);
  const [cx, setCx] = React.useState(50);
  const [cy, setCy] = React.useState(22);

  const [ressources, setRessources] = React.useState<unknown>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);

  // Rendu une première fois par le serveur, ce composant ne peut
  // toucher ni au stockage ni à `navigator` avant d'être monté.
  const monte = React.useSyncExternalStore(
    abonnementVide,
    () => true,
    () => false
  );
  const partageable = monte && peutPartager();

  // Ce que l'inscription vient de déposer : la personne ne resaisit
  // pas ce qu'elle a déjà donné. Absent, les champs restent vides.
  //
  // La lecture se fait au PREMIER RENDU CLIENT, pas dans un effet :
  // le serveur ne connaît pas `sessionStorage` et rendrait des champs
  // vides qu'un effet viendrait remplir après coup, en deux temps.
  const [prerempli, setPrerempli] = React.useState(false);
  if (monte && !prerempli) {
    setPrerempli(true);
    const d = depotInscription();
    if (d.prenom) setPrenom(d.prenom);
    if (d.nom) setNom(d.nom);
    if (d.role) setRole(d.role);
    if (d.affiliation) setAffiliation(d.affiliation);
  }

  // Les images et les polices, une fois. `next/font` renomme les
  // familles : on lit leurs vrais noms dans les variables CSS, sinon
  // le canvas dessine avec la police de secours sans prévenir.
  React.useEffect(() => {
    let vivant = true;
    const css = getComputedStyle(document.documentElement);
    AfficheNTMS.charger({
      logo: "/ntms-logo.png",
      motif: "/brand/paterne.webp",
      polices: {
        texte: css.getPropertyValue("--font-lato").trim() || undefined,
        titre: css.getPropertyValue("--font-bricolage").trim() || undefined,
      },
    })
      .then((r) => {
        if (vivant) setRessources(r);
      })
      .catch(() => {
        if (vivant) setErreur(affiche.erreurPreparation);
      });
    return () => {
      vivant = false;
    };
  }, [affiche.erreurPreparation]);


  // Le cadre photo du badge, en unites du badge. La photo y entre en
  // « cover » : l'axe le plus juste n'a aucun jeu.
  const CADRE = 380;
  const jeu = React.useMemo(() => {
    if (!photo) return { horizontal: false, vertical: false };
    const echelle =
      Math.max(CADRE / photo.width, CADRE / photo.height) * Math.max(1, zoom);
    return {
      horizontal: photo.width * echelle - CADRE > 1,
      vertical: photo.height * echelle - CADRE > 1,
    };
  }, [photo, zoom]);

  const donnees = React.useMemo(
    () => ({
      prenom,
      nom,
      role,
      affiliation,
      photo,
      cadrage: { zoom, x: cx, y: cy },
    }),
    [prenom, nom, role, affiliation, photo, zoom, cx, cy]
  );

  React.useEffect(() => {
    if (!ressources || !canvas.current) return;
    AfficheNTMS.dessiner(canvas.current, donnees, ressources);
  }, [ressources, donnees]);

  async function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    try {
      setPhoto(await AfficheNTMS.image(url));
      setNomPhoto(f.name);
      setZoom(1);
      setCx(50);
      setCy(22);
      setErreur(null);
      apercu.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setErreur(affiche.erreurPhoto);
    }
  }

  function nomFichier() {
    // Nom puis prénom : les fichiers se classent par famille, aussi
    // bien dans le téléphone que dans le dossier du comité.
    const base = `jy-serai-ntms2026-${nom}-${prenom}`;
    return (
      base
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + ".png"
    );
  }

  const enPng = () =>
    new Promise<Blob | null>((ok) => canvas.current?.toBlob(ok, "image/png"));

  async function telecharger() {
    const image = await enPng();
    if (!image) return setErreur(affiche.erreurImage);
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(image);
    lien.download = nomFichier();
    lien.click();
    setTimeout(() => URL.revokeObjectURL(lien.href), 2000);
  }

  async function partager() {
    const image = await enPng();
    if (!image) return setErreur(affiche.erreurImage);
    try {
      await navigator.share({
        files: [new File([image], nomFichier(), { type: "image/png" })],
        text: affiche.textePartage,
      });
    } catch {
      // Partage annulé : rien à signaler.
    }
  }

  const pret = Boolean(ressources);
  // Ce qu'il faut pour que l'affiche veuille dire quelque chose. Le
  // role et l'affiliation restent facultatifs : tout le monde n'est
  // pas AIESECer.
  const manques: string[] = [];
  if (!prenom.trim()) manques.push(affiche.libellePrenom);
  if (!nom.trim()) manques.push(affiche.libelleNom);
  if (!photo) manques.push(affiche.libellePhoto);
  const complet = pret && manques.length === 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
      {/* L'aperçu d'abord sur téléphone : c'est ce qu'on vient voir. */}
      <div ref={apercu} className="scroll-mt-24 lg:order-2 lg:sticky lg:top-24">
        <canvas
          ref={canvas}
          width={1080}
          height={1350}
          role="img"
          aria-label={affiche.apercuAlt}
          className="mx-auto block h-auto w-full max-w-sm rounded-2xl bg-muted shadow-lg"
        />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {pret ? affiche.format : affiche.chargement}
        </p>

        {photo ? (
          <div className="mx-auto mt-5 flex max-w-sm flex-col gap-1 rounded-2xl border border-border bg-card/50 p-5">
            <Reglage
              libelle={affiche.zoom}
              valeur={zoom}
              min={1}
              max={3}
              step={0.01}
              onChange={setZoom}
            />
            <Reglage
              libelle={affiche.horizontal}
              valeur={cx}
              min={0}
              max={100}
              step={1}
              onChange={setCx}
              inerte={!jeu.horizontal}
              aideInerte={affiche.aideAxeBloque}
            />
            <Reglage
              libelle={affiche.vertical}
              valeur={cy}
              min={0}
              max={100}
              step={1}
              onChange={setCy}
              inerte={!jeu.vertical}
              aideInerte={affiche.aideAxeBloque}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-7 lg:order-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{affiche.libellePrenom}</span>
            <input
              type="text"
              value={prenom}
              maxLength={20}
              autoComplete="given-name"
              onChange={(e) => setPrenom(e.target.value)}
              className={CHAMP}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{affiche.libelleNom}</span>
            <input
              type="text"
              value={nom}
              maxLength={24}
              autoComplete="family-name"
              onChange={(e) => setNom(e.target.value)}
              className={CHAMP}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{affiche.libelleRole}</span>
            <input
              type="text"
              value={role}
              maxLength={16}
              placeholder={affiche.placeholderRole}
              onChange={(e) => setRole(e.target.value)}
              className={CHAMP}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              {affiche.libelleAffiliation}
            </span>
            <input
              type="text"
              value={affiliation}
              maxLength={28}
              placeholder={affiche.placeholderAffiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className={CHAMP}
            />
          </label>
        </div>
        <p className="-mt-3 text-sm leading-relaxed text-muted-foreground">
          {affiche.aideRole}
        </p>

        <div>
          <input
            ref={champFichier}
            type="file"
            accept="image/*"
            onChange={choisirPhoto}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => champFichier.current?.click()}
            className={cn(
              "flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-4 py-5",
              "text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <Upload className="size-4 text-primary" />
            {nomPhoto || affiche.boutonPhoto}
          </button>
          <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
            {affiche.aidePhoto}
          </span>
        </div>

        {erreur ? (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {erreur}
          </p>
        ) : null}

        {pret && manques.length ? (
          <p className="text-sm text-muted-foreground">
            {affiche.manquePour} {manques.join(", ").toLowerCase()}.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            disabled={!complet}
            onClick={telecharger}
            className="h-13 rounded-full px-7 text-base has-data-[icon=inline-start]:pl-6 max-sm:h-14 max-sm:w-full"
          >
            <Download data-icon="inline-start" />
            {affiche.boutonTelecharger}
          </Button>
          {partageable ? (
            <Button
              size="lg"
              variant="outline"
              disabled={!complet}
              onClick={partager}
              className="h-13 rounded-full px-7 text-base has-data-[icon=inline-start]:pl-6 max-sm:h-14 max-sm:w-full"
            >
              <Share2 data-icon="inline-start" />
              {affiche.boutonPartager}
            </Button>
          ) : null}
        </div>

        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          {affiche.photoPrivee}
        </p>
      </div>
    </div>
  );
}
