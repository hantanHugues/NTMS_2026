import type { Metadata } from "next";
import { Bricolage_Grotesque, Lato } from "next/font/google";
import "./globals.css";
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
export const metadata: Metadata = {
  metadataBase: new URL("https://ntms-2026.vercel.app"),
  title: "NTMS 2026 — Les 20 ans d'AIESEC in Benin",
  description:
    "National Training and Motivation Seminar, du 18 au 22 novembre 2026 à Lokossa. Cinq jours de formation et de rencontres pour les vingt ans d'AIESEC in Benin.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "NTMS 2026",
    title: "NTMS 2026 — Les 20 ans d'AIESEC in Benin",
    description:
      "Du 18 au 22 novembre 2026 à Lokossa. Cinq jours de formation et de rencontres. Réserve ta place gratuitement.",
    images: [{ url: "/partage.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

/**
 * La racine est en thème CLAIR. Les sections sombres (header, hero,
 * programme, inscription, footer) portent elles-mêmes la classe `dark`,
 * ce qui redéfinit les tokens sur leur sous-arbre. C'est ce qui donne
 * l'alternance sombre / clair d'une section à l'autre.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={cn("h-full", lato.variable, bricolage.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
