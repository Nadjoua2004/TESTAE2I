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
        endpoints: ['POST /upload', 'POST /delete']
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  };