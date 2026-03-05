const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
// IMPORTANTE: Aumentamos el límite para que las fotos pasen sin problema
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let db;

(async () => {
    db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS studies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT,
            modality TEXT DEFAULT 'RX',
            region TEXT,
            hallazgos TEXT,
            impresion TEXT,
            cie10_code TEXT,
            status TEXT DEFAULT 'Draft',
            version INTEGER DEFAULT 1
        );
    `);
    console.log("✅ DIAGNOSTICO ADAX: Cerebro Gemini Conectado");
})();

// ESTO QUITARÁ EL "CANNOT GET /"
app.get('/', (req, res) => {
    res.send("🚀 Servidor de DIAGNOSTICO ADAX funcionando correctamente.");
});

app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ ERROR: No hay API KEY");
            return res.status(500).json({ texto: "Error: Configuración de API incompleta." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como un radiólogo experto de la empresa DIAGNOSTICO ADAX. 
        Analiza esta imagen médica de ${estudio} de la región ${region}. 
        Genera un informe detallado con:
        - HALLAZGOS: (Descripción técnica profesional)
        - IMPRESIÓN DIAGNÓSTICA: (Conclusión clara)
        Usa terminología médica precisa y sé muy profesional.`;

        // Limpiamos el base64
        const imageData = image.split(",")[1];
        
        // CORRECCIÓN: Estructura exacta que pide Google Gemini
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
        console.error("❌ ERROR DETALLADO:", error.message);
        res.status(500).json({ texto: "La IA tuvo un problema técnico: " + error.message });
    }
});

app.get('/cie10', (req, res) => {
    res.json([
        { codigo: "R05X", nombre: "Tos (RX Tórax)" },
        { codigo: "J189", nombre: "Neumonía" },
        { codigo: "M545", nombre: "Lumbago" }
    ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto activo: ${PORT}`));