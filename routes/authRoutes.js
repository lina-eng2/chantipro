const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post("/register", (req, res) => {
  console.log("✅ /api/auth/register HIT", req.body);
  return res.status(200).json({ ok: true, body: req.body });
});


//router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
