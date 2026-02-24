const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

let db;

(async () => {
    db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
    // Tabla con soporte para FSM, Versiones y Plantillas [cite: 39, 58]
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
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            content TEXT
        );
    `);
    console.log("✅ RADIO DRAFT V2: Listo para la Nube");
})();

// Rutas para CIE-10 Colombia y Gestión de Estudios [cite: 60]
app.get('/cie10', (req, res) => {
    res.json([
        { codigo: "R05X", nombre: "Tos (RX Tórax)" },
        { codigo: "J189", nombre: "Neumonía" },
        { codigo: "M545", nombre: "Lumbago" }
    ]);
});

app.post('/studies', async (req, res) => {
    const { patient_name, region, hallazgos, impresion, cie10_code } = req.body;
    const status = (hallazgos || impresion) ? 'Edited' : 'Draft'; // FSM [cite: 46]
    const result = await db.run(
        'INSERT INTO studies (patient_name, region, hallazgos, impresion, cie10_code, status) VALUES (?, ?, ?, ?, ?, ?)',
        [patient_name, region, hallazgos, impresion, cie10_code, status]
    );
    res.status(201).json({ id: result.lastID, status, mensaje: "Estudio guardado como " + status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto: ${PORT}`));