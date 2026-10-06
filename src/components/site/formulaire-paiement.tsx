"use client";

import * as React from "react";
import Image from "next/image";
import {
  Check,
  FileCheck2,
  Info,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChoixPays, ListeDeroulante } from "@/components/site/listes-inscription";
import { useContenu } from "@/components/site/langue";
import { emailValide, numeroInternational } from "@/lib/inscription-regles";
import { FORMATS, MOYENS, MOYEN_AUTRE, POIDS_MAX } from "@/lib/paiement";
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
 * La date, en trois listes.
 *
 * Le champ `type="date"` natif impose son « jj/mm/aaaa » et son
 * calendrier bleu, que rien ne permet d'habiller : ni la police, ni
 * les couleurs, ni les arrondis du site. Trois listes maison disent la
 * même chose, dans notre langue et notre habillage, et donnent une
 * date impossible à saisir de travers.
 */
function ChoixDate({
  valeur,
  onChange,
  etiquette,
}: {
  /** Format ISO, « 2026-10-02 », ou chaîne vide. */
  valeur: string;
  onChange: (v: string) => void;
  etiquette: string;
}) {
  const { paiement } = useContenu();
  const [annee, mois, jour] = valeur ? valeur.split("-") : ["", "", ""];
  const maintenant = new Date();

  // Deux années suffisent : on déclare un paiement récent.
  const annees = [String(maintenant.getFullYear()), String(maintenant.getFullYear() - 1)];
  // Le nombre de jours dépend du mois choisi, et de l'année bissextile.
  const nbJours =
    annee && mois ? new Date(Number(annee), Number(mois), 0).getDate() : 31;

  function poser(j: string, m: string, a: string) {
    onChange(j && m && a ? `${a}-${m}-${j}` : "");
  }

  return (
    <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
      <ListeDeroulante
        etiquette={etiquette}
        indication={paiement.dateJour}
        options={Array.from({ length: nbJours }, (_, i) => String(i + 1).padStart(2, "0"))}
        valeur={jour || ""}
        onChange={(j) => poser(j, mois, annee)}
      />
      <ListeDeroulante
        etiquette={etiquette}
        indication={paiement.dateMois}
        options={paiement.mois.map((nom, i) => ({
          valeur: String(i + 1).padStart(2, "0"),
          libelle: nom,
        }))}
        valeur={mois || ""}
        onChange={(m) => poser(jour, m, annee)}
      />
      <ListeDeroulante
        etiquette={etiquette}
        indication={paiement.dateAnnee}
        options={annees}
        valeur={annee || ""}
        onChange={(a) => poser(jour, mois, a)}
      />
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

export function FormulairePaiement({ montant }: { montant: number }) {
  const { paiement } = useContenu();
  const msg = paiement.erreurs;
  const [nom, setNom] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [paysTel, setPaysTel] = React.useState("BJ");
  const [numero, setNumero] = React.useState("");
  const [moyen, setMoyen] = React.useState("");
  const [moyenAutre, setMoyenAutre] = React.useState("");
  const [montantPaye, setMontantPaye] = React.useState(String(montant));
  const [date, setDate] = React.useState("");
  const [remarque, setRemarque] = React.useState("");

  const [fichier, setFichier] = React.useState<File | null>(null);
  const [allege, setAllege] = React.useState<number | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, setEnvoi] = React.useState(false);
  const [envoye, setEnvoye] = React.useState(false);

  const champFichier = React.useRef<HTMLInputElement>(null);
  const montantLisible = new Intl.NumberFormat(paiement.locale).format(montant);
  // Un paiement ne peut pas avoir eu lieu demain.
  const aujourdhui = new Date().toISOString().slice(0, 10);

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

  async function envoyer() {
    if (nom.trim().length < 2) return setErreur(msg.nom);
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
          nom,
          email,
          numero: international,
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

      <div className="mt-6 flex items-baseline justify-between gap-4 border-b border-border pb-5">
        <span className="text-sm text-muted-foreground">Montant attendu</span>
        <span className="font-heading text-2xl font-extrabold tracking-tight">
          {montantLisible} FCFA
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
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
          <label>
            <Libelle obligatoire>{paiement.libelleEmail}</Libelle>
            <input
              className={CHAMP}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={120}
              placeholder={paiement.placeholderEmail}
            />
          </label>
        </div>

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
              onChange={setPaysTel}
            />
            <input
              className={CHAMP}
              type="tel"
              inputMode="tel"
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/[^\d\s().-]/g, ""))}
              autoComplete="tel-national"
              maxLength={20}
              aria-labelledby="q-tel-paiement"
              placeholder="01 97 12 34 56"
            />
          </div>
        </div>

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
            />
          </div>
        </div>

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
      </div>

      {erreur ? (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground"
        >
          {erreur}
        </p>
      ) : null}

      <Button
        className="mt-8 h-13 w-full rounded-full text-base has-data-[icon=inline-start]:pl-6 max-sm:h-14"
        disabled={envoi}
        onClick={envoyer}
      >
        <Send data-icon="inline-start" />
        {envoi ? paiement.enCours : paiement.bouton}
      </Button>
    </div>
  );
}
