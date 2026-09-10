import { Reveal } from "@/components/site/reveal";
import { constat } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Le problème, et ce qu'il coûte.
 *
 * SUR ORDINATEUR — deux colonnes de même poids typographique, réunies
 * par un filet et une seule phrase : la mise en page porte l'argument.
 * Ceux qui cherchent et ceux qui travaillent ne sont pas deux publics,
 * c'est le même.
 *
 * SUR TÉLÉPHONE — cette mise en page tombe. Les colonnes s'empilent,
 * et le 51 sort de l'écran avant que le 49 n'y entre : la confrontation
 * qui EST l'argument de la section n'a plus lieu.
 *
 * D'où un objet différent, propre au mobile : deux bandes pleine
 * largeur, collées l'une à l'autre, sans marge ni gouttière. Parce
 * qu'elles se touchent et vont d'un bord à l'autre de l'écran, elles se
 * lisent comme UN seul bloc coupé en deux — les cent personnes,
 * partagées. Et elles ont exactement la même hauteur : c'est ce que dit
 * la phrase qui suit, personne n'est plus tranquille que l'autre.
 *
 * Aucun graphique, aucune proportion dessinée. Une version précédente
 * représentait les cent personnes en semis de points ; abandonnée, le
 * dispositif demandait un effort d'interprétation pour rien.
 *
 * Tout le traitement mobile passe par `max-sm:`, qui ne produit du CSS
 * qu'en dessous de 640 px. La vue sur ordinateur ne peut pas bouger.
 */

/** Habillage de chaque bande, sur téléphone uniquement. */
const BANDES = [
  {
    fond: "max-sm:bg-[oklch(0.325_0.082_37)]",
    chiffre: "max-sm:text-[oklch(0.735_0.19_50.5)]",
    libelle: "max-sm:text-[oklch(0.96_0.02_75)]",
    detail: "max-sm:text-[oklch(0.84_0.03_55)]",
  },
  {
    fond: "max-sm:bg-card",
    chiffre: "",
    libelle: "",
    detail: "",
  },
];

export function Constat() {
  return (
    <section
      id="constat"
      className="scroll-mt-24 bg-background py-24 max-sm:pt-16 max-sm:pb-24 sm:py-32"
    >
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <h2 className="font-heading text-[clamp(1.75rem,8.5vw,2.25rem)] leading-[1.02] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {constat.question}
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground max-sm:mt-5">
            {constat.probe}
          </p>

          <p className="mt-16 text-sm text-muted-foreground max-sm:mt-10">
            {constat.intro}
          </p>

          {/*
            Sur téléphone : `-mx-6` annule la marge du conteneur, les
            bandes touchent donc les bords de l'écran ; `gap-0` les colle
            l'une à l'autre ; le filet supérieur disparaît, ce sont les
            bandes elles-mêmes qui structurent.
          */}
          <div className="mt-6 grid gap-10 border-t border-border pt-10 max-sm:-mx-6 max-sm:mt-5 max-sm:auto-rows-fr max-sm:gap-0 max-sm:border-t-0 max-sm:pt-0 sm:grid-cols-2 sm:gap-14">
            {constat.columns.map((col, i) => (
              <div
                key={col.value}
                className={cn("max-sm:px-6 max-sm:py-9", BANDES[i].fond)}
              >
                {/* Chiffre et libelle sur la meme ligne de base. */}
                <div className="flex items-baseline gap-3 sm:gap-4">
                  <p
                    className={cn(
                      "font-heading shrink-0 text-6xl leading-none font-extrabold tracking-tight text-accent-text tabular-nums sm:text-7xl",
                      BANDES[i].chiffre
                    )}
                  >
                    {col.value}
                  </p>
                  <p
                    className={cn(
                      "font-heading text-xl leading-tight font-extrabold tracking-tight text-balance sm:text-2xl",
                      BANDES[i].libelle
                    )}
                  >
                    {col.label}
                  </p>
                </div>
                <p
                  className={cn(
                    "mt-4 text-pretty text-muted-foreground max-sm:mt-3",
                    BANDES[i].detail
                  )}
                >
                  {col.detail}
                </p>
              </div>
            ))}
          </div>

          <p className="font-heading mt-10 border-t border-border pt-10 text-2xl leading-snug font-extrabold tracking-tight text-balance max-sm:mt-9 max-sm:border-t-0 max-sm:pt-0 max-sm:text-[1.375rem] sm:text-3xl">
            <span className="text-accent-text">{constat.level}</span>{" "}
            {constat.gap}
          </p>

          <p className="font-heading mt-10 text-2xl leading-snug font-extrabold tracking-tight text-balance max-sm:mt-7 max-sm:text-[1.375rem] sm:text-3xl">
            {constat.closing}{" "}
            <span className="text-accent-text">{constat.closingAccent}</span>
          </p>

          <p className="mt-10 text-xs text-muted-foreground/70 max-sm:mt-8">
            {constat.source}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
