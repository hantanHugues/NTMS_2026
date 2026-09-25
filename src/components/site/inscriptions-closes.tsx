import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarX, Home, Mail, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { contact, event, instagram, inscription } from "@/lib/content";

/**
 * L'écran servi à la place du formulaire une fois les inscriptions
 * closes.
 *
 * Il arrive par le même chemin que l'inscription : la personne clique
 * « Je m'inscris » comme avant, et tombe ici. Une page qui dit
 * seulement « c'est fermé » renvoie les gens dans le vide, alors elle
 * garde les deux portes ouvertes — le comité, et le compte qui
 * annoncera la prochaine édition.
 *
 * Même habillage que l'écran de fin d'inscription : carte sur
 * ordinateur, écran entier avec sa barre sur téléphone.
 */
export function InscriptionsCloses() {
  return (
    <div className="flex flex-col rounded-3xl bg-card text-center shadow-md max-sm:min-h-svh max-sm:rounded-none max-sm:bg-background max-sm:shadow-none">
      <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:hidden">
        <Image
          src="/ntms-logo.png"
          alt={event.name}
          width={1699}
          height={1267}
          className="h-7 w-auto"
        />
        <Link
          href="/"
          className="-mr-2 flex items-center gap-1.5 rounded-full px-2 py-2 text-sm text-muted-foreground"
        >
          <Home className="size-4" />
          Accueil
        </Link>
      </div>

      <div className="p-8 sm:p-12 max-sm:flex max-sm:flex-1 max-sm:flex-col max-sm:justify-center max-sm:px-5 max-sm:py-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <CalendarX className="size-6" />
        </span>
        <h1 className="font-heading mt-6 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
          {inscription.closesTitre}
        </h1>
        <p className="mx-auto mt-5 max-w-md leading-relaxed text-pretty text-muted-foreground">
          {inscription.closesTexte}
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            className="h-13 flex-1 rounded-full text-base has-data-[icon=inline-start]:pl-6"
            render={
              <a
                href={contact.whatsappLien}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle data-icon="inline-start" />
            {contact.whatsappLabel}
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            className="h-13 flex-1 rounded-full text-base has-data-[icon=inline-start]:pl-6"
            render={
              <a
                href={`mailto:${event.email}?subject=${encodeURIComponent(
                  contact.mailSubject
                )}`}
              />
            }
          >
            <Mail data-icon="inline-start" />
            Écrire au comité
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          La prochaine édition s&apos;annonce sur{" "}
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            {instagram.handle}
          </a>
          .
        </p>

        <Link
          href="/"
          className="mx-auto mt-8 flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-primary/10"
        >
          <ArrowLeft className="size-4" />
          Revenir à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
