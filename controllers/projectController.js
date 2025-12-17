const pool = require('../db/db');

// helper: check membership
async function isMember(projectId, userId) {
  const r = await pool.query(
    "SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2",
    [projectId, userId]
  );
  return r.rows.length > 0;
}

exports.listProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    // MOA: projets dont il est owner + tous projets où il est membre
    const result = await pool.query(`
      SELECT p.*
      FROM projects p
      WHERE p.owner_id = $1
      UNION
      SELECT p.*
      FROM projects p
      JOIN project_members m ON m.project_id = p.id
      WHERE m.user_id = $1
      ORDER BY id DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("LIST PROJECTS ERROR 👉", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

exports.createProject = async (req, res) => {
  const { name, location, type, surface, budget } = req.body;

  try {
    // seul MOA crée un projet
    if (req.user.role !== "MOA") {
      return res.status(403).json({ error: "Seul le MOA peut créer un projet." });
    }

    if (!name || !location) {
      return res.status(400).json({ error: "Nom et localisation obligatoires." });
    }

    const result = await pool.query(
      `INSERT INTO projects (owner_id, name, location, type, surface, budget, status)
       VALUES ($1,$2,$3,$4,$5,$6,'En cours')
       RETURNING *`,
      [req.user.id, name, location, type || null, surface || null, budget || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE PROJECT ERROR 👉", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user.id;

    const proj = await pool.query("SELECT * FROM projects WHERE id=$1", [projectId]);
    if (proj.rows.length === 0) return res.status(404).json({ error: "Projet introuvable." });

    const project = proj.rows[0];

    const member = await isMember(projectId, userId);
    const isOwner = project.owner_id === userId;

    if (!isOwner && !member) return res.status(403).json({ error: "Accès refusé." });

    res.json(project);
  } catch (err) {
    console.error("GET PROJECT ERROR 👉", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user.id;
    const { name, location, type, surface, budget, status } = req.body;

    const proj = await pool.query("SELECT * FROM projects WHERE id=$1", [projectId]);
    if (proj.rows.length === 0) return res.status(404).json({ error: "Projet introuvable." });
    const project = proj.rows[0];

    // seul owner (MOA) peut modifier fiche projet + status
    if (project.owner_id !== userId) {
      return res.status(403).json({ error: "Seul le MOA propriétaire peut modifier le projet." });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name=$1, location=$2, type=$3, surface=$4, budget=$5, status=$6
       WHERE id=$7
       RETURNING *`,
      [
        name ?? project.name,
        location ?? project.location,
        type ?? project.type,
        surface ?? project.surface,
        budget ?? project.budget,
        status ?? project.status,
        projectId
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE PROJECT ERROR 👉", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

// MOA invite un user à un projet (par email) avec role_in_project
exports.inviteMember = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { email, role_in_project } = req.body;

    const proj = await pool.query("SELECT * FROM projects WHERE id=$1", [projectId]);
    if (proj.rows.length === 0) return res.status(404).json({ error: "Projet introuvable." });
    if (proj.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: "Seul le MOA propriétaire peut inviter." });
    }

    const u = await pool.query("SELECT id, role FROM users WHERE email=$1", [email]);
    if (u.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });

    const user = u.rows[0];

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role_in_project)
       VALUES ($1,$2,$3)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [projectId, user.id, role_in_project || user.role]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("INVITE ERROR 👉", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};
