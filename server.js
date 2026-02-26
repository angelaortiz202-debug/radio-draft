const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // La librería que instalaste

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentamos el límite para recibir imágenes

// Configuración de Gemini con la llave que pusiste en Render
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

// --- NUEVA RUTA: ANALIZAR IMAGEN CON IA ---
app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Instrucción profesional para la IA
        const prompt = `Actúa como un radiólogo experto de DIAGNOSTICO ADAX. 
        Analiza esta imagen de ${estudio} de la región ${region}. 
        Proporciona un informe estructurado:
        1. HALLAZGOS: Descripción técnica y anatómica.
        2. IMPRESIÓN DIAGNÓSTICA: Conclusión principal.
        Si la imagen no es clara, indícalo. Sé conciso y profesional.`;

        // Procesar la imagen (quitando el encabezado base64)
        const imageData = image.split(",")[1];
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        res.json({ texto: response.text() });

    } catch (error) {
        console.error("Error con Gemini:", error);
        res.status(500).json({ error: "La IA está descansando, intenta de nuevo." });
    }
});

// Rutas existentes mantenidas
app.get('/cie10', (req, res) => {
    res.json([
        { codigo: "R05X", nombre: "Tos (RX Tórax)" },
        { codigo: "J189", nombre: "Neumonía" },
        { codigo: "M545", nombre: "Lumbago" }
    ]);
});

app.post('/studies', async (req, res) => {
    const { patient_name, region, hallazgos, impresion, cie10_code } = req.body;
    const status = (hallazgos || impresion) ? 'Edited' : 'Draft';
    const result = await db.run(
        'INSERT INTO studies (patient_name, region, hallazgos, impresion, cie10_code, status) VALUES (?, ?, ?, ?, ?, ?)',
        [patient_name, region, hallazgos, impresion, cie10_code, status]
    );
    res.status(201).json({ id: result.lastID, status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto: ${PORT}`));