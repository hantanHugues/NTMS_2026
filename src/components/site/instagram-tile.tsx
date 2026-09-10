"use client";

import * as React from "react";

import { EMBED } from "@/lib/instagram";

/**
 * Une publication Instagram, réduite à son carré d'image.
 *
 * Le lecteur d'Instagram impose une largeur MINIMALE de 326 px à sa
 * page d'intégration. Dans une colonne plus étroite — deux colonnes sur
 * un téléphone en font environ 170 — le contenu déborderait et on n'en
 * verrait que la partie gauche.
 *
 * On rend donc l'iframe à sa largeur minimale, puis on la met à
 * l'échelle de la colonne. La géométrie mesurée sur le lecteur
 * (en-tête 54 px, image carrée, barre d'actions 154 px) est multipliée
 * par le même facteur, d'où le décalage vertical de `54 × échelle`.
 */
export function InstagramTile({ url }: { url: string }) {
  const cadre = React.useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = React.useState(1);

  React.useEffect(() => {
    const el = cadre.current;
    if (!el) return;

    const mesurer = () => setEchelle(el.clientWidth / EMBED.largeurMin);
    mesurer();

    const observer = new ResizeObserver(mesurer);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cadre}
      className="relative aspect-square w-full overflow-hidden bg-white"
    >
      <iframe
        src={`${url.replace(/\/$/, "")}/embed/`}
        title="Publication Instagram"
        loading="lazy"
        scrolling="no"
        className="absolute left-0 border-0"
        style={{
          width: EMBED.largeurMin,
          height: EMBED.largeurMin + EMBED.enTete + EMBED.barre,
          top: -EMBED.enTete * echelle,
          transform: `scale(${echelle})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
