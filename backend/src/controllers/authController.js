const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user and their role
    const query = `
      SELECT u.id, u.email, u.password_hash, u.must_change_password, r.id as role_id, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `;
    const result = await db.query(query, [email.toLowerCase().trim()]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get specific profile ID (student_id or lecturer_id)
    let profileId = null;
    let name = 'User';
    let batchId = null;
    
    if (user.role_name === 'Student') {
      const studentRes = await db.query('SELECT id, name, batch_id FROM students WHERE user_id = $1', [user.id]);
      if (studentRes.rows.length > 0) {
        profileId = studentRes.rows[0].id;
        name = studentRes.rows[0].name;
        batchId = studentRes.rows[0].batch_id;
      }
    } else if (user.role_name === 'Lecturer') {
      const lecturerRes = await db.query('SELECT id, name FROM lecturers WHERE user_id = $1', [user.id]);
      if (lecturerRes.rows.length > 0) {
        profileId = lecturerRes.rows[0].id;
        name = lecturerRes.rows[0].name;
      }
    } else {
      name = 'Admin';
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        roleId: user.role_id, 
        roleName: user.role_name,
        profileId,
        batchId,
        name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        roleName: user.role_name,
        name,
        mustChangePassword: user.must_change_password,
        profileId
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    // Get user
    const userRes = await db.query('SELECT password_hash, must_change_password FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    // If they have set a password before, check old password (unless it was reset by admin and they must change it, but checking old password is safer)
    // To keep it simple, we check oldPassword if user.must_change_password is false. If it is true, they might also know the old temporary one. We will check it anyway to ensure security.
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
