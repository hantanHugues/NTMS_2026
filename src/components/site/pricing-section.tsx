import { PricingPacks } from "@/components/site/pricing-packs";
import { contenu } from "@/lib/contenu";
import { paiementsOuverts } from "@/lib/inscription-regles";

/**
 * LA SECTION « CHOISIS TON PACK », juste avant l'appel a l'action : on
 * voit ce que chaque pack comprend et ce qu'il coute AVANT de
 * s'inscrire ou de payer.
 *
 * Elle disparait avec la page de paiement : une fois les paiements
 * clos, montrer des prix n'a plus de sens.
 */
export async function PricingSection() {
  if (!paiementsOuverts()) return null;
  const { pricing, paiement } = await contenu();


  return (
    <section
      id="packs"
      className="scroll-mt-24 bg-background px-6 py-24 max-sm:px-4 max-sm:py-14 sm:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <PricingPacks
          textes={{
            titre: pricing.titre,
            titreAccent: pricing.titreAccent,
            lead: pricing.lead,
            question: pricing.question,
            delegate: pricing.delegate,
            alumni: pricing.alumni,
            lesPacks: pricing.lesPacks,
            compris: pricing.compris,
            devise: pricing.devise,
            bouton: pricing.bouton,
            note: pricing.note,
          }}
          locale={paiement.locale}
        />
      </div>
    </section>
  );
}
