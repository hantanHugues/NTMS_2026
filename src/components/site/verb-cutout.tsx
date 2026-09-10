"use client";

import * as React from "react";
import { ShaderBackdrop } from "@/components/site/shader-backdrop";
import { cn } from "@/lib/utils";

/** Repère du tracé SVG. Le conteneur garde ce rapport, donc aucun glyphe n'est déformé. */
const VB_W = 1000;
const VB_H = 210;

/**
 * Le verbe du titre, en DÉCOUPE : le shader est rendu derrière, et un
 * aplat de la couleur de fond est peint par-dessus, percé à la forme
 * du mot. Les lettres sont donc littéralement faites de la matière
 * animée.
 *
 * C'est ce qui donne son sens au shader : le thème de l'édition est la
 * transformation, et le mot se transforme en étant fait d'une matière
 * qui ne cesse de changer.
 *
 * Chaque verbe est étiré à la même largeur via `textLength` +
 * `lengthAdjust="spacing"` : seul l'interlettrage varie, jamais le
 * dessin des lettres. Effet de bord utile — ce n'est plus le mot le
 * plus long qui impose la taille de tous les autres.
 */
export function VerbCutout({
  verbs,
  intervalMs = 2600,
  className,
}: {
  verbs: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const maskId = React.useId();

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((c) => (c + 1) % verbs.length),
      intervalMs
    );
    return () => window.clearInterval(id);
  }, [verbs.length, intervalMs]);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
    >
      <ShaderBackdrop />

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Apprendre à ${verbs[index]}`}
      >
        <defs>
          <mask id={maskId}>
            {/* Blanc = on peint l'aplat. Noir = on perce. */}
            <rect width={VB_W} height={VB_H} fill="white" />
            {verbs.map((verb, i) => (
              <text
                key={verb}
                x={VB_W / 2}
                y={VB_H * 0.78}
                textAnchor="middle"
                textLength={VB_W * 0.97}
                lengthAdjust="spacing"
                fill="black"
                opacity={i === index ? 1 : 0}
                style={{
                  fontFamily: "var(--font-bricolage), system-ui, sans-serif",
                  fontSize: `${VB_H * 0.92}px`,
                  fontWeight: 800,
                  transition: "opacity 520ms cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: i === index ? "90ms" : "0ms",
                }}
              >
                {verb}
              </text>
            ))}
          </mask>
        </defs>

        <rect
          width={VB_W}
          height={VB_H}
          fill="var(--background)"
          mask={`url(#${maskId})`}
        />
      </svg>
    </div>
  );
}
