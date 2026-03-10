require('dotenv').config(); // IMPORTANTE: Carga la API Key del archivo .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Verificación de Seguridad en Logs de Render
console.log("🔍 Verificando API KEY...");
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: La GEMINI_API_KEY no está configurada en Render o .env");
} else {
    console.log("✅ API KEY detectada correctamente.");
}

app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        // LA MEJOR DECISIÓN: Gemini 2.0 Flash (Rápido, moderno y con visión superior)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Actúa como radiólogo experto de DIAGNOSTICO ADAX. 
        Analiza detalladamente esta imagen de ${estudio} de la región ${region}. 
        Genera un informe con HALLAZGOS e IMPRESIÓN DIAGNÓSTICA en español profesional.`;

        const base64Data = image.split(",")[1];

        // Estructura de "Contents" recomendada para el modelo 2.0
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                ]
            }]
        });

        const response = await result.response;
        res.json({ texto: response.text() });

    } catch (error) {
        console.error("❌ ERROR REAL EN SERVIDOR ADAX:", error.message);
        res.status(500).json({ texto: "Error en servidor: " + error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DIAGNOSTICO ADAX Corriendo en puerto ${PORT}`);
});