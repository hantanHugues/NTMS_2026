import Image from "next/image";
import { Reveal } from "@/components/site/reveal";
import { SolutionCarousel } from "@/components/site/solution-carousel";
import { event, solution } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * La solution : l'événement lui-même.
 *
 * Le thème officiel sert de titre — le reformuler au-dessus revenait à
 * le dire deux fois. La promesse est placée en haut, à droite des
 * informations pratiques : en pied de section elle arrivait trop tard.
 *
 * Disposition : TOUT LE TEXTE à gauche, les quatre cartes à droite.
 * Dans la colonne de droite les cartes alternent leur alignement et
 * restent bornées en largeur, ce qui produit un zigzag plutôt qu'une
 * pile. Aucune marge négative — une version précédente en utilisait et
 * les cartes se chevauchaient.
 */

function Offer({ index }: { index: number }) {
  const offer = solution.offers[index];
  const align = index % 2 === 0 ? "left" : "right";
  const Icon = offer.icon;
  const filled = index === 3;

  return (
    <Reveal
      as="article"
      delay={index * 80}
      className={cn(
        "rounded-3xl p-6 shadow-md transition-shadow duration-500 hover:shadow-xl lg:max-w-sm",
        align === "right" && "lg:ml-auto",
        filled ? "bg-accent text-accent-foreground" : "bg-background"
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          filled
            ? "bg-accent-foreground/15 text-accent-foreground"
            : "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>

      <h3 className="font-heading mt-5 text-lg leading-tight font-extrabold tracking-tight text-balance">
        {offer.title}
      </h3>

      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-pretty",
          filled ? "opacity-80" : "text-muted-foreground"
        )}
      >
        {offer.body}
      </p>
    </Reveal>
  );
}

export function Solution() {
  return (
    <section
      id="solution"
      className="scroll-mt-24 border-y border-border bg-card pt-14 pb-20 max-sm:pt-20 max-sm:pb-12 sm:pt-16 sm:pb-24"
    >
      <div className="mx-auto grid max-w-6xl gap-14 px-6 max-sm:gap-0 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        {/* Colonne de texte */}
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Image
              src="/ntms-logo-couleur.png"
              alt="NTMS 2026"
              width={1617}
              height={1207}
              className="h-14 w-auto sm:h-16"
            />
            <span className="hidden h-10 w-px bg-border sm:block" />
            <p className="text-muted-foreground">{solution.themeLabel}</p>
          </div>

          <h2 className="font-heading mt-8 font-extrabold tracking-tight">
            <span className="block text-4xl leading-[1.02] text-balance sm:text-5xl">
              {event.themeSubject}
            </span>
            <span className="mt-3 block text-2xl leading-tight text-balance text-accent-text sm:text-3xl">
              {event.themeAngle}
            </span>
          </h2>

          {/* La promesse passe AVANT les informations pratiques : c'est
              elle qui donne envie de lire la suite. */}
          {/* Sur telephone cette phrase remonte DANS le bloc epingle du
              carrousel : elle y occupe la place que les cartes ne
              doivent pas remplir en s'etirant. */}
          <p className="font-heading mt-8 text-xl leading-snug font-extrabold tracking-tight text-balance max-sm:hidden sm:text-2xl">
            {solution.closing}{" "}
            <span className="text-accent-text">{solution.closingAccent}</span>
          </p>

          <p className="mt-8 border-t border-border pt-8 leading-relaxed text-pretty text-muted-foreground">
            {solution.lead}
          </p>
        </Reveal>

        {/* Colonne des cartes. Masquee sur telephone : elles y passent
            en defilement horizontal epingle, hors de ce conteneur pour
            aller d'un bord a l'autre de l'ecran. */}
        <div className="flex flex-col gap-5 max-sm:hidden">
          {solution.offers.map((offer, i) => (
            <Offer key={offer.title} index={i} />
          ))}
        </div>
      </div>

      <SolutionCarousel />
    </section>
  );
}
