const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protect all admin routes with JWT and Admin role check
router.use(authenticateToken);
router.use(requireRole(['Admin']));

router.post('/students', adminController.createStudent);
router.get('/students', adminController.getStudents);

router.post('/lecturers', adminController.createLecturer);
router.get('/lecturers', adminController.getLecturers);

router.post('/reset-password', adminController.resetUserPassword);

router.post('/batches', adminController.createBatch);
router.get('/batches', adminController.getBatches);

router.post('/courses', adminController.createCourse);
router.get('/courses', adminController.getCourses);

router.get('/stats', adminController.getStats);

module.exports = router;
