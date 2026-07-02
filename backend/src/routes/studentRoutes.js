const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentController = require('../controllers/studentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Multer storage for student assignment submission uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Protect all student routes
router.use(authenticateToken);
router.use(requireRole(['Student']));

router.get('/courses', studentController.getCourses);
router.get('/courses/:courseId', studentController.getCourseDetails);

router.post('/watch-video', studentController.watchVideo);

router.get('/notes/download/:noteId', studentController.downloadNote);

router.post('/assignments/submit', upload.single('submissionFile'), studentController.submitAssignment);

router.get('/quizzes/:quizId/questions', studentController.getQuizQuestions);
router.post('/quizzes/submit', studentController.submitQuiz);

router.get('/dashboard', studentController.getStudentDashboard);

module.exports = router;
