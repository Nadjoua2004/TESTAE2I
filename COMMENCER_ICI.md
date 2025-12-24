# 🚀 Configuration LinkedIn - Commencez Ici !

## ✅ Vous avez créé une application LinkedIn ? Parfait !

Suivez ces **3 étapes simples** pour activer l'auto-remplissage :

---

## 📋 ÉTAPE 1 : Récupérer vos identifiants LinkedIn

1. **Allez sur** : https://www.linkedin.com/developers/apps
2. **Cliquez sur votre application**
3. **Allez dans l'onglet "Auth"**
4. **Notez ces 2 informations** :
   - ✅ **Client ID** (ex: `86abc123def456`)
   - ✅ **Client Secret** (cliquez sur "Show" pour le voir)

---

## 📋 ÉTAPE 2 : Configurer l'URL de redirection dans LinkedIn

⚠️ **TRÈS IMPORTANT** : Cette URL doit correspondre EXACTEMENT !

1. **Toujours dans l'onglet "Auth" de LinkedIn**
2. **Section "Authorized redirect URLs for your app"**
3. **Ajoutez votre URL** (exemples) :
   - Production : `https://votre-domaine.com/carriere`
   - Local : `http://localhost:8080/carriere`
4. **Cliquez sur "Update"**

💡 **Astuce** : Vous pouvez tester pour trouver l'URL exacte (voir Étape 3)

---

## 📋 ÉTAPE 3 : Configurer Cloudflare Worker

### Méthode Simple (Recommandée)

**Ouvrez un terminal** dans le dossier du projet et exécutez :

```bash
cd cloudflare-worker
```

**Puis configurez les secrets un par un :**

```bash
# 1. Configurer le Client ID
wrangler secret put LINKEDIN_CLIENT_ID
# Collez votre Client ID et appuyez sur Entrée

# 2. Configurer le Client Secret
wrangler secret put LINKEDIN_CLIENT_SECRET
# Collez votre Client Secret et appuyez sur Entrée
# (Le texte ne s'affichera pas - c'est normal)

# 3. (Optionnel) Configurer l'URL de redirection
wrangler secret put LINKEDIN_REDIRECT_URI
# Collez votre URL de redirection et appuyez sur Entrée
```

**Ensuite, déployez le Worker :**

```bash
wrangler deploy
```

✅ **C'est tout !** Le Worker est maintenant configuré.

---

## 🧪 ÉTAPE 4 : Tester

1. **Ouvrez votre site** sur la page `/carriere`
2. **Ouvrez la console** (F12)
3. **Cliquez sur "Se connecter avec LinkedIn"**
4. **Regardez le log** : `🔗 [LINKEDIN] Using redirect URI: ...`
5. **Si l'URL ne correspond pas** à celle dans LinkedIn :
   - Copiez l'URL exacte du log
   - Allez sur LinkedIn → Votre App → Auth
   - Ajoutez cette URL exacte dans "Authorized redirect URLs"
   - Cliquez sur "Update"
6. **Réessayez** la connexion

---

## ✅ Checklist Rapide

- [ ] Client ID récupéré depuis LinkedIn
- [ ] Client Secret récupéré depuis LinkedIn
- [ ] URL de redirection ajoutée dans LinkedIn
- [ ] `LINKEDIN_CLIENT_ID` configuré dans le Worker
- [ ] `LINKEDIN_CLIENT_SECRET` configuré dans le Worker
- [ ] Worker déployé avec `wrangler deploy`
- [ ] Test effectué et formulaire rempli automatiquement

---

## 🐛 Problème ?

### "redirect_uri_mismatch"
→ L'URL dans LinkedIn ne correspond pas exactement
→ Copiez l'URL du log console et ajoutez-la dans LinkedIn

### "LinkedIn Client ID not configured"
→ Vérifiez que vous avez bien configuré les secrets
→ Redéployez le Worker : `wrangler deploy`

### Le formulaire ne se remplit pas
→ Vérifiez la console pour les erreurs
→ Vérifiez que les champs ont les bons IDs

---

## 📞 Besoin d'aide détaillée ?

Consultez : `ETAPES_CONFIGURATION_LINKEDIN.md` pour un guide complet.

---

## 🎉 C'est terminé !

Une fois ces étapes complétées, le bouton LinkedIn remplira automatiquement le formulaire avec les informations du profil LinkedIn de l'utilisateur.

