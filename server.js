const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        // USAMOS 1.5 FLASH: Es más estable para cuentas gratuitas
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como radiólogo de DIAGNOSTICO ADAX. Analiza esta imagen de ${estudio} - ${region}. Genera HALLAZGOS e IMPRESIÓN DIAGNÓSTICA.`;

        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }
                ]
            }]
        });

        res.json({ texto: result.response.text() });
    } catch (error) {
        console.error("ERROR ADAX:", error.message);
        res.status(500).json({ texto: "Error de Cuota/Servidor: " + error.message });
    }
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 ADAX activo en ${PORT}`));