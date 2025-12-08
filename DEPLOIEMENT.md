# Guide de Déploiement - AE2I Algérie

Ce document contient toutes les instructions pour déployer votre site sur **Cloudflare Pages** et **Firebase Hosting**.

---

## 📁 Structure du Projet

```
project/
├── public/                          # Dossier de déploiement
│   ├── index.html                   # Page principale
│   ├── styles.css                   # Styles CSS
│   ├── script.js                    # JavaScript principal
│   ├── firebase.js                  # Configuration Firebase SDK v9
│   ├── _headers                     # En-têtes HTTP pour Cloudflare
│   ├── _redirects                   # Redirections pour Cloudflare
│   └── backend/                     # Assets du site
│       └── uploads/
│           ├── photos/              # Images
│           ├── videos/              # Vidéos
│           └── brochures/           # Documents PDF
├── firebase.json                    # Configuration Firebase Hosting
├── .firebaserc                      # Projets Firebase
├── firestore.rules                  # Règles de sécurité Firestore
├── storage.rules                    # Règles de sécurité Storage
├── firestore.indexes.json           # Index Firestore
├── wrangler.toml                    # Configuration Cloudflare Workers
└── DEPLOIEMENT.md                   # Ce fichier
```

---

## 🚀 Déploiement sur Cloudflare Pages

### Prérequis
- Compte Cloudflare (gratuit ou payant)
- Dépôt Git (GitHub, GitLab, ou Bitbucket)

### Étape 1 : Préparer votre dépôt Git

1. Initialisez Git dans votre projet (si ce n'est pas déjà fait) :
```bash
git init
git add .
git commit -m "Initial commit - Site AE2I Algérie"
```

2. Poussez vers votre dépôt distant :
```bash
git remote add origin https://github.com/votre-username/ae2i-algerie.git
git push -u origin main
```

### Étape 2 : Créer un projet Cloudflare Pages

1. Connectez-vous à [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Allez dans **Pages** > **Create a project**
3. Connectez votre compte GitHub/GitLab/Bitbucket
4. Sélectionnez votre dépôt `ae2i-algerie`
5. Configurez les paramètres de build :
   - **Framework preset** : None
   - **Build command** : (laissez vide)
   - **Build output directory** : `public`
   - **Root directory** : (laissez vide)

6. Cliquez sur **Save and Deploy**

### Étape 3 : Configuration des domaines

1. Dans Cloudflare Pages, allez dans **Custom domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

### Étape 4 : Variables d'environnement (optionnel)

Si vous utilisez Firebase, ajoutez les variables d'environnement :

1. Allez dans **Settings** > **Environment variables**
2. Ajoutez :
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

### Vérifications

- ✅ Le site se charge correctement
- ✅ Les images et vidéos s'affichent
- ✅ Le cache fonctionne (vérifiez les en-têtes HTTP)
- ✅ Les redirections fonctionnent
- ✅ Le site est sécurisé (HTTPS)

---

## 🔥 Déploiement sur Firebase Hosting

### Prérequis
- Compte Google/Firebase
- Node.js installé (version 14+)
- Firebase CLI installé

### Étape 1 : Installer Firebase CLI

```bash
npm install -g firebase-tools
```

### Étape 2 : Se connecter à Firebase

```bash
firebase login
```

### Étape 3 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **Add project**
3. Nommez votre projet : `ae2i-algerie`
4. Suivez les étapes de création

### Étape 4 : Configurer Firebase dans votre projet

Dans le dossier de votre projet :

```bash
firebase init
```

Sélectionnez :
- ✅ **Hosting** : Configure files for Firebase Hosting
- ✅ **Firestore** : Deploy rules for Firestore (si vous utilisez la base de données)
- ✅ **Storage** : Deploy rules for Storage (si vous utilisez le stockage)

Répondez aux questions :
- **Project Setup** : Sélectionnez votre projet `ae2i-algerie`
- **Public directory** : `public`
- **Configure as single-page app** : `Yes`
- **Set up automatic builds** : `No` (ou `Yes` si vous voulez)
- **File public/index.html already exists. Overwrite?** : `No` (IMPORTANT!)

### Étape 5 : Configurer Firebase SDK dans firebase.js

Ouvrez `public/firebase.js` et remplacez les valeurs de configuration :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",                    // Trouvez ces valeurs dans
    authDomain: "VOTRE_AUTH_DOMAIN",            // Firebase Console >
    projectId: "VOTRE_PROJECT_ID",              // Project Settings >
    storageBucket: "VOTRE_STORAGE_BUCKET",      // General > Your apps
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

Pour trouver ces valeurs :
1. Allez dans Firebase Console
2. Cliquez sur l'icône d'engrenage > **Project settings**
3. Faites défiler jusqu'à **Your apps**
4. Cliquez sur **Add app** > **Web** (si ce n'est pas déjà fait)
5. Copiez les valeurs de configuration

### Étape 6 : Déployer sur Firebase Hosting

```bash
firebase deploy --only hosting
```

Ou pour tout déployer (hosting, firestore, storage) :

```bash
firebase deploy
```

### Étape 7 : Configurer Firestore (optionnel mais recommandé)

Si vous voulez utiliser la base de données Firestore :

1. Allez dans Firebase Console > **Firestore Database**
2. Cliquez sur **Create database**
3. Choisissez le mode :
   - **Production mode** (recommandé avec les règles de sécurité)
   - **Test mode** (pour le développement uniquement)
4. Choisissez la région (recommandé : `europe-west1` pour l'Algérie)

Déployez les règles de sécurité :
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Étape 8 : Configurer Storage (optionnel)

Pour activer le stockage de fichiers (CVs, images, etc.) :

1. Allez dans Firebase Console > **Storage**
2. Cliquez sur **Get started**
3. Acceptez les règles par défaut (elles seront remplacées)
4. Choisissez la même région que Firestore

Déployez les règles de sécurité :
```bash
firebase deploy --only storage:rules
```

### Étape 9 : Créer les utilisateurs Admin

Pour créer un compte administrateur :

1. Allez dans Firebase Console > **Authentication**
2. Activez **Email/Password** comme méthode de connexion
3. Ajoutez un utilisateur manuellement :
   - Email : `admin@ae2i-algerie.com`
   - Password : (votre mot de passe sécurisé)

4. Allez dans **Firestore Database**
5. Créez une collection `users`
6. Ajoutez un document avec l'ID = UID de l'utilisateur créé
7. Ajoutez les champs :
   ```json
   {
       "email": "admin@ae2i-algerie.com",
       "role": "admin",
       "username": "admin",
       "active": true,
       "createdAt": (timestamp actuel)
   }
   ```

### Vérifications

- ✅ Le site est accessible via l'URL Firebase : `https://ae2i-algerie.web.app`
- ✅ Les images et assets se chargent correctement
- ✅ Firebase SDK est initialisé (vérifiez la console du navigateur)
- ✅ L'authentification fonctionne (si configurée)
- ✅ Firestore et Storage fonctionnent (si configurés)

---

## 🔄 Mises à jour

### Pour Cloudflare Pages

Les mises à jour sont automatiques ! À chaque push sur votre branche `main` :
1. Cloudflare détecte le changement
2. Reconstruit et redéploie automatiquement
3. Le site est mis à jour en quelques secondes

### Pour Firebase Hosting

Après avoir fait des modifications :

```bash
# Déployer tout
firebase deploy

# Ou uniquement le hosting
firebase deploy --only hosting

# Ou uniquement les règles
firebase deploy --only firestore:rules,storage:rules
```

---

## 📊 Migration des données vers Firebase

Si vous avez des données existantes dans le fichier JavaScript, vous devez les migrer vers Firestore :

### 1. Migrer les Services

Dans la console Firebase ou via un script :

```javascript
// Exemple de migration (à exécuter dans la console du navigateur une fois connecté)
const services = siteData.services; // vos services actuels
services.forEach(async (service) => {
    await firebaseHelper.setDocument('services', service.id.toString(), service);
});
```

### 2. Migrer les Offres d'emploi

```javascript
const jobs = siteData.jobs;
jobs.forEach(async (job) => {
    await firebaseHelper.addDocument('jobs', job);
});
```

### 3. Migrer les Clients

```javascript
const clients = siteData.clients;
clients.forEach(async (client) => {
    await firebaseHelper.setDocument('clients', client.id.toString(), client);
});
```

### 4. Migrer les Paramètres

```javascript
await firebaseHelper.setDocument('settings', 'main', siteData.settings);
```

---

## 🛠️ Commandes utiles

### Firebase CLI

```bash
# Voir les projets Firebase
firebase projects:list

# Changer de projet
firebase use ae2i-algerie

# Déployer hosting uniquement
firebase deploy --only hosting

# Déployer rules uniquement
firebase deploy --only firestore:rules,storage:rules

# Tester localement
firebase serve

# Voir les logs
firebase functions:log
```

### Cloudflare Wrangler (si vous utilisez Workers)

```bash
# Publier sur Cloudflare
wrangler publish

# Développement local
wrangler dev

# Voir les logs
wrangler tail
```

---

## 🔐 Sécurité

### Points importants :

1. **Ne JAMAIS commiter les clés Firebase** dans Git
   - Ajoutez `firebaseConfig` aux variables d'environnement
   - Utilisez `.env` pour le développement local

2. **Activez les règles de sécurité Firestore et Storage**
   - Déjà configurées dans `firestore.rules` et `storage.rules`
   - Testez-les régulièrement

3. **Activez HTTPS uniquement**
   - Automatique avec Cloudflare et Firebase

4. **Limitez les uploads**
   - CVs : max 10MB
   - Images : max 10MB
   - Vidéos : max 100MB

5. **Surveillez l'utilisation**
   - Consultez les quotas Firebase régulièrement
   - Configurez des alertes de budget

---

## 📞 Support et dépannage

### Problèmes courants

#### 1. "Firebase is not defined"
- Vérifiez que `firebase.js` est chargé avant `script.js`
- Vérifiez la console pour les erreurs de chargement

#### 2. "Permission denied" dans Firestore
- Vérifiez que les règles de sécurité sont déployées
- Vérifiez que l'utilisateur est authentifié

#### 3. Les assets ne se chargent pas
- Vérifiez les chemins dans `index.html`
- Vérifiez que les fichiers sont dans `public/backend/uploads/`

#### 4. Le site ne se met pas à jour
- Videz le cache du navigateur (Ctrl+Shift+R)
- Vérifiez que le déploiement est réussi dans le dashboard

### Ressources utiles

- [Documentation Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Documentation Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Documentation Storage](https://firebase.google.com/docs/storage)

---

## ✅ Checklist finale

Avant de mettre en production :

- [ ] Le site fonctionne localement
- [ ] Les clés Firebase sont configurées
- [ ] Les règles de sécurité sont déployées
- [ ] L'authentification est configurée
- [ ] Un compte admin est créé
- [ ] Les données sont migrées (si nécessaire)
- [ ] Le domaine personnalisé est configuré
- [ ] Le certificat SSL est actif
- [ ] Les formulaires fonctionnent
- [ ] L'upload de CV fonctionne
- [ ] Les tests sont effectués sur mobile et desktop
- [ ] Les performances sont bonnes (PageSpeed > 90)
- [ ] Le SEO est optimisé
- [ ] Google Analytics est configuré (optionnel)
- [ ] La sauvegarde des données est configurée

---

## 📄 Licence

© 2024 AE2I Algérie. Tous droits réservés.
