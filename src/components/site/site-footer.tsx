import { Mail } from "lucide-react";
import { event, navItems } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="dark relative isolate overflow-hidden bg-background text-foreground">
      {/* AIESEC en filigrane. Petit et pose bas : le nom de
          l'organisation signe la page sans venir concurrencer celui de
          l'evenement, qui ouvre le pied de page en grand. */}
      <span
        aria-hidden
        className="font-heading pointer-events-none absolute right-6 -bottom-3 text-6xl font-extrabold tracking-tight opacity-[0.06] select-none sm:text-7xl"
      >
        AIESEC
      </span>

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <span className="font-heading text-2xl font-extrabold tracking-tight">
              {event.name}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {event.baseline} — {event.organisation}. Vingt ans d'AIESEC in Benin,
              et cinq jours pour élever nos standards.
            </p>
            <a
              href={`mailto:${event.email}`}
              className="mt-2 flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              <Mail className="size-4 text-primary" />
              {event.email}
            </a>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-20">
            <div className="flex flex-col gap-4">
              <span className="kicker opacity-70">Navigation</span>
              <nav className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <span className="kicker opacity-70">L&apos;édition</span>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <span>{event.dates}</span>
                <span>{event.city}</span>
                <span>{event.seats} places</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border/40 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {/* Annee figee sur celle de l'edition : `new Date()` s'evalue
                cote serveur ET cote client, et les deux peuvent tomber de
                part et d'autre du 31 decembre selon le fuseau — c'est une
                erreur d'hydratation en puissance. */}
            © {new Date(event.startsAt).getFullYear()} {event.organisation}
          </p>
          <p className="max-w-md text-xs text-muted-foreground sm:text-right">
            {event.theme}
          </p>
        </div>
      </div>
    </footer>
  );
}
