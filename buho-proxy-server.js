// Servidor Proxy para Búho WhatsApp API
// Deploy gratis en Vercel, Railway o Render
// Solución para el problema de certificado SSL

const express = require('express');
const cors = require('cors');
const https = require('https');

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

// Función helper para hacer peticiones HTTPS
function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: options.headers,
      agent: httpsAgent,
    };

    console.log('🔵 Haciendo petición a:', url);
    console.log('🔵 Headers:', JSON.stringify(options.headers, null, 2));
    console.log('🔵 Body:', JSON.stringify(body, null, 2));

    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`🔵 Status: ${res.statusCode}`);
        console.log(`🔵 Respuesta raw (primeros 500 chars):`, data.substring(0, 500));
        
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ JSON parseado correctamente');
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          console.log('⚠️ No es JSON válido, devolviendo raw');
          resolve({ 
            status: res.statusCode, 
            data: { 
              error: 'Respuesta no es JSON',
              raw: data.substring(0, 1000),
              parseError: e.message
            } 
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('🔴 Error en request:', error);
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

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

    const response = await makeRequest(`${BUHO_BASE_URL}/api/mensaje/enviar-texto`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AssistComp-Proxy/1.0'
      }
    }, { numero, mensaje });

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ Proxy: Mensaje enviado exitosamente`);
      res.json(response.data);
    } else {
      console.error('❌ Proxy Error:', response.data);
      res.status(response.status).json({ 
        error: 'Error en el proxy',
        details: response.data 
      });
    }
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

    const response = await makeRequest(`${BUHO_BASE_URL}/api/mensaje/enviar/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AssistComp-Proxy/1.0'
      }
    }, { numero, mensaje, archivo, nombreArchivo });

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ Proxy: PDF enviado exitosamente`);
      res.json(response.data);
    } else {
      console.error('❌ Proxy Error:', response.data);
      res.status(response.status).json({ 
        error: 'Error en el proxy',
        details: response.data 
      });
    }
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

    const response = await makeRequest(`${BUHO_BASE_URL}/api/mensaje/enviar-medios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AssistComp-Proxy/1.0'
      }
    }, { numero, media, caption, enlace });

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ Proxy: Media enviado exitosamente`);
      res.json(response.data);
    } else {
      console.error('❌ Proxy Error:', response.data);
      res.status(response.status).json({ 
        error: 'Error en el proxy',
        details: response.data 
      });
    }
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
