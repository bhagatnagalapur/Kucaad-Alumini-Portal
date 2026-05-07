const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const aboutController = require('../controllers/aboutController');
const executiveController = require('../controllers/executiveController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Must be logged in AND be an admin
// Moderation Routes
router.get('/pending', verifyToken, verifyAdmin, adminController.getPendingApprovals);
router.put('/update-status/:id', verifyToken, verifyAdmin, adminController.updateUserStatus);

// Job Moderation
router.get('/jobs/pending', verifyToken, verifyAdmin, adminController.getPendingJobs);
router.put('/jobs/:id', verifyToken, verifyAdmin, adminController.updateJobStatus);

// Event Moderation
router.get('/events/pending', verifyToken, verifyAdmin, adminController.getPendingEvents);
router.put('/events/:id', verifyToken, verifyAdmin, adminController.updateEventStatus);

router.get('/users-table', verifyToken, verifyAdmin, adminController.getUsersTable);
router.post('/create-user', verifyToken, verifyAdmin, adminController.createUser);
router.put('/user-role/:id', verifyToken, verifyAdmin, adminController.updateUserRole);
router.get('/about-us', verifyToken, aboutController.getAboutUs);
router.put('/about-us', verifyToken, verifyAdmin, aboutController.saveAboutUs);
router.get('/executives', verifyToken, executiveController.getExecutiveMembers);
router.put('/executives', verifyToken, verifyAdmin, executiveController.saveExecutiveMembers);

module.exports = router;
