# NTMS 2026 — site et inscriptions

Site du **National Training and Motivation Seminar 2026**, organisé par
AIESEC in Benin pour les **20 ans de l'organisation**.
Lokossa, 18 – 22 novembre 2026.

Le site fait trois choses : présenter l'édition, enregistrer les
inscriptions dans un classeur Google en envoyant un mail de
confirmation, et encaisser la place par mobile money.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

Next.js 16 (Turbopack) · React 19 · Tailwind CSS 4 · shadcn/ui (preset
nova, sur Base UI — pas Radix).

## Deux dépôts, deux déploiements

| | dépôt | site |
|---|---|---|
| test | `origin` → hantanHugues/NTMS_2026 | https://ntms-2026.vercel.app |
| production | `imbenin` → imbenin/ntms26 | https://ntms26.aiesec.bj |

Chaque Vercel **ne construit que les commits dont l'auteur est membre
de son compte**. Un commit signé `hugueshantan@gmail.com` est construit
par le test et ignoré par la production, et inversement pour
`imbenin@aiesec.net`. Pour livrer des deux côtés, on pousse le travail
sous une adresse, puis un commit vide sous l'autre :

```bash
git commit -m "…"                                    # auteur par defaut
git commit --allow-empty --author="imbenin <imbenin@aiesec.net>" -m "Declenchement du build de production"
git push origin main && git push imbenin main
```

## Structure

- `src/app/page.tsx` — l'ordre des sections de l'accueil
- `src/app/inscription/` — le formulaire, en trois étapes
- `src/app/paiement/` — la billetterie et la page de retour
- `src/app/api/` — les routes serveur : inscription, paiement, webhook
- `src/lib/content.ts` — **tout le texte du site**, un seul fichier
- `src/lib/inscription-regles.ts` — règles de validation **partagées**
  entre le navigateur et le serveur, et les trois phases de l'édition
- `src/lib/paiement.ts` — montant attendu, moyens et formats acceptes
- `src/lib/classeur.ts` — l'appel au script Google
- `src/components/site/` — une section = un composant
- `sheets/` — les scripts Apps Script et le mode d'emploi du classeur
- `public/photos/` — photos d'événements AIESEC in Benin

## Les trois phases de l'édition

Deux dates commandent tout le site. Une seule fonction, `phase()` dans
`inscription-regles.ts`, les traduit — l'en-tête, le hero et la carte
d'appel à l'action en découlent.

```
maintenant < FIN_INSCRIPTIONS                  → inscription (gratuite)
FIN_INSCRIPTIONS < maintenant < FIN_PAIEMENTS  → paiement
maintenant > FIN_PAIEMENTS                     → tout est clos
```

Une date illisible laisse le site **ouvert** : mieux vaut une
inscription de trop qu'une page fermée sur une faute de frappe.

## La chaîne d'inscription

```
formulaire → /api/inscription → Apps Script → onglet « inscriptions » + mail
                                           └→ classeur secondaire (facultatif)
```

Le navigateur ne parle jamais à Google directement : l'adresse du
script et le secret restent côté serveur, et les réponses sont
revalidées là-bas avec les mêmes règles que dans le formulaire.

Le mode d'emploi du classeur — onglets de configuration, pièces
jointes, envoi manuel, quotas — est dans [`sheets/README.md`](sheets/README.md).

## La chaîne de paiement

Le site **n'encaisse pas**. Aucun agrégateur disponible ne couvre tous
les opérateurs du pays — MTN et Celtiis manquaient à l'appel — alors
la personne paie par son moyen habituel, puis **déclare** son paiement
avec une preuve.

```
/paiement → /api/paiement/declarer → Apps Script
                                     ├→ preuve rangee dans Drive
                                     └→ ligne « a_verifier » dans l'onglet des paiements

              le comite verifie, ecrit « valide » dans la colonne statut
                                     ↓
              menu NTMS → « Envoyer les reçus aux paiements validés »
```

Trois points à ne pas défaire :

1. **Le site ne valide rien.** Il vérifie la forme — champs, format et
   poids du fichier — et transmet. La décision appartient au comité.
2. **La preuve est allégée dans le navigateur** avant l'envoi : une
   capture d'écran de téléphone pèse souvent 4 Mo, et la limite d'un
   envoi est de 3 Mo. Les PDF partent tels quels.
3. **Les reçus partent par lot**, aux paiements marqués `valide` qui
   n'en ont pas encore reçu. Pas de sélection ligne par ligne : on
   trie par la colonne.

Le contenu du reçu se règle dans l'onglet **`config recu`** du
classeur, avec les mêmes libellés que les autres mails. Variables
disponibles : `{{nom}}`, `{{reference}}`, `{{montant}}`, `{{moyen}}`.

Tant que `MONTANT_INSCRIPTION` n'est pas renseignée, `/paiement`
répond **404**.

## Variables d'environnement

Modèle complet dans `.env.example`. En local, `.env.local` (jamais
commité) ; en ligne, le tableau de bord de l'hébergeur.

**Inscriptions**

| variable | rôle |
|---|---|
| `INSCRIPTION_WEBAPP_URL` | adresse `/exec` du script Apps Script |
| `INSCRIPTION_SECRET` | secret partagé avec la propriété `SECRET` du script |
| `INSCRIPTION_MIROIR_URL` | facultatif — copie vers un second classeur |
| `INSCRIPTION_MIROIR_SECRET` | facultatif — si ce classeur a son propre secret |
| `INSCRIPTION_DEBUG` | `1` fait remonter le motif exact d'un refus. **Jamais en production.** |

**Paiement**

| variable | rôle |
|---|---|
| `MONTANT_INSCRIPTION` | montant attendu, en FCFA, affiché sur la page. Vide = `/paiement` répond 404. |

**Dates et liens** (insérés au moment du build : redéployer après
changement)

| variable | rôle |
|---|---|
| `NEXT_PUBLIC_DATE_NTMS` | cible du compte à rebours |
| `NEXT_PUBLIC_FIN_INSCRIPTIONS` | clôture du formulaire. Par défaut, la date ci-dessus. |
| `NEXT_PUBLIC_FIN_PAIEMENTS` | clôture de la billetterie |
| `NEXT_PUBLIC_LIEN_WHATSAPP` | invitation au groupe, affichée après l'inscription |
| `INSTAGRAM_TOKEN` | facultatif — sans lui, la section affiche les publications listées à la main dans `src/lib/instagram.ts` |

## Page d'essai

`/labo-9fk2` montre les écrans qu'on ne voit normalement qu'en
s'inscrivant pour de bon : l'attente pendant l'envoi, l'échec avec ses
contacts de secours, l'inscription enregistrée, les inscriptions
closes. Elle répond **404 hors développement**.

## À finir

- confirmer le nombre de places (180 est une valeur provisoire)
- remplir l'onglet `config recu` du classeur (objet et corps du reçu)
- supprimer les lignes de test des classeurs avant l'ouverture
