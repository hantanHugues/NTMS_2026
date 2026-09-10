import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/site/section-heading";
import { programme } from "@/lib/content";

export function ProgrammeSection() {
  return (
    <section
      id="programme"
      className="scroll-mt-24 bg-card py-28 shadow-[inset_0_1px_0_0_var(--border),inset_0_-1px_0_0_var(--border)] sm:py-40"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          step="04"
          kicker="Le programme"
          title={
            <>
              Quatre jours,
              <br className="hidden sm:block" /> une{" "}
              <span className="text-gradient">progression</span>.
            </>
          }
          description={
            <>
              On regarde le marché en face, on outille, on met à l&apos;épreuve,
              puis on repart avec un cap. L&apos;ordre fait le travail.
            </>
          }
        />

        <Tabs defaultValue="j1" className="mt-16 gap-10">
          <TabsList className="h-auto w-fit flex-wrap rounded-2xl bg-background p-1.5 shadow-md">
            {programme.map((day) => (
              <TabsTrigger
                key={day.value}
                value={day.value}
                className="h-10 rounded-xl px-5 text-sm font-bold"
              >
                {day.day}
              </TabsTrigger>
            ))}
          </TabsList>

          {programme.map((day) => (
            <TabsContent key={day.value} value={day.value}>
              <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
                <div className="flex flex-col">
                  <h3 className="font-heading text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">
                    {day.title}
                  </h3>
                  <p className="mt-4 text-lg text-pretty text-muted-foreground">
                    {day.subtitle}
                  </p>
                  <span className="kicker mt-6 opacity-60">
                    {day.sessions.length} sessions
                  </span>
                </div>

                <ol className="flex flex-col gap-2.5">
                  {day.sessions.map((session) => (
                    <li
                      key={session.time}
                      className="group flex items-center gap-6 rounded-2xl bg-background px-6 py-5 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className="w-14 shrink-0 font-mono text-sm text-accent-text tabular-nums">
                        {session.time}
                      </span>
                      <span className="flex-1 leading-snug font-bold text-pretty">
                        {session.label}
                      </span>
                      <span className="kicker hidden shrink-0 opacity-45 sm:block">
                        {session.tag}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
