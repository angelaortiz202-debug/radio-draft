const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Servir archivos estáticos (Interfaz y Logo)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Configuración de Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;

        // MODELO 1.5-FLASH: Tiene límites de cuota gratuita mucho más amplios
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como radiólogo experto de DIAGNOSTICO ADAX. 
        Analiza detalladamente esta imagen de ${estudio} - ${region}. 
        Genera un informe profesional con:
        1. HALLAZGOS: (Descripción técnica detallada).
        2. IMPRESIÓN DIAGNÓSTICA: (Conclusión médica).
        Escribe en español profesional y directo.`;

        const base64Data = image.split(",")[1];

        // Estructura de mensaje moderna y robusta
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
        // Si sigue saliendo 429, el mensaje nos lo confirmará aquí
        res.status(500).json({ texto: "Error de Sistema/Cuota: " + error.message });
    }
});

// 3. Ruta para que Render cargue el index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. Puerto dinámico para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DIAGNOSTICO ADAX (1.5-Flash) activo en puerto ${PORT}`);
});