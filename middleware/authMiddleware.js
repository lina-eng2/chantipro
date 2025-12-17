const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Token manquant." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Token invalide." });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié." });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Accès refusé." });
    return next();
  };
}

module.exports = { authRequired, allowRoles };
