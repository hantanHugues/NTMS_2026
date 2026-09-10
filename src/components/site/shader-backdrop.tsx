"use client";

import * as React from "react";
import { ShaderCanvas } from "@/components/ui/phosphor-30";
import { AETHER_NTMS_SRC } from "@/lib/aether-ntms-shader";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Plafond de résolution.
 *
 * Le shader log-polaire coûte une poignée de divisions et de fonctions
 * trigonométriques par pixel — rien à voir avec le raymarching à 80
 * itérations de la version précédente, pour lequel j'avais mis en
 * place un budget de pixels serré.
 *
 * Ce budget a été retiré : il rendait le canvas en 748x457 pour un
 * écran de 1440x880, puis l'étirait. Les filaments, qui doivent rester
 * fins, se retrouvaient épaissis — l'animation avait l'air zoomée.
 */
const DPR_MAX = 1.5;

/** Sonde WebGL2, faite une seule fois puis mémorisée. */
let webgl2Support: boolean | null = null;
function supportsWebgl2() {
  if (webgl2Support === null) {
    try {
      webgl2Support = !!document.createElement("canvas").getContext("webgl2");
    } catch {
      webgl2Support = false;
    }
  }
  return webgl2Support;
}

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function motionAllowed() {
  return !window.matchMedia(REDUCED_MOTION).matches && supportsWebgl2();
}

const motionAllowedOnServer = () => false;

/**
 * Fond animé du hero.
 *
 * Rendu à la résolution native de l'écran, sans flou : ces deux
 * réglages étaient la cause de l'effet « zoomé ».
 *
 * Le canvas est démonté dès que la section sort du viewport — ce qui
 * arrête sa boucle d'animation — et rien n'est rendu si WebGL2 manque
 * ou si le système demande moins d'animations.
 */
export function ShaderBackdrop() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);

  const allowed = React.useSyncExternalStore(
    subscribeMotion,
    motionAllowed,
    motionAllowedOnServer
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "150px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 overflow-hidden">
      {allowed && inView ? (
        <ShaderCanvas fragSource={AETHER_NTMS_SRC} pixelRatio={DPR_MAX} />
      ) : null}
    </div>
  );
}
