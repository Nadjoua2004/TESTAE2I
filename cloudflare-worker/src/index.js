// src/index.js
export default {
    async fetch(request, env) {
      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      };
      
      // Handle preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
      
      const url = new URL(request.url);
      
      // Upload endpoint
      if (request.method === 'POST' && url.pathname === '/upload') {
        try {
          const formData = await request.formData();
          const file = formData.get('file');
          const path = formData.get('path') || `uploads/${Date.now()}_${file.name}`;
          
          if (!file) {
            return new Response(JSON.stringify({
              success: false,
              error: 'No file provided'
            }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          
          // Upload to R2
          await env.AE2I_BUCKET.put(path, file);
          
          // Return public URL
          return new Response(JSON.stringify({
            success: true,
            url: `https://pub-298ee83d49284d7cc8b8c2eac280bf44.r2.dev/ae2i-cvs-algerie/${path}`,
            fileName: file.name,
            path: path
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Upload error:', error);
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      // Delete endpoint
      if (request.method === 'POST' && url.pathname === '/delete') {
        try {
          const data = await request.json();
          await env.AE2I_BUCKET.delete(data.path);
          
          return new Response(JSON.stringify({ success: true }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      // LinkedIn: Get Client ID endpoint
      if (request.method === 'GET' && url.pathname === '/linkedin/key') {
        try {
          const clientId = env.LINKEDIN_CLIENT_ID;
          
          if (!clientId) {
            return new Response(JSON.stringify({
              success: false,
              error: 'LinkedIn Client ID not configured'
            }), {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          
          // DON'T return redirect_uri from worker - let frontend determine it
          // The frontend knows its own URL better than the worker
          // Only return redirect_uri if explicitly set as a secret (for override)
          const redirectUri = env.LINKEDIN_REDIRECT_URI;
          
          const response = {
            client_id: clientId
          };
          
          // Only include redirect_uri if it's explicitly set (for override scenarios)
          if (redirectUri) {
            response.redirect_uri = redirectUri;
          }
          
          return new Response(JSON.stringify(response), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('LinkedIn key error:', error);
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      // LinkedIn: OAuth token exchange and profile fetch endpoint
      if (request.method === 'POST' && url.pathname === '/linkedin/auth') {
        try {
          const { code, redirect_uri } = await request.json();
          
          if (!code) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Authorization code required'
            }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          
          const clientId = env.LINKEDIN_CLIENT_ID;
          const clientSecret = env.LINKEDIN_CLIENT_SECRET;
          // Use redirect_uri from request if provided, otherwise use env secret, otherwise fail
          // This MUST match exactly what was used in the authorization request
          const redirectUri = redirect_uri || env.LINKEDIN_REDIRECT_URI;
          
          if (!redirectUri) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Redirect URI required. Either pass it in the request or set LINKEDIN_REDIRECT_URI secret.'
            }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          
          console.log('🔗 [WORKER] Using redirect URI:', redirectUri);
          
          if (!clientId || !clientSecret) {
            return new Response(JSON.stringify({
              success: false,
              error: 'LinkedIn credentials not configured'
            }), {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          
          // Step 1: Exchange authorization code for access token
          const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirectUri,
              client_id: clientId,
              client_secret: clientSecret
            })
          });
          
          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('LinkedIn token error:', errorText);
            throw new Error('Failed to exchange code for token');
          }
          
          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;
          
          if (!accessToken) {
            throw new Error('No access token received');
          }
          
          // Step 2: Fetch user profile using access token
          const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            console.error('LinkedIn profile error:', errorText);
            throw new Error('Failed to fetch LinkedIn profile');
          }
          
          const profileData = await profileResponse.json();
          
          // Step 3: Fetch additional profile details (headline, profile picture)
          let headline = '';
          let profilePicture = '';
          
          try {
            // Try to get profile with additional fields (requires different API endpoint)
            const profileV2Response = await fetch('https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (profileV2Response.ok) {
              const profileV2Data = await profileV2Response.json();
              
              // Extract profile picture if available
              if (profileV2Data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier) {
                profilePicture = profileV2Data.profilePicture.displayImage.elements[0].identifiers[0].identifier;
              }
            }
            
            // Try to get headline from profile
            const headlineResponse = await fetch('https://api.linkedin.com/v2/me?projection=(headline)', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (headlineResponse.ok) {
              const headlineData = await headlineResponse.json();
              headline = headlineData.headline || '';
            }
          } catch (e) {
            console.warn('Could not fetch additional profile data:', e);
            // Continue with basic profile data
          }
          
          // Return formatted profile data
          return new Response(JSON.stringify({
            success: true,
            firstName: profileData.given_name || profileData.firstName?.localized?.en_US || '',
            lastName: profileData.family_name || profileData.lastName?.localized?.en_US || '',
            email: profileData.email || '',
            headline: headline,
            profilePicture: profilePicture,
            sub: profileData.sub || profileData.id || '',
            access_token: accessToken
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
          
        } catch (error) {
          console.error('LinkedIn auth error:', error);
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
       // Dans la fonction fetch, ajoute:
if (request.method === 'GET' && url.pathname.startsWith('/download/')) {
    try {
        const path = url.pathname.replace('/download/', '');
        const object = await env.AE2I_BUCKET.get(path);
        
        if (object === null) {
            return new Response('File not found', { status: 404 });
        }
        
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', '*');
        
        return new Response(object.body, { headers });
    } catch (error) {
        return new Response('Error: ' + error.message, { status: 500 });
    }
}
      
      // Health check
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'AE2I Upload Worker',
        endpoints: [
          'POST /upload',
          'POST /delete',
          'GET /linkedin/key',
          'POST /linkedin/auth'
        ]
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  };