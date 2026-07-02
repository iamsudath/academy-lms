const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Create a new Student
exports.createStudent = async (req, res) => {
  const { email, password, name, batchId } = req.body;

  if (!email || !password || !name || !batchId) {
    return res.status(400).json({ error: 'All fields (email, password, name, batchId) are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if email exists
    const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (checkUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // 2. Hash temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user (Role 3 = Student)
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role_id, must_change_password) 
       VALUES ($1, $2, 3, true) RETURNING id`,
      [email.toLowerCase().trim(), hashedPassword]
    );
    const userId = userRes.rows[0].id;

    // 4. Create student profile
    const studentRes = await client.query(
      `INSERT INTO students (user_id, batch_id, name) 
       VALUES ($1, $2, $3) RETURNING id, name`,
      [userId, batchId, name]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: studentRes.rows[0].id,
        userId,
        name: studentRes.rows[0].name,
        email,
        batchId
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating student:', err);
    res.status(500).json({ error: 'Failed to create student' });
  } finally {
    client.release();
  }
};

// Create a new Lecturer
exports.createLecturer = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields (email, password, name) are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if email exists
    const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (checkUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // 2. Hash temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user (Role 2 = Lecturer)
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role_id, must_change_password) 
       VALUES ($1, $2, 2, true) RETURNING id`,
      [email.toLowerCase().trim(), hashedPassword]
    );
    const userId = userRes.rows[0].id;

    // 4. Create lecturer profile
    const lecturerRes = await client.query(
      `INSERT INTO lecturers (user_id, name) 
       VALUES ($1, $2) RETURNING id, name`,
      [userId, name]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Lecturer created successfully',
      lecturer: {
        id: lecturerRes.rows[0].id,
        userId,
        name: lecturerRes.rows[0].name,
        email
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating lecturer:', err);
    res.status(500).json({ error: 'Failed to create lecturer' });
  } finally {
    client.release();
  }
};

// Admin Reset Password for any user
exports.resetUserPassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'User ID and a secure new password (min 6 chars) are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await db.query(
      'UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2 RETURNING id',
      [hashedPassword, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User password reset successfully. User will be prompted to change it on next login.' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Batches Management
exports.createBatch = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Batch name is required' });

  try {
    const result = await db.query('INSERT INTO batches (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
};

exports.getBatches = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM batches ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
};

// Courses Management
exports.createCourse = async (req, res) => {
  const { title, description, lecturerId } = req.body;
  if (!title) return res.status(400).json({ error: 'Course title is required' });

  try {
    const result = await db.query(
      'INSERT INTO courses (title, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, description, lecturerId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, l.name as lecturer_name 
      FROM courses c
      LEFT JOIN lecturers l ON c.created_by = l.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.id as student_id, s.name, u.email, u.id as user_id, b.name as batch_name, b.id as batch_id
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN batches b ON s.batch_id = b.id
      ORDER BY s.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Get all lecturers
exports.getLecturers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.id as lecturer_id, l.name, u.email, u.id as user_id
      FROM lecturers l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lecturers' });
  }
};

// Admin Statistics Dashboard Report
exports.getStats = async (req, res) => {
  try {
    const studentCount = await db.query('SELECT COUNT(*) FROM students');
    const lecturerCount = await db.query('SELECT COUNT(*) FROM lecturers');
    const courseCount = await db.query('SELECT COUNT(*) FROM courses');
    const batchCount = await db.query('SELECT COUNT(*) FROM batches');
    
    res.json({
      totalStudents: parseInt(studentCount.rows[0].count),
      totalLecturers: parseInt(lecturerCount.rows[0].count),
      totalCourses: parseInt(courseCount.rows[0].count),
      totalBatches: parseInt(batchCount.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};
