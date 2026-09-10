import { bandeau } from "@/lib/content";

/**
 * Le bandeau.
 *
 * SECTION À PART ENTIÈRE : son propre identifiant, son propre fond,
 * son propre contenu dans `content.ts` — elle ne puise plus dans
 * `preuve`, où elle passait pour un appendice de la galerie.
 *
 * Elle garde en revanche une hauteur COURTE : elle ne prend pas
 * l'écran comme les sections qui l'entourent. C'est la respiration
 * entre la galerie sombre et le programme.
 *
 * Deux rangées qui défilent en sens contraire, à des vitesses
 * différentes. Aucune dépendance ajoutée : c'est la technique déjà
 * employée par `SkillMarquee` — la liste est rendue deux fois et
 * l'animation translate de -50 %, donc la boucle est invisible. Le
 * sens inverse s'obtient avec `animation-direction`, pas avec une
 * seconde image-clé.
 */

function Row({
  photos,
  duration,
  reverse = false,
}: {
  photos: string[];
  duration: string;
  reverse?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]"
    >
      <div
        className="flex w-max animate-marquee gap-4 pr-4"
        style={{
          animationDuration: duration,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[...photos, ...photos].map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            loading="lazy"
            className="h-40 w-60 shrink-0 rounded-xl object-cover shadow-md sm:h-52 sm:w-78"
          />
        ))}
      </div>
    </div>
  );
}

export function PhotoStrip() {
  return (
    <section
      id="bandeau"
      className="scroll-mt-24 border-b border-border bg-card pt-24 pb-14 sm:pt-32 sm:pb-16"
    >
      {/* Bloc de titre CENTRE, comme les sections qui precedent. La
          couleur ne souligne que la seconde moitie de la phrase : c'est
          elle qui porte l'argument. */}
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="kicker text-muted-foreground">{bandeau.kicker}</p>
        <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {/* Deux lignes forcees : en flux libre, le « et » de la seconde
              moitie remontait seul en fin de premiere ligne. */}
          <span className="block">{bandeau.title}</span>
          <span className="block text-accent-text">{bandeau.titleAccent}</span>
        </h2>
        <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
          {bandeau.lead}
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-4 sm:mt-14">
        <Row photos={bandeau.rows[0]} duration="46s" />
        <Row photos={bandeau.rows[1]} duration="58s" reverse />
      </div>
    </section>
  );
}
