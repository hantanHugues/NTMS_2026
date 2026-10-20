import * as React from "react";
import Image from "next/image";
import { Check } from "lucide-react";

import FloatingDotsCta from "@/components/ui/floating-dots-cta";
import { contenu } from "@/lib/contenu";

/**
 * LA SECTION « AFFICHE », juste après l'appel à l'action.
 *
 * D'un côté un exemple du badge « J'y serai » — dessiné par le vrai
 * moteur de l'affiche (`public/affiche/exemple.webp`), avec un avatar
 * générique et non la photo de quelqu'un —, de l'autre l'invitation à
 * créer le sien. La page de création est `/affiche` ; la photo n'y
 * quitte jamais le téléphone.
 *
 * Bande brique de bord à bord, comme la section « preuve » : elle
 * coupe le rythme entre l'appel à l'action (clair) et la suite.
 *
 * Pour refaire l'image : ouvrir `/affiche`, dessiner avec
 * `public/affiche/avatar-exemple.svg` comme photo, exporter en 800 × 1000.
 */
export async function AfficheSection() {
  const { afficheAccueil: a } = await contenu();

  return (
    <section
      id="affiche"
      className="dark scroll-mt-24 overflow-hidden bg-background px-6 py-24 text-foreground max-sm:px-4 max-sm:py-16 sm:py-32"
      /* Mêmes valeurs que la section « preuve » : une seule brique sur
         le site, redéfinie localement pour que les surfaces dérivées
         suivent. */
      style={
        {
          "--background": "oklch(0.325 0.082 37)",
          "--card": "oklch(0.375 0.078 37)",
          "--muted-foreground": "oklch(0.84 0.03 55)",
          "--border": "oklch(1 0 0 / 12%)",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
        {/* Le texte d'abord dans le code : sur téléphone, le bouton
            arrive avant l'image ; sur ordinateur, l'image passe à
            gauche. */}
        <div>
          <h2 className="font-heading text-[clamp(2.25rem,11vw,3.25rem)] leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl">
            {a.titre} <span className="text-primary">{a.titreAccent}</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-pretty text-muted-foreground max-sm:text-base">
            {a.texte}
          </p>

          <ul className="mt-8 space-y-3">
            {a.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-foreground/85">
                <Check aria-hidden className="size-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-xs max-sm:max-w-none">
            <FloatingDotsCta className="w-full" href="/affiche" label={a.bouton} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm md:order-first md:max-w-none">
          <Image
            src="/affiche/exemple.webp"
            alt={a.alt}
            width={800}
            height={1000}
            sizes="(min-width: 768px) 440px, 90vw"
            className="h-auto w-full rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] ring-1 ring-white/15"
          />
        </div>
      </div>
    </section>
  );
}
