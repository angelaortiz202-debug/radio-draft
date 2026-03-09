const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// --- CONFIGURACIÓN DE SEGURIDAD Y CAPACIDAD ---
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Para recibir imágenes de alta calidad
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- CONEXIÓN CON EL FRONTEND (La "Cara") ---
// Esto le dice al servidor que busque el index.html en la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURACIÓN DE IA GEMINI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- RUTA 1: MOSTRAR LA PÁGINA WEB ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- RUTA 2: EL MOTOR DE ANÁLISIS IA ---
app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ texto: "Error: No se encontró la API KEY en Render." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `Actúa como un radiólogo experto de la empresa DIAGNOSTICO ADAX. 
        Analiza esta imagen médica de ${estudio} de la región ${region}. 
        Genera un informe detallado con:
        - HALLAZGOS: (Descripción técnica profesional)
        - IMPRESIÓN DIAGNÓSTICA: (Conclusión clara)
        Usa terminología médica precisa en español y sé muy profesional.`;

        const imageData = image.split(",")[1];
        
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageData,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const response = await result.response;
        res.json({ texto: response.text() });

    } catch (error) {
        console.error("Error en el servidor:", error.message);
        res.status(500).json({ texto: "Lo siento Ángela, la IA tuvo un problema técnico: " + error.message });
    }
});

// --- LANZAMIENTO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 DIAGNOSTICO ADAX operativo en el puerto ${PORT}`);
});