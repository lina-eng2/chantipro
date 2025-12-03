const pool = require('../db/db');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE owner_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.getOne = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE id=$1 AND owner_id=$2",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Projet introuvable." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.create = async (req, res) => {
  const { name, location, type, surface, budget } = req.body;

  if (!name || !location)
    return res.status(400).json({ error: "Nom + localisation obligatoires" });

  try {
    const result = await pool.query(
      `INSERT INTO projects (owner_id,name,location,type,surface,budget,status)
       VALUES ($1,$2,$3,$4,$5,$6,'Brouillon')
       RETURNING *`,
      [req.user.id, name, location, type, surface, budget]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
};
