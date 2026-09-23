import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FormulaireInscription } from "@/components/site/formulaire-inscription";
import { event, inscription } from "@/lib/content";

export const metadata: Metadata = {
  title: `${inscription.titre} — ${event.organisation}`,
  description: inscription.chapo,
};

/**
 * La page d'inscription.
 *
 * Volontairement dépouillée : pas de menu, pas de sections, un seul
 * chemin. Le seul lien sortant ramène à l'accueil. Une page de
 * formulaire qui propose autre chose perd des inscrits.
 */
export default function PageInscription() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="-mx-2 flex items-center gap-3 px-2 py-3">
            <Image
              src="/ntms-logo.png"
              alt={event.name}
              width={1699}
              height={1267}
              priority
              className="h-8 w-auto"
            />
            <span className="hidden text-xs tracking-wider text-muted-foreground sm:block">
              {event.organisation}
            </span>
          </Link>
          <Link
            href="/"
            className="-mr-2 flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-heading text-[clamp(1.75rem,8vw,2.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
          {inscription.titre}
        </h1>
        <p className="mt-4 leading-relaxed text-pretty text-muted-foreground">
          {inscription.chapo}
        </p>

        <div className="mt-10">
          <FormulaireInscription />
        </div>
      </main>
    </div>
  );
}
