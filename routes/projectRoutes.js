const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authRequired } = require('../middleware/authMiddleware');

router.get('/', authRequired, projectController.listProjects);
router.post('/', authRequired, projectController.createProject);
router.get('/:id', authRequired, projectController.getProject);
router.put('/:id', authRequired, projectController.updateProject);

// invite members
router.post('/:id/invite', authRequired, projectController.inviteMember);

module.exports = router;
