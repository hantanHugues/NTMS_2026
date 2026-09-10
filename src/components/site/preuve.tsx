import * as React from "react";

import {
  ContainerAnimated,
  ContainerScroll,
  ContainerStagger,
  ContainerSticky,
  GalleryCol,
  GalleryContainer,
} from "@/components/ui/animated-gallery";
import { preuve } from "@/lib/content";

/**
 * La preuve.
 *
 * Galerie 3D pilotée par le défilement : les trois colonnes partent
 * basculées à 62 degrés et se redressent à mesure qu'on descend, avec
 * une parallaxe verticale décalée d'une colonne à l'autre.
 *
 * Le conteneur fait 420vh mais l'animation se termine à 72 % du
 * parcours. Les 28 % restants — un peu plus d'un écran — sont un
 * PALIER : la galerie y est posée, droite et entièrement visible,
 * avant que la section suivante n'entre. Auparavant les transformations
 * couraient jusqu'à la dernière ligne de défilement, si bien que la
 * rangée du bas finissait de se dévoiler au moment exact où le bloc
 * quittait l'écran.
 *
 * La grille est bornee a max-w-5xl et centree verticalement
 * (`items-center`). Le decalage de la colonne centrale etait ecrit
 * `mt-[-50%]` : un pourcentage de marge se resout sur la LARGEUR du
 * conteneur, soit environ 430 px de remontee — la colonne sortait par
 * le haut pendant que le bas restait vide.
 *
 * Les vignettes sont en 3:2, le format natif des photos, et portent
 * `shrink-0`. Sans ça, la colonne flex contrainte a la hauteur de
 * l'ecran ecrasait chaque image a un rapport de 4,1 — `object-cover`
 * rognait alors massivement, d'ou l'impression de zoom.
 *
 * Fond BRIQUE assombri — la seule couleur de la charte qui n'était pas
 * encore employée comme surface. Le hero et le pied de page sont en
 * nuit : deux sombres de température opposée se distinguent dans
 * l'enchaînement, deux sombres identiques se confondent.
 *
 * Par-dessus, le paterne de la charte, couché et répété sur TOUTE la
 * zone (titre compris), pas seulement derrière la galerie. Il est
 * fourni en noir sur blanc : on l'inverse puis on le compose en
 * `screen`, ce qui neutralise complètement le fond blanc — seuls les
 * traits ressortent, à 5 % d'opacité. La trame de points a été retirée,
 * deux textures superposées se seraient parasitées.
 *
 * Les photos sont de vrais événements AIESEC in Benin. Le texte ne
 * prétend pas qu'il s'agit d'éditions précédentes du NTMS.
 */

/*
  Hauteur calee sur la FENETRE, pas sur le rapport de l'image : quatre
  vignettes plus leurs trois gouttieres doivent tenir dans le cadre
  collant, sinon la rangee du bas ne se dévoile jamais entierement.
  A 900 px de haut cela donne 190 px pour 306 px de large, soit 3:2 a
  un cheveu pres — `object-cover` ne rogne donc presque rien. La
  reserve de 7,5rem laisse la rangee du haut sous la barre fixe.
*/
const PHOTO_CLASS =
  "block h-[calc((100svh-7.5rem)/4)] w-full shrink-0 rounded-xl object-cover ring-1 ring-white/12";

/** Fin de l'animation, en fraction du défilement de la section. */
const SETTLED = 0.72;

/** Fin du redressement : au-dela, les colonnes sont droites. */
const REDRESSE = SETTLED * 0.58;

export function Preuve() {
  return (
    <section
      id="preuve"
      className="dark relative isolate scroll-mt-24 bg-background text-foreground"
      /*
        Le fond de CETTE section est la brique de la charte, assombrie.
        Le hero et le pied de page sont en nuit : deux sombres de
        temperature opposee, qui ne se confondent donc pas dans
        l'enchainement. On redefinit les tokens localement plutot que de
        forcer une classe, pour que les degrades et surfaces derives
        suivent.
      */
      style={
        {
          "--background": "oklch(0.325 0.082 37)",
          "--card": "oklch(0.375 0.078 37)",
          "--muted-foreground": "oklch(0.84 0.03 55)",
          "--border": "oklch(1 0 0 / 12%)",
        } as React.CSSProperties
      }
    >
      {/*
        Le paterne de la charte, couvrant la section entière.

        Le fichier livré est noir sur blanc et debout : il est couché et
        inversé À LA SOURCE (`sharp().rotate(90).negate()`), pas en CSS.
        Un `filter: invert()` aurait fait retomber
        `background-attachment: fixed` en `scroll` — le paterne aurait
        défilé avec la section au lieu de rester posé derrière.

        Blanc sur noir composé en `screen` : le fond noir est neutre,
        seuls les traits s'ajoutent. C'est ce qui permet de rester à 7 %
        sans que la brique soit lavée.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07] mix-blend-screen"
        style={{
          backgroundImage: "url(/brand/paterne.webp)",
          backgroundRepeat: "repeat",
          backgroundSize: "1100px auto",
          backgroundAttachment: "fixed",
        }}
      />

      <ContainerStagger className="relative z-10 px-6 pt-24 pb-0 text-center sm:pt-28">
        <ContainerAnimated>
          <h2 className="font-heading text-4xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {preuve.title}
          </h2>
        </ContainerAnimated>
        <ContainerAnimated className="mt-5">
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            {preuve.lead}
          </p>
        </ContainerAnimated>
      </ContainerStagger>

      <ContainerScroll className="relative z-10 h-[420vh]">
        <ContainerSticky className="h-svh pt-10">
          <GalleryContainer
            className="mx-auto max-w-[62rem] items-center gap-3 px-4 sm:px-6"
            angle={62}
            rotateRange={[0, REDRESSE]}
            scaleRange={[REDRESSE, SETTLED]}
            /*
              Le basculement pivote pres du HAUT du cadre. Avec l'origine
              par defaut, la bande ecrasee a 75 degres se posait au
              centre et laissait un vide sous le titre. A l'arrivee,
              angle nul et echelle 1, l'origine n'a plus aucun effet.
            */
            style={{ transformOrigin: "50% 14%" }}
          >
            <GalleryCol yRange={["-8%", "0%"]} range={[REDRESSE, SETTLED]}>
              {preuve.columns[0].map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className={PHOTO_CLASS}
                />
              ))}
            </GalleryCol>

            <GalleryCol
              className="-mt-10"
              yRange={["12%", "3%"]}
              range={[REDRESSE, SETTLED]}
            >
              {preuve.columns[1].map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className={PHOTO_CLASS}
                />
              ))}
            </GalleryCol>

            <GalleryCol yRange={["-8%", "0%"]} range={[REDRESSE, SETTLED]}>
              {preuve.columns[2].map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className={PHOTO_CLASS}
                />
              ))}
            </GalleryCol>
          </GalleryContainer>
        </ContainerSticky>
      </ContainerScroll>
    </section>
  );
}
