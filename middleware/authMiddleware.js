const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
}

module.exports = authMiddleware;
