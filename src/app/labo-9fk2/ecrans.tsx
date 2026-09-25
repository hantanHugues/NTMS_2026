"use client";

import * as React from "react";

import {
  EcranEnvoi,
  EcranSucces,
  SecoursContact,
} from "@/components/site/formulaire-inscription";
import { InscriptionsCloses } from "@/components/site/inscriptions-closes";
import { VIDE } from "@/lib/inscription-regles";
import { cn } from "@/lib/utils";

/**
 * Le choix de l'écran à regarder. Trois boutons en haut, l'écran
 * dessous, dans les conditions réelles : l'attente s'affiche par-dessus
 * toute la page, comme pendant un vrai envoi.
 */

const EXEMPLE = {
  ...VIDE,
  nom: "Hantan",
  prenom: "Hugues",
  email: "hugues@exemple.bj",
  telephone: "01 97 12 34 56",
};

const ERREUR = "Le service ne répond pas. Réessaie dans un instant.";

type Ecran = "attente" | "echec" | "succes" | "closes";

const ECRANS: { cle: Ecran; libelle: string }[] = [
  { cle: "attente", libelle: "Attente pendant l'envoi" },
  { cle: "echec", libelle: "Échec de l'envoi" },
  { cle: "succes", libelle: "Inscription enregistrée" },
  { cle: "closes", libelle: "Inscriptions closes" },
];

export function EcransEssai() {
  const [ecran, setEcran] = React.useState<Ecran>("attente");

  return (
    <div className="min-h-svh bg-background">
      <div className="sticky top-0 z-[60] border-b border-border bg-background/95 backdrop-blur">
        {/* Barre compacte : sur écran étroit elle mangeait 170 px et
            repoussait l'écran montré, ce qui donnait une fausse idée de
            sa mise en page. */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-5 sm:py-3">
          <span className="mr-2 hidden text-xs tracking-wider text-muted-foreground uppercase sm:inline">
            Écrans d&apos;essai · local
          </span>
          {ECRANS.map((e) => (
            <button
              key={e.cle}
              type="button"
              onClick={() => setEcran(e.cle)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors sm:px-4 sm:py-2 sm:text-sm",
                ecran === e.cle
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40"
              )}
            >
              {e.libelle}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 max-sm:px-0 max-sm:py-0">
        {/* Remonté à chaque changement : l'attente rejoue ses phrases
            depuis la première. */}
        {ecran === "attente" ? <EcranEnvoi key="attente" /> : null}
        {ecran === "echec" ? (
          <div className="rounded-3xl bg-card p-6 shadow-md sm:p-10 max-sm:rounded-none max-sm:bg-background max-sm:p-5 max-sm:shadow-none">
            <p
              role="alert"
              className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground"
            >
              {ERREUR}
            </p>
            <SecoursContact donnees={EXEMPLE} erreur={ERREUR} />
          </div>
        ) : null}
        {ecran === "succes" ? <EcranSucces /> : null}
        {/* Ce que verra un visiteur qui clique « Je m'inscris » une fois
            le compte à rebours à zéro. */}
        {ecran === "closes" ? <InscriptionsCloses /> : null}
      </div>
    </div>
  );
}
