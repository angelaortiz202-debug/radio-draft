const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir la interfaz desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Gemini 1.5 Flash (Versión estable)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const prompt = `Actúa como radiólogo de DIAGNOSTICO ADAX. 
        Analiza esta imagen médica de ${estudio} de la región ${region}. 
        Genera HALLAZGOS detallados e IMPRESIÓN DIAGNÓSTICA profesional en español.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" } }
        ]);

        res.json({ texto: result.response.text() });
    } catch (error) {
        console.error("Error IA:", error.message);
        res.status(500).json({ texto: "Error en el servidor: " + error.message });
    }
});

// Ruta para que Render cargue el HTML al entrar a la URL
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ADAX corriendo en puerto ${PORT}`);
});