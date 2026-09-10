# NTMS 2026 — page d'inscription

Landing page du **New Team Members Seminar 2026**, AIESEC in Benin.
Lokossa, 19 – 22 novembre 2026.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

Next.js 16 (Turbopack) · React 19 · Tailwind CSS 4 · shadcn/ui (preset nova, Base UI).

## Structure

- `src/app/page.tsx` — l'ordre des sections de la page
- `src/lib/content.ts` — **tout le texte du site**, un seul fichier
- `src/lib/instagram.ts` — d'où viennent les publications Instagram
- `src/components/site/` — une section = un composant
- `src/components/ui/` — composants shadcn/ui et ajouts
- `public/photos/` — photos d'événements AIESEC in Benin
- `public/brand/` — paterne de la charte, avatar Instagram

## Variables d'environnement

Une seule, facultative : `INSTAGRAM_TOKEN`. Voir `.env.example`.

Sans elle, la section Instagram affiche les publications listées dans
`src/lib/instagram.ts`. Avec elle, elle affiche les six dernières,
rafraîchies toutes les heures.

## À finir

- brancher l'URL réelle du formulaire (`cta.href` dans `content.ts`,
  actuellement l'ancre `#inscription`)
- confirmer le nombre de places (180 est une valeur provisoire)
- ajouter le numéro WhatsApp et le compte Instagram dans la section
  contact quand ils seront connus
