const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const projectController = require('../controllers/projectController');

router.get('/', authMiddleware, projectController.getAll);
router.get('/:id', authMiddleware, projectController.getOne);
router.post('/', authMiddleware, projectController.create);

module.exports = router;
