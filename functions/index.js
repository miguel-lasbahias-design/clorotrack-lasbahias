// Cloud Function v2: proxy hacia la API de Anthropic.
// Permite que el navegador (incluido el móvil) llame a Claude
// sin exponer la API key ni chocar con CORS.
//
// La key se lee del secret ANTHROPIC_API_KEY configurado con:
//   firebase functions:secrets:set ANTHROPIC_API_KEY
//
// Se accede via Firebase Hosting rewrite en /api/claude.

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

exports.claudeProxy = onRequest(
  {
    secrets: [ANTHROPIC_API_KEY],
    region: 'us-central1',
    cors: false,    // CORS lo manejamos manualmente para tener control total
    memory: '512MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const apiKey = ANTHROPIC_API_KEY.value();
    if (!apiKey) {
      res.status(500).json({
        error: 'ANTHROPIC_API_KEY no configurada en Firebase Secrets',
      });
      return;
    }

    try {
      // Reenviar al endpoint de Anthropic con la key inyectada
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(req.body),
      });

      const text = await upstream.text();
      res
        .status(upstream.status)
        .type('application/json')
        .send(text);
    } catch (err) {
      res.status(502).json({
        error: 'Upstream error',
        detail: String(err && err.message ? err.message : err),
      });
    }
  }
);
