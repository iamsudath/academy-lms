const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // Read schema.sql
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema SQL
    console.log('Creating database tables...');
    await pool.query(schemaSql);
    console.log('Tables created or already exist.');

    // Insert Roles
    console.log('Seeding roles...');
    await pool.query(`
      INSERT INTO roles (id, name) 
      VALUES (1, 'Admin'), (2, 'Lecturer'), (3, 'Student')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `);

    // Check if admin already exists
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@lms.com'");
    if (adminCheck.rows.length === 0) {
      console.log('Seeding default admin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await pool.query(`
        INSERT INTO users (email, password_hash, role_id, must_change_password)
        VALUES ('admin@lms.com', $1, 1, false);
      `, [hashedPassword]);
      console.log('Admin account created (admin@lms.com / admin123)');
    } else {
      console.log('Admin user already exists.');
    }

    // Insert demo batches
    console.log('Seeding batches...');
    await pool.query(`
      INSERT INTO batches (id, name)
      VALUES (1, '2026 A/L ICT Batch'), (2, '2027 A/L ICT Batch')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
