"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { contact, event } from "@/lib/content";

/**
 * Le bouton qui ouvre un message déjà adressé et déjà intitulé.
 *
 * La destination dépend de l'appareil :
 *
 *   TÉLÉPHONE — `mailto:`, qui ouvre l'application de courrier
 *   installée : Gmail, Mail d'Apple, Outlook, celle que la personne
 *   utilise vraiment. C'est le geste attendu sur mobile, et le compte
 *   est déjà connecté.
 *
 *   ORDINATEUR — la fenêtre de rédaction Gmail, dans un onglet. Un
 *   `mailto:` y réveille le logiciel de courrier de la machine, donc
 *   sort du navigateur, souvent sur un compte que personne n'utilise.
 *
 * Le rendu serveur part sur la version Gmail : c'est le cas le plus
 * sûr, et l'effet corrige au montage si l'écran est petit. La requête
 * média est écoutée, un pivotement d'appareil est donc pris en compte.
 */

const GMAIL =
  "https://mail.google.com/mail/?view=cm&fs=1" +
  `&to=${encodeURIComponent(event.email)}` +
  `&su=${encodeURIComponent(contact.mailSubject)}`;

const MAILTO = `mailto:${event.email}?subject=${encodeURIComponent(
  contact.mailSubject
)}`;

export function ContactButton() {
  const [surTelephone, setSurTelephone] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const suivre = () => setSurTelephone(media.matches);
    suivre();
    media.addEventListener("change", suivre);
    return () => media.removeEventListener("change", suivre);
  }, []);

  return (
    <Button
      nativeButton={false}
      size="lg"
      className="mt-7 h-12 w-full rounded-full text-base"
      render={
        surTelephone ? (
          <a href={MAILTO} />
        ) : (
          <a href={GMAIL} target="_blank" rel="noopener noreferrer" />
        )
      }
    >
      {contact.buttonLabel}
      <ArrowUpRight data-icon="inline-end" />
    </Button>
  );
}
