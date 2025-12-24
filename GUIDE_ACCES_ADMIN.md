# Guide d'Accès à la Page Admin

## Comment accéder à la page d'administration ?

### Méthode 1 : Accès normal (quand le site n'est PAS en maintenance)

1. **Faites défiler jusqu'en bas de la page** (footer)
2. **Cliquez sur le bouton "Se connecter"** (icône utilisateur 👤)
3. **Entrez vos identifiants** (email et mot de passe admin)
4. **Après connexion**, cliquez sur **"Panneau d'administration"** dans le menu déroulant

### Méthode 2 : Accès en mode maintenance

Si le mode maintenance est activé :

1. **La page de maintenance s'affiche automatiquement**
2. **Un formulaire de connexion apparaît au centre de la page** avec le titre "Connexion Administrateur"
3. **Entrez vos identifiants admin** (email et mot de passe)
4. **Cliquez sur "Se connecter"**
5. **Une fois connecté**, vous verrez le panneau administrateur avec :
   - Un bouton **"Désactiver le Mode Maintenance"** pour désactiver la maintenance
   - Un bouton **"Se déconnecter"** pour vous déconnecter

### Méthode 3 : Accès direct via URL (si déjà connecté)

Si vous êtes déjà connecté en tant qu'admin, vous pouvez accéder directement à la page admin en ajoutant `#admin` à l'URL :

```
https://votre-site.com/#admin
```

## Problèmes courants

### Le formulaire de connexion n'apparaît pas en mode maintenance

**Solution :**
- Vérifiez que vous avez bien fait défiler la page jusqu'au centre
- Le formulaire devrait être visible avec un fond semi-transparent blanc
- Si le problème persiste, rechargez la page (F5 ou Ctrl+R)

### Le bouton "Se connecter" n'est pas visible dans le footer

**Solution :**
- Le bouton se trouve en bas à droite du footer
- Il affiche une icône utilisateur 👤 avec le texte "Se connecter"
- Si vous êtes déjà connecté, le bouton affichera "Dashboard Admin" au lieu de "Se connecter"

### Je ne peux pas me connecter

**Vérifications :**
1. Vérifiez que vous utilisez le bon email et mot de passe
2. Vérifiez que votre compte a bien le rôle "admin" dans Firestore
3. Vérifiez la console du navigateur (F12) pour voir les erreurs éventuelles

## Structure des rôles

- **admin** : Accès complet au panneau d'administration
- **recruiter/recruteur** : Accès au panneau recruteur
- **reader/lecteur** : Accès en lecture seule

## Notes importantes

- Le bouton de connexion est toujours visible dans le footer, même en mode maintenance
- En mode maintenance, seul un administrateur peut se connecter et désactiver la maintenance
- Après connexion, vous pouvez accéder au panneau admin depuis le menu déroulant du bouton de connexion

