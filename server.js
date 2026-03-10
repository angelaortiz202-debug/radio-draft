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
        
        // Forzamos el modelo 2.0 Flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como radiólogo de DIAGNOSTICO ADAX. Analiza la imagen de ${estudio} - ${region}. Hallazgos e impresión diagnóstica.`;

        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }
                ]
            }]
        });

        const response = await result.response;
        res.json({ texto: response.text() });

    } catch (error) {
        console.error("❌ ERROR REAL IA:", error); // Esto nos dirá el error real en los logs
        res.status(500).json({ texto: "Error en servidor ADAX: " + error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DIAGNOSTICO ADAX Corriendo en puerto ${PORT}`);
});