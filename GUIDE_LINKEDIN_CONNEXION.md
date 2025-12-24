# 🔗 Guide de Configuration LinkedIn - Auto-remplissage des Candidatures

## 📋 Vue d'ensemble

Ce guide explique comment configurer la connexion LinkedIn pour que le bouton **"Se connecter avec LinkedIn (auto-remplissage + profil)"** remplisse automatiquement le formulaire de candidature avec les informations du profil LinkedIn de l'utilisateur.

## 🏗️ Architecture du Système

Le système fonctionne en 3 étapes :

1. **Frontend** (`public/script.js`) : Gère le flux OAuth et le pré-remplissage du formulaire
2. **Backend** (`cloudflare-worker/src/index.js`) : Échange le code d'autorisation contre un token et récupère le profil utilisateur
3. **LinkedIn API** : Fournit les données du profil utilisateur

## ✅ Étapes de Configuration

### Étape 1 : Créer une Application LinkedIn

1. **Aller sur LinkedIn Developers**
   - Visitez : https://www.linkedin.com/developers/
   - Connectez-vous avec votre compte LinkedIn

2. **Créer une nouvelle application**
   - Cliquez sur **"Create app"**
   - Remplissez les informations :
     - **App name** : AE2I Algérie (ou le nom de votre choix)
     - **LinkedIn Page** : Sélectionnez votre page LinkedIn
     - **Privacy policy URL** : URL de votre politique de confidentialité
     - **App logo** : Logo de votre entreprise

3. **Récupérer les identifiants**
   - Une fois l'application créée, allez dans l'onglet **"Auth"**
   - Notez votre **Client ID** et **Client Secret**
   - ⚠️ **IMPORTANT** : Le Client Secret ne doit JAMAIS être exposé dans le code frontend

4. **Configurer les URLs de redirection**
   - Dans l'onglet **"Auth"**, section **"Authorized redirect URLs for your app"**
   - Ajoutez les URLs suivantes (selon votre environnement) :
   
   **Pour la production :**
   ```
   https://votre-domaine.com/carriere
   ```
   ou
   ```
   https://votre-domaine.com/carriere/
   ```
   
   **Pour le développement local :**
   ```
   http://localhost:8080/carriere
   ```
   
   ⚠️ **CRITIQUE** : L'URL de redirection doit correspondre EXACTEMENT :
   - Même protocole (`http` vs `https`)
   - Même domaine
   - Même chemin (`/carriere`)
   - Même slash final (ou absence de slash)
   - Même numéro de port (si test local)

5. **Configurer les permissions (Scopes)**
   - Dans l'onglet **"Auth"**, section **"Products"**
   - Activez **"Sign In with LinkedIn using OpenID Connect"**
   - Les scopes requis sont automatiquement inclus :
     - `openid` - Pour l'authentification OAuth 2.0
     - `profile` - Pour les informations de profil de base
     - `email` - Pour l'adresse email de l'utilisateur

### Étape 2 : Configurer le Cloudflare Worker

Le Cloudflare Worker sert de backend sécurisé pour échanger le code d'autorisation contre un token d'accès.

1. **Installer Wrangler CLI** (si pas déjà installé)
   ```bash
   npm install -g wrangler
   ```

2. **Se connecter à Cloudflare**
   ```bash
   wrangler login
   ```

3. **Configurer les secrets LinkedIn**
   ```bash
   cd cloudflare-worker
   
   # Configurer le Client ID
   wrangler secret put LINKEDIN_CLIENT_ID
   # Quand demandé, entrez votre Client ID LinkedIn
   
   # Configurer le Client Secret
   wrangler secret put LINKEDIN_CLIENT_SECRET
   # Quand demandé, entrez votre Client Secret LinkedIn
   
   # (Optionnel) Configurer l'URL de redirection personnalisée
   wrangler secret put LINKEDIN_REDIRECT_URI
   # Quand demandé, entrez : https://votre-domaine.com/carriere
   ```

4. **Déployer le Worker**
   ```bash
   wrangler deploy
   ```

### Étape 3 : Vérifier la Configuration Frontend

Le frontend est déjà configuré dans `public/script.js`. Vérifiez que :

1. **L'URL du Worker est correcte** (ligne ~10-11 dans `script.js`) :
   ```javascript
   const R2_CONFIG = {
       workerUrl: 'https://upload-ae2i.ae2ialgerie2025.workers.dev',
       publicUrl: 'https://pub-298ee83d49284d7cc8b8c2eac280bf44.r2.dev/ae2i-cvs-algerie'
   };
   ```
   ⚠️ Remplacez par votre URL de Worker si différente

2. **Le bouton LinkedIn est présent** dans `public/index.html` (ligne ~5409) :
   ```html
   <button class="linkedin-btn functional-btn" onclick="connectLinkedIn()">
       <i class="fab fa-linkedin"></i>
       <span>Se connecter avec LinkedIn (auto-remplissage + profil)</span>
   </button>
   ```

3. **Les champs du formulaire ont les bons IDs** :
   - `applicantLastName` - Nom
   - `applicantFirstName` - Prénom
   - `applicantEmail` - Email
   - `applicantPosition` - Poste/Position

## 🔄 Comment ça fonctionne

### Flux d'authentification :

1. **L'utilisateur clique sur "Se connecter avec LinkedIn"**
   - La fonction `connectLinkedIn()` est appelée
   - Le frontend récupère le Client ID depuis le Worker (`GET /linkedin/key`)
   - L'utilisateur est redirigé vers la page d'autorisation LinkedIn

2. **L'utilisateur autorise l'application sur LinkedIn**
   - LinkedIn redirige vers votre site avec un code d'autorisation
   - La fonction `handleLinkedInCallback()` est appelée automatiquement

3. **Le backend échange le code contre un token**
   - Le frontend envoie le code au Worker (`POST /linkedin/auth`)
   - Le Worker échange le code contre un token d'accès LinkedIn
   - Le Worker récupère le profil utilisateur depuis l'API LinkedIn

4. **Le formulaire est pré-rempli automatiquement**
   - Les données du profil sont retournées au frontend
   - La fonction `prefillFormWithLinkedInData()` remplit les champs :
     - Nom → `applicantLastName`
     - Prénom → `applicantFirstName`
     - Email → `applicantEmail`
     - Headline → `applicantPosition`
   - Le profil LinkedIn de l'utilisateur s'ouvre dans un nouvel onglet

## 🧪 Tester l'Intégration

1. **Ouvrir la page de carrière**
   - Allez sur `/carriere` de votre site

2. **Cliquer sur le bouton LinkedIn**
   - Cliquez sur **"Se connecter avec LinkedIn (auto-remplissage + profil)"**

3. **Autoriser l'application**
   - Connectez-vous à LinkedIn si nécessaire
   - Autorisez l'application à accéder à vos informations

4. **Vérifier le pré-remplissage**
   - Vous devriez être redirigé vers votre site
   - Le formulaire devrait être automatiquement rempli avec vos données LinkedIn
   - Votre profil LinkedIn devrait s'ouvrir dans un nouvel onglet

## 🐛 Dépannage

### ❌ "LinkedIn Client ID not configured"
- **Solution** : Vérifiez que vous avez configuré `LINKEDIN_CLIENT_ID` dans le Cloudflare Worker
- **Action** : Redéployez le Worker après avoir configuré les secrets

### ❌ "Failed to exchange code for token"
- **Solutions possibles** :
  1. Vérifiez que `LINKEDIN_CLIENT_SECRET` est correctement configuré
  2. Vérifiez que l'URL de redirection correspond EXACTEMENT dans les paramètres LinkedIn
  3. Vérifiez les logs du Worker : `wrangler tail`

### ❌ "redirect_uri_mismatch"
- **Cause** : L'URL de redirection ne correspond pas exactement
- **Solution** :
  1. Ouvrez la console du navigateur (F12)
  2. Cliquez sur le bouton LinkedIn
  3. Regardez le log : `🔗 [LINKEDIN] Using redirect URI: ...`
  4. Copiez cette URL EXACTE
  5. Ajoutez-la dans les paramètres LinkedIn (onglet Auth → Authorized redirect URLs)

### ❌ Le formulaire ne se remplit pas automatiquement
- **Solutions possibles** :
  1. Vérifiez la console du navigateur pour les erreurs
  2. Vérifiez que `prefillFormWithLinkedInData()` est appelée
  3. Vérifiez que les IDs des champs correspondent (`applicantLastName`, `applicantFirstName`, etc.)

### ❌ "Failed to fetch LinkedIn profile"
- **Solutions possibles** :
  1. LinkedIn API peut avoir des limites de taux
  2. Vérifiez que votre application LinkedIn a les bonnes permissions
  3. Vérifiez que le token d'accès est valide

## 📝 Notes de Sécurité

- ✅ **Client Secret** : Stocké de manière sécurisée dans les secrets Cloudflare Worker (jamais exposé au frontend)
- ✅ **Paramètre OAuth state** : Empêche les attaques CSRF
- ✅ **Tokens d'accès** : Stockés dans `sessionStorage` (effacés à la fermeture du navigateur)
- ✅ **En-têtes CORS** : Correctement configurés

## 📚 Fichiers Importants

- `public/script.js` - Logique frontend (lignes 3843-4202)
- `cloudflare-worker/src/index.js` - Backend Worker (lignes 94-351)
- `public/index.html` - Bouton LinkedIn (ligne ~5409)
- `LINKEDIN_SETUP.md` - Documentation technique complète (en anglais)

## 🔍 Vérification de l'URL de Redirection

Pour trouver votre URL de redirection exacte :

1. Ouvrez votre page de carrière dans le navigateur
2. Ouvrez la console du navigateur (F12)
3. Cliquez sur **"Se connecter avec LinkedIn"**
4. Regardez le log dans la console :
   ```
   🔗 [LINKEDIN] Using redirect URI: https://votre-domaine.com/carriere
   ```
5. Copiez cette URL EXACTE
6. Ajoutez-la dans les paramètres LinkedIn (Auth → Authorized redirect URLs)

## ✅ Checklist de Configuration

- [ ] Application LinkedIn créée
- [ ] Client ID et Client Secret récupérés
- [ ] URLs de redirection configurées dans LinkedIn
- [ ] Permissions (Scopes) activées dans LinkedIn
- [ ] Secrets configurés dans Cloudflare Worker (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`)
- [ ] Cloudflare Worker déployé
- [ ] URL du Worker vérifiée dans `script.js`
- [ ] Test de connexion LinkedIn effectué
- [ ] Formulaire se remplit automatiquement

## 🎉 C'est tout !

Une fois ces étapes terminées, le bouton **"Se connecter avec LinkedIn"** devrait fonctionner et remplir automatiquement le formulaire de candidature avec les informations du profil LinkedIn de l'utilisateur.

