"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import {
  COOKIE_LANGUE,
  type DictionnaireClient,
  type Langue,
} from "@/lib/langues";
import { cn } from "@/lib/utils";

/**
 * LA LANGUE, CÔTÉ NAVIGATEUR.
 *
 * Un composant client ne peut pas lire les cookies au moment du rendu :
 * la mise en page, elle, le fait côté serveur et lui passe le
 * dictionnaire une fois pour toutes. Tout ce qui s'affiche dans un
 * composant client passe donc par ce contexte.
 */

const Contexte = React.createContext<DictionnaireClient | null>(null);

export function FournisseurLangue({
  dictionnaire,
  children,
}: {
  dictionnaire: DictionnaireClient;
  children: React.ReactNode;
}) {
  return <Contexte.Provider value={dictionnaire}>{children}</Contexte.Provider>;
}

/** Le dictionnaire de la langue en cours, dans un composant client. */
export function useContenu(): DictionnaireClient {
  const valeur = React.useContext(Contexte);
  if (!valeur) {
    throw new Error("useContenu doit être appelé sous FournisseurLangue.");
  }
  return valeur;
}

const LIBELLES: Record<Langue, string> = { fr: "Français", en: "English" };

/**
 * Le sélecteur.
 *
 * Il écrit le cookie puis demande à Next de refaire la page : le
 * serveur la rend dans la nouvelle langue, sans rechargement complet
 * et sans changer d'adresse. Le cookie dure un an, le choix tient donc
 * d'une visite à l'autre.
 */
export function SelecteurLangue({ className }: { className?: string }) {
  const { langue } = useContenu();
  const router = useRouter();
  const [enCours, demarrer] = React.useTransition();

  function basculer(vers: Langue) {
    if (vers === langue) return;
    document.cookie = `${COOKIE_LANGUE}=${vers}; path=/; max-age=31536000; samesite=lax`;
    demarrer(() => router.refresh());
  }

  const autre: Langue = langue === "fr" ? "en" : "fr";

  return (
    <button
      type="button"
      onClick={() => basculer(autre)}
      disabled={enCours}
      aria-label={`Switch to ${LIBELLES[autre]}`}
      title={LIBELLES[autre]}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium",
        "transition-colors hover:border-primary/40 disabled:opacity-60",
        className
      )}
    >
      <Languages className="size-4 text-primary" />
      <span className="tabular-nums uppercase">{autre}</span>
    </button>
  );
}
