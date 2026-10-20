import { NextResponse } from "next/server";

import { situationPaiement } from "@/lib/classeur";

/**
 * Les packs et leurs prix, pour la section « Choisis ton pack » de
 * l'accueil.
 *
 * Mis en cache cinq minutes par le CDN (puis servis perimes pendant
 * qu'ils se rafraichissent) : la page d'accueil n'attend jamais le
 * classeur, et un prix change dans l'onglet « packs » en cinq minutes.
 * Une erreur n'est PAS mise en cache.
 */
export async function GET() {
  try {
    // Sans e-mail ni numero : le classeur ne renvoie que les packs.
    const { packs } = await situationPaiement("", "");
    return NextResponse.json(
      { packs: packs.map(({ nom, prix }) => ({ nom, prix })) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("Packs illisibles :", err);
    return NextResponse.json(
      { packs: [] },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
