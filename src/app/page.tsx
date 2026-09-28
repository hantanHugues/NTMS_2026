import { BackToTop } from "@/components/site/back-to-top";
import { Constat } from "@/components/site/constat";
import { ContactSection } from "@/components/site/contact-section";
import { Hero } from "@/components/site/hero";
import { InstagramSection } from "@/components/site/instagram-section";
import { PhotoStrip } from "@/components/site/photo-strip";
import { Preuve } from "@/components/site/preuve";
import { RegistrationCta } from "@/components/site/registration-cta";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SkillMarquee } from "@/components/site/skill-marquee";
import { Solution } from "@/components/site/solution";
import { phase } from "@/lib/inscription-regles";

/**
 * Reconstruite au plus toutes les cinq minutes.
 *
 * L'accueil change d'aspect au passage des dates de clôture — le
 * bouton passe de « Je m'inscris » à « Je paie ma place ». Une page
 * figée au moment du build garderait l'ancien bouton indéfiniment ;
 * une page recalculée à chaque visite coûterait cher pour rien.
 */
export const revalidate = 300;

export default function Home() {
  const etape = phase();
  return (
    <div id="top" className="flex min-h-full flex-col">
      <SiteHeader phase={etape} />
      <main className="flex-1">
        <Hero phase={etape} />
        <SkillMarquee />
        <Constat />
        <Solution />
        <Preuve />
        <PhotoStrip />
        <RegistrationCta phase={etape} />
        <InstagramSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
