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

export const metadata: Metadata = {
  title: "NTMS 2026 — S'adapter, le nouveau métier",
  description:
    "Le séminaire des nouveaux membres d'AIESEC in Benin. Quatre jours pour construire l'adaptabilité que le marché de l'emploi réclame déjà.",
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
