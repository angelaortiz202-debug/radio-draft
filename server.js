require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Para aceptar imágenes base64

// Verificación de API KEY en los Logs de Render
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: Falta GEMINI_API_KEY en las variables de entorno.");
}

app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        // Usamos el modelo más moderno y con mejor visión
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Actúa como radiólogo experto de DIAGNOSTICO ADAX. 
        Analiza la imagen de ${estudio} de ${region}. 
        Proporciona un informe estructurado con: Hallazgos e Impresión Diagnóstica. 
        Usa lenguaje médico profesional en español.`;

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
        console.error("❌ ERROR IA:", error.message);
        res.status(500).json({ texto: "Error en el análisis: " + error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ADAX Live en puerto ${PORT}`);
});