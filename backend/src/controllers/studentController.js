const db = require('../config/db');

// List courses for student (since it's a batch based system, we can filter courses or show all courses)
exports.getCourses = async (req, res) => {
  try {
    const courses = await db.query(`
      SELECT c.*, l.name as lecturer_name 
      FROM courses c
      LEFT JOIN lecturers l ON c.created_by = l.id
      ORDER BY c.created_at DESC
    `);
    res.json(courses.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Course structure with modules, lessons, notes, assignments, quizzes, and access logs
exports.getCourseDetails = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.profileId;

  try {
    // 1. Fetch modules
    const modulesRes = await db.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY sort_order ASC, id ASC', [courseId]);
    const modules = modulesRes.rows;

    if (modules.length === 0) {
      return res.json([]);
    }

    const moduleIds = modules.map(m => m.id);

    // 2. Fetch lessons in those modules
    const lessonsRes = await db.query(`
      SELECT l.*, 
             log.open_count, log.first_opened_at, 
             n.id as note_id, n.file_name as note_name, n.allow_download as note_allow_download,
             a.id as assignment_id, a.title as assignment_title,
             q.id as quiz_id, q.title as quiz_title
      FROM lessons l
      LEFT JOIN video_access_logs log ON l.id = log.lesson_id AND log.student_id = $1
      LEFT JOIN notes n ON l.id = n.lesson_id
      LEFT JOIN assignments a ON l.id = a.lesson_id
      LEFT JOIN quizzes q ON l.id = q.lesson_id
      WHERE l.module_id = ANY($2)
      ORDER BY l.sort_order ASC, l.id ASC
    `, [studentId, moduleIds]);
    
    const lessons = lessonsRes.rows;

    // Group lessons by module
    const courseStructure = modules.map(mod => {
      return {
        ...mod,
        lessons: lessons.filter(les => les.module_id === mod.id)
      };
    });

    res.json(courseStructure);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
};

// Watch Video (Triggers increment of log, checks limits)
exports.watchVideo = async (req, res) => {
  const { lessonId } = req.body;
  const studentId = req.user.profileId;

  if (!lessonId) return res.status(400).json({ error: 'Lesson ID is required' });

  try {
    // 1. Get lesson specifications
    const lessonRes = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
    if (lessonRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    const lesson = lessonRes.rows[0];

    // Check start date if present
    if (lesson.start_date) {
      const startDate = new Date(lesson.start_date);
      const today = new Date();
      if (today < startDate) {
        return res.status(403).json({ error: `This lesson is scheduled to start on ${lesson.start_date}` });
      }
    }

    // 2. Fetch or create video access log
    const logRes = await db.query(
      'SELECT * FROM video_access_logs WHERE student_id = $1 AND lesson_id = $2',
      [studentId, lessonId]
    );

    const today = new Date();

    if (logRes.rows.length === 0) {
      // First watch: Create log with open_count = 1
      const insertRes = await db.query(
        `INSERT INTO video_access_logs (student_id, lesson_id, open_count, first_opened_at, last_opened_at)
         VALUES ($1, $2, 1, $3, $3) RETURNING *`,
        [studentId, lessonId, today]
      );
      return res.json({ allowed: true, youtubeVideoId: lesson.youtube_video_id, log: insertRes.rows[0] });
    }

    const log = logRes.rows[0];

    // Check expiry days
    if (lesson.expiry_days) {
      const firstOpened = new Date(log.first_opened_at);
      const diffTime = Math.abs(today - firstOpened);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > lesson.expiry_days) {
        return res.status(403).json({ 
          error: `Video access expired. Expiry limit was ${lesson.expiry_days} days from your first watch (${firstOpened.toDateString()}).` 
        });
      }
    }

    // Check max opens
    if (lesson.max_opens && lesson.max_opens !== -1) {
      if (log.open_count >= lesson.max_opens) {
        return res.status(403).json({ 
          error: `Video access blocked: You have reached the maximum open limit of ${lesson.max_opens} watches for this lesson.` 
        });
      }
    }

    // Increment open count
    const updateRes = await db.query(
      `UPDATE video_access_logs 
       SET open_count = open_count + 1, last_opened_at = $1 
       WHERE id = $2 RETURNING *`,
      [today, log.id]
    );

    res.json({
      allowed: true,
      youtubeVideoId: lesson.youtube_video_id,
      log: updateRes.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download Note File (checks path)
exports.downloadNote = async (req, res) => {
  const { noteId } = req.params;
  try {
    const result = await db.query('SELECT * FROM notes WHERE id = $1', [noteId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const note = result.rows[0];
    if (!note.allow_download) {
      return res.status(403).json({ error: 'Downloading this note is disabled by the lecturer' });
    }
    
    res.download(note.file_path, note.file_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download note file' });
  }
};

// Submit Assignment
exports.submitAssignment = async (req, res) => {
  const { assignmentId, submissionText } = req.body;
  const studentId = req.user.profileId;
  const file = req.file;

  if (!assignmentId) {
    return res.status(400).json({ error: 'Assignment ID is required' });
  }

  try {
    // Check if student already submitted
    const checkRes = await db.query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );

    let query = '';
    let params = [];

    if (checkRes.rows.length > 0) {
      // Update existing submission
      query = `
        UPDATE submissions 
        SET submission_text = $1, file_path = $2, submitted_at = CURRENT_TIMESTAMP 
        WHERE assignment_id = $3 AND student_id = $4 RETURNING *
      `;
      params = [submissionText || null, file ? file.path : null, assignmentId, studentId];
    } else {
      // Create new submission
      query = `
        INSERT INTO submissions (submission_text, file_path, assignment_id, student_id) 
        VALUES ($1, $2, $3, $4) RETURNING *
      `;
      params = [submissionText || null, file ? file.path : null, assignmentId, studentId];
    }

    const result = await db.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

// Fetch Quiz questions (without showing the correct answer index to prevent front-end cheating!)
exports.getQuizQuestions = async (req, res) => {
  const { quizId } = req.params;
  try {
    const questionsRes = await db.query(
      'SELECT id, question_text, options FROM questions WHERE quiz_id = $1 ORDER BY id ASC',
      [quizId]
    );
    res.json(questionsRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
};

// Submit Quiz and Auto-Grade
exports.submitQuiz = async (req, res) => {
  const { quizId, answers } = req.body; // answers is an array of objects: { questionId, selectedOptionIndex }
  const studentId = req.user.profileId;

  if (!quizId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Quiz ID and answers array are required' });
  }

  try {
    // 1. Fetch correct answers from DB
    const questionsRes = await db.query(
      'SELECT id, correct_option_index FROM questions WHERE quiz_id = $1',
      [quizId]
    );
    const questions = questionsRes.rows;

    if (questions.length === 0) {
      return res.status(400).json({ error: 'No questions found for this quiz' });
    }

    // 2. Score the answers
    let score = 0;
    const totalQuestions = questions.length;

    questions.forEach(q => {
      const studentAnswer = answers.find(a => parseInt(a.questionId) === q.id);
      if (studentAnswer && studentAnswer.selectedOptionIndex === q.correct_option_index) {
        score++;
      }
    });

    // 3. Save result
    const resultRes = await db.query(
      `INSERT INTO quiz_results (quiz_id, student_id, score, total_questions) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [quizId, studentId, score, totalQuestions]
    );

    res.json({
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      result: resultRes.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit quiz results' });
  }
};

// Fetch Student Stats / Analytics
exports.getStudentDashboard = async (req, res) => {
  const studentId = req.user.profileId;
  try {
    // 1. Assignments grades
    const assignmentsRes = await db.query(`
      SELECT sub.id as submission_id, sub.grade, sub.feedback, sub.submitted_at, a.title as assignment_title
      FROM submissions sub
      JOIN assignments a ON sub.assignment_id = a.id
      WHERE sub.student_id = $1
    `, [studentId]);

    // 2. Quiz results
    const quizResultsRes = await db.query(`
      SELECT qr.*, q.title as quiz_title
      FROM quiz_results qr
      JOIN quizzes q ON qr.quiz_id = q.id
      WHERE qr.student_id = $1
      ORDER BY qr.submitted_at DESC
    `, [studentId]);

    // 3. Progress calculations (watched lessons vs total lessons)
    const totalLessonsRes = await db.query('SELECT COUNT(*) FROM lessons');
    const watchedLessonsRes = await db.query(
      'SELECT COUNT(*) FROM video_access_logs WHERE student_id = $1 AND open_count > 0',
      [studentId]
    );

    const totalLessons = parseInt(totalLessonsRes.rows[0].count);
    const watchedLessons = parseInt(watchedLessonsRes.rows[0].count);
    const progressPercentage = totalLessons > 0 ? Math.round((watchedLessons / totalLessons) * 100) : 0;

    res.json({
      assignments: assignmentsRes.rows,
      quizResults: quizResultsRes.rows,
      watchedCount: watchedLessons,
      totalCount: totalLessons,
      progressPercentage
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student dashboard stats' });
  }
};
