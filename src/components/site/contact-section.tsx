import { Mail } from "lucide-react";
import { ContactButton } from "@/components/site/contact-button";
import { Reveal } from "@/components/site/reveal";
import { contact, event } from "@/lib/content";

/**
 * Contact.
 *
 * Deux colonnes : le texte à gauche, une carte de contact à droite.
 * Une première version centrait un titre au-dessus d'une petite
 * pastille de courriel — trois éléments dans une section de 500 px,
 * la page semblait s'être arrêtée.
 *
 * La carte porte l'adresse ET la liste des sujets sur lesquels le
 * comité répond. Cette liste fait deux choses : elle remplit la
 * colonne, et elle dit au lecteur qu'il a le droit de poser CES
 * questions-là — ce sont exactement celles que la page n'a pas
 * traitées (tarifs, trajet, hébergement).
 *
 * Un seul canal affiché, l'adresse du comité : le numéro WhatsApp et
 * le compte Instagram ne sont pas encore connus.
 *
 * Le bouton ouvre un message DÉJÀ ADRESSÉ et DÉJÀ INTITULÉ, dans un
 * nouvel onglet. Seul le corps reste vide — c'est au lecteur d'écrire
 * sa question, un texte pré-tapé serait à effacer avant de commencer.
 *
 * La destination du bouton dépend de l'appareil — voir
 * `contact-button.tsx`.
 *
 * L'adresse reste affichée en clair au-dessus, pour qui ne passe pas
 * par Gmail.
 */

export function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-24 border-t border-border bg-card py-20 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
        <Reveal>
          <p className="kicker text-muted-foreground">{contact.kicker}</p>

          <h2 className="font-heading mt-5 text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            <span className="block">{contact.title}</span>
            <span className="block text-accent-text">
              {contact.titleAccent}
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-pretty text-muted-foreground">
            {contact.lead}
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-3xl bg-background p-8 shadow-md sm:p-9">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Mail className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs tracking-wider text-muted-foreground">
                  {contact.mailLabel}
                </span>
                <span className="font-heading block text-xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere] max-sm:text-lg sm:text-2xl">
                  {/* Coupure permise juste après « @ » : sur petit écran,
                      l'adresse passe à la ligne là, pas au milieu d'un mot. */}
                  {event.email.split("@")[0]}@<wbr />
                  {event.email.split("@")[1]}
                </span>
              </span>
            </div>

            <ContactButton />

            <p className="mt-8 border-t border-border pt-8 text-xs tracking-wider text-muted-foreground uppercase">
              {contact.topicsLabel}
            </p>

            <ul className="mt-4 flex flex-col gap-3">
              {contact.topics.map((topic) => (
                <li key={topic} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
