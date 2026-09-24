/**
 * Les publications du compte Instagram.
 *
 * CE QUI A ETE VERIFIE, pour ne pas refaire le tour :
 *
 *   - la page publique du profil repond 200 et 627 Ko, mais son HTML
 *     ne contient AUCUNE publication : tout est monte en JavaScript.
 *     Un `fetch` cote serveur n'en tire rien ;
 *   - la page d'integration d'une publication (`/p/<code>/embed/`) est
 *     bien servie telle quelle, mais les deux seules images qu'elle
 *     porte en clair sont l'avatar (160x160) et un logo (144x74) —
 *     l'image du poste, elle aussi, arrive par JavaScript ;
 *   - l'iframe officielle affiche la vraie publication, mais avec sa
 *     barre « j'aime / commenter / partager », dont on ne veut pas.
 *
 * Conclusion : afficher l'IMAGE NUE des dernieres publications passe
 * obligatoirement par l'API Graph, donc par un jeton.
 *
 *   1. AVEC `INSTAGRAM_TOKEN` — les six dernieres publications, image
 *      et lien, remises a jour toutes les heures. Rien d'autre a
 *      changer : la section est deja ecrite pour ca.
 *
 *   2. SANS jeton — les publications listees ci-dessous, affichees par
 *      l'iframe officielle mais DECOUPEE pour n'en garder que l'image.
 *      Ce sont donc de vraies publications, dans le style du site.
 *      Elles ne se mettent pas a jour toutes seules.
 *
 * Le decoupage repose sur une geometrie mesuree sur les six
 * publications, a deux largeurs : la page d'integration fait toujours
 * `largeur + 208` de haut, l'image commence a 54 px et occupe un carre
 * exact. En-tete 54, image, barre d'actions 154. Ces valeurs sont
 * exportees plus bas — si Instagram change sa mise en page, c'est le
 * seul endroit a corriger.
 */

const COMPTE = "beninnationalconference";

export const instagramProfil = `https://www.instagram.com/${COMPTE}`;

/** Geometrie de la page d'integration, mesuree. */
export const EMBED = {
  enTete: 54,
  barre: 154,
  /** Largeur minimale imposee par le lecteur d'Instagram. */
  largeurMin: 326,
};

export type InstagramPost =
  /** L'image nue : servie par Instagram (avec jeton), ou gardee ici. */
  | { mode: "image"; url: string; image: string; video?: boolean }
  /** Sans jeton : l'iframe officielle, decoupee sur l'image. */
  | { mode: "embed"; url: string };

/**
 * Publications relevees sur le profil public le 24 septembre 2026, de
 * la plus recente a la plus ancienne.
 *
 * COMMENT LES REFAIRE — le HTML brut du profil ne contient rien, mais
 * un vrai navigateur, lui, monte la grille. Ouvrir le profil dans
 * Chromium (Playwright), fermer la fenetre de connexion, defiler d'un
 * ecran, puis relever les `a[href]` en `/p/<code>/` et `/reel/<code>/`
 * dans l'ordre de la page. Le prefixe du compte est a retirer : c'est
 * l'adresse courte qui s'integre.
 */
const REPLI: { url: string; image?: string }[] = [
  { url: "https://www.instagram.com/p/DdoJX3sDf1j/" },
  // UNE VIDEO. Son integration officielle pose une grande fleche
  // blanche et « Regarder sur Instagram » par-dessus l'image, et cette
  // surcouche est DANS l'iframe d'Instagram : aucun style de notre cote
  // ne peut l'atteindre. On garde donc l'image de couverture, relevee
  // sur cette page d'integration et servie depuis `public` (les
  // adresses du CDN d'Instagram sont signees et expirent), avec notre
  // propre repere de lecture, discret.
  {
    url: "https://www.instagram.com/reel/DdSHHoRTcet/",
    image: "/instagram/reel-DdSHHoRTcet.jpg",
  },
  { url: "https://www.instagram.com/p/DbdUnstNia8/" },
  { url: "https://www.instagram.com/p/DbbmNHktX6K/" },
  { url: "https://www.instagram.com/p/DbYuQCYtnyl/" },
  { url: "https://www.instagram.com/p/DbTlKdaDblq/" },
];

type MediaGraph = {
  permalink?: string;
  media_url?: string;
  thumbnail_url?: string;
  media_type?: string;
};

export async function getInstagramPosts(
  limit = 6
): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_TOKEN;

  const repli: InstagramPost[] = REPLI.slice(0, limit).map((post) =>
    post.image
      ? { mode: "image" as const, url: post.url, image: post.image, video: true }
      : { mode: "embed" as const, url: post.url }
  );

  if (!token) return repli;

  try {
    const reponse = await fetch(
      "https://graph.instagram.com/me/media" +
        "?fields=permalink,media_url,thumbnail_url,media_type" +
        `&limit=${limit}&access_token=${token}`,
      // Une heure de cache : la page reste statique, et une nouvelle
      // publication remonte d'elle-meme au passage suivant.
      { next: { revalidate: 3600 } }
    );
    if (!reponse.ok) return repli;

    const charge = (await reponse.json()) as { data?: MediaGraph[] };
    const posts: InstagramPost[] = (charge.data ?? [])
      .map((media) => ({
        mode: "image" as const,
        url: media.permalink ?? instagramProfil,
        // Une video n'a pas d'image : c'est `thumbnail_url` qui la porte.
        image: media.thumbnail_url ?? media.media_url ?? "",
        // Meme repere de lecture que dans la liste tenue a la main.
        video: media.media_type === "VIDEO" || media.media_type === "REELS",
      }))
      .filter((post) => post.image !== "")
      .slice(0, limit);

    return posts.length > 0 ? posts : repli;
  } catch {
    // Le compte Instagram ne doit jamais faire tomber la page.
    return repli;
  }
}
