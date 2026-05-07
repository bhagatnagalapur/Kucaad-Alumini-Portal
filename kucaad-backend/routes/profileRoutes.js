const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');

// User must be logged in to create a profile or view the directory
router.post('/', verifyToken, profileController.createProfile);
router.get('/directory', verifyToken, profileController.getDirectory);

module.exports = router;