// Cloudflare Worker example to verify Google reCAPTCHA tokens
// Deploy: wrangler publish
// Bind secret: wrangler secret put RECAPTCHA_SECRET
// Endpoint: POST /verify { token }

function jsonCors(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Access-Control-Allow-Origin', 'https://glimmercharger.github.io');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Vary', 'Origin');
  return new Response(JSON.stringify(body), { ...init, headers, status: init.status || 200 });
}

function corsOptions() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', 'https://glimmercharger.github.io');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(null, { status: 204, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/verify') return new Response('Not found', { status: 404 });

    if (request.method === 'OPTIONS') {
      return corsOptions();
    }

    if (request.method !== 'POST') {
      return jsonCors({ success: false, error: 'method-not-allowed' }, { status: 405 });
    }

    try {
      const { token } = await request.json();
      if (!token) return jsonCors({ success: false, error: 'missing-token' }, { status: 400 });

      const params = new URLSearchParams();
      params.append('secret', env.RECAPTCHA_SECRET);
      params.append('response', token);

      const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: params,
      });
      const data = await r.json();

      return jsonCors({ success: !!data.success, data });
    } catch (e) {
      return jsonCors({ success: false, error: 'server-error' }, { status: 500 });
    }
  },
};
