const pool = require("../db/db");

async function canAccessProject(projectId, userId) {
  // owner ou membre
  const owner = await pool.query("SELECT owner_id FROM projects WHERE id=$1", [projectId]);
  if (owner.rows.length === 0) return false;
  if (owner.rows[0].owner_id === userId) return true;

  const mem = await pool.query(
    "SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2",
    [projectId, userId]
  );
  return mem.rows.length > 0;
}

exports.listDocuments = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = req.user.id;

    if (!(await canAccessProject(projectId, userId))) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const docs = await pool.query(
      `SELECT d.*, u.email AS uploader_email
       FROM documents d
       JOIN users u ON u.id = d.uploaded_by
       WHERE d.project_id=$1
       ORDER BY d.created_at DESC`,
      [projectId]
    );

    res.json(docs.rows);
  } catch (err) {
    console.error("LIST DOCS ERROR:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = req.user.id;

    if (!(await canAccessProject(projectId, userId))) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Fichier manquant." });
    }

    const doc_type = (req.body.doc_type || "plan").trim();

    const result = await pool.query(
      `INSERT INTO documents (project_id, uploaded_by, doc_type, filename, storage_path)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [projectId, userId, doc_type, req.file.originalname, `/uploads/${req.file.filename}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("UPLOAD DOC ERROR:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.signConvention = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const documentId = Number(req.params.documentId);
    const userId = req.user.id;

    if (!(await canAccessProject(projectId, userId))) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    // vérifier que le document appartient au projet et est une "convention"
    const doc = await pool.query(
      "SELECT * FROM documents WHERE id=$1 AND project_id=$2",
      [documentId, projectId]
    );
    if (doc.rows.length === 0) return res.status(404).json({ error: "Document introuvable." });

    // tu peux forcer la signature uniquement si doc_type === 'convention'
    // sinon enlève ce check
    if (doc.rows[0].doc_type !== "convention") {
      return res.status(400).json({ error: "Ce document n'est pas une convention." });
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "";
    const ua = (req.headers["user-agent"] || "").slice(0, 255);

    await pool.query(
      `INSERT INTO convention_signatures (project_id, user_id, document_id, signer_ip, signer_user_agent)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (project_id, user_id, document_id) DO NOTHING`,
      [projectId, userId, documentId, ip, ua]
    );

    res.json({ ok: true, message: "Convention signée." });
  } catch (err) {
    console.error("SIGN CONVENTION ERROR:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
