import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/section-heading";
import { faq } from "@/lib/content";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 bg-background py-28 sm:py-40">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          step="05"
          kicker="FAQ"
          title={
            <>
              Ce qu&apos;on nous demande
              <br className="hidden sm:block" /> le plus.
            </>
          }
          align="center"
        />

        <Accordion
          multiple={false}
          className="mt-16 gap-3 rounded-3xl bg-card p-4 shadow-md sm:p-6"
        >
          {faq.map((item) => (
            <AccordionItem
              key={item.value}
              value={item.value}
              className="rounded-2xl px-5 transition-colors duration-300 not-last:border-b-0 hover:bg-background/60"
            >
              <AccordionTrigger className="py-6 text-left text-lg font-bold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 leading-relaxed text-pretty text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
