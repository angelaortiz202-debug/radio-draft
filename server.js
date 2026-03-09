const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Archivos estáticos desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 2. Configuración de IA (Asegúrate de tener GEMINI_API_KEY en Render)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        // Usamos la potencia de la 2.0
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Actúa como radiólogo experto de DIAGNOSTICO ADAX. 
        Analiza esta imagen de ${estudio} - ${region}. 
        Genera un informe con HALLAZGOS detallados e IMPRESIÓN DIAGNÓSTICA profesional en español.`;

        const base64Data = image.split(",")[1];

        // --- TU AJUSTE MAESTRO APLICADO AQUÍ ---
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        });

        const response = await result.response;
        res.json({ texto: response.text() });

    } catch (error) {
        console.error("ERROR EN SERVIDOR ADAX:", error.message);
        res.status(500).json({ texto: "Error técnico: " + error.message });
    }
});

// 3. Ruta principal para Render
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. Puerto dinámico
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DIAGNOSTICO ADAX con Gemini 2.0 activo en puerto ${PORT}`);
});