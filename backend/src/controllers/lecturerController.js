const db = require('../config/db');

// Modules Management
exports.createModule = async (req, res) => {
  const { courseId, title, description, sortOrder } = req.body;
  if (!courseId || !title) return res.status(400).json({ error: 'Course ID and Title are required' });

  try {
    const result = await db.query(
      'INSERT INTO modules (course_id, title, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [courseId, title, description, sortOrder || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create module' });
  }
};

exports.getModules = async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await db.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY sort_order ASC, id ASC', [courseId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
};

// Lessons Management
exports.createLesson = async (req, res) => {
  const { moduleId, title, description, youtubeVideoId, maxOpens, expiryDays, startDate, sortOrder } = req.body;
  if (!moduleId || !title) return res.status(400).json({ error: 'Module ID and Title are required' });

  try {
    const result = await db.query(
      `INSERT INTO lessons (module_id, title, description, youtube_video_id, max_opens, expiry_days, start_date, sort_order) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        moduleId,
        title,
        description,
        youtubeVideoId || null,
        maxOpens !== undefined ? maxOpens : 3,
        expiryDays !== undefined ? expiryDays : 14,
        startDate || null,
        sortOrder || 0
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};

// Add PDF Note
exports.addNote = async (req, res) => {
  const { lessonId, allowDownload } = req.body;
  const file = req.file;

  if (!lessonId || !file) {
    return res.status(400).json({ error: 'Lesson ID and PDF file are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO notes (lesson_id, file_name, file_path, allow_download) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [lessonId, file.originalname, file.path, allowDownload !== 'false']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload note' });
  }
};

// Add Assignment
exports.createAssignment = async (req, res) => {
  const { lessonId, title, description, dueDate } = req.body;
  if (!lessonId || !title) return res.status(400).json({ error: 'Lesson ID and Title are required' });

  try {
    const result = await db.query(
      'INSERT INTO assignments (lesson_id, title, description, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [lessonId, title, description, dueDate || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

// Create Quiz and Questions
exports.createQuiz = async (req, res) => {
  const { lessonId, title, attemptLimit, questions } = req.body; // questions should be array of objects: { questionText, options: [], correctOptionIndex }
  
  if (!lessonId || !title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Lesson ID, Title, and Questions array are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert quiz
    const quizRes = await client.query(
      'INSERT INTO quizzes (lesson_id, title, attempt_limit) VALUES ($1, $2, $3) RETURNING *',
      [lessonId, title, attemptLimit || null]
    );
    const quiz = quizRes.rows[0];

    // 2. Insert questions
    for (const q of questions) {
      await client.query(
        'INSERT INTO questions (quiz_id, question_text, options, correct_option_index) VALUES ($1, $2, $3, $4)',
        [quiz.id, q.questionText, JSON.stringify(q.options), q.correctOptionIndex]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...quiz, questionsCount: questions.length });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create quiz' });
  } finally {
    client.release();
  }
};

// View Assignment Submissions
exports.getSubmissions = async (req, res) => {
  const lecturerId = req.user.profileId;
  try {
    // Fetch all submissions for courses created by this lecturer
    const result = await db.query(`
      SELECT sub.*, s.name as student_name, a.title as assignment_title, c.title as course_title, l.title as lesson_title
      FROM submissions sub
      JOIN students s ON sub.student_id = s.id
      JOIN assignments a ON sub.assignment_id = a.id
      JOIN lessons l ON a.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE c.created_by = $1
      ORDER BY sub.submitted_at DESC
    `, [lecturerId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// Grade Submission
exports.gradeSubmission = async (req, res) => {
  const { submissionId, grade, feedback } = req.body;
  const lecturerId = req.user.profileId;

  if (!submissionId || !grade) {
    return res.status(400).json({ error: 'Submission ID and Grade are required' });
  }

  try {
    const result = await db.query(
      `UPDATE submissions 
       SET grade = $1, feedback = $2, graded_by = $3 
       WHERE id = $4 RETURNING *`,
      [grade, feedback || null, lecturerId, submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

// View Quiz Results Summary
exports.getQuizResultsSummary = async (req, res) => {
  const lecturerId = req.user.profileId;
  try {
    const result = await db.query(`
      SELECT qr.*, s.name as student_name, q.title as quiz_title, c.title as course_title
      FROM quiz_results qr
      JOIN students s ON qr.student_id = s.id
      JOIN quizzes q ON qr.quiz_id = q.id
      JOIN lessons l ON q.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE c.created_by = $1
      ORDER BY qr.submitted_at DESC
    `, [lecturerId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
};
