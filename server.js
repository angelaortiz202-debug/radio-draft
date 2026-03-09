const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Servir archivos estáticos (Interfaz y Logo)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Configuración de Google AI (Sin especificar versión aquí para evitar el bug v1beta)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;

        // SELECCIÓN DEL MODELO: Usamos el nombre base que es el más compatible en Render
        // Si gemini-1.5-flash-latest falló, este nombre estándar es el "comodín"
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como radiólogo experto de la empresa DIAGNOSTICO ADAX. 
        Analiza detalladamente esta imagen médica de ${estudio} de la región ${region}. 
        Proporciona un informe profesional con:
        1. HALLAZGOS: (Descripción técnica).
        2. IMPRESIÓN DIAGNÓSTICA: (Conclusión médica).
        Escribe en español profesional y directo.`;

        // Extraer la base64 pura
        const base64Data = image.split(",")[1];

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        
        res.json({ texto: text });

    } catch (error) {
        console.error("Error detallado en el servidor:", error);
        // Enviamos el error específico para saber qué pasó exactamente
        res.status(500).json({ texto: "Error IA: " + error.message });
    }
});

// 3. Ruta principal para Render
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. Inicio del Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor DIAGNOSTICO ADAX activo en puerto ${PORT}`);
});