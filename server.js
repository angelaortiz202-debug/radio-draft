const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        // CAMBIO CLAVE: Usamos el modelo 2.0 que es el estándar actual
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Actúa como radiólogo de DIAGNOSTICO ADAX. 
        Analiza detalladamente esta imagen de ${estudio} de la región ${region}. 
        Genera un informe con HALLAZGOS e IMPRESIÓN DIAGNÓSTICA en español profesional.`;

        const base64Data = image.split(",")[1];

        // Estructura de "Contents" recomendada para evitar errores de versión
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
        console.error("ERROR ADAX:", error.message);
        res.status(500).json({ texto: "Error en servidor: " + error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ADAX con Gemini 2.0 activo en puerto ${PORT}`);
});
// Update final 10-03-2026