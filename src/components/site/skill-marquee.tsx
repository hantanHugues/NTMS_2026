import { skillTags } from "@/lib/content";

/**
 * Bandeau défilant des compétences. La liste est rendue deux fois et
 * l'animation translate de -50 %, donc la boucle est invisible.
 */
export function SkillMarquee() {
  return (
    <div className="relative flex overflow-hidden border-b border-border bg-background py-5">
      <div className="flex w-max animate-marquee items-center">
        {[...skillTags, ...skillTags].map((skill, i) => (
          <span
            key={`${skill}-${i}`}
            aria-hidden={i >= skillTags.length}
            className="flex items-center gap-8 px-8 text-sm font-medium tracking-wide whitespace-nowrap text-muted-foreground"
          >
            {skill}
            <span className="size-1 rounded-full bg-primary/50" />
          </span>
        ))}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent"
      />
    </div>
  );
}
