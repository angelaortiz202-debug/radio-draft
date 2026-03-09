const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la IA con la versión estable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        // Usamos la versión de modelo que Render y Google aceptan sin errores 404
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como radiólogo de DIAGNOSTICO ADAX. 
        Analiza esta imagen de ${estudio} - ${region}. 
        Genera HALLAZGOS e IMPRESIÓN DIAGNÓSTICA en español profesional.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        res.json({ texto: response.text() });

    } catch (error) {
        console.error(error);
        res.status(500).json({ texto: "Error en el servidor: " + error.message });
    }
});

// Ruta principal para evitar el "Cannot GET /"
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 ADAX activo en puerto ${PORT}`));