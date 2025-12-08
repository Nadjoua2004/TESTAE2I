#!/bin/bash

# Script de déploiement rapide AE2I Algérie
# Usage: ./deploy.sh [cloudflare|firebase|all]

set -e  # Arrêter en cas d'erreur

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   🚀 Script de Déploiement AE2I Algérie   ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."

    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Téléchargez-le depuis https://nodejs.org/"
        exit 1
    fi
    log_success "Node.js installé : $(node --version)"

    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé."
        exit 1
    fi
    log_success "npm installé : $(npm --version)"

    echo ""
}

# Déployer sur Firebase
deploy_firebase() {
    log_info "Déploiement sur Firebase Hosting..."

    # Vérifier Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_warning "Firebase CLI n'est pas installé. Installation..."
        npm install -g firebase-tools
    fi

    # Vérifier la connexion Firebase
    log_info "Vérification de la connexion Firebase..."
    firebase projects:list &> /dev/null || {
        log_warning "Vous n'êtes pas connecté à Firebase. Connexion..."
        firebase login
    }

    # Demander confirmation
    echo -e "${YELLOW}Déployer sur Firebase Hosting ? (o/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Oo]$ ]]; then
        log_info "Déploiement en cours..."
        firebase deploy --only hosting
        log_success "Déploiement Firebase réussi !"

        # Afficher l'URL
        PROJECT_ID=$(firebase projects:list | grep '(current)' | awk '{print $2}')
        if [ ! -z "$PROJECT_ID" ]; then
            echo ""
            log_success "🌐 Votre site est accessible sur :"
            echo -e "${GREEN}   https://${PROJECT_ID}.web.app${NC}"
            echo -e "${GREEN}   https://${PROJECT_ID}.firebaseapp.com${NC}"
        fi
    else
        log_info "Déploiement Firebase annulé."
    fi

    echo ""
}

# Déployer les règles Firebase
deploy_firebase_rules() {
    log_info "Déploiement des règles Firebase..."

    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI n'est pas installé."
        return 1
    fi

    echo -e "${YELLOW}Déployer les règles Firestore et Storage ? (o/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Oo]$ ]]; then
        log_info "Déploiement des règles..."
        firebase deploy --only firestore:rules,storage:rules,firestore:indexes
        log_success "Règles déployées avec succès !"
    else
        log_info "Déploiement des règles annulé."
    fi

    echo ""
}

# Instructions Cloudflare
cloudflare_instructions() {
    log_info "Instructions pour Cloudflare Pages..."
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  📝 Déploiement Cloudflare Pages via Git             ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1. Poussez votre code sur Git (GitHub/GitLab/Bitbucket) :"
    echo -e "${GREEN}   git add .${NC}"
    echo -e "${GREEN}   git commit -m \"Prêt pour déploiement\"${NC}"
    echo -e "${GREEN}   git push origin main${NC}"
    echo ""
    echo "2. Allez sur https://dash.cloudflare.com"
    echo ""
    echo "3. Cliquez sur Pages > Create a project"
    echo ""
    echo "4. Connectez votre dépôt Git"
    echo ""
    echo "5. Configuration du build :"
    echo -e "${YELLOW}   - Framework preset: None${NC}"
    echo -e "${YELLOW}   - Build command: (laissez vide)${NC}"
    echo -e "${YELLOW}   - Build output directory: public${NC}"
    echo ""
    echo "6. Cliquez sur 'Save and Deploy'"
    echo ""
    log_success "Cloudflare déploiera automatiquement votre site !"
    echo ""
}

# Vérifier la configuration Firebase
check_firebase_config() {
    log_info "Vérification de la configuration Firebase..."

    if grep -q "VOTRE_API_KEY" public/firebase.js; then
        log_warning "Configuration Firebase non complétée !"
        echo ""
        echo -e "${YELLOW}Étapes pour configurer Firebase :${NC}"
        echo "1. Allez sur https://console.firebase.google.com"
        echo "2. Créez un projet ou sélectionnez-en un"
        echo "3. Project Settings > General > Your apps"
        echo "4. Copiez les clés de configuration"
        echo "5. Modifiez public/firebase.js avec vos vraies clés"
        echo ""
        return 1
    else
        log_success "Configuration Firebase OK"
        return 0
    fi
}

# Test local
test_local() {
    log_info "Lancement du serveur local..."

    if command -v firebase &> /dev/null; then
        log_info "Serveur Firebase Emulator sur http://localhost:5000"
        firebase serve
    else
        log_info "Serveur HTTP simple sur http://localhost:8080"
        npx http-server public -p 8080
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo -e "${BLUE}Que voulez-vous faire ?${NC}"
    echo "1) Déployer sur Firebase Hosting"
    echo "2) Déployer les règles Firebase (Firestore + Storage)"
    echo "3) Instructions Cloudflare Pages"
    echo "4) Test local (serveur de développement)"
    echo "5) Tout déployer (Firebase + Règles)"
    echo "6) Vérifier la configuration"
    echo "7) Quitter"
    echo ""
    echo -n "Votre choix (1-7) : "
}

# Main
main() {
    check_prerequisites

    # Si argument fourni
    if [ $# -eq 1 ]; then
        case $1 in
            cloudflare)
                cloudflare_instructions
                ;;
            firebase)
                check_firebase_config
                deploy_firebase
                ;;
            rules)
                deploy_firebase_rules
                ;;
            all)
                check_firebase_config
                deploy_firebase
                deploy_firebase_rules
                ;;
            test)
                test_local
                ;;
            *)
                log_error "Argument invalide. Usage: ./deploy.sh [cloudflare|firebase|rules|all|test]"
                exit 1
                ;;
        esac
        exit 0
    fi

    # Menu interactif
    while true; do
        show_menu
        read -r choice
        case $choice in
            1)
                check_firebase_config
                deploy_firebase
                ;;
            2)
                deploy_firebase_rules
                ;;
            3)
                cloudflare_instructions
                ;;
            4)
                test_local
                ;;
            5)
                check_firebase_config
                deploy_firebase
                deploy_firebase_rules
                ;;
            6)
                check_firebase_config
                ;;
            7)
                log_success "Au revoir !"
                exit 0
                ;;
            *)
                log_error "Choix invalide. Veuillez choisir entre 1 et 7."
                ;;
        esac
    done
}

# Exécuter le script
main "$@"
