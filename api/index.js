const express = require('express');
const path = require('path');

const app = express();

// Servir archivos estáticos desde api/public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta Principal (Inicio y Bitácora)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de Proyectos (Conectada a GitHub)
app.get('/proyectos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'proyectos.html'));
});

module.exports = app;
