import { cn } from "@/lib/utils";

/**
 * En-tête de section commun à toute la page.
 *
 * Le kicker porte la couleur d'accent — c'est là qu'elle se voit le plus
 * sur une page où les fonds restent sobres. Le numéro d'étape donne le
 * repère de progression d'une section à l'autre.
 */
export function SectionHeading({
  step,
  kicker,
  title,
  description,
  align = "left",
  className,
}: {
  step: string;
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "mx-auto max-w-3xl items-center text-center" : "",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="kicker tabular-nums opacity-60">{step}</span>
        <span className="h-px w-6 bg-primary/50" />
        <span className="kicker">{kicker}</span>
      </div>

      <h2 className="font-heading mt-6 text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {title}
      </h2>

      {description ? (
        <p
          className={cn(
            "mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
