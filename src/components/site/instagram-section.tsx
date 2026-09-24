import { Reveal } from "@/components/site/reveal";
import { Play } from "lucide-react";

import { instagram } from "@/lib/content";
import { getInstagramPosts, type InstagramPost } from "@/lib/instagram";
import { InstagramTile } from "@/components/site/instagram-tile";

/**
 * Instagram.
 *
 * Colonnes qui défilent verticalement, en sens CONTRAIRE d'une colonne
 * à l'autre. Chaque vignette est l'image seule et mène au compte : pas
 * de barre « j'aime / commenter », qui n'a rien à faire sur une page
 * d'inscription — celui qui veut réagir le fera sur Instagram.
 *
 * C'est ce qui a remplacé l'iframe officielle : elle affichait bien la
 * vraie publication, mais impossible de lui retirer sa barre d'actions.
 *
 * Le défilement est en CSS (`--animate-marquee-y`), sur le modèle du
 * bandeau horizontal : la colonne est rendue deux fois et remonte de la
 * moitié de sa hauteur, donc la boucle ne se voit pas. Aucune
 * dépendance ajoutée.
 *
 * D'où viennent les images : voir `lib/instagram.ts`. Avec un jeton,
 * ce sont les six dernières publications, en image nue. Sans jeton,
 * ce sont de vraies publications quand même — l'iframe officielle,
 * DÉCOUPÉE pour n'en garder que le carré de l'image.
 *
 * Le découpage : la page d'intégration mesure `largeur + 208` de haut,
 * l'image commence à 54 px et occupe un carré exact (mesuré sur les
 * six publications, à deux largeurs). On donne donc au cadre la taille
 * de l'image, et on remonte l'iframe de 54 px à l'intérieur. En-tête
 * et barre d'actions tombent hors champ.
 *
 * L'iframe garde sa largeur minimale de 326 px imposée par Instagram :
 * les colonnes ne descendent jamais en dessous, d'où une seule colonne
 * en dessous de 640 px de large.
 *
 * Le glyphe Instagram est dessiné à la main : lucide v1 a retiré ses
 * icônes de marque (vérifié sur les 6 191 noms du paquet).
 */

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function Colonne({
  posts,
  reverse,
  duree,
  className,
}: {
  posts: InstagramPost[];
  reverse: boolean;
  duree: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="flex animate-marquee-y flex-col gap-4"
        style={{
          animationDuration: duree,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[...posts, ...posts].map((post, i) => (
          <article
            key={`${post.url}-${i}`}
            className="group overflow-hidden rounded-2xl bg-card shadow-md"
          >
            {post.mode === "image" ? (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${instagram.handle} sur Instagram`}
                className="relative block aspect-square w-full overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Une vidéo se signale au centre, mais en petit et en
                    translucide : on garde l'image lisible, à l'opposé de
                    la grande flèche opaque d'Instagram. */}
                {post.video ? (
                  <span
                    aria-hidden
                    className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-nuit/35 text-white/90 backdrop-blur-[2px]"
                  >
                    <Play className="size-4 translate-x-px fill-current" />
                  </span>
                ) : null}
              </a>
            ) : (
              <InstagramTile url={post.url} />
            )}

            {/* Le pied de vignette remplace l'en-tete d'Instagram, qu'on
                a decoupe : le compte reste identifie, mais dans notre
                typographie et nos couleurs. */}
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={instagram.avatar}
                alt=""
                loading="lazy"
                className="size-7 shrink-0 rounded-full object-cover ring-1 ring-border"
              />
              <span className="truncate text-xs font-medium">
                {instagram.handle}
              </span>
              <InstagramGlyph className="ml-auto size-4 shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-accent-text" />
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

export async function InstagramSection() {
  const posts = await getInstagramPosts(6);

  // Trois colonnes de deux, celle du milieu à contresens.
  const colonnes = [posts.slice(0, 2), posts.slice(2, 4), posts.slice(4, 6)];

  return (
    <section
      id="instagram"
      className="scroll-mt-24 border-t border-border bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
          <Reveal className="max-w-xl">
            <p className="kicker text-muted-foreground">{instagram.kicker}</p>

            <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              <span className="block">{instagram.title}</span>
              <span className="block text-accent-text">
                {instagram.titleAccent}
              </span>
            </h2>

            <p className="mt-5 leading-relaxed text-pretty text-muted-foreground">
              {instagram.lead}
            </p>
          </Reveal>

          <Reveal delay={120} className="shrink-0">
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-fit items-center gap-3 rounded-full bg-accent py-3 pr-6 pl-3 text-accent-foreground transition-shadow duration-500 hover:shadow-lg"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-foreground/12">
                <InstagramGlyph className="size-4" />
              </span>
              <span className="text-left">
                <span className="font-heading block text-sm leading-tight font-extrabold tracking-tight">
                  {instagram.handle}
                </span>
                <span className="block text-xs underline-offset-4 group-hover:underline">
                  {instagram.button}
                </span>
              </span>
            </a>
          </Reveal>
        </div>

        {/* Le fondu haut et bas empeche les vignettes de se couper net
            sur le bord du cadre. */}
        <div
          aria-hidden
          className="mt-12 grid h-[34rem] grid-cols-2 gap-3 overflow-hidden max-sm:gap-3 sm:gap-4 [mask-image:linear-gradient(180deg,transparent,black_9%,black_91%,transparent)] lg:grid-cols-3"
        >
          {colonnes.map((colonne, i) => (
            <Colonne
              key={i}
              posts={colonne}
              reverse={i % 2 === 1}
              duree={`${34 + i * 6}s`}
              className={
                i === 2 ? "hidden lg:block" : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
