import type { Metadata } from "next";
import { Bricolage_Grotesque, Lato } from "next/font/google";
import "./globals.css";
import { FournisseurLangue } from "@/components/site/langue";
import { langueActive } from "@/lib/contenu";
import { pourLeClient } from "@/lib/langues";
import { cn } from "@/lib/utils";

// Lato est la police de la charte NTMS : elle porte tout le texte courant.
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

// Magic (police de titre de la charte) est sous licence usage personnel :
// Bricolage Grotesque la remplace pour l'affichage, en OFL.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Ce que montrent WhatsApp, Telegram ou les réseaux quand on colle le
 * lien du site : titre, phrase et image. Sans `metadataBase`, l'adresse
 * de l'image resterait relative et aucune application ne l'afficherait.
 *
 * Ces applications gardent l'aperçu en mémoire : après une mise à jour,
 * l'ancien peut encore s'afficher pendant plusieurs heures.
 */
const PARTAGE = {
  fr: {
    titre: "NTMS 2026 — Les 20 ans d'AIESEC in Benin",
    description:
      "National Training and Motivation Seminar, du 18 au 22 novembre 2026 à Lokossa. Cinq jours de formation et de rencontres pour les vingt ans d'AIESEC in Benin.",
    partage:
      "Du 18 au 22 novembre 2026 à Lokossa. Cinq jours de formation et de rencontres. Réserve ta place gratuitement.",
    locale: "fr_FR",
  },
  en: {
    titre: "NTMS 2026 — Twenty years of AIESEC in Benin",
    description:
      "National Training and Motivation Seminar, November 18 – 22, 2026 in Lokossa. Five days of training and encounters for twenty years of AIESEC in Benin.",
    partage:
      "November 18 – 22, 2026 in Lokossa. Five days of training and encounters. Book your seat for free.",
    locale: "en_US",
  },
};

/**
 * L'aperçu de partage suit la langue du lecteur, comme le reste du
 * site : c'est la même page, servie dans la langue de son navigateur.
 */
export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueActive();
  const t = PARTAGE[langue];
  return {
    metadataBase: new URL("https://ntms-2026.vercel.app"),
    title: t.titre,
    description: t.description,
    openGraph: {
      type: "website",
      locale: t.locale,
      siteName: "NTMS 2026",
      title: t.titre,
      description: t.partage,
      images: [{ url: "/partage.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * La racine est en thème CLAIR. Les sections sombres (header, hero,
 * programme, inscription, footer) portent elles-mêmes la classe `dark`,
 * ce qui redéfinit les tokens sur leur sous-arbre. C'est ce qui donne
 * l'alternance sombre / clair d'une section à l'autre.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // La langue est décidée ici, une fois : l'attribut `lang` de la page
  // en dépend — il commande la césure, la correction orthographique et
  // la prononciation des lecteurs d'écran — et les composants clients
  // reçoivent le même dictionnaire par le fournisseur.
  const langue = await langueActive();

  return (
    <html
      lang={langue}
      className={cn("h-full", lato.variable, bricolage.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <FournisseurLangue dictionnaire={pourLeClient(langue)}>
          {children}
        </FournisseurLangue>
      </body>
    </html>
  );
}
