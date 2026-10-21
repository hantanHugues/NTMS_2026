"use client";

import * as React from "react";
import { Check } from "lucide-react";

import FloatingDotsCta from "@/components/ui/floating-dots-cta";
import type { Categorie } from "@/lib/paiement";
import { cn } from "@/lib/utils";

/**
 * LES PACKS : un grand cadre sur toute la largeur.
 *
 *   en haut    le titre, et le choix Delegate / Alumni (pastille glissante)
 *   a gauche   le pack choisi : son nom, son prix en grand, son contenu,
 *              et le bouton qui mene au paiement
 *   a droite   la liste des packs de la categorie : on touche, le detail
 *              de gauche change
 *
 * Pensee pour remplir la largeur — le titre a gauche et une carte
 * etroite a droite laissaient un grand vide —, sur le modele d'une
 * grille de tarifs (21st.dev) : deux cartes cote a cote sous un
 * en-tete. En CSS pur : aucune bibliotheque d'animation ajoutee.
 *
 * Les prix viennent du classeur par `/api/packs` (cache cinq minutes),
 * pas du code : les changer dans l'onglet « packs » suffit.
 */

type Pack = {
  nom: string;
  prix: number;
  categorie: Categorie;
  libelle: string;
  points: string[];
};

export type TextesPacks = {
  titre: string;
  titreAccent: string;
  lead: string;
  question: string;
  delegate: string;
  alumni: string;
  lesPacks: string;
  compris: string;
  devise: string;
  bouton: string;
  note: string;
};

const CARTE = "rounded-3xl border border-border bg-background";
const ETIQUETTE =
  "text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase";

export function PricingPacks({
  textes,
  locale,
}: {
  textes: TextesPacks;
  locale: string;
}) {
  const [packs, setPacks] = React.useState<Pack[] | null>(null);
  const [echec, setEchec] = React.useState(false);
  const [onglet, setOnglet] = React.useState<"delegate" | "alumni">("delegate");
  const [choisi, setChoisi] = React.useState("");

  React.useEffect(() => {
    let vivant = true;
    fetch("/api/packs")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((r: { packs: Pack[] }) => {
        if (!vivant) return;
        const liste = r.packs;
        if (!liste.length) return setEchec(true);
        setPacks(liste);
        // Delegate d'abord ; sinon la seule categorie qui existe.
        const depart = liste.some((p) => p.categorie === "delegate" || !p.categorie)
          ? "delegate"
          : "alumni";
        setOnglet(depart);
        setChoisi(liste.find((p) => !p.categorie || p.categorie === depart)?.nom ?? "");
      })
      .catch(() => {
        if (vivant) setEchec(true);
      });
    return () => {
      vivant = false;
    };
  }, []);

  // Le site n'affiche pas de prix qu'il ne connait pas : sans reponse du
  // classeur, la section disparait plutot que de montrer du vide.
  if (echec) return null;

  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);
  const aDeuxCategories =
    !!packs?.some((p) => p.categorie === "delegate") &&
    !!packs?.some((p) => p.categorie === "alumni");
  const liste = (packs ?? []).filter((p) => !p.categorie || p.categorie === onglet);
  const actuel = liste.find((p) => p.nom === choisi) ?? liste[0];
  const contenu = actuel?.points ?? [];

  function choisirOnglet(v: "delegate" | "alumni") {
    setOnglet(v);
    // On ouvre le premier pack de l'autre categorie.
    setChoisi((packs ?? []).find((p) => !p.categorie || p.categorie === v)?.nom ?? "");
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm max-sm:rounded-3xl max-sm:p-5 sm:p-10 lg:p-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h2 className="font-heading text-[clamp(2.25rem,11vw,3.25rem)] leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl">
            {textes.titre}{" "}
            <span className="text-accent-text">{textes.titreAccent}</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground max-sm:text-base">
            {textes.lead}
          </p>
        </div>

        {aDeuxCategories ? (
          <div className="md:w-72">
            <p className="mb-3 text-sm font-medium text-foreground md:text-right">
              {textes.question}
            </p>
            <div
              role="tablist"
              className="relative grid h-11 grid-cols-2 rounded-xl bg-muted p-1 ring-1 ring-border"
            >
              {/* La pastille glisse d'un onglet a l'autre. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-background shadow-sm ring-1 ring-border transition-transform duration-300 ease-out",
                  onglet === "alumni" && "translate-x-full"
                )}
              />
              {(["delegate", "alumni"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={onglet === v}
                  onClick={() => choisirOnglet(v)}
                  className={cn(
                    "relative z-10 rounded-lg text-base font-medium transition-colors duration-300",
                    onglet === v
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === "delegate" ? textes.delegate : textes.alumni}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {packs === null ? (
        <div aria-hidden className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className={cn(CARTE, "h-72 animate-pulse bg-muted")} />
          <div className={cn(CARTE, "h-72 animate-pulse bg-muted")} />
        </div>
      ) : (
        // `key` : changer d'onglet rejoue l'apparition des deux cartes.
        <div
          key={onglet}
          className="mt-10 grid animate-rise gap-5 max-sm:mt-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
        >
          {/* LE PACK CHOISI. Sur telephone, la liste passe avant : on
              choisit, puis on lit le detail juste en dessous. */}
          <div className={cn(CARTE, "order-2 p-7 max-sm:p-5 lg:order-1")}>
            {actuel ? (
              <div
                className={cn(
                  "grid gap-8",
                  contenu.length && "md:grid-cols-[minmax(14rem,1fr)_auto_1fr] md:gap-10"
                )}
              >
                <div className="flex flex-col">
                  <p className={ETIQUETTE}>
                    {onglet === "delegate" ? textes.delegate : textes.alumni}
                  </p>
                  <p className="mt-4 text-lg font-medium">{actuel.libelle}</p>
                  {/* `key` : le prix se renouvelle quand on change de pack. */}
                  <p
                    key={actuel.nom}
                    className="font-heading mt-3 animate-rise text-6xl leading-none font-extrabold tracking-tight tabular-nums max-sm:text-5xl"
                  >
                    {fmt(actuel.prix)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{textes.devise}</p>
                  {/* `dark` : l'orange du hero (plus clair, texte fonce),
                      lisible aussi sur cette carte claire. */}
                  <div className="dark mt-8">
                    <FloatingDotsCta
                      className="w-full whitespace-nowrap"
                      href="/paiement"
                      label={textes.bouton}
                    />
                  </div>
                </div>

                {contenu.length ? (
                  <>
                    <div aria-hidden className="hidden w-px bg-border md:block" />
                    <div>
                      <p className={ETIQUETTE}>{textes.compris}</p>
                      <ul className="mt-5 space-y-4">
                        {contenu.map((ligne) => (
                          <li
                            key={ligne}
                            className="flex items-start gap-3 text-sm text-foreground/85"
                          >
                            <span
                              aria-hidden
                              className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-background"
                            >
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                            {ligne}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* LA LISTE DES PACKS. */}
          <div className={cn(CARTE, "order-1 p-7 max-sm:p-5 lg:order-2")}>
            <p className={ETIQUETTE}>{textes.lesPacks}</p>
            <ul className="mt-4 divide-y divide-border" role="radiogroup" aria-label={textes.lesPacks}>
              {liste.map((p, i) => {
                const actif = p.nom === actuel?.nom;
                return (
                  <li key={`${i}-${p.nom}`}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      onClick={() => setChoisi(p.nom)}
                      className="group flex w-full items-center gap-4 py-4 text-left"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300",
                          actif
                            ? "border-primary"
                            : "border-muted-foreground/25 group-hover:border-muted-foreground/50"
                        )}
                      >
                        <span
                          className={cn(
                            "size-3.5 rounded-full bg-primary transition-transform duration-300",
                            actif ? "scale-100" : "scale-0"
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          "flex-1 text-base transition-colors",
                          actif ? "font-medium text-foreground" : "text-foreground/75"
                        )}
                      >
                        {p.libelle}
                      </span>
                      <span className="text-base tabular-nums">
                        {fmt(p.prix)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {textes.devise}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <p className="mt-8 text-sm text-muted-foreground">{textes.note}</p>
    </div>
  );
}
