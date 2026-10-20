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
 * Conclusion : afficher l'IMAGE NUE des dernieres publications
 * demanderait l'API Graph de Meta, donc un jeton. On a renonce au
 * jeton : le site affiche les publications listees ci-dessous, par
 * l'iframe officielle DECOUPEE pour n'en garder que l'image. Ce sont de
 * vraies publications, dans le style du site. Elles ne se mettent pas
 * a jour toutes seules : pour en changer, modifier la liste.
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
  /** L'image nue, gardee ici (une video : sa couverture). */
  | { mode: "image"; url: string; image: string; video?: boolean }
  /** L'iframe officielle, decoupee sur l'image. */
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
  // LA GRILLE NE MONTRE QUE LE NTMS. Le compte publie aussi pour
  // EST'Co, une autre conference : ses publications n'ont rien a faire
  // sur ce site. Releve du 6 octobre 2026, de la plus recente a la
  // plus ancienne.
  { url: "https://www.instagram.com/p/Ddrv5m1DWPx/" },
  { url: "https://www.instagram.com/p/DdoJX3sDf1j/" },
  // UNE VIDEO. Son integration officielle pose une grande fleche
  // blanche et « Regarder sur Instagram » par-dessus l'image, et cette
  // surcouche est DANS l'iframe d'Instagram : aucun style de notre
  // cote ne peut l'atteindre. On garde donc l'image de couverture,
  // servie depuis `public`, avec notre propre repere de lecture.
  {
    url: "https://www.instagram.com/reel/DdSHHoRTcet/",
    image: "/instagram/reel-DdSHHoRTcet.jpg",
  },
];


export async function getInstagramPosts(
  limit = 6
): Promise<InstagramPost[]> {
  return REPLI.slice(0, limit).map((post) =>
    post.image
      ? { mode: "image" as const, url: post.url, image: post.image, video: true }
      : { mode: "embed" as const, url: post.url }
  );
}
