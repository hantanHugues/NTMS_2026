import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/site/countdown";
import { RotatingVerb } from "@/components/site/rotating-verb";
import { ShaderBackdrop } from "@/components/site/shader-backdrop";
import { ACTION, ACTION_PAIEMENT } from "@/components/site/actions";
import { contenu } from "@/lib/contenu";
import { inscriptionsOuvertes, paiementsOuverts } from "@/lib/inscription-regles";

/**
 * Hero d'annonce d'événement.
 *
 * Quatre blocs, pas un de plus : le logo, le titre, les informations
 * pratiques, l'action. La version précédente en empilait sept — logo,
 * date, titre, description, quatre chiffres, boutons, compte à rebours
 * — et le titre s'y noyait.
 *
 * Ce qui a été retiré : la description (l'en-tête porte déjà le nom de
 * l'organisation), la rangée de chiffres, et la ligne du compte à
 * rebours, désormais fondue dans les informations pratiques.
 *
 * MOBILE — les tailles du titre sont FLUIDES. Elles etaient ecrites en
 * dur : le verbe faisait 52 px quelle que soit la largeur, et
 * « désapprendre » mesurait alors 361 px pour 327 disponibles a 375 de
 * large. Le mot etait coupe des deux cotes sans qu'aucune barre de
 * defilement ne le signale, la section portant `overflow-hidden`.
 * `clamp` retombe sur les memes valeurs qu'avant des 640 px : la vue
 * sur ordinateur est inchangee, au pixel pres.
 */
export async function Hero() {
  const { afficheAccueil, event, hero, rotatingVerbs } = await contenu();
  // Deux actions de MEME poids, chacune tant que sa date n'est pas
  // passee : s'inscrire, ou payer. Quand plus rien n'est ouvert, le
  // hero garde une porte : le contact.
  const peutSInscrire = inscriptionsOuvertes();
  const peutPayer = paiementsOuverts();
  return (
    <section className="dark relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-20 text-center sm:py-28 text-foreground">
      <ShaderBackdrop />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
      />

      <div className="relative flex w-full max-w-5xl animate-rise flex-col items-center">
        <Image
          src="/ntms-logo.png"
          alt={event.name}
          width={1699}
          height={1267}
          priority
          className="h-12 w-auto brightness-0 invert sm:h-16 lg:h-20"
        />

        <h1 className="font-heading mt-8 font-extrabold tracking-tight sm:mt-12">
          <span className="block text-[clamp(1.5rem,7.5vw,2rem)] leading-[1.05] sm:text-5xl lg:text-6xl">
            {hero.amorce}
          </span>
          <RotatingVerb
            verbs={rotatingVerbs}
            className="my-1 justify-items-center text-[clamp(2.25rem,12vw,3.25rem)] leading-[1] text-primary sm:text-8xl lg:text-9xl"
          />
          <span className="block text-[clamp(1.5rem,7.5vw,2rem)] leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
            {hero.chute}
          </span>
        </h1>

        <Countdown
          target={event.startsAt}
          unites={hero.unites}
          className="mt-8 sm:mt-12"
        />

        <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row">
          {peutSInscrire ? (
            <Button
              nativeButton={false}
              size="lg"
              className={ACTION}
              render={<a href="#carte-inscription" />}
            >
              {hero.boutonInscription}
            </Button>
          ) : null}
          {peutPayer ? (
            <Button
              nativeButton={false}
              size="lg"
              className={`${ACTION} ${ACTION_PAIEMENT}`}
              render={<a href="#packs" />}
            >
              {hero.boutonPaiement}
            </Button>
          ) : null}
          {!peutSInscrire && !peutPayer ? (
            <Button
              nativeButton={false}
              size="lg"
              className={ACTION}
              render={<a href="#contact" />}
            >
              {hero.contact}
            </Button>
          ) : null}
        </div>

        {/* L'affiche : un LIEN, pas un troisieme bouton. Les deux boutons
            plus haut restent les seuls elements pleins ; la vignette du
            badge dit ce qu'on obtient sans un mot de plus. */}
        <Link
          href="#affiche"
          className="group mt-5 flex items-center gap-3 rounded-full px-3 py-2.5 text-sm text-foreground/65 transition-colors hover:text-foreground sm:mt-6"
        >
          <Image
            src="/affiche/exemple.webp"
            alt=""
            width={28}
            height={35}
            className="h-[35px] w-7 -rotate-6 rounded-[3px] shadow-md ring-1 ring-white/25 transition-transform group-hover:rotate-0"
          />
          <span className="underline decoration-foreground/25 underline-offset-4 transition-colors group-hover:decoration-foreground/60">
            {afficheAccueil.lien}
          </span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
