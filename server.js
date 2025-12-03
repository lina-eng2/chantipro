require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();

app.use(bodyParser.json());

// -------- API ----------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// -------- Pages web ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});


app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get('/project', (req, res) => {
  res.sendFile(path.join(__dirname, "public/project.html"));
});

app.get('/confidentialite', (req, res) => {
  res.sendFile(path.join(__dirname, "public/confidentialite.html"));
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));


// -------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur démarré sur http://localhost:" + PORT));
