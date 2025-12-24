@echo off
REM Script de configuration LinkedIn pour AE2I (Windows)
REM Ce script configure les secrets LinkedIn dans Cloudflare Worker

echo 🔗 Configuration LinkedIn pour AE2I
echo ======================================
echo.

REM Vérifier si wrangler est installé
where wrangler >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Wrangler CLI n'est pas installé.
    echo 📦 Installation: npm install -g wrangler
    pause
    exit /b 1
)

echo ✅ Wrangler CLI détecté
echo.

REM Aller dans le dossier cloudflare-worker
if not exist "cloudflare-worker" (
    echo ❌ Le dossier cloudflare-worker n'existe pas
    pause
    exit /b 1
)

cd cloudflare-worker

echo 📝 Configuration des secrets LinkedIn
echo.

REM Demander le Client ID
set /p LINKEDIN_CLIENT_ID="1️⃣ Entrez votre LinkedIn Client ID: "

if "%LINKEDIN_CLIENT_ID%"=="" (
    echo ❌ Client ID ne peut pas être vide
    pause
    exit /b 1
)

REM Demander le Client Secret
set /p LINKEDIN_CLIENT_SECRET="2️⃣ Entrez votre LinkedIn Client Secret: "

if "%LINKEDIN_CLIENT_SECRET%"=="" (
    echo ❌ Client Secret ne peut pas être vide
    pause
    exit /b 1
)

REM Demander l'URL de redirection (optionnel)
echo.
set /p LINKEDIN_REDIRECT_URI="3️⃣ Entrez votre URL de redirection (optionnel, appuyez sur Entrée pour ignorer): "
echo    Exemple: https://votre-domaine.com/carriere

echo.
echo ⚙️ Configuration des secrets dans Cloudflare Worker...
echo.

REM Configurer LINKEDIN_CLIENT_ID
echo %LINKEDIN_CLIENT_ID% | wrangler secret put LINKEDIN_CLIENT_ID
if %ERRORLEVEL% EQU 0 (
    echo ✅ LINKEDIN_CLIENT_ID configuré
) else (
    echo ❌ Erreur lors de la configuration de LINKEDIN_CLIENT_ID
    pause
    exit /b 1
)

REM Configurer LINKEDIN_CLIENT_SECRET
echo %LINKEDIN_CLIENT_SECRET% | wrangler secret put LINKEDIN_CLIENT_SECRET
if %ERRORLEVEL% EQU 0 (
    echo ✅ LINKEDIN_CLIENT_SECRET configuré
) else (
    echo ❌ Erreur lors de la configuration de LINKEDIN_CLIENT_SECRET
    pause
    exit /b 1
)

REM Configurer LINKEDIN_REDIRECT_URI si fourni
if not "%LINKEDIN_REDIRECT_URI%"=="" (
    echo %LINKEDIN_REDIRECT_URI% | wrangler secret put LINKEDIN_REDIRECT_URI
    if %ERRORLEVEL% EQU 0 (
        echo ✅ LINKEDIN_REDIRECT_URI configuré: %LINKEDIN_REDIRECT_URI%
    ) else (
        echo ⚠️ Erreur lors de la configuration de LINKEDIN_REDIRECT_URI (non critique)
    )
)

echo.
echo 🚀 Déploiement du Worker...
wrangler deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Configuration terminée avec succès!
    echo.
    echo 📋 Prochaines étapes:
    echo 1. Allez sur https://www.linkedin.com/developers/apps
    echo 2. Sélectionnez votre application
    echo 3. Allez dans l'onglet 'Auth'
    echo 4. Ajoutez votre URL de redirection dans 'Authorized redirect URLs'
    echo 5. Testez la connexion sur votre site!
) else (
    echo ❌ Erreur lors du déploiement
)

pause

