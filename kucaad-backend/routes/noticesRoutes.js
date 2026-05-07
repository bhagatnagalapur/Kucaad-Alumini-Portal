const express = require('express');
const router = express.Router();
const noticesController = require('../controllers/noticesController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, noticesController.getNotices);
router.post('/', verifyToken, verifyAdmin, noticesController.createNotice);

module.exports = router;
