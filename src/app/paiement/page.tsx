import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FormulairePaiement } from "@/components/site/formulaire-paiement";
import { SelecteurLangue } from "@/components/site/langue";
import { contenu } from "@/lib/contenu";
import { notFound } from "next/navigation";

import { paiementsOuverts } from "@/lib/inscription-regles";
import { billetterieEnService, montantInscription } from "@/lib/paiement";

export async function generateMetadata(): Promise<Metadata> {
  const { event, inscription, paiement } = await contenu();
  return {
    title: `${paiement.titre} — ${event.name}`,
    description: paiement.chapo,
  };
}

/** Lue à chaque visite : la date de clôture doit s'appliquer tout de suite. */
export const dynamic = "force-dynamic";

/**
 * La page de paiement.
 *
 * Même dépouillement que l'inscription : une seule route possible, un
 * seul lien sortant. Le montant est lu ICI, côté serveur, et seulement
 * affiché plus bas.
 */
export default async function PagePaiement() {
  if (!billetterieEnService()) notFound();
  const { event, inscription, paiement } = await contenu();
  const ouverts = paiementsOuverts();

  // Le montant manquant est une erreur de réglage, pas une erreur du
  // visiteur : on le dit clairement plutôt que de planter la page.
  let montant: number | null = null;
  try {
    montant = montantInscription();
  } catch {
    montant = null;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:h-20 sm:px-6">
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-20 max-sm:px-0">
        <div className="max-sm:px-5">
          <h1 className="font-heading text-[clamp(1.75rem,8vw,2.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
            {ouverts ? paiement.titre : paiement.closTitre}
          </h1>
          <p className="mt-4 leading-relaxed text-pretty text-muted-foreground">
            {ouverts ? paiement.chapo : paiement.closTexte}
          </p>
        </div>

        {ouverts && montant !== null ? (
          <div className="mt-10 max-sm:mt-6">
            <FormulairePaiement montant={montant} />
          </div>
        ) : null}

        {ouverts && montant === null ? (
          <p
            role="alert"
            className="mt-10 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground max-sm:mx-5"
          >
            {paiement.montantManquant} {event.email}.
          </p>
        ) : null}
      </main>
    </div>
  );
}
