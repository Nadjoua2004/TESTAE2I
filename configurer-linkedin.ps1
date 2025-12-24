# Script de configuration LinkedIn pour AE2I (PowerShell)
# Ce script configure les secrets LinkedIn dans Cloudflare Worker

Write-Host "🔗 Configuration LinkedIn pour AE2I" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si wrangler est installé
try {
    $null = Get-Command wrangler -ErrorAction Stop
    Write-Host "✅ Wrangler CLI détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler CLI n'est pas installé." -ForegroundColor Red
    Write-Host "📦 Installation: npm install -g wrangler" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Aller dans le dossier cloudflare-worker
if (-not (Test-Path "cloudflare-worker")) {
    Write-Host "❌ Le dossier cloudflare-worker n'existe pas" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Set-Location cloudflare-worker

Write-Host "📝 Configuration des secrets LinkedIn" -ForegroundColor Cyan
Write-Host ""

# Demander le Client ID
$LINKEDIN_CLIENT_ID = Read-Host "1️⃣ Entrez votre LinkedIn Client ID"

if ([string]::IsNullOrWhiteSpace($LINKEDIN_CLIENT_ID)) {
    Write-Host "❌ Client ID ne peut pas être vide" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Demander le Client Secret
$secureSecret = Read-Host "2️⃣ Entrez votre LinkedIn Client Secret" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
$LINKEDIN_CLIENT_SECRET = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($LINKEDIN_CLIENT_SECRET)) {
    Write-Host "❌ Client Secret ne peut pas être vide" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Demander l'URL de redirection (optionnel)
Write-Host ""
Write-Host "3️⃣ Entrez votre URL de redirection (optionnel, appuyez sur Entrée pour ignorer):" -ForegroundColor Yellow
Write-Host "   Exemple: https://votre-domaine.com/carriere" -ForegroundColor Gray
$LINKEDIN_REDIRECT_URI = Read-Host

Write-Host ""
Write-Host "⚙️ Configuration des secrets dans Cloudflare Worker..." -ForegroundColor Cyan
Write-Host ""

# Configurer LINKEDIN_CLIENT_ID
Write-Host "Configuration de LINKEDIN_CLIENT_ID..." -ForegroundColor Yellow
$process = Start-Process -FilePath "wrangler" -ArgumentList "secret", "put", "LINKEDIN_CLIENT_ID" -NoNewWindow -Wait -PassThru -RedirectStandardInput "input.txt"
$LINKEDIN_CLIENT_ID | wrangler secret put LINKEDIN_CLIENT_ID
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ LINKEDIN_CLIENT_ID configuré" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la configuration de LINKEDIN_CLIENT_ID" -ForegroundColor Red
    Write-Host "💡 Essayez de le configurer manuellement avec: wrangler secret put LINKEDIN_CLIENT_ID" -ForegroundColor Yellow
}

# Configurer LINKEDIN_CLIENT_SECRET
Write-Host "Configuration de LINKEDIN_CLIENT_SECRET..." -ForegroundColor Yellow
$LINKEDIN_CLIENT_SECRET | wrangler secret put LINKEDIN_CLIENT_SECRET
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ LINKEDIN_CLIENT_SECRET configuré" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la configuration de LINKEDIN_CLIENT_SECRET" -ForegroundColor Red
    Write-Host "💡 Essayez de le configurer manuellement avec: wrangler secret put LINKEDIN_CLIENT_SECRET" -ForegroundColor Yellow
}

# Configurer LINKEDIN_REDIRECT_URI si fourni
if (-not [string]::IsNullOrWhiteSpace($LINKEDIN_REDIRECT_URI)) {
    Write-Host "Configuration de LINKEDIN_REDIRECT_URI..." -ForegroundColor Yellow
    $LINKEDIN_REDIRECT_URI | wrangler secret put LINKEDIN_REDIRECT_URI
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ LINKEDIN_REDIRECT_URI configuré: $LINKEDIN_REDIRECT_URI" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Erreur lors de la configuration de LINKEDIN_REDIRECT_URI (non critique)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🚀 Déploiement du Worker..." -ForegroundColor Cyan
wrangler deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Configuration terminée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "1. Allez sur https://www.linkedin.com/developers/apps" -ForegroundColor White
    Write-Host "2. Sélectionnez votre application" -ForegroundColor White
    Write-Host "3. Allez dans l'onglet 'Auth'" -ForegroundColor White
    Write-Host "4. Ajoutez votre URL de redirection dans 'Authorized redirect URLs'" -ForegroundColor White
    Write-Host "5. Testez la connexion sur votre site!" -ForegroundColor White
} else {
    Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"

