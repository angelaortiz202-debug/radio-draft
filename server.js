const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// Configuraciones iniciales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Conexión con la Inteligencia Artificial
// Asegúrate de que en Render la variable se llame exactamente: GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let db;

// Configuración de la Base de Datos
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
    console.log("✅ DIAGNOSTICO ADAX: Base de datos y IA listas");
})();

// --- RUTA 1: BIENVENIDA (Para que no salga "Cannot GET /") ---
app.get('/', (req, res) => {
    res.send("🚀 El cerebro de DIAGNOSTICO ADAX está encendido y conectado a Gemini.");
});

// --- RUTA 2: EL CEREBRO (Análisis de Imágenes con IA) ---
app.post('/analizar-imagen', async (req, res) => {
    try {
        const { image, region, estudio } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ Error: No se encontró la API KEY");
            return res.status(500).json({ texto: "Error de configuración: Falta la llave de IA en Render." });
        }

        const model = genAI.getGenerativeModel({model: "gemini-pro-vision" }, { apiVersion: 'v1beta' });

        const prompt = `Actúa como un radiólogo experto de la empresa DIAGNOSTICO ADAX. 
        Analiza esta imagen médica de ${estudio} de la región ${region}. 
        Genera un informe detallado con:
        - HALLAZGOS: (Descripción técnica profesional)
        - IMPRESIÓN DIAGNÓSTICA: (Conclusión clara)
        Usa terminología médica precisa y sé muy profesional.`;

        // Limpiar el formato de la imagen para que Gemini lo entienda
        const imageData = image.split(",")[1];
        
        // Llamada a Gemini
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
        const textoIA = response.text();
        
        res.json({ texto: textoIA });

    } catch (error) {
        console.error("❌ ERROR EN EL SERVIDOR:", error.message);
        res.status(500).json({ texto: "La IA tuvo un problema técnico: " + error.message });
    }
});

// --- RUTA 3: LISTADO DE CÓDIGOS MÉDICOS ---
app.get('/cie10', (req, res) => {
    res.json([
        { codigo: "R05X", nombre: "Tos (RX Tórax)" },
        { codigo: "J189", nombre: "Neumonía" },
        { codigo: "M545", nombre: "Lumbago" }
    ]);
});

// --- RUTA 4: GUARDAR INFORMES ---
app.post('/studies', async (req, res) => {
    const { patient_name, region, hallazgos, impresion, cie10_code } = req.body;
    const status = (hallazgos || impresion) ? 'Edited' : 'Draft';
    const result = await db.run(
        'INSERT INTO studies (patient_name, region, hallazgos, impresion, cie10_code, status) VALUES (?, ?, ?, ?, ?, ?)',
        [patient_name, region, hallazgos, impresion, cie10_code, status]
    );
    res.status(201).json({ id: result.lastID, status });
});

// Lanzar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto: ${PORT}`));