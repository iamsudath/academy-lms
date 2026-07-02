const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const lecturerController = require('../controllers/lecturerController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Multer file upload setup for PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Protect all lecturer routes
router.use(authenticateToken);
router.use(requireRole(['Lecturer']));

router.post('/modules', lecturerController.createModule);
router.get('/modules/course/:courseId', lecturerController.getModules);

router.post('/lessons', lecturerController.createLesson);

router.post('/notes', upload.single('pdf'), lecturerController.addNote);

router.post('/assignments', lecturerController.createAssignment);

router.post('/quizzes', lecturerController.createQuiz);

router.get('/submissions', lecturerController.getSubmissions);
router.post('/submissions/grade', lecturerController.gradeSubmission);

router.get('/quiz-results', lecturerController.getQuizResultsSummary);

module.exports = router;
