/** Le moteur de l'affiche « J'y serai », copié du dossier generateur-affiche. */
declare const AfficheNTMS: {
  LARGEUR: number;
  HAUTEUR: number;
  charger(sources: {
    logo: string;
    motif: string;
    exemple?: string;
    polices?: { texte?: string; titre?: string };
  }): Promise<unknown>;
  dessiner(
    canvas: HTMLCanvasElement,
    donnees: {
      prenom?: string;
      nom?: string;
      role?: string;
      lc?: string;
      affiliation?: string;
      photo?: HTMLImageElement | null;
      jySerai?: "encreur" | "tampon" | "pied";
      cadrage?: { zoom?: number; x?: number; y?: number };
    },
    ressources: unknown
  ): void;
  image(src: string): Promise<HTMLImageElement>;
};
export default AfficheNTMS;
