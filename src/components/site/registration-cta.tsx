import * as React from "react";
import { Check } from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import FloatingDotsCta from "@/components/ui/floating-dots-cta";
import { contenu } from "@/lib/contenu";
import { inscriptionsOuvertes, paiementsOuverts } from "@/lib/inscription-regles";

/**
 * L'APPEL A L'ACTION DE L'INSCRIPTION, avant la section des packs.
 *
 * Il ne porte que l'inscription : le paiement a sa propre section
 * (« Choisis ton pack »), qui est son appel a l'action. Aucun mot sur
 * le prix ici — « gratuit » laissait croire qu'il existait un billet
 * gratuit ; a la place, la date limite.
 *
 * Quand les inscriptions sont closes, la section disparait si le
 * paiement est encore ouvert (la section des packs prend le relais) ;
 * quand plus rien n'est ouvert, il reste le contact.
 *
 * Une grande carte a deux parties cote a cote, comme la section des
 * packs : a gauche la date limite et le bouton, a droite ce que
 * l'inscription comprend. Sur telephone, elles s'empilent.
 */
export async function RegistrationCta() {
  const { cta, ctaClos, event, hero, paiement } = await contenu();

  if (!inscriptionsOuvertes()) {
    // Le paiement est ouvert : sa propre section fait le travail.
    if (paiementsOuverts()) return null;
    return (
      <section
        id="inscription"
        className="scroll-mt-24 bg-background px-6 py-24 max-sm:px-4 max-sm:py-14 sm:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading max-w-3xl text-[clamp(2.25rem,11vw,3.25rem)] leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl">
            {ctaClos.title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground max-sm:text-base">
            {ctaClos.lead}
          </p>
          <Button
            nativeButton={false}
            size="lg"
            className="mt-10 h-13 rounded-full px-9 text-base max-sm:w-full"
            render={<a href={ctaClos.href} />}
          >
            {ctaClos.button}
          </Button>
        </div>
      </section>
    );
  }

  // « 24 octobre », dans la langue du site et à l'heure du Bénin.
  const t = Date.parse(event.finInscriptions);
  const limite = Number.isNaN(t)
    ? ""
    : new Intl.DateTimeFormat(paiement.locale, {
        day: "numeric",
        month: "long",
        timeZone: "Africa/Porto-Novo",
      }).format(t);
  const i = cta.inscription;

  return (
    <section
      id="inscription"
      className="scroll-mt-24 bg-background px-6 py-24 max-sm:px-4 max-sm:py-14 sm:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading max-w-3xl text-[clamp(2.25rem,11vw,3.25rem)] leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl">
          {cta.title} <span className="text-accent-text">{cta.titleAccent}</span>
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground max-sm:text-base">
          {cta.lead}
        </p>

        <article
          id="carte-inscription"
          className="relative mt-12 scroll-mt-24 overflow-hidden rounded-3xl border border-border bg-card p-8 transition-shadow duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,23,36,0.18)] max-sm:mt-9 max-sm:p-6 sm:p-12"
        >
          {/* La lumière qui fait le tour de la carte, de la couleur de
              son bouton. */}
          <BorderBeam
            size={260}
            duration={9}
            borderWidth={2}
            colorFrom="#FF7A00"
            colorTo="#FFB36B"
          />

          <div className="grid gap-10 md:grid-cols-[minmax(15rem,1fr)_auto_1fr] md:gap-12">
            <div className="flex flex-col">
              <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {i.nom}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">{i.jusqu}</p>
              <p className="font-heading mt-1 text-5xl leading-none font-extrabold tracking-tight max-sm:text-4xl">
                {limite}
              </p>
              <p className="mt-5 text-muted-foreground">{i.description}</p>

              {/* `dark` ramène l'orange du hero (plus clair, texte foncé)
                  même sur la carte claire. */}
              <div className="dark mt-8">
                <FloatingDotsCta
                  className="w-full whitespace-nowrap"
                  href="/inscription"
                  label={hero.boutonInscription}
                />
              </div>
            </div>

            <div aria-hidden className="hidden w-px bg-border md:block" />

            <ul className="space-y-4 self-center">
              {i.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-foreground/85">
                  <span
                    aria-hidden
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-background"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </article>

        <p className="mt-8 text-sm text-muted-foreground">
          {event.seats} {cta.places} · {event.city} — {event.dates}
        </p>
      </div>
    </section>
  );
}
