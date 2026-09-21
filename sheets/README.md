# Base d'inscription NTMS 2026

Le classeur maître fait deux choses, et seulement deux : **garder la
liste des inscrits** et **leur envoyer des mails**.

Deux mails existent, chacun avec son onglet de réglage :

| mail | onglet | quand il part |
|---|---|---|
| **automatique** | `config auto` | tout seul, à chaque inscription |
| **manuel** | `config manuel` | seulement en cliquant dans le menu **NTMS** |

Le contenu de `config auto` se change selon la période : c'est toujours
ce mail-là que le site fait partir. L'ancien nom d'onglet `config` reste
accepté pour l'automatique.

| fichier | rôle |
|---|---|
| `ntms-2026-base.xlsx` | le classeur à importer : `inscriptions`, `config auto`, `config manuel`, `lisez-moi` |
| `inscription.gs` | le script à coller dans ce classeur |
| `README.md` | ce document |

---

## Ce qui circule, et qui le voit

```
visiteur ──► /inscription (site) ──► /api/inscription (serveur du site)
                                           │  + secret partagé
                                           ▼
                                   script Apps Script ──► onglet inscriptions
                                           │
                                           └──► mail à l'inscrit (config)
```

- Le navigateur du visiteur ne connaît **que le site**.
- L'adresse du script et le secret vivent dans des variables
  **serveur** ; ils n'apparaissent jamais dans la page.
- Le script **refuse** tout appel qui ne porte pas le secret : connaître
  l'adresse `/exec` ne suffit pas à remplir la feuille ni à faire
  envoyer des mails.

---

## Le secret partagé

Il doit être **identique** à deux endroits :

| où | quoi |
|---|---|
| Apps Script → Paramètres du projet → **Propriétés du script** | propriété `SECRET` |
| `.env.local` du site | `INSCRIPTION_SECRET=…` |

Le secret n'est **jamais** écrit dans `inscription.gs` : ce fichier est
public sur GitHub. Pour créer la propriété : Apps Script → roue dentée
**Paramètres du projet** → tout en bas, **Propriétés du script** →
**Ajouter une propriété** → nom `SECRET`, valeur = celle de
`INSCRIPTION_SECRET` dans `.env.local` → **Enregistrer**.

Si tu en changes un, change l'autre — sinon **toutes** les inscriptions
échouent.

---

## Procédure complète, dans l'ordre

### A. Préparer le classeur

**Si tu pars de zéro** : Drive → **Nouveau → Importer un fichier** →
`ntms-2026-base.xlsx`, puis clic droit → **Ouvrir avec → Google
Sheets**, et **Fichier → Enregistrer au format Google Sheets**.

**Si ton classeur existe déjà**, vérifie trois choses avant d'importer :

1. **L'en-tête de l'onglet `inscriptions`** doit être exactement,
   de A à Z :

   ```
   horodatage reference nom prenom email whatsapp sexe profil niveau
   role lc pays source chambre allergie allergie_detail restauration
   consentement_groupe consentement_photos mail_envoye mail_envoye_le
   erreur_mail id_envoi mail_manuel mail_manuel_le erreur_mail_manuel
   ```

   Le plus simple : **vider entièrement l'onglet, en-tête compris**. Le
   script repose le bon en-tête à la première inscription.

   Le script vérifie l'en-tête avant d'écrire. S'il ne correspond pas,
   l'inscription est **refusée** (le site affiche un échec, et le
   journal du serveur indique la colonne fautive) au lieu d'être écrite
   de travers.

2. **S'il existe déjà un onglet `config` ou `config auto`**, supprime-le
   avant l'import. Sinon Google crée « config auto 1 », et le script
   continue de lire l'ancien.

3. **L'onglet des inscrits doit s'appeler `inscriptions`** — c'est ce
   que dit « Nom feuille (BD) » dans `config auto`. S'ils ne correspondent
   pas, le script crée un nouvel onglet et tes inscrits se retrouvent
   répartis sur deux feuilles.

Puis : **Fichier → Importer → Importer** → `ntms-2026-base.xlsx` →
**« Insérer une ou plusieurs nouvelles feuilles »**. Supprime ensuite
le doublon d'onglet `inscriptions` que l'import aura créé.

### B. Mettre à jour le script

1. **Extensions → Apps Script**
2. Remplacer **tout** le contenu de `Code.gs` par `inscription.gs`
3. **Enregistrer** (`Ctrl + S`) — le bandeau « Unsaved changes » doit
   disparaître
4. **Paramètres du projet** (roue dentée à gauche) → vérifier que
   **« Activer l'environnement d'exécution Chrome V8 »** est coché

### C. Autoriser l'envoi de mail et vérifier le rendu

Pas besoin de déployer pour cette étape : l'éditeur exécute le code
enregistré.

1. Dans la liste des fonctions en haut, choisir **`testerLeMail`**
2. **Run**
3. Google demande une nouvelle autorisation — le script envoie
   maintenant des mails. **Review permissions** → ton compte →
   **Advanced → Go to … (unsafe) → Allow**
4. Ouvrir ta boîte : un message **« [TEST] … »** doit être arrivé, avec
   titre, corps, bouton WhatsApp et référence `NTMS-TEST`

Si l'exécution échoue avec « Onglet config incomplet », remplir
**Objet** et **Corps**.

### D. Déployer

C'est l'étape qu'on oublie. Sans elle, le site continue d'appeler
l'**ancien** code.

**Premier déploiement** (tu pars de zéro) :

1. **Deploy → New deployment**
2. Roue dentée à gauche de « Select type » → **Web app**
3. **Execute as : Me** · **Who has access : Anyone**
   (surtout pas « Anyone with Google account »)
4. **Deploy**, copier l'adresse qui finit par **`/exec`**
5. La coller dans `.env.local` : `INSCRIPTION_WEBAPP_URL=…`

**Déploiement existant** (ton cas actuel) :

1. **Deploy → Manage deployments**
2. Vérifier que l'identifiant du déploiement correspond à celui de
   l'adresse `/exec` du site
3. Crayon ✏️ → **Version : New version** → **Deploy**

L'adresse `/exec` **ne change pas**.

**Contrôle** : ouvrir l'adresse `/exec` dans un navigateur.

| ce que tu vois | ce que ça veut dire |
|---|---|
| `{"ok":true,"message":"Service d'inscription NTMS 2026 actif."…}` | ✅ la bonne version est en ligne |
| « Fonction de script introuvable : doGet » | ❌ l'ancienne version est encore servie, ou ce n'est pas le bon déploiement — refaire le point 3 |
| une page de connexion Google | ❌ l'accès n'est pas réglé sur **Anyone** |

### E. Tester une vraie inscription

1. Dans `ntms-2026-web`, **arrêter puis relancer** le serveur :
   `npm run dev`. Le fichier `.env.local` n'est lu qu'au démarrage.
2. Ouvrir `http://localhost:3000/inscription`
3. Remplir les trois étapes **avec ta propre adresse mail**
4. Valider

| où | ce que tu dois constater |
|---|---|
| l'écran du site | « Ton inscription est enregistrée », une référence, le bouton WhatsApp |
| l'onglet `inscriptions` | une nouvelle ligne, `mail_envoye = oui` |
| ta boîte mail | le mail défini dans `config` |

5. **Supprimer les lignes de test** avant d'ouvrir les inscriptions.
   Le compteur de références, lui, **ne recule pas** : le premier vrai
   inscrit n'aura pas un numéro déjà envoyé à un testeur.

---

## Mise en ligne réelle

Chez l'hébergeur (Vercel ou autre), déclarer les trois variables de
`.env.local` :

```
INSCRIPTION_WEBAPP_URL=…
INSCRIPTION_SECRET=…
NEXT_PUBLIC_LIEN_WHATSAPP=…
```

`NEXT_PUBLIC_LIEN_WHATSAPP` est inséré dans le site **au moment de la
construction** : si tu le changes chez l'hébergeur, il faut
**redéployer le site**.

---

## La base secondaire

Un **second classeur**, tenu par un autre compte, reçoit une copie de
chaque inscription. Il sert de base de travail à l'équipe : on y trie,
on y filtre, on le partage avec qui on veut.

**Aucun des deux comptes n'a accès au classeur de l'autre.** Le site
écrit dans les deux, chacun par son propre script et son propre secret.

```
site ──► script du registre maître ──► inscriptions + mail
     └──► script de la base secondaire ──► copie
```

**Mise en place, par le titulaire du second classeur :**

1. Créer le classeur, puis **Extensions → Apps Script**, et y coller
   `base-secondaire.gs`.
2. **Paramètres du projet → Propriétés du script** → propriété `SECRET`,
   avec **la même valeur** que celle du registre maître, celle de
   `INSCRIPTION_SECRET`.
3. **Deploy → New deployment → Web app**, « Execute as : Me », « Who has
   access : Anyone ». Copier l'adresse `/exec`.
4. Transmettre cette adresse à qui tient le site.

**Côté site**, dans `.env.local` et chez l'hébergeur :

```
INSCRIPTION_MIROIR_URL=…      (l'adresse /exec du second script)
```

Laisser cette variable vide désactive la copie. Une variable
`INSCRIPTION_MIROIR_SECRET` existe, au cas où les deux classeurs
devraient un jour avoir des secrets différents.

**Ce que reçoit la base secondaire :** les données de l'inscription et
sa référence, sans le suivi des mails. L'en-tête se pose tout seul, et
une référence déjà présente n'est jamais copiée deux fois.

**Si elle est injoignable**, l'inscription et le mail se font quand
même : l'inscrit ne voit rien, et le site consigne l'échec dans ses
journaux. Le registre maître fait foi.

---

## Au quotidien

**Changer le texte d'un mail** : onglet `config auto` ou `config manuel`.
Immédiat, pas besoin de redéployer le script.

**Envoyer le mail manuel** : menu **NTMS** dans le classeur.
- *Aux lignes sélectionnées* : sélectionne les lignes des inscrits, puis clique.
- *À ceux qui ne l'ont pas reçu* : tous ceux dont `mail_manuel` n'est pas `oui`.

Dans les deux cas, une confirmation s'affiche, puis les mails partent
dans la minute qui suit, par la même file que les inscriptions. Le suivi
se lit dans `mail_manuel`, `mail_manuel_le` et `erreur_mail_manuel`.

**Renvoyer le mail automatique à tout le monde** : menu **NTMS**. À
utiliser après avoir changé le contenu de `config auto` : tous les
inscrits, y compris ceux qui l'avaient déjà reçu, reçoivent la nouvelle
version.

**Voir un mail avant de l'envoyer** : menu **NTMS** → « M'envoyer un
aperçu du mail automatique » ou « … du mail manuel ».

**L'habillage du mail** (en-tête brique à motif, logo, bande Quand / Où
/ Référence, pied de page) est dans le script, pas dans `config` : il est
le même pour tous les mails. Le logo et le motif sont servis depuis le
dépôt GitHub public (`public/mail/`). Tant que ce dossier n'est pas
poussé, le mail part sans eux, sur fond brique uni.

**Changer le lien WhatsApp** : il existe à **deux** endroits — « Lien
CTA » dans `config` (pour le mail) et `NEXT_PUBLIC_LIEN_WHATSAPP` (pour
l'écran de confirmation du site). Changer les deux.

**Couper les mails** sans arrêter les inscriptions :
`ENVOI_ACTIF = false` dans le script, puis nouvelle version. Cela coupe
les deux mails.

**Un mail n'est pas parti** : la ligne porte `mail_envoye = non` et
l'erreur exacte dans `erreur_mail`. Corriger la cause, puis lancer
`envoyerLesMailsEnAttente` depuis l'éditeur. Il ne renvoie jamais un
mail déjà parti.

**Quota** : il se compte en **destinataires**, pas en mails. Un compte
Gmail ordinaire en autorise **100 par jour**, un compte Workspace
1 500 — **CC et BCC compris**. Avec une adresse en CC, chaque
inscription en consomme deux : 50 inscrits servis par jour. Au-delà,
les mails restent en attente et se rattrapent le lendemain avec
`envoyerLesMailsEnAttente`.

**Expéditeur** : le compte qui a déployé le script. Pour envoyer depuis
une autre adresse, c'est ce compte-là qui doit posséder le classeur et
faire le déploiement.

---

## Règles du classeur

- Ne **jamais réordonner** les colonnes de `inscriptions`.
- Ne **jamais modifier** une ligne d'inscrit à la main.
- Ne **jamais toucher** à `id_envoi` : c'est lui qui empêche les
  doublons.
- Ne **pas partager** ce classeur en écriture. Le travail d'équipe se
  fait dans le classeur miroir.
