"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Les durées ; leur nom vient du dictionnaire, il se traduit. */
const UNITS = [86_400_000, 3_600_000, 60_000, 1_000] as const;

export type UnitesCompte = {
  jours: string;
  heures: string;
  minutes: string;
  secondes: string;
  /** Ce qu'annonce un lecteur d'écran à la place des chiffres. */
  libelle: string;
};

function split(remaining: number, unites: UnitesCompte) {
  const noms = [unites.jours, unites.heures, unites.minutes, unites.secondes];
  let rest = Math.max(remaining, 0);
  return UNITS.map((ms, i) => {
    const value = Math.floor(rest / ms);
    rest -= value * ms;
    return { label: noms[i], value };
  });
}

/**
 * Compte à rebours compact, sur une seule ligne.
 *
 * Chiffre et unité partagent la même ligne de base au lieu d'être
 * empilés dans des cartes : le bloc tient donc dans la hauteur d'une
 * ligne de texte, et remplace la ligne d'informations pratiques sans
 * occuper plus de place qu'elle.
 *
 * Le premier rendu affiche des tirets — l'heure du serveur et celle
 * du navigateur ne coïncident pas, et l'écart provoquerait une erreur
 * d'hydratation.
 */
export function Countdown({
  target,
  unites,
  className,
}: {
  target: string;
  unites: UnitesCompte;
  className?: string;
}) {
  const targetMs = React.useMemo(() => new Date(target).getTime(), [target]);
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const tick = () => setRemaining(targetMs - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const parts = split(remaining ?? 0, unites);

  return (
    <p
      className={cn("flex items-baseline justify-center gap-5", className)}
      aria-label={unites.libelle}
    >
      {parts.map((part) => (
        <span key={part.label} className="flex items-baseline gap-1">
          <span className="font-heading text-2xl leading-none font-extrabold tabular-nums sm:text-3xl">
            {remaining === null ? "--" : String(part.value).padStart(2, "0")}
          </span>
          <span className="text-sm text-muted-foreground">{part.label}</span>
        </span>
      ))}
    </p>
  );
}
