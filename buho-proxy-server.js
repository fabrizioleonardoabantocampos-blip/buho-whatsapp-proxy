// Servidor Proxy para Búho WhatsApp API
// Deploy gratis en Vercel, Railway o Render
// Solución para el problema de certificado SSL

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS para permitir peticiones desde Supabase
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Agente HTTPS que NO valida certificados (solo para Búho)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Ignora errores de certificado SSL
});

const BUHO_BASE_URL = 'https://eliascoronado.qr.buho.la';

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Búho Proxy Server está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Proxy para enviar texto
app.post('/api/mensaje/enviar-texto', async (req, res) => {
  try {
    const { numero, mensaje } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    console.log(`📤 Proxy: Enviando texto a ${numero}`);

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${BUHO_BASE_URL}/api/mensaje/enviar-texto`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AssistComp-Proxy/1.0'
      },
      body: JSON.stringify({ numero, mensaje }),
      agent: httpsAgent // Usa el agente que ignora SSL
    });

    const data = await response.json();
    console.log(`✅ Proxy: Mensaje enviado exitosamente`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({ 
      error: 'Error en el proxy',
      details: error.message 
    });
  }
});

// Proxy para enviar PDF
app.post('/api/mensaje/enviar/pdf', async (req, res) => {
  try {
    const { numero, mensaje, archivo, nombreArchivo } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    console.log(`📤 Proxy: Enviando PDF a ${numero} - ${nombreArchivo}`);

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${BUHO_BASE_URL}/api/mensaje/enviar/pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AssistComp-Proxy/1.0'
      },
      body: JSON.stringify({ numero, mensaje, archivo, nombreArchivo }),
      agent: httpsAgent
    });

    const data = await response.json();
    console.log(`✅ Proxy: PDF enviado exitosamente`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({ 
      error: 'Error en el proxy',
      details: error.message 
    });
  }
});

// Proxy para enviar medios
app.post('/api/mensaje/enviar-medios', async (req, res) => {
  try {
    const { numero, media, caption, enlace } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    console.log(`📤 Proxy: Enviando ${media} a ${numero}`);

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${BUHO_BASE_URL}/api/mensaje/enviar-medios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AssistComp-Proxy/1.0'
      },
      body: JSON.stringify({ numero, media, caption, enlace }),
      agent: httpsAgent
    });

    const data = await response.json();
    console.log(`✅ Proxy: Media enviado exitosamente`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({ 
      error: 'Error en el proxy',
      details: error.message 
    });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error del servidor:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor proxy',
    message: error.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Búho Proxy Server corriendo en puerto ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
