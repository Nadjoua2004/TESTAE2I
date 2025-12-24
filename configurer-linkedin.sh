#!/bin/bash

# Script de configuration LinkedIn pour AE2I
# Ce script configure les secrets LinkedIn dans Cloudflare Worker

echo "🔗 Configuration LinkedIn pour AE2I"
echo "======================================"
echo ""

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI n'est pas installé."
    echo "📦 Installation: npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler CLI détecté"
echo ""

# Aller dans le dossier cloudflare-worker
if [ ! -d "cloudflare-worker" ]; then
    echo "❌ Le dossier cloudflare-worker n'existe pas"
    exit 1
fi

cd cloudflare-worker

echo "📝 Configuration des secrets LinkedIn"
echo ""

# Demander le Client ID
echo "1️⃣ Entrez votre LinkedIn Client ID:"
read -r LINKEDIN_CLIENT_ID

if [ -z "$LINKEDIN_CLIENT_ID" ]; then
    echo "❌ Client ID ne peut pas être vide"
    exit 1
fi

# Demander le Client Secret
echo ""
echo "2️⃣ Entrez votre LinkedIn Client Secret:"
read -s LINKEDIN_CLIENT_SECRET

if [ -z "$LINKEDIN_CLIENT_SECRET" ]; then
    echo "❌ Client Secret ne peut pas être vide"
    exit 1
fi

# Demander l'URL de redirection (optionnel)
echo ""
echo "3️⃣ Entrez votre URL de redirection (optionnel, appuyez sur Entrée pour ignorer):"
echo "   Exemple: https://votre-domaine.com/carriere"
read -r LINKEDIN_REDIRECT_URI

echo ""
echo "⚙️ Configuration des secrets dans Cloudflare Worker..."
echo ""

# Configurer LINKEDIN_CLIENT_ID
echo "$LINKEDIN_CLIENT_ID" | wrangler secret put LINKEDIN_CLIENT_ID
if [ $? -eq 0 ]; then
    echo "✅ LINKEDIN_CLIENT_ID configuré"
else
    echo "❌ Erreur lors de la configuration de LINKEDIN_CLIENT_ID"
    exit 1
fi

# Configurer LINKEDIN_CLIENT_SECRET
echo "$LINKEDIN_CLIENT_SECRET" | wrangler secret put LINKEDIN_CLIENT_SECRET
if [ $? -eq 0 ]; then
    echo "✅ LINKEDIN_CLIENT_SECRET configuré"
else
    echo "❌ Erreur lors de la configuration de LINKEDIN_CLIENT_SECRET"
    exit 1
fi

# Configurer LINKEDIN_REDIRECT_URI si fourni
if [ ! -z "$LINKEDIN_REDIRECT_URI" ]; then
    echo "$LINKEDIN_REDIRECT_URI" | wrangler secret put LINKEDIN_REDIRECT_URI
    if [ $? -eq 0 ]; then
        echo "✅ LINKEDIN_REDIRECT_URI configuré: $LINKEDIN_REDIRECT_URI"
    else
        echo "⚠️ Erreur lors de la configuration de LINKEDIN_REDIRECT_URI (non critique)"
    fi
fi

echo ""
echo "🚀 Déploiement du Worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration terminée avec succès!"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Allez sur https://www.linkedin.com/developers/apps"
    echo "2. Sélectionnez votre application"
    echo "3. Allez dans l'onglet 'Auth'"
    echo "4. Ajoutez votre URL de redirection dans 'Authorized redirect URLs'"
    echo "5. Testez la connexion sur votre site!"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi

