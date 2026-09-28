import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { contact, event, paiement } from "@/lib/content";
import { enregistrerPaiement } from "@/lib/classeur";
import { notFound } from "next/navigation";

import {
  billetterieEnService,
  verifierPaiement,
  type StatutPaiement,
} from "@/lib/paiement";

export const metadata: Metadata = {
  title: `Paiement — ${event.name}`,
  robots: { index: false, follow: false },
};

/** Jamais de cache : l'état d'un paiement change de minute en minute. */
export const dynamic = "force-dynamic";

/**
 * OÙ REVIENT LA PERSONNE APRÈS AVOIR PAYÉ.
 *
 * C'est l'adresse déclarée chez Money Fusion sous « URL de redirection
 * après paiement ».
 *
 * ON NE CROIT PAS L'ADRESSE. Elle porte un jeton, rien de plus : l'état
 * du paiement est demandé à Money Fusion depuis le serveur. Quelqu'un
 * qui écrirait « ?statut=paid » à la main n'obtiendrait rien.
 *
 * La ligne est aussi écrite dans le classeur depuis ici, et pas
 * seulement depuis le webhook : si l'un des deux chemins échoue,
 * l'autre a déjà fait le travail, et le classeur reconnaît le jeton
 * pour ne pas doubler la ligne.
 */

const ICONES: Record<StatutPaiement | "inconnu", React.ReactNode> = {
  paid: <CheckCircle2 className="size-6" />,
  pending: <Clock className="size-6" />,
  failure: <XCircle className="size-6" />,
  "no paid": <XCircle className="size-6" />,
  inconnu: <XCircle className="size-6" />,
};

export default async function PageRetourPaiement({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!billetterieEnService()) notFound();

  const params = await searchParams;
  const lire = (cle: string) => {
    const v = params[cle];
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : "";
  };
  // Money Fusion renvoie le jeton ; le nom du paramètre varie selon les
  // intégrations, on accepte donc les trois formes rencontrées.
  const jeton = lire("token") || lire("tokenPay") || lire("paymentToken");

  const paiementVerifie = jeton ? await verifierPaiement(jeton) : null;
  const etat: StatutPaiement | "inconnu" = paiementVerifie
    ? paiementVerifie.statut
    : "inconnu";
  const texte = paiement.retour[etat];

  // Trace dans le classeur, sans jamais faire échouer l'affichage : la
  // personne doit voir son résultat même si Google ne répond pas.
  if (paiementVerifie) {
    const personnel = paiementVerifie.personnel as Record<string, string>;
    try {
      await enregistrerPaiement({
        token: paiementVerifie.token,
        statut: paiementVerifie.statut,
        montant: String(paiementVerifie.montant),
        frais: String(paiementVerifie.frais),
        moyen: paiementVerifie.moyen,
        numero_transaction: paiementVerifie.numeroTransaction,
        nom: paiementVerifie.nom,
        numero: paiementVerifie.numero,
        email: String(personnel?.email ?? ""),
        reference_inscription: String(personnel?.reference ?? ""),
        evenement: String(personnel?.evenement ?? ""),
        source: "retour",
      });
    } catch (err) {
      console.error("Paiement non enregistré au retour :", err);
    }
  }

  const reussi = etat === "paid";
  const aRejouer = etat === "failure" || etat === "no paid";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12 text-center">
      <span
        className={
          reussi
            ? "flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
            : "flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"
        }
      >
        {ICONES[etat]}
      </span>

      <h1 className="font-heading mt-6 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
        {texte.titre}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-pretty text-muted-foreground">
        {texte.texte}
      </p>

      {paiementVerifie ? (
        <dl className="mt-8 w-full max-w-md rounded-2xl border border-border bg-card px-5 py-4 text-left text-sm">
          <div className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-muted-foreground">Montant</dt>
            <dd className="font-semibold tabular-nums">
              {new Intl.NumberFormat("fr-FR").format(paiementVerifie.montant)} FCFA
            </dd>
          </div>
          {paiementVerifie.moyen ? (
            <div className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className="text-muted-foreground">Moyen</dt>
              <dd className="font-semibold">{paiementVerifie.moyen}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-muted-foreground">Référence</dt>
            <dd className="font-mono text-xs break-all">
              {paiementVerifie.numeroTransaction || paiementVerifie.token}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        {aRejouer ? (
          <Button
            nativeButton={false}
            className="h-13 w-full rounded-full text-base has-data-[icon=inline-start]:pl-6 max-sm:h-14 sm:flex-1"
            render={<a href="/paiement" />}
          >
            <CreditCard data-icon="inline-start" />
            Réessayer le paiement
          </Button>
        ) : null}
        <Button
          nativeButton={false}
          variant="outline"
          className="h-13 w-full rounded-full text-base max-sm:h-14 sm:flex-1"
          render={
            <a
              href={contact.whatsappLien}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          Écrire au comité
        </Button>
      </div>

      <Link
        href="/"
        className="mt-8 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Revenir à l&apos;accueil
      </Link>
    </div>
  );
}
