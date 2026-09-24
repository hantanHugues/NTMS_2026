import { notFound } from "next/navigation";

import { EcransEssai } from "./ecrans";

/**
 * PAGE D'ESSAI — LOCALE UNIQUEMENT.
 *
 * Elle montre les écrans du formulaire qu'on ne voit normalement qu'en
 * s'inscrivant pour de bon : l'attente pendant l'envoi, l'échec avec
 * ses contacts de secours, et l'écran de fin.
 *
 * `notFound()` la fait répondre 404 partout sauf en développement :
 * même déployée, l'adresse ne mène à rien. Le nom de dossier
 * « labo-9fk2 » n'est pas devinable, mais ce n'est pas lui qui protège
 * la page — c'est cette condition.
 *
 *   http://localhost:3000/labo-9fk2
 */
export default function PageLabo() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <EcransEssai />;
}
