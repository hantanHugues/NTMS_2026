/**
 * L'appel au classeur Google (Apps Script), partagé par l'inscription
 * et le paiement.
 *
 * DEUX PIÈGES, appris à l'usage :
 *   – Apps Script répond par une REDIRECTION qu'il faut suivre à la
 *     main, en GET propre : laissée à `fetch`, elle finit en 404 ;
 *   – quand quelque chose cloche côté Google (mauvais déploiement, page
 *     de connexion, panne), la réponse n'est pas du JSON mais une page
 *     HTML. On en extrait le texte, car c'est là que Google écrit la
 *     cause réelle.
 */

export type ReponseClasseur = {
  ok?: boolean;
  message?: string;
  reference?: string | null;
};

export async function appelerScript(
  url: string,
  corps: Record<string, string>
): Promise<ReponseClasseur> {
  const signal = AbortSignal.timeout(45000);
  const premier = await fetch(url, {
    method: "POST",
    // `text/plain` évite la requête préliminaire qu'Apps Script ne sait
    // pas traiter.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(corps),
    redirect: "manual",
    signal,
  });

  let reponse = premier;
  if (premier.status >= 300 && premier.status < 400) {
    const suite = premier.headers.get("location");
    if (!suite) throw new Error("Redirection d'Apps Script sans adresse.");
    reponse = await fetch(suite, { method: "GET", signal });
  }

  const texte = await reponse.text();
  try {
    return JSON.parse(texte) as ReponseClasseur;
  } catch {
    const lisible = texte
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    throw new Error(
      `Réponse non JSON d'Apps Script (HTTP ${reponse.status}) : ${lisible.slice(0, 600)}`
    );
  }
}

/**
 * Dépose une déclaration de paiement dans le classeur.
 *
 * La preuve voyage encodée dans le même envoi : Apps Script ne sait
 * pas lire un formulaire multipart, et c'est lui qui range le fichier
 * dans Drive, sous le compte propriétaire du classeur.
 */
export async function enregistrerPaiement(champs: Record<string, string>) {
  const url = process.env.INSCRIPTION_WEBAPP_URL;
  const secret = process.env.INSCRIPTION_SECRET;
  if (!url || !secret) throw new Error("Classeur non configuré.");
  return appelerScript(url, { ...champs, type: "paiement", _secret: secret });
}
