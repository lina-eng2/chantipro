const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ROLES } = require("../config/roles");

function normalizeRole(input) {
  return (input || "MOA").toString().trim().toLowerCase();
}

exports.register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe obligatoires." });
    }

    const finalRole = normalizeRole(role);

    // exemple: "ARCHITECTE" -> "architecte"
    if (!ROLES.includes(finalRole)) {
      return res.status(400).json({
        error: "Rôle invalide.",
        allowed: ROLES
      });
    }

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Email déjà utilisé." });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3) RETURNING id,email,role",
      [email, hash, finalRole]
    );

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("REGISTER ERROR 👉", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Identifiants incorrects." });
    }

    const user = result.rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ error: "Identifiants incorrects." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};
