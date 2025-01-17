const express = require('express');
const cors = require('cors');
// node-fetch@2 için
const fetch = require('node-fetch');

const app = express();

// CORS ayarlarını genişlet
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Ana sayfa için basit bir endpoint
app.get('/', (req, res) => {
    res.send('Proxy server is running');
});

app.get('/proxy', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({ error: 'URL parametresi gerekli' });
        }

        console.log('İstek yapılan URL:', url);

        const response = await fetch(`https://tele-social.vercel.app/down?url=${url}`);
        if (!response.ok) {
            throw new Error(`API yanıt hatası: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Yanıtı:', data);
        res.json(data);
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy sunucusu ${PORT} portunda çalışıyor`);
    console.log(`Test için: http://localhost:${PORT}`);
}); 