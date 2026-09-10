"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Fait défiler les verbes du titre.
 *
 * Tous les mots sont empilés dans la même cellule de grille : la
 * largeur est celle du plus long, donc le reste du titre ne bouge
 * jamais.
 *
 * Le passage d'un mot à l'autre est un FONDU CROISÉ, pas une
 * animation jouée une fois. Deux raisons :
 *   - une keyframe qui démarre à opacity 0 laisse un trou visible
 *     entre deux mots ;
 *   - un `filter: blur()` sur un texte en `background-clip: text`
 *     empêche Chromium de peindre le dégradé, donc le mot
 *     disparaissait purement et simplement.
 * Ici on n'anime que l'opacité et la translation, jamais le filtre.
 */
export function RotatingVerb({
  verbs,
  intervalMs = 2600,
  className,
}: {
  verbs: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % verbs.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [verbs.length, intervalMs]);

  return (
    <span className={cn("grid", className)}>
      <span className="sr-only">{verbs.join(", ")}</span>
      {verbs.map((verb, i) => (
        <span
          key={verb}
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]",
            // Leger recouvrement volontaire : l'entrant demarre avant que
            // le sortant ait fini. Un delai plus long creerait une fenetre
            // ou aucun mot n'est visible, et le titre clignoterait.
            i === index
              ? "translate-y-0 opacity-100 duration-500 delay-100"
              : "pointer-events-none translate-y-[0.18em] opacity-0 duration-400"
          )}
        >
          {verb}
        </span>
      ))}
    </span>
  );
}
