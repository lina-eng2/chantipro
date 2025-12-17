require('dotenv').config();
const express = require('express');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const documentRoutes = require("./routes/documentRoutes");

const app = express();

// -------- Parsers (avant les routes) ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------- Static files ----------
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// -------- Uploads (fichiers) ----------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------- API ----------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use("/api/documents", documentRoutes);

// -------- Pages web ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// (optionnel) ancien lien dashboard → redirige vers MOA
app.get('/dashboard', (req, res) => {
  return res.redirect('/dashboard/moa');
});

// Routes par rôle
app.get('/dashboard/moa', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-moa.html'));
});

app.get('/dashboard/architecte', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-architecte.html'));
});

app.get('/dashboard/amoa', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-amoa.html'));
});

app.get('/dashboard/bet', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-bet.html'));
});

app.get('/dashboard/bct', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-bct.html'));
});

app.get('/dashboard/labo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-labo.html'));
});

app.get('/dashboard/topographe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-topographe.html'));
});

// Page détail projet (commune)
app.get('/project', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'project.html'));
});

app.get('/confidentialite', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confidentialite.html'));
});

// -------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur démarré sur http://localhost:" + PORT));
