# AE2I Algérie - Site Web Professionnel

Site web officiel de AE2I Algérie, entreprise spécialisée dans l'ingénierie, l'énergie et les services industriels.

## 🌟 Fonctionnalités

- ✅ **Site multilingue** (Français, Anglais, Arabe)
- ✅ **Mode sombre/clair**
- ✅ **Pages dynamiques** : Accueil, À propos, Services, Qualité, Carrière, Contact
- ✅ **Système de candidatures** avec upload de CV
- ✅ **Formulaire de contact** avec validation
- ✅ **Dashboard administrateur** complet
- ✅ **Gestion des offres d'emploi**
- ✅ **Galerie clients** avec logos
- ✅ **Témoignages** clients
- ✅ **Effets visuels sophistiqués** (Prism effect)
- ✅ **Design responsive** mobile-first
- ✅ **Conformité RGPD/Loi 18-07** (Algérie)
- ✅ **Optimisé pour SEO**

## 🚀 Déploiement

Ce projet est prêt pour être déployé sur :

### Cloudflare Pages
- Configuration automatique via Git
- CDN global ultra-rapide
- HTTPS automatique
- Déploiement en quelques secondes

### Firebase Hosting
- Hébergement Google Cloud
- CDN global
- Intégration Firestore/Storage
- Authentification intégrée

**📖 Guide complet de déploiement : Consultez [DEPLOIEMENT.md](./DEPLOIEMENT.md)**

## 📁 Structure du projet

```
project/
├── public/                    # Fichiers de production
│   ├── index.html            # Page HTML principale
│   ├── styles.css            # Styles CSS
│   ├── script.js             # JavaScript principal
│   ├── firebase.js           # Configuration Firebase
│   └── backend/              # Assets (images, vidéos, PDF)
├── firebase.json             # Config Firebase Hosting
├── firestore.rules           # Règles de sécurité Firestore
├── storage.rules             # Règles de sécurité Storage
├── wrangler.toml            # Config Cloudflare
├── DEPLOIEMENT.md           # Guide de déploiement détaillé
└── README.md                # Ce fichier
```

## 🛠️ Installation locale

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/ae2i-algerie.git
cd ae2i-algerie
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Firebase** (optionnel)
- Copiez `.env.example` vers `.env`
- Remplissez avec vos clés Firebase
- Modifiez `public/firebase.js` avec vos configurations

4. **Lancer le serveur local**
```bash
# Avec Firebase
npm start

# Ou avec un serveur HTTP simple
npx http-server public -p 8080
```

5. **Ouvrir dans le navigateur**
```
http://localhost:8080
```

## 🔑 Configuration Firebase

Pour activer les fonctionnalités backend (base de données, authentification, stockage) :

1. Créez un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Récupérez vos clés de configuration
3. Modifiez `public/firebase.js` avec vos clés :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_AUTH_DOMAIN",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_STORAGE_BUCKET",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

4. Déployez les règles de sécurité :
```bash
firebase deploy --only firestore:rules,storage:rules
```

## 📊 Fonctionnalités Backend

### Avec Firebase activé

- **Firestore** : Base de données pour services, emplois, candidatures, messages
- **Storage** : Stockage des CVs, images, vidéos
- **Authentication** : Système de connexion admin/recruteur
- **Hosting** : Hébergement du site

### En mode Local (sans Firebase)

- Toutes les données sont stockées dans `script.js` (variable `siteData`)
- Aucune persistance entre les sessions
- Idéal pour la démo et le développement

## 👥 Rôles utilisateurs

### Admin
- Accès complet à toutes les fonctionnalités
- Gestion du contenu du site
- Gestion des utilisateurs
- Consultation des candidatures et messages

### Recruteur
- Gestion des offres d'emploi
- Consultation des candidatures
- Envoi de réponses aux candidats

### Lecteur
- Consultation uniquement
- Visualisation des candidatures et messages
- Aucune modification possible

## 🌍 Langues supportées

- 🇫🇷 Français (par défaut)
- 🇬🇧 English
- 🇩🇿 العربية (Arabe)

Le changement de langue se fait via les boutons en haut à droite.

## 📱 Responsive Design

Le site est entièrement responsive et optimisé pour :
- 📱 Mobile (320px+)
- 💻 Tablette (768px+)
- 🖥️ Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🎨 Personnalisation

### Couleurs
Modifiez les variables CSS dans `public/styles.css` :

```css
:root {
    --primary: #0e7a9e;      /* Couleur principale */
    --secondary: #e63946;     /* Couleur secondaire */
    --accent: #00a896;        /* Couleur d'accentuation */
    /* ... */
}
```

### Logo et images
Remplacez les fichiers dans `public/backend/uploads/photos/`

### Contenu
Modifiez directement dans `public/script.js` (variable `siteData`) ou via le dashboard admin

## 🔒 Sécurité

- ✅ Règles de sécurité Firestore/Storage configurées
- ✅ HTTPS uniquement (Cloudflare/Firebase)
- ✅ Protection CSRF
- ✅ Validation des formulaires côté client et serveur
- ✅ Upload de fichiers sécurisé avec limitations de taille
- ✅ Authentification JWT via Firebase
- ✅ Conformité RGPD/Loi 18-07

## 📈 Performance

- ⚡ Chargement < 3s
- ⚡ Score Lighthouse > 90
- ⚡ Images optimisées et lazy loading
- ⚡ CSS et JS minifiés pour la production
- ⚡ Cache CDN activé

## 📞 Support

Pour toute question ou problème :

- 📧 Email : ae2i.algerie@ae2i-aerh.com
- 📱 Téléphone Alger : 0770 284 828 / 0770 431 516
- 📱 Téléphone Oran : 0770 177 776 / 046 821 393
- 🔗 LinkedIn : [AE2I Algérie](https://www.linkedin.com/company/ae2i-algerie)

## 📄 Licence

© 2024 AE2I Algérie. Tous droits réservés.

---

**Développé avec ❤️ pour AE2I Algérie**
