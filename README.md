# NTMS 2026 — site, inscriptions et paiements

Site du **National Training and Motivation Seminar 2026**, organisé par
AIESEC in Benin pour les **20 ans de l'organisation**.
Lokossa, 18 – 22 novembre 2026.

Le site fait trois choses : présenter l'édition, enregistrer les
inscriptions dans un classeur Google (avec un mail de confirmation), et
recevoir les **déclarations de paiement** des packs. Il n'encaisse rien
lui-même.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

**Node 20.9 ou plus récent est obligatoire** (Next.js 16). Avec une
version plus ancienne, `next dev` refuse de démarrer.

Next.js 16 (Turbopack) · React 19 · Tailwind CSS 4 · shadcn/ui (preset
nova, sur Base UI — pas Radix). Aucune bibliothèque d'animation : les
effets sont en CSS.

## Deux dépôts, deux déploiements

| | dépôt | site |
|---|---|---|
| test | `origin` → hantanHugues/NTMS_2026 | https://ntms-2026.vercel.app |
| production | `imbenin` → imbenin/ntms26 | https://ntms26.aiesec.bj |

Chaque Vercel **ne construit que les commits dont l'auteur est membre
de son compte**. Un commit signé `hugueshantan@gmail.com` est construit
par le test et ignoré par la production, et inversement pour
`imbenin@aiesec.net`. Dans ce dépôt, l'identité locale est
`hantanhugues <hugueshantan@gmail.com>`. Pour livrer des deux côtés, on
pousse le travail sous une adresse, puis un commit vide sous l'autre :

```bash
git commit -m "…"                                    # auteur par defaut
git commit --allow-empty --author="imbenin <imbenin@aiesec.net>" -m "Declenchement du build de production"
git push origin main && git push imbenin main
```

Le dépôt de production n'est pas configuré dans toutes les copies : le
remote `imbenin` est à ajouter au besoin.

## Structure

- `src/app/page.tsx` — l'ordre des sections de l'accueil
- `src/app/inscription/` — le formulaire d'inscription, en trois étapes
- `src/app/paiement/` — le formulaire de déclaration de paiement
- `src/app/affiche/` — la création de l'affiche « J'y serai »
- `src/app/api/` — routes serveur : `inscription`, `paiement/situation`,
  `paiement/declarer`, `packs`
- `src/lib/content.ts`, `content-en.ts` — **tout le texte du site**, en
  français et en anglais
- `src/lib/dates.ts` — **les trois dates** (voir plus bas)
- `src/lib/inscription-regles.ts` — validation **partagée** navigateur /
  serveur, et les phases de l'édition
- `src/lib/paiement.ts` — moyens et formats acceptés, fuseau, lecture
  d'une ligne de l'onglet `packs`
- `src/lib/classeur.ts` — les appels au script Google
- `src/components/site/` — une section = un composant
- `sheets/` — les scripts Apps Script et le mode d'emploi du classeur
- `public/photos/`, `public/affiche/` — photos, exemple d'affiche

## Les dates : un fichier, pas des variables

`src/lib/dates.ts` contient les trois dates du site. On les écrit à la
main, on commite, on pousse : le site se redéploie tout seul.

| date | effet |
|---|---|
| `evenement` | cible du compte à rebours |
| `finInscriptions` | après elle, le formulaire d'inscription se ferme |
| `finPaiements` | après elle, la page de paiement se ferme |

Une date illisible laisse le site **ouvert** : mieux vaut une
inscription de trop qu'une page fermée sur une faute de frappe.

## L'accueil

Le hero porte **deux boutons de même poids** — « Je m'inscris » (orange)
et « Je paie ma place » (crème) — et un petit lien vers l'affiche. Ils
font défiler vers la section qui leur correspond. Chaque action
disparaît à sa propre date ; quand plus rien n'est ouvert, il reste
« Contactez-nous ».

Dans l'ordre : **inscription** (carte à deux parties, date limite, aucun
mot sur le prix), **« Choisis ton pack »** (l'appel à l'action du
paiement), **affiche**, Instagram, contact. La section des packs
disparaît quand les paiements sont clos ; celle de l'inscription,
quand le paiement reste ouvert après la fin des inscriptions.

## La chaîne d'inscription

```
formulaire → /api/inscription → Apps Script → onglet « inscriptions » + mail
                                           └→ classeur secondaire (facultatif)
```

Le navigateur ne parle jamais à Google directement : l'adresse du
script et le secret restent côté serveur. Le mode d'emploi du classeur
— onglets de configuration, pièces jointes, envoi manuel, quotas — est
dans [`sheets/README.md`](sheets/README.md).

## Les packs : tout est dans l'onglet `packs`

Le site ne contient **ni prix ni description de pack**. L'onglet `packs`
du classeur a trois colonnes (la ligne 1 est l'en-tête) :

| A — nom | B — prix | C — description |
|---|---|---|
| `Delegate - Package 3` | `65000` | `5 jours obligatoires, Chambre seule, T-shirt spécialisé, Restauration` |
| `Alumni - Package 1` | `25000` | `Gala, 1 nuit, T-shirt spécialisé` |

- **Catégorie** : `Alumni` ou `Delegate`, au début du nom. La personne
  choisit la sienne dans le formulaire et ne voit que ses packs. Sans
  catégorie, le pack est proposé à tout le monde.
- **Nom** : ce qui s'affiche en titre de la carte (« Package 3 »).
- **Prix** : un nombre seul, en FCFA.
- **Description** (facultative) : chaque élément, séparé par une
  virgule, un point-virgule ou un retour à la ligne, devient un point à
  coche. Elle ne se traduit pas.
- Le nom de la colonne A est ce qui s'enregistre dans la colonne `pack`
  de l'onglet des paiements : **chaque nom est unique**. Le tiret qui
  sépare catégorie et nom a un espace de chaque côté.
- L'ordre de l'onglet est l'ordre d'affichage. Le site relit l'onglet
  toutes les cinq minutes au plus (`/api/packs`, mise en cache).
- Avant la mise à jour du script, la description peut encore s'écrire
  dans le nom (`Delegate - Package 3 - Chambre seule, Restauration`) : le
  site accepte les deux formes, la colonne C l'emporte.

Le mode d'emploi à coller dans l'onglet `lisez-moi` du classeur est
[`sheets/lisez-moi.txt`](sheets/lisez-moi.txt).

## La chaîne de paiement

Le site **n'encaisse pas**. Aucun agrégateur disponible ne couvre tous
les opérateurs du pays — MTN et Celtiis manquaient à l'appel — alors
la personne **paie d'abord** par son moyen habituel, puis **notifie son
paiement** sur le site, avec une preuve.

```
/paiement → /api/paiement/situation   « qui es-tu ? » (e-mail + numéro)
          → /api/paiement/declarer → Apps Script
                                     ├→ preuve rangée dans Drive
                                     └→ ligne « a_verifier » dans l'onglet des paiements

              le comité vérifie, écrit « valide » ou « refuse » dans la colonne statut
                                     ↓
              menu NTMS → « Envoyer les mails de paiement (validés et refusés) »
```

**Le parcours de la personne**

1. Elle donne son e-mail et son numéro, puis **Continue**. La
   combinaison e-mail + numéro est son identité : une autre est
   refusée, avec les contacts du comité.
2. **Nouvelle** : son nom, puis Alumni ou Delegate, puis un pack parmi
   des cartes qui montrent prix et contenu. **De retour** : le site la
   reconnaît, rappelle son pack, ce qui est validé et ce qui reste.
3. Elle **saisit elle-même le montant** : il n'est jamais pré-rempli.
4. Elle choisit le moyen, la date, joint la preuve, envoie.
5. Un pack **soldé**, ou déjà couvert par des paiements en attente, ne
   se redéclare pas.

**Trois points à ne pas défaire**

1. **Le site ne valide rien.** Il vérifie la forme — champs, format et
   poids du fichier — et transmet. La décision appartient au comité.
2. **La preuve est allégée dans le navigateur** avant l'envoi : une
   capture d'écran de téléphone pèse souvent 4 Mo, et la limite d'un
   envoi est de 3 Mo. Les PDF partent tels quels.
3. **Les mails partent par lot**, aux paiements marqués `valide` ou
   `refuse` qui n'en ont pas encore reçu. Pas de sélection ligne par
   ligne : on trie par la colonne.

**Les onglets du classeur** (créés par **NTMS → Initialiser les
onglets**) : `inscriptions`, `payement` (une ligne par paiement, colonne
`statut` en liste déroulante), `participants` (une ligne par personne :
total validé, reste à payer, statut), `packs`, `config recu`.

**Le mail de paiement** se règle dans `config recu`, en trois colonnes :
B paiement validé (il reste un solde), C paiement non validé, D pack
soldé (le bouton de D est celui du groupe WhatsApp). Variables : `{{nom}}`,
`{{reference}}`, `{{pack}}`, `{{moyen}}`, `{{tranche}}`, `{{montant_du}}`,
`{{facture}}` (paiement actuel, total payé, reste à payer), `{{paiement_actuel}}`,
`{{total_paye}}`, `{{reste}}`. Le menu NTMS propose trois aperçus, un
par cas, qui t'arrivent à toi.

## Variables d'environnement

Modèle complet dans `.env.example`. En local, `.env.local` (jamais
commité) ; en ligne, le tableau de bord de l'hébergeur. **Après tout
changement, redéployer** : les liens WhatsApp sont insérés au build.

| variable | rôle |
|---|---|
| `INSCRIPTION_WEBAPP_URL` | adresse `/exec` du script Apps Script |
| `INSCRIPTION_SECRET` | secret partagé avec la propriété `SECRET` du script |
| `INSCRIPTION_MIROIR_URL` | facultatif — copie des inscriptions vers un second classeur |
| `INSCRIPTION_MIROIR_SECRET` | facultatif — si ce classeur a son propre secret |
| `NEXT_PUBLIC_LIEN_WHATSAPP` | groupe affiché après l'inscription |
| `NEXT_PUBLIC_LIEN_WHATSAPP_PAIEMENT` | groupe affiché après une déclaration de paiement |

Sans les liens WhatsApp, le bouton correspondant n'apparaît pas. Les
dates, les prix, les catégories et les descriptions des packs ne sont
**pas** des variables (voir plus haut).

## Page d'essai

`/labo-9fk2` montre les écrans qu'on ne voit normalement qu'en
s'inscrivant pour de bon : l'attente pendant l'envoi, l'échec avec ses
contacts de secours, l'inscription enregistrée, les inscriptions
closes. Elle répond **404 hors développement**.

## À finir

- confirmer le nombre de places (180 est une valeur provisoire)
- vérifier le texte des trois colonnes de `config recu`
- vérifier les noms de l'onglet `packs` (catégorie, nom, description)
- supprimer les lignes de test des classeurs avant l'ouverture
