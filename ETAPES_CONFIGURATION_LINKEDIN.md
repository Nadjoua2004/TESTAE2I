# 🔗 Étapes de Configuration LinkedIn - Guide Pratique

## ✅ Vous avez créé une application LinkedIn ? Parfait !

Suivez ces étapes pour connecter votre application au système d'auto-remplissage.

---

## 📋 Étape 1 : Récupérer vos identifiants LinkedIn

1. **Allez sur LinkedIn Developers**
   - Ouvrez : https://www.linkedin.com/developers/apps
   - Connectez-vous si nécessaire

2. **Sélectionnez votre application**
   - Cliquez sur l'application que vous venez de créer

3. **Récupérez vos identifiants**
   - Allez dans l'onglet **"Auth"**
   - Notez :
     - **Client ID** (ex: `86abc123def456`)
     - **Client Secret** (cliquez sur "Show" pour le voir)

4. **Notez ces informations** - vous en aurez besoin à l'étape suivante

---

## 📋 Étape 2 : Configurer l'URL de redirection dans LinkedIn

⚠️ **IMPORTANT** : Cette étape est cruciale pour que l'authentification fonctionne !

1. **Toujours dans l'onglet "Auth" de votre application LinkedIn**

2. **Trouvez la section "Authorized redirect URLs for your app"**

3. **Déterminez votre URL de redirection** :
   - Si votre site est en production : `https://votre-domaine.com/carriere`
   - Si vous testez en local : `http://localhost:8080/carriere` (ou le port que vous utilisez)
   
   **Exemples :**
   - `https://ae2i-b6c7f.web.app/carriere`
   - `https://www.ae2i-algerie.com/carriere`
   - `http://localhost:8080/carriere` (pour tests locaux)

4. **Ajoutez l'URL** dans le champ "Authorized redirect URLs"
   - Cliquez sur **"Add redirect URL"**
   - Entrez votre URL exacte
   - Cliquez sur **"Update"**

5. **Notez cette URL** - elle doit correspondre EXACTEMENT à celle utilisée par votre site

---

## 📋 Étape 3 : Configurer Cloudflare Worker

Vous avez deux options :

### Option A : Utiliser le script automatique (Recommandé)

**Sur Windows :**
```bash
configurer-linkedin.bat
```

**Sur Mac/Linux :**
```bash
chmod +x configurer-linkedin.sh
./configurer-linkedin.sh
```

Le script vous demandera :
1. Votre LinkedIn Client ID
2. Votre LinkedIn Client Secret
3. Votre URL de redirection (optionnel)

### Option B : Configuration manuelle

1. **Ouvrir un terminal** dans le dossier du projet

2. **Aller dans le dossier cloudflare-worker**
   ```bash
   cd cloudflare-worker
   ```

3. **Se connecter à Cloudflare** (si pas déjà fait)
   ```bash
   wrangler login
   ```

4. **Configurer le Client ID**
   ```bash
   wrangler secret put LINKEDIN_CLIENT_ID
   ```
   - Quand demandé, collez votre Client ID et appuyez sur Entrée

5. **Configurer le Client Secret**
   ```bash
   wrangler secret put LINKEDIN_CLIENT_SECRET
   ```
   - Quand demandé, collez votre Client Secret et appuyez sur Entrée
   - ⚠️ Le texte ne s'affichera pas (c'est normal pour la sécurité)

6. **Configurer l'URL de redirection** (optionnel mais recommandé)
   ```bash
   wrangler secret put LINKEDIN_REDIRECT_URI
   ```
   - Quand demandé, entrez votre URL de redirection exacte
   - Exemple : `https://votre-domaine.com/carriere`

7. **Déployer le Worker**
   ```bash
   wrangler deploy
   ```

---

## 📋 Étape 4 : Vérifier la configuration

1. **Vérifier que le Worker est déployé**
   - Le script ou la commande `wrangler deploy` devrait afficher un message de succès
   - Notez l'URL du Worker (ex: `https://upload-ae2i.ae2ialgerie2025.workers.dev`)

2. **Vérifier que l'URL du Worker est correcte dans le code**
   - Ouvrez `public/script.js`
   - Vérifiez la ligne ~11 :
     ```javascript
     const R2_CONFIG = {
         workerUrl: 'https://upload-ae2i.ae2ialgerie2025.workers.dev',
         ...
     };
     ```
   - Si votre URL de Worker est différente, modifiez-la ici

---

## 📋 Étape 5 : Tester la connexion

1. **Ouvrir votre site**
   - Allez sur la page `/carriere` de votre site
   - Exemple : `https://votre-domaine.com/carriere`

2. **Ouvrir la console du navigateur**
   - Appuyez sur `F12` ou `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Allez dans l'onglet "Console"

3. **Cliquer sur le bouton LinkedIn**
   - Cliquez sur **"Se connecter avec LinkedIn (auto-remplissage + profil)"**

4. **Vérifier les logs dans la console**
   - Vous devriez voir : `🔗 [LINKEDIN] Using redirect URI: ...`
   - **Notez cette URL** - elle doit correspondre EXACTEMENT à celle dans LinkedIn

5. **Autoriser l'application**
   - Vous serez redirigé vers LinkedIn
   - Connectez-vous si nécessaire
   - Autorisez l'application à accéder à vos informations

6. **Vérifier le retour**
   - Vous devriez être redirigé vers votre site
   - Le formulaire devrait être automatiquement rempli avec vos données LinkedIn
   - Votre profil LinkedIn devrait s'ouvrir dans un nouvel onglet

---

## 🐛 Problèmes courants et solutions

### ❌ "LinkedIn Client ID not configured"
**Solution :**
- Vérifiez que vous avez bien configuré `LINKEDIN_CLIENT_ID` dans le Worker
- Redéployez le Worker après avoir configuré les secrets

### ❌ "redirect_uri_mismatch"
**Solution :**
1. Ouvrez la console du navigateur (F12)
2. Cliquez sur le bouton LinkedIn
3. Regardez le log : `🔗 [LINKEDIN] Using redirect URI: ...`
4. Copiez cette URL EXACTE
5. Allez sur LinkedIn Developers → Votre App → Auth
6. Ajoutez cette URL EXACTE dans "Authorized redirect URLs"
7. Cliquez sur "Update"

### ❌ Le formulaire ne se remplit pas
**Solution :**
1. Vérifiez la console pour les erreurs
2. Vérifiez que les IDs des champs sont corrects :
   - `applicantLastName`
   - `applicantFirstName`
   - `applicantEmail`
   - `applicantPosition`

### ❌ "Failed to exchange code for token"
**Solution :**
1. Vérifiez que `LINKEDIN_CLIENT_SECRET` est correctement configuré
2. Vérifiez les logs du Worker : `wrangler tail`
3. Vérifiez que l'URL de redirection correspond exactement

---

## ✅ Checklist finale

- [ ] Application LinkedIn créée
- [ ] Client ID récupéré
- [ ] Client Secret récupéré
- [ ] URL de redirection ajoutée dans LinkedIn
- [ ] Secrets configurés dans Cloudflare Worker
- [ ] Worker déployé avec succès
- [ ] URL du Worker vérifiée dans `script.js`
- [ ] Test de connexion effectué
- [ ] Formulaire se remplit automatiquement

---

## 🎉 C'est terminé !

Une fois toutes ces étapes complétées, le système devrait fonctionner. Les utilisateurs pourront cliquer sur "Se connecter avec LinkedIn" et le formulaire sera automatiquement rempli avec leurs informations LinkedIn.

---

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs du Worker : `cd cloudflare-worker && wrangler tail`
3. Vérifiez que toutes les URLs correspondent exactement

