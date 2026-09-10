"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Bouton d'appel a l'action, avec des points qui montent en continu
 * derriere le libelle.
 *
 * Le composant d'origine ne rendait qu'un `<button>`. Ici l'inscription
 * est un LIEN vers une page dediee : passer `href` fait rendre un `<a>`,
 * sans quoi on retombe sur le bouton natif.
 *
 * Toute l'animation est en CSS (`.fdc-*` dans `globals.css`), calee sur
 * les jetons de la charte — aucune couleur n'est ecrite en dur.
 */

type BaseProps = { label?: string; className?: string };

type AnchorProps = BaseProps & { href: string } & Omit<
    ComponentPropsWithoutRef<"a">,
    "className" | "href"
  >;

type ButtonProps = BaseProps & { href?: never } & Omit<
    ComponentPropsWithoutRef<"button">,
    "className"
  >;

export type FloatingDotsCtaProps = AnchorProps | ButtonProps;

export default function FloatingDotsCta(props: FloatingDotsCtaProps) {
  const { label = "Je m'inscris", className, ...rest } = props;
  const classes = ["fdc-button", className].filter(Boolean).join(" ");

  const inner: ReactNode = (
    <>
      <span aria-hidden className="fdc-points_wrapper">
        {Array.from({ length: 10 }).map((_, i) => (
          <i key={i} className="fdc-point" />
        ))}
      </span>

      <span className="fdc-inner">
        {label}
        <svg
          aria-hidden
          className="fdc-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </>
  );

  if ("href" in props && props.href) {
    return (
      <a className={classes} {...(rest as ComponentPropsWithoutRef<"a">)}>
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {inner}
    </button>
  );
}
