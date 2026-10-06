import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { GenerateurAffiche } from "@/components/site/affiche";
import { SelecteurLangue } from "@/components/site/langue";
import { contenu } from "@/lib/contenu";

export async function generateMetadata(): Promise<Metadata> {
  const { affiche, event } = await contenu();
  return {
    title: `${affiche.titre} — ${event.name}`,
    description: affiche.chapo,
  };
}

/**
 * LA PAGE DE L'AFFICHE.
 *
 * Elle s'atteint directement, et depuis l'écran de fin d'inscription,
 * qui y dépose au passage le prénom, le nom et le comité. Aucun
 * contrôle d'inscription : l'affiche sert à faire connaître l'édition,
 * plus elle circule mieux c'est.
 *
 * Tout le travail se fait dans le navigateur — la photo n'est jamais
 * envoyée au site.
 */
export default async function PageAffiche() {
  const { affiche, event, inscription } = await contenu();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:h-20 sm:px-6">
          <Link href="/" className="-mx-2 flex items-center gap-3 px-2 py-3">
            <Image
              src="/ntms-logo.png"
              alt={event.name}
              width={1699}
              height={1267}
              priority
              className="h-7 w-auto sm:h-8"
            />
            <span className="hidden text-xs tracking-wider text-muted-foreground sm:block">
              {event.organisation}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <SelecteurLangue />
            <Link
              href="/"
              className="-mr-2 flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {inscription.formulaire.retour}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-6 sm:py-16">
        <h1 className="font-heading text-[clamp(1.75rem,8vw,2.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
          {affiche.titre}
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-pretty text-muted-foreground">
          {affiche.chapo}
        </p>

        <div className="mt-10 sm:mt-12">
          <GenerateurAffiche />
        </div>
      </main>
    </div>
  );
}
