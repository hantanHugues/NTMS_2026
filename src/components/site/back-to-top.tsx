"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

/**
 * Bouton discret pour remonter en haut de la page.
 *
 * Invisible sur le hero, il n'apparaît qu'une fois le premier écran
 * dépassé : en haut de page il n'a aucune utilité.
 *
 * Comme pour l'en-tête, l'état est écrit directement sur le nœud
 * (`data-visible`) et le défilement est lu dans une frame d'animation :
 * aucun rendu React à chaque pixel.
 *
 * Remontée douce, sauf si le système demande moins d'animations.
 */
export function BackToTop() {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const appliquer = () => {
      frame = 0;
      el.dataset.visible = String(window.scrollY > window.innerHeight);
    };
    const surDefilement = () => {
      if (frame) return;
      frame = requestAnimationFrame(appliquer);
    };

    appliquer();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => {
      window.removeEventListener("scroll", surDefilement);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const remonter = () => {
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: doux ? "smooth" : "auto" });
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={remonter}
      data-visible="false"
      aria-label="Remonter en haut de la page"
      className="fixed right-5 bottom-5 z-40 flex size-11 items-center justify-center rounded-full border border-border bg-card/85 text-foreground shadow-md backdrop-blur-md transition-all duration-300 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[visible=false]:pointer-events-none data-[visible=false]:translate-y-3 data-[visible=false]:opacity-0 sm:right-8 sm:bottom-8"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
