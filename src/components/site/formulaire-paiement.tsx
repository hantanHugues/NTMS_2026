"use client";

import * as React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { emailValide } from "@/lib/inscription-regles";
import { useContenu } from "@/components/site/langue";
import { cn } from "@/lib/utils";

/**
 * Le formulaire de paiement.
 *
 * Trois questions, pas une de plus : le nom qui apparaîtra sur
 * l'opération, l'adresse où envoyer le reçu, et le numéro à débiter.
 * Tout le reste — montant, sécurité, opérateur — se passe chez Money
 * Fusion, où la personne est envoyée juste après.
 *
 * LE MONTANT EST AFFICHÉ, PAS SAISI. Il descend du serveur pour être
 * lu, et c'est le serveur qui le redonnera à Money Fusion : ce qui part
 * d'ici ne peut pas changer le prix.
 */

const CHAMP =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary max-sm:min-h-13";

export function FormulairePaiement({ montant }: { montant: number }) {
  const { paiement } = useContenu();
  const [nom, setNom] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [numero, setNumero] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, setEnvoi] = React.useState(false);

  const montantLisible = new Intl.NumberFormat("fr-FR").format(montant);

  async function payer() {
    if (nom.trim().length < 2) return setErreur("Ton nom, s'il te plaît.");
    if (!emailValide(email.trim()))
      return setErreur("Cette adresse e-mail n'est pas valide.");
    if (numero.replace(/\D/g, "").length < 8)
      return setErreur("Ce numéro mobile money n'est pas valide.");

    setErreur(null);
    setEnvoi(true);
    try {
      const reponse = await fetch("/api/paiement/creer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, numero, reference }),
      });
      const resultat = (await reponse.json()) as {
        ok?: boolean;
        url?: string;
        message?: string;
      };
      if (!resultat.ok || !resultat.url) {
        throw new Error(resultat.message || "Paiement impossible pour l'instant.");
      }
      // On quitte le site pour la page de paiement de Money Fusion.
      window.location.href = resultat.url;
    } catch (err) {
      setErreur(
        err instanceof Error ? err.message : "Paiement impossible pour l'instant."
      );
      setEnvoi(false);
    }
  }

  return (
    <div className="rounded-3xl bg-card p-6 shadow-md sm:p-10 max-sm:rounded-none max-sm:bg-background max-sm:p-5 max-sm:shadow-none">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-5">
        <span className="text-sm text-muted-foreground">Montant à régler</span>
        <span className="font-heading text-2xl font-extrabold tracking-tight">
          {montantLisible} FCFA
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <label>
          <span className="mb-2 block text-sm font-medium">
            {paiement.libelleNom}
            <span className="text-accent-text"> *</span>
          </span>
          <input
            className={CHAMP}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="name"
            maxLength={100}
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium">
            {paiement.libelleEmail}
            <span className="text-accent-text"> *</span>
          </span>
          <input
            className={CHAMP}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={120}
            placeholder="prenom.nom@exemple.bj"
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium">
            {paiement.libelleNumero}
            <span className="text-accent-text"> *</span>
          </span>
          <input
            className={CHAMP}
            type="tel"
            inputMode="tel"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/[^\d\s]/g, ""))}
            autoComplete="tel-national"
            maxLength={20}
            placeholder="01 97 12 34 56"
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            {paiement.aideNumero}
          </span>
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium">
            Référence d&apos;inscription
            <span className="text-muted-foreground"> (facultatif)</span>
          </span>
          <input
            className={CHAMP}
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            maxLength={20}
            placeholder="NTMS-0042"
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            Elle figure dans ton mail de confirmation d&apos;inscription. Elle
            nous aide à rapprocher ton paiement de ton dossier.
          </span>
        </label>
      </div>

      {erreur ? (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground"
        >
          {erreur}
        </p>
      ) : null}

      <Button
        className={cn(
          "mt-8 h-13 w-full rounded-full text-base has-data-[icon=inline-start]:pl-6",
          "max-sm:h-14"
        )}
        disabled={envoi}
        onClick={payer}
      >
        <CreditCard data-icon="inline-start" />
        {envoi ? paiement.enCours : `${paiement.bouton} · ${montantLisible} FCFA`}
      </Button>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        Le paiement se fait sur la page sécurisée de Money Fusion. Ni le site
        ni AIESEC in Benin ne voient ton code secret.
      </p>
    </div>
  );
}
