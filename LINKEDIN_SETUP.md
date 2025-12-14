# LinkedIn Integration Setup Guide

## Overview

The LinkedIn integration allows job applicants to connect with LinkedIn to auto-fill the application form with their profile data. The integration uses Cloudflare Workers for secure backend operations.

## Architecture

- **Frontend**: `public/script.js` - Handles OAuth flow and form auto-fill
- **Backend**: `cloudflare-worker/src/index.js` - Handles OAuth token exchange and profile fetching
- **Endpoints**:
  - `GET /linkedin/key` - Returns LinkedIn Client ID
  - `POST /linkedin/auth` - Exchanges authorization code for access token and fetches user profile

## Setup Steps

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Note your **Client ID** and **Client Secret**
4. **IMPORTANT - Configure Redirect URLs:**
   - Go to your app → **Auth** tab
   - Under **"Authorized redirect URLs for your app"**, add:
     - For production: `https://yourdomain.com/carriere` (replace with your actual domain)
     - For local testing: `http://localhost:8080/carriere` (or whatever port you use)
   - **CRITICAL**: The redirect URI must match EXACTLY:
     - Same protocol (`http` vs `https`)
     - Same domain
     - Same path (`/carriere`)
     - No trailing slash unless your URL has one
     - Same port number (if testing locally)
   
   **To find your exact redirect URI:**
   1. Open your career page in browser
   2. Open browser console (F12)
   3. Click "Se connecter avec LinkedIn"
   4. Check console log - it will show: `🔗 [LINKEDIN] Using redirect URI: ...`
   5. Copy that EXACT URL and add it to LinkedIn app settings

### 2. Configure Cloudflare Worker Secrets

Set the LinkedIn credentials as secrets in your Cloudflare Worker:

```bash
cd cloudflare-worker

# Set LinkedIn Client ID
wrangler secret put LINKEDIN_CLIENT_ID
# When prompted, enter your LinkedIn Client ID

# Set LinkedIn Client Secret
wrangler secret put LINKEDIN_CLIENT_SECRET
# When prompted, enter your LinkedIn Client Secret

# (Optional) Set custom redirect URI
wrangler secret put LINKEDIN_REDIRECT_URI
# When prompted, enter: https://yourdomain.com/carriere
```

### 3. Deploy Cloudflare Worker

```bash
cd cloudflare-worker
wrangler deploy
```

### 4. Update Frontend Configuration

The frontend automatically uses the worker URL from `R2_CONFIG.workerUrl`. Make sure it's set correctly in `public/script.js`:

```javascript
const R2_CONFIG = {
    workerUrl: 'https://upload-ae2i.ae2ialgerie2025.workers.dev',
    publicUrl: 'https://pub-298ee83d49284d7cc8b8c2eac280bf44.r2.dev/ae2i-cvs-algerie'
};
```

### 5. Test the Integration

1. Go to your career page (`/carriere`)
2. Click "Se connecter avec LinkedIn"
3. Authorize the app on LinkedIn
4. You should be redirected back and the form should auto-fill

## How It Works

1. **User clicks "Connect with LinkedIn"**
   - Frontend calls `GET /linkedin/key` to get Client ID
   - Redirects user to LinkedIn OAuth page

2. **User authorizes on LinkedIn**
   - LinkedIn redirects back with authorization code
   - Frontend calls `handleLinkedInCallback()`

3. **Backend exchanges code for token**
   - Frontend calls `POST /linkedin/auth` with authorization code
   - Worker exchanges code for access token
   - Worker fetches user profile from LinkedIn API

4. **Form auto-fills**
   - Profile data is returned to frontend
   - `prefillFormWithLinkedInData()` fills form fields
   - User's LinkedIn profile opens in new tab

## Security Notes

- **Client Secret** is stored securely in Cloudflare Worker secrets (never exposed to frontend)
- **OAuth state parameter** prevents CSRF attacks
- **Access tokens** are stored in `sessionStorage` (cleared on browser close)
- **CORS headers** are properly configured

## Troubleshooting

### "LinkedIn Client ID not configured"
- Make sure you've set `LINKEDIN_CLIENT_ID` secret in Cloudflare Worker
- Redeploy the worker after setting secrets

### "Failed to exchange code for token"
- Check that `LINKEDIN_CLIENT_SECRET` is set correctly
- Verify redirect URI matches exactly in LinkedIn app settings
- Check Cloudflare Worker logs: `wrangler tail`

### "Failed to fetch LinkedIn profile"
- LinkedIn API may have rate limits
- Check that your LinkedIn app has the correct permissions
- Verify the access token is valid

### Form doesn't auto-fill
- Check browser console for errors
- Verify `prefillFormWithLinkedInData()` is being called
- Check that form field IDs match (`applicantLastName`, `applicantFirstName`, etc.)

## API Endpoints Reference

### GET /linkedin/key
Returns LinkedIn Client ID and redirect URI.

**Response:**
```json
{
  "client_id": "your_client_id",
  "redirect_uri": "https://yourdomain.com/carriere"
}
```

### POST /linkedin/auth
Exchanges authorization code for access token and fetches user profile.

**Request:**
```json
{
  "code": "authorization_code_from_linkedin"
}
```

**Response:**
```json
{
  "success": true,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "headline": "Software Engineer",
  "profilePicture": "https://...",
  "sub": "linkedin_user_id",
  "access_token": "access_token_here"
}
```

## LinkedIn API Permissions Required

The integration requires the following LinkedIn API scopes:
- `openid` - For OAuth 2.0 authentication
- `profile` - For basic profile information
- `email` - For user email address

Make sure these are enabled in your LinkedIn app settings.

