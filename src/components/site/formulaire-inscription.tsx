"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { event, inscription } from "@/lib/content";
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
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary";

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
  return (
    <div
      role="radiogroup"
      aria-labelledby={etiquette}
      aria-required="true"
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={valeur === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-4 py-2.5 text-sm transition-colors",
            valeur === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary/40"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function FormulaireInscription() {
  const [etape, setEtape] = React.useState(0);
  const [donnees, setDonnees] = React.useState<Donnees>(VIDE);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, setEnvoi] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  const [piege, setPiege] = React.useState("");

  // Tiré une seule fois : il identifie CE formulaire, même si la
  // personne valide plusieurs fois après une erreur réseau.
  const [idEnvoi] = React.useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(36).slice(2)
  );

  const titreEtape = React.useRef<HTMLHeadingElement>(null);
  const titreSucces = React.useRef<HTMLHeadingElement>(null);
  const premierRendu = React.useRef(true);

  React.useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    titreEtape.current?.focus();
  }, [etape]);

  React.useEffect(() => {
    if (reference !== null) titreSucces.current?.focus();
  }, [reference]);

  const set = (cle: keyof Donnees) => (valeur: string) =>
    setDonnees((d) => {
      const suivant = { ...d, [cle]: valeur };
      // Changer de branche repart d'un rôle vierge ; les champs d'une
      // branche abandonnée ne doivent pas rester.
      if ((cle === "profil" || cle === "niveau") && valeur !== d[cle]) {
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

  if (reference !== null) {
    return (
      <div className="rounded-3xl bg-card p-8 text-center shadow-md sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Check className="size-6" />
        </span>
        <h2
          ref={titreSucces}
          tabIndex={-1}
          className="font-heading mt-6 text-2xl font-extrabold tracking-tight text-balance outline-none sm:text-3xl"
        >
          {inscription.succesTitre}
        </h2>
        {reference ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ta référence :{" "}
            <strong className="text-foreground">{reference}</strong>
          </p>
        ) : null}
        <p className="mx-auto mt-5 max-w-md leading-relaxed text-pretty text-muted-foreground">
          {inscription.succesTexte}
        </p>

        {inscription.lienWhatsApp ? (
          <Button
            nativeButton={false}
            size="lg"
            className="mt-8 h-13 rounded-full px-8 text-base"
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
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            Le lien du groupe t&apos;est envoyé par mail.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl bg-card p-6 shadow-md sm:p-10">
      <div className="flex items-center gap-2">
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
      <p className="mt-4 text-sm text-muted-foreground">
        Étape {etape + 1} sur {inscription.etapes.length}
      </p>
      <h2
        ref={titreEtape}
        tabIndex={-1}
        className="font-heading mt-1 text-2xl font-extrabold tracking-tight outline-none"
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

      <div className="mt-8 flex flex-col gap-6">
        {etape === 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
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
              <div className="grid gap-2 sm:grid-cols-[15rem_1fr]">
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
                  <Libelle obligatoire id="q-niveau">Tu es au niveau…</Libelle>
                  <Choix
                    etiquette="q-niveau"
                    options={inscription.niveaux}
                    valeur={donnees.niveau}
                    onChange={set("niveau")}
                  />
                </div>

                {donnees.niveau ? (
                  <div>
                    <Libelle obligatoire id="q-role">Ton rôle</Libelle>
                    <ListeDeroulante
                      key={donnees.niveau}
                      etiquette="q-role"
                      options={
                        donnees.niveau === "MC"
                          ? inscription.rolesMC
                          : inscription.rolesLC
                      }
                      valeur={donnees.role}
                      onChange={set("role")}
                      indication="Choisis ton rôle"
                    />
                  </div>
                ) : null}

                {donnees.niveau === "MC" && donnees.role === "Autre" ? (
                  <label>
                    <Libelle obligatoire>Précise ton rôle</Libelle>
                    <input
                      className={CHAMP}
                      value={donnees.role_autre}
                      onChange={(e) => set("role_autre")(e.target.value)}
                      maxLength={100}
                    />
                  </label>
                ) : null}

                {donnees.niveau === "LC" ? (
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
                ) : null}
              </>
            ) : null}

            {donnees.profil === PROFIL_ETRANGER ? (
              <div className="grid gap-6 sm:grid-cols-2">
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
              <Libelle obligatoire id="q-chambre">Chambre</Libelle>
              <Choix
                etiquette="q-chambre"
                options={inscription.chambres}
                valeur={donnees.chambre}
                onChange={set("chambre")}
              />
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

            <div className="flex flex-col gap-3 border-t border-border pt-6">
              {(
                [
                  ["consentement_groupe", inscription.consentementGroupe],
                  ["consentement_photos", inscription.consentementPhotos],
                ] as const
              ).map(([cle, texte]) => (
                <label key={cle} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0"
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
      </div>

      {erreur ? (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground"
        >
          {erreur}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-3">
        {etape > 0 ? (
          <Button
            variant="outline"
            className="h-12 rounded-full px-5"
            onClick={() => {
              setErreur(null);
              setEtape((n) => n - 1);
            }}
          >
            <ArrowLeft data-icon="inline-start" />
            Retour
          </Button>
        ) : null}

        {etape < inscription.etapes.length - 1 ? (
          <Button
            className="h-12 flex-1 rounded-full text-base sm:flex-none sm:px-8"
            onClick={suivant}
          >
            Continuer
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button
            className="h-12 flex-1 rounded-full text-base sm:flex-none sm:px-8"
            disabled={envoi}
            onClick={envoyer}
          >
            {envoi ? "Envoi…" : inscription.boutonFinal}
          </Button>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {event.dates} · {event.city}
      </p>
    </div>
  );
}
