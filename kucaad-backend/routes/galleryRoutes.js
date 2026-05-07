const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { verifyToken, verifyGalleryContributor } = require('../middleware/authMiddleware');

router.get('/', verifyToken, galleryController.getGalleryItems);
router.post('/', verifyToken, verifyGalleryContributor, galleryController.createGalleryItem);

module.exports = router;
