const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware'); // ⭐ ICI : plus de {}


// Liste des projets et création
router.get('/', authMiddleware, projectController.getProjects);
router.post('/', authMiddleware, projectController.createProject);

// Détail projet
router.get('/:id', authMiddleware, projectController.getProjectById);

// Mise à jour du projet (MOA)
router.put('/:id', authMiddleware, projectController.updateProject);

module.exports = router;
