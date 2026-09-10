import * as React from "react";
import Image from "next/image";

import FloatingDotsCta from "@/components/ui/floating-dots-cta";
import { cta, event } from "@/lib/content";

/**
 * L'appel à l'action.
 *
 * Carte sombre posée dans une section claire : la seule rupture de ton
 * du corps de page, et elle tombe sur le moment de conversion.
 *
 * AUCUN formulaire ici. L'inscription vit sur des pages dédiées, et
 * elle va plus loin qu'une adresse mail — on s'inscrit, puis on
 * rejoint le groupe WhatsApp. La colonne de droite décrit ces trois
 * étapes : c'est ce qui occupait la place du formulaire, et ça répond
 * à la question que le bouton pose forcément (« il se passe quoi si
 * je clique ? »).
 *
 * Décor volontairement sobre — une trame de points, rien de plus. Les
 * halos flous ont été retirés partout ailleurs sur le site.
 *
 * La carte reprend la BRIQUE de la section « preuve », jetons compris,
 * plutôt que le nuit qu'elle portait : le pied de page juste en
 * dessous est en nuit, et deux blocs sombres identiques a la suite se
 * seraient confondus.
 *
 * En filigrane, le SIGLE NTMS — le logo, pas du texte. La police de la
 * marque (Magic, MrLetters) est sous licence usage personnel : la
 * poser sur un site public demanderait la licence commerciale. Le logo
 * porte exactement le meme lettrage et appartient a l'organisation,
 * donc il dit la meme chose sans le probleme.
 */
export function RegistrationCta() {
  return (
    <section
      id="inscription"
      className="scroll-mt-24 bg-background px-6 py-24 max-sm:px-4 max-sm:py-14 sm:py-32"
    >
      <div
        className="dark relative mx-auto max-w-5xl overflow-hidden rounded-4xl bg-background text-foreground shadow-2xl max-sm:rounded-3xl"
        /* Memes valeurs que la section « preuve » — un seul brique sur
           le site, redefini localement pour que les surfaces derivees
           (`bg-card`, bordures) suivent. */
        style={
          {
            "--background": "oklch(0.325 0.082 37)",
            "--card": "oklch(0.375 0.078 37)",
            "--muted-foreground": "oklch(0.84 0.03 55)",
            "--border": "oklch(1 0 0 / 12%)",
          } as React.CSSProperties
        }
      >
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-[0.12]"
        />

        {/* Filigrane : deborde volontairement du cadre, l'`overflow-hidden`
            de la carte le rogne — c'est ce qui lui donne l'echelle. Il
            est cale a GAUCHE : a droite, le panneau des trois etapes
            (`bg-card/60`) en assombrissait la moitie et la coupure se
            voyait. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-16 w-[28rem] max-w-[60%] opacity-[0.08]"
        >
          <Image
            src="/ntms-logo.png"
            alt=""
            width={1699}
            height={1267}
            className="w-full brightness-0 invert"
          />
        </div>

        <div className="relative grid gap-12 p-9 max-sm:gap-8 max-sm:p-6 sm:p-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <span className="kicker">
                {event.seats} {cta.seatsLabel}
              </span>
            </div>

            <h2 className="font-heading mt-6 text-[clamp(1.75rem,8.5vw,2.25rem)] leading-[1] font-extrabold tracking-tight text-balance sm:mt-7 sm:text-5xl">
              {cta.title}{" "}
              <span className="text-accent-text">{cta.titleAccent}</span>
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-pretty text-muted-foreground max-sm:mt-4 max-sm:text-base">
              {cta.lead}
            </p>

            {/* Bouton a points flottants : le seul du site a porter cet
                effet, et il tombe sur le seul clic qui compte. */}
            <FloatingDotsCta
              className="mt-8 w-fit max-sm:mt-7 max-sm:w-full"
              href={cta.href}
              label={cta.button}
            />

            <p className="mt-5 text-sm text-muted-foreground max-sm:mt-4 max-sm:text-center">
              {event.city} — {event.dates}
            </p>
          </div>

          <ol className="flex flex-col gap-6 rounded-3xl bg-card/60 p-7 backdrop-blur-md max-sm:gap-5 max-sm:rounded-none max-sm:border-t max-sm:border-white/12 max-sm:bg-transparent max-sm:p-0 max-sm:pt-8 max-sm:backdrop-blur-none sm:p-8">
            {cta.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary max-sm:size-9">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-heading leading-tight font-extrabold tracking-tight max-sm:text-sm">
                      <span className="text-muted-foreground">{i + 1}. </span>
                      {step.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground max-sm:mt-1 max-sm:text-[0.8125rem]">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
