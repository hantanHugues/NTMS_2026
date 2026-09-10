"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { solution } from "@/lib/content";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/**
 * Les quatre cartes, en défilement horizontal épinglé. TÉLÉPHONE
 * UNIQUEMENT — sur ordinateur elles restent en zigzag à droite du
 * texte, ce composant n'est jamais monté.
 *
 * Construit sur GSAP ScrollTrigger, l'outil de référence pour ce type
 * de séquence. Ce qu'il apporte et qu'une version maison doit sinon
 * réécrire :
 *
 *   - `pin` gère lui-même l'élément d'espacement qui remplace le bloc
 *     figé dans le flux. C'est précisément ce calcul que je faisais à
 *     la main, et c'est de là que venaient les vides ;
 *   - `scrub` lie la position à l'avancée du défilement, avec un
 *     lissage d'une seconde qui rattrape les à-coups du doigt ;
 *   - `invalidateOnRefresh` recalcule la distance à la rotation de
 *     l'appareil ou au changement de barre d'adresse.
 *
 * Le contexte GSAP (`gsap.context`) enferme tout ce que le composant
 * crée : au démontage, `revert()` supprime l'épinglage, l'espacement et
 * les styles en une fois. Sans lui, quitter la page laisse la section
 * figée.
 */

function Carte({ index }: { index: number }) {
  const offre = solution.offers[index];
  const Icon = offre.icon;
  const plein = index === 3;

  return (
    <article
      className={cn(
        "flex min-h-[25rem] w-[80vw] shrink-0 flex-col justify-center rounded-3xl p-6 shadow-md",
        plein ? "bg-accent text-accent-foreground" : "bg-background"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          plein
            ? "bg-accent-foreground/15 text-accent-foreground"
            : "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>

      <h3 className="font-heading mt-5 text-xl leading-tight font-extrabold tracking-tight text-balance">
        {offre.title}
      </h3>

      <p
        className={cn(
          "mt-2 text-sm leading-relaxed text-pretty",
          plein ? "opacity-80" : "text-muted-foreground"
        )}
      >
        {offre.body}
      </p>
    </article>
  );
}

export function SolutionCarousel() {
  const section = React.useRef<HTMLDivElement>(null);
  const piste = React.useRef<HTMLDivElement>(null);
  const barre = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const cadre = section.current;
    const track = piste.current;
    if (!cadre || !track) return;

    // Le système demande moins d'animations : on laisse la bande se
    // parcourir au doigt, sans rien figer.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.classList.add("snap-x", "snap-mandatory", "overflow-x-auto");
      return;
    }

    const ctx = gsap.context(() => {
      const distance = () =>
        Math.max(0, track.scrollWidth - cadre.offsetWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: cadre,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      /*
        Entree. Le bloc fait un ecran de haut : pendant qu'il monte
        depuis le bas, les cartes sont coupees par le bord inferieur.
        On les fait donc apparaitre SUR l'approche, pour qu'elles ne
        soient visibles qu'une fois le bloc en place. Le fond du bloc
        est celui de la section, la montee elle-meme ne se voit pas.
      */
      gsap.fromTo(
        track,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: cadre,
            start: "top 75%",
            end: "top 8%",
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        }
      );

      if (barre.current) {
        gsap.fromTo(
          barre.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: cadre,
              start: "top top",
              end: () => "+=" + distance(),
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    }, cadre);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={section}
      /*
        Le bloc epingle occupe l'ecran entier, et la piste occupe tout
        ce qui reste apres l'en-tete et le trait d'avancement (`flex-1`,
        `min-h-0`). C'est ce qui supprime le vide : plus rien ne flotte
        au milieu d'un fond nu.
      */
      className="relative flex h-svh flex-col overflow-hidden pt-24 pb-8 sm:hidden"
    >
      {/*
        La promesse de la section vit ICI sur telephone. C'est elle qui
        occupe le haut du bloc epingle : sans elle il fallait choisir
        entre des cartes etirees sur tout l'ecran et un espaceur qui
        laisse du vide entre le bloc et les sections voisines.
      */}
      <p className="font-heading shrink-0 px-6 text-xl leading-snug font-extrabold tracking-tight text-balance">
        {solution.closing}{" "}
        <span className="text-accent-text">{solution.closingAccent}</span>
      </p>

      <div ref={piste} className="mt-7 flex w-max min-h-0 flex-1 items-center gap-4 px-6">
        {solution.offers.map((offre, i) => (
          <Carte key={offre.title} index={i} />
        ))}
      </div>

      {/* Trait d'avancement : quand la page cesse de descendre, il faut
          dire où on en est. */}
      <div aria-hidden className="mx-6 mt-6 h-px shrink-0 bg-border">
        <div
          ref={barre}
          className="h-full w-full origin-left scale-x-0 bg-accent-foreground/60"
        />
      </div>
    </div>
  );
}
