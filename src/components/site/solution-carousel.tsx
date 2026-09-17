import { solution } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Les quatre offres, en défilement horizontal épinglé. TÉLÉPHONE
 * UNIQUEMENT — sur ordinateur elles restent en zigzag à droite du
 * texte, ce composant n'est jamais monté.
 *
 * AUCUN JAVASCRIPT. Tout le mécanisme vit dans `globals.css`, sous les
 * classes `offres-*`, et repose sur `animation-timeline`. Le calcul se
 * fait sur le compositeur, comme le défilement natif : le décalage
 * d'une frame entre le bloc figé et la page — ce qui faisait trembler
 * la section sur tactile — ne peut plus se produire.
 *
 * Ce composant remplace une version pilotée par GSAP ScrollTrigger,
 * qui repositionnait le bloc sur le fil principal. Il n'a plus besoin
 * d'être un composant client.
 *
 * Sur les navigateurs sans `animation-timeline` — Firefox, où le
 * support est encore derrière un drapeau — la piste redevient une
 * bande à faire glisser au doigt, avec accrochage carte par carte.
 * Fonctionnel, sans l'effet, jamais cassé.
 */

function Carte({ index }: { index: number }) {
  const offre = solution.offers[index];
  const Icon = offre.icon;
  const plein = index === 3;

  return (
    <article
      className={cn(
        "flex min-h-[26rem] w-[80vw] shrink-0 flex-col justify-center rounded-3xl p-6 shadow-md",
        plein ? "bg-accent text-accent-foreground" : "bg-background"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          plein
            ? "bg-accent-foreground/15 text-accent-foreground"
            : "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>

      <h3 className="font-heading mt-5 text-xl leading-tight font-extrabold tracking-tight text-balance">
        {offre.title}
      </h3>

      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-pretty",
          plein ? "opacity-80" : "text-muted-foreground"
        )}
      >
        {offre.body}
      </p>
    </article>
  );
}

export function SolutionCarousel() {
  return (
    <div className="offres-cadre relative mt-10 sm:hidden">
      <div className="offres-bloc">
        {/* La promesse de la section vit ICI sur téléphone : elle occupe
            le haut du bloc épinglé, que les cartes n'ont donc pas à
            remplir en s'étirant. */}
        <p className="font-heading shrink-0 px-6 text-2xl leading-snug font-extrabold tracking-tight text-balance">
          {solution.closing}{" "}
          <span className="text-accent-text">{solution.closingAccent}</span>
        </p>

        <div className="offres-piste mt-6">
          {solution.offers.map((offre, i) => (
            <Carte key={offre.title} index={i} />
          ))}
        </div>

        {/* Trait d'avancement : quand la page cesse de descendre, il faut
            dire où on en est. Masqué dans la version à faire glisser,
            où il n'aurait aucun sens. */}
        <div aria-hidden className="mx-6 mt-5 h-px shrink-0 bg-border">
          <div className="offres-barre h-full w-full bg-accent-foreground/60" />
        </div>
      </div>
    </div>
  );
}
