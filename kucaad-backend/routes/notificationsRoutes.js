const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, notificationsController.getNotifications);
router.patch('/:id/read', verifyToken, notificationsController.markNotificationRead);
router.patch('/read-all', verifyToken, notificationsController.markAllRead);

module.exports = router;
