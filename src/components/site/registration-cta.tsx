import * as React from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import FloatingDotsCta from "@/components/ui/floating-dots-cta";
import { contenu } from "@/lib/contenu";
import { inscriptionsOuvertes, paiementsOuverts } from "@/lib/inscription-regles";
import { cn } from "@/lib/utils";

/**
 * L'appel à l'action : DEUX CARTES, comme une grille de tarifs.
 *
 * Deux gestes, dans l'ordre — s'inscrire, puis payer — donc deux
 * cartes, chacune avec son bouton (ceux du hero, avec l'effet de points
 * flottants). Deux boutons plutôt qu'un : les dates diffèrent, et
 * quelqu'un d'inscrit doit pouvoir payer plus tard sans repasser par
 * l'inscription.
 *
 *   inscription   carte claire, bouton orange
 *   paiement      carte sombre à dégradé, bouton crème
 *
 * Chaque carte disparaît quand sa date est passée ; quand plus rien
 * n'est ouvert, il reste le contact.
 *
 * Structure inspirée d'un composant « pricing cards » (21st.dev) : nom
 * en capitales espacées, grand chiffre léger, description sous un
 * filet, liste à coches, bouton pleine largeur. Réécrit avec nos
 * composants et nos jetons — pas de dépendance ajoutée.
 */
export async function RegistrationCta() {
  const { cta, ctaClos, event, hero, paiement } = await contenu();
  const peutSInscrire = inscriptionsOuvertes();
  const peutPayer = paiementsOuverts();

  // « 24 octobre », dans la langue du site et à l'heure du Bénin.
  const jusquau = (iso: string) => {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return "";
    return new Intl.DateTimeFormat(paiement.locale, {
      day: "numeric",
      month: "long",
      timeZone: "Africa/Porto-Novo",
    }).format(t);
  };

  const cartes = [
    peutSInscrire && {
      cle: "inscription",
      sombre: false,
      ...cta.inscription,
      limite: jusquau(event.finInscriptions),
      bouton: hero.boutonInscription,
      href: "/inscription",
    },
    peutPayer && {
      cle: "paiement",
      sombre: true,
      ...cta.paiement,
      limite: jusquau(event.finPaiements),
      bouton: hero.boutonPaiement,
      href: "/paiement",
    },
  ].filter(Boolean) as {
    cle: string;
    sombre: boolean;
    nom: string;
    prix: string;
    jusqu: string;
    description: string;
    points: string[];
    limite: string;
    bouton: string;
    href: string;
  }[];

  return (
    <section
      id="inscription"
      className="scroll-mt-24 bg-background px-6 py-24 max-sm:px-4 max-sm:py-14 sm:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading max-w-3xl text-[clamp(2.25rem,11vw,3.25rem)] leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl">
          {cartes.length ? (
            <>
              {cta.title}{" "}
              <span className="text-accent-text">{cta.titleAccent}</span>
            </>
          ) : (
            ctaClos.title
          )}
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground max-sm:text-base">
          {cartes.length ? cta.lead : ctaClos.lead}
        </p>

        {cartes.length ? (
          <div
            className={cn(
              "mt-12 grid gap-6 max-sm:mt-9 md:gap-8",
              cartes.length > 1 ? "md:grid-cols-2" : "max-w-md"
            )}
          >
            {cartes.map((c) => (
              <article
                key={c.cle}
                id={`carte-${c.cle}`}
                className={cn(
                  "group relative scroll-mt-24 overflow-hidden rounded-2xl border transition-all duration-500",
                  c.sombre
                    ? "dark border-border bg-gradient-to-b from-[oklch(0.17_0.034_234.8)] to-[oklch(0.125_0.03_234.8)] text-foreground hover:border-foreground/25 hover:shadow-[0_8px_40px_-12px_rgba(0,23,36,0.5)]"
                    : "border-border bg-card text-foreground hover:border-foreground/25 hover:shadow-[0_8px_40px_-12px_rgba(0,23,36,0.18)]"
                )}
              >
                {/* La lumiere qui fait le tour de la carte, de la couleur
                    de SON bouton : orange sur la carte claire, creme sur
                    la sombre. Les deux ne tournent pas en phase. */}
                <BorderBeam
                  size={260}
                  duration={9}
                  borderWidth={2}
                  delay={c.sombre ? 4.5 : 0}
                  colorFrom={c.sombre ? "#FFEBD1" : "#FF7A00"}
                  colorTo={c.sombre ? "#FFD2A1" : "#FFB36B"}
                />
                <div className="flex h-full flex-col p-10 max-sm:p-7">
                  <h3 className="text-lg font-medium tracking-wider uppercase">
                    {c.nom}
                  </h3>

                  <div className="mt-4">
                    <span className="block text-5xl font-light max-sm:text-4xl">
                      {c.prix}
                    </span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {c.jusqu} {c.limite}
                    </span>
                  </div>

                  <p className="mt-4 border-b border-border pb-6 text-sm text-muted-foreground">
                    {c.description}
                  </p>

                  <ul className="mt-8 flex-1 space-y-4">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-center gap-3">
                        <Check
                          aria-hidden
                          className={cn(
                            "size-4 shrink-0",
                            c.sombre ? "text-foreground" : "text-accent-text"
                          )}
                        />
                        <span className="text-sm text-foreground/80">{p}</span>
                      </li>
                    ))}
                  </ul>

                  {/* `dark` ramène l'orange du hero (plus clair, texte
                      foncé) même sur la carte claire. */}
                  <div className="dark mt-10">
                    <FloatingDotsCta
                      className={cn("w-full", c.sombre && "fdc-creme")}
                      href={c.href}
                      label={c.bouton}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Button
            nativeButton={false}
            size="lg"
            className="mt-10 h-13 rounded-full px-9 text-base max-sm:w-full"
            render={<a href={ctaClos.href} />}
          >
            {ctaClos.button}
          </Button>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          {event.seats} {cta.places} · {event.city} — {event.dates}
        </p>
      </div>
    </section>
  );
}
