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

export default function Home() {
  return (
    <div id="top" className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <SkillMarquee />
        <Constat />
        <Solution />
        <Preuve />
        <PhotoStrip />
        <RegistrationCta />
        <InstagramSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
