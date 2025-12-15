const pool = require('../db/db');

// Récupérer tous les projets du MOA connecté
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, location, type, surface, budget, status, created_at
       FROM projects
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Erreur getProjects:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// Créer un nouveau projet (MOA)
exports.createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'MOA') {
      return res.status(403).json({ error: 'Seul le MOA peut créer un projet.' });
    }

    const { name, location, type, surface, budget } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Nom et localisation sont obligatoires.' });
    }

    const result = await pool.query(
      `INSERT INTO projects (owner_id, name, location, type, surface, budget)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [userId, name, location, type || null, surface || null, budget || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur createProject:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// Récupérer le détail d’un projet
exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, owner_id, name, location, type, surface, budget, status, created_at
       FROM projects
       WHERE id = $1`,
      [projectId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    const project = result.rows[0];

    // Pour l’instant, seul le propriétaire peut voir
    if (project.owner_id !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé à ce projet.' });
    }

    return res.json(project);
  } catch (err) {
    console.error('Erreur getProjectById:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ⭐ Mise à jour complète d’un projet (MOA propriétaire)
exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Seul le MOA peut modifier son projet
    if (userRole !== 'MOA') {
      return res.status(403).json({ error: 'Seul le MOA peut modifier le projet.' });
    }

    const {
      name,
      location,
      type,
      surface,
      budget,
      status,
    } = req.body;

    // Statuts autorisés
    const allowedStatus = ['Brouillon', 'En cours', 'Complet'];
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = $1,
           location = $2,
           type = $3,
           surface = $4,
           budget = $5,
           status = $6
       WHERE id = $7 AND owner_id = $8
       RETURNING *`,
      [
        name,
        location,
        type || null,
        surface || null,
        budget || null,
        status || 'En cours',
        projectId,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Projet introuvable ou non autorisé.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur updateProject:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
