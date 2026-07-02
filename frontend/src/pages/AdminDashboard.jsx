import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, GraduationCap, BookOpen, Layers, Plus, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalLecturers: 0, totalCourses: 0, totalBatches: 0 });
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lists
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  // Form states
  const [studentForm, setStudentForm] = useState({ email: '', password: '', name: '', batchId: '' });
  const [lecturerForm, setLecturerForm] = useState({ email: '', password: '', name: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', lecturerId: '' });
  const [batchForm, setBatchForm] = useState({ name: '' });
  const [resetForm, setResetForm] = useState({ userId: '', newPassword: '' });

  // Modals visibility
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStats();
    loadTabContent();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const loadTabContent = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'students') {
        const [studRes, batRes] = await Promise.all([
          api.get('/api/admin/students'),
          api.get('/api/admin/batches')
        ]);
        setStudents(studRes.data);
        setBatches(batRes.data);
      } else if (activeTab === 'lecturers') {
        const res = await api.get('/api/admin/lecturers');
        setLecturers(res.data);
      } else if (activeTab === 'courses') {
        const [crsRes, lecRes] = await Promise.all([
          api.get('/api/admin/courses'),
          api.get('/api/admin/lecturers')
        ]);
        setCourses(crsRes.data);
        setLecturers(lecRes.data);
      } else if (activeTab === 'batches') {
        const res = await api.get('/api/admin/batches');
        setBatches(res.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/admin/students', studentForm);
      setSuccess('Student created successfully!');
      setStudentForm({ email: '', password: '', name: '', batchId: '' });
      setShowModal(false);
      loadTabContent();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student');
    }
  };

  const handleLecturerSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/admin/lecturers', lecturerForm);
      setSuccess('Lecturer created successfully!');
      setLecturerForm({ email: '', password: '', name: '' });
      setShowModal(false);
      loadTabContent();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lecturer');
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/admin/courses', courseForm);
      setSuccess('Course created successfully!');
      setCourseForm({ title: '', description: '', lecturerId: '' });
      setShowModal(false);
      loadTabContent();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/admin/batches', batchForm);
      setSuccess('Batch created successfully!');
      setBatchForm({ name: '' });
      setShowModal(false);
      loadTabContent();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create batch');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/admin/reset-password', resetForm);
      setSuccess('User password reset successfully!');
      setResetForm({ userId: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Admin Panel
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            AMS Portal Management overview and configurations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 p-5 flex items-center">
          <div className="rounded-md bg-indigo-50 p-3 mr-4 text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 truncate">Total Students</p>
            <p className="text-2xl font-semibold text-slate-950">{stats.totalStudents}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 p-5 flex items-center">
          <div className="rounded-md bg-emerald-50 p-3 mr-4 text-emerald-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 truncate">Total Lecturers</p>
            <p className="text-2xl font-semibold text-slate-950">{stats.totalLecturers}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 p-5 flex items-center">
          <div className="rounded-md bg-sky-50 p-3 mr-4 text-sky-600">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 truncate">Active Courses</p>
            <p className="text-2xl font-semibold text-slate-950">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 p-5 flex items-center">
          <div className="rounded-md bg-violet-50 p-3 mr-4 text-violet-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 truncate">Total Batches</p>
            <p className="text-2xl font-semibold text-slate-950">{stats.totalBatches}</p>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="text-green-500 mt-0.5" size={18} />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Tabs and Actions Row */}
      <div className="border-b border-slate-200 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          {['students', 'lecturers', 'courses', 'batches', 'password-reset'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition duration-150
                ${activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>

        {activeTab !== 'password-reset' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus size={16} />
            Create {activeTab.slice(0, -1)}
          </button>
        )}
      </div>

      {/* Main Tab Lists Panel */}
      <div className="bg-white shadow border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading details...</div>
        ) : (
          <>
            {activeTab === 'students' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {students.map((student) => (
                    <tr key={student.student_id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">{student.batch_name || 'No Batch'}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">{student.user_id}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-slate-500 text-xs">No students registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'lecturers' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {lecturers.map((lec) => (
                    <tr key={lec.lecturer_id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{lec.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">{lec.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">{lec.user_id}</td>
                    </tr>
                  ))}
                  {lecturers.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-6 text-slate-500 text-xs">No lecturers registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'courses' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Lecturer</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{course.title}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{course.description || 'No Description'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-indigo-600 font-medium">{course.lecturer_name || 'Unassigned'}</td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-6 text-slate-500 text-xs">No courses created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'batches' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {batches.map((batch) => (
                    <tr key={batch.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500">{batch.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{batch.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(batch.created_at).toDateString()}</td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-6 text-slate-500 text-xs">No batches created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'password-reset' && (
              <div className="p-8 max-w-lg mx-auto">
                <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                  <RotateCcw size={18} />
                  Reset User Password
                </h3>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Select User Account</label>
                    <select
                      required
                      value={resetForm.userId}
                      onChange={(e) => setResetForm({ ...resetForm, userId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Choose Account --</option>
                      <optgroup label="Lecturers">
                        {lecturers.map(l => (
                          <option key={`l-${l.user_id}`} value={l.user_id}>{l.name} ({l.email})</option>
                        ))}
                      </optgroup>
                      <optgroup label="Students">
                        {students.map(s => (
                          <option key={`s-${s.user_id}`} value={s.user_id}>{s.name} ({s.email})</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">New Password</label>
                    <input
                      type="text"
                      required
                      value={resetForm.newPassword}
                      onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter new strong password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
                  >
                    Reset and Force Change On Next Login
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-65 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 capitalize">Create {activeTab.slice(0, -1)}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            
            <div className="p-6">
              {activeTab === 'students' && (
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input type="text" required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Saman Perera" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                    <input type="email" required value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="saman@gmail.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Temporary Password</label>
                    <input type="text" required value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="tempPass123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Assigned Batch</label>
                    <select required value={studentForm.batchId} onChange={(e) => setStudentForm({ ...studentForm, batchId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                      <option value="">-- Choose Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm">Save Student</button>
                </form>
              )}

              {activeTab === 'lecturers' && (
                <form onSubmit={handleLecturerSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Lecturer Name</label>
                    <input type="text" required value={lecturerForm.name} onChange={(e) => setLecturerForm({ ...lecturerForm, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Dr. Nimal Silva" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                    <input type="email" required value={lecturerForm.email} onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="nimal@lms.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Temporary Password</label>
                    <input type="text" required value={lecturerForm.password} onChange={(e) => setLecturerForm({ ...lecturerForm, password: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="tempPass123" />
                  </div>
                  <button type="submit" className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm">Save Lecturer</button>
                </form>
              )}

              {activeTab === 'courses' && (
                <form onSubmit={handleCourseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Course Title</label>
                    <input type="text" required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Grade 12 python coding" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Detailed syllabus outline..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Assign Lecturer</label>
                    <select value={courseForm.lecturerId} onChange={(e) => setCourseForm({ ...courseForm, lecturerId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                      <option value="">-- Unassigned / Choose Lecturer --</option>
                      {lecturers.map(l => (
                        <option key={l.lecturer_id} value={l.lecturer_id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm">Save Course</button>
                </form>
              )}

              {activeTab === 'batches' && (
                <form onSubmit={handleBatchSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Batch Name</label>
                    <input type="text" required value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="2027 O/L Revision" />
                  </div>
                  <button type="submit" className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm">Save Batch</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
