import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BookOpen, FolderPlus, FileText, CheckSquare, ListTodo, Plus, Award, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function LecturerDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [activeView, setActiveView] = useState('courses'); // courses, submissions, quiz-results

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ moduleId: '', title: '', description: '', youtubeVideoId: '', maxOpens: 3, expiryDays: 14, startDate: '' });
  const [assignmentForm, setAssignmentForm] = useState({ lessonId: '', title: '', description: '', dueDate: '' });
  const [quizForm, setQuizForm] = useState({ lessonId: '', title: '', attemptLimit: '' });
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  
  // Note file upload state
  const [noteFile, setNoteFile] = useState(null);
  const [noteLessonId, setNoteLessonId] = useState('');
  const [noteAllowDownload, setNoteAllowDownload] = useState(true);

  // Grading state
  const [gradingForm, setGradingForm] = useState({ submissionId: '', grade: '', feedback: '' });

  // Modal / status states
  const [showModal, setShowModal] = useState(null); // 'module', 'lesson', 'note', 'assignment', 'quiz', 'grade'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchSubmissions();
    fetchQuizResults();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/admin/courses');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const assigned = res.data.filter(c => c.created_by === userObj.profileId);
        setCourses(assigned);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await api.get('/api/lecturer/submissions');
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuizResults = async () => {
    try {
      const res = await api.get('/api/lecturer/quiz-results');
      setQuizResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setActiveView('course-detail');
    setError(''); setSuccess('');
    try {
      const res = await api.get(`/api/lecturer/modules/course/${course.id}`);
      setModules(res.data);
    } catch (err) {
      setError('Failed to fetch modules.');
    }
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/lecturer/modules', { ...moduleForm, courseId: selectedCourse.id });
      setSuccess('Module created successfully!');
      setModuleForm({ title: '', description: '' });
      setShowModal(null);
      selectCourse(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create module');
    }
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      let videoId = lessonForm.youtubeVideoId;
      if (videoId && videoId.includes('youtube.com/watch?v=')) {
        videoId = new URL(videoId).searchParams.get('v');
      } else if (videoId && videoId.includes('youtu.be/')) {
        videoId = videoId.split('youtu.be/')[1]?.split('?')[0];
      }

      await api.post('/api/lecturer/lessons', { 
        ...lessonForm, 
        youtubeVideoId: videoId 
      });
      setSuccess('Lesson created successfully!');
      setLessonForm({ moduleId: '', title: '', description: '', youtubeVideoId: '', maxOpens: 3, expiryDays: 14, startDate: '' });
      setShowModal(null);
      selectCourse(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lesson');
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!noteFile) return setError('Please select a PDF file.');

    const formData = new FormData();
    formData.append('pdf', noteFile);
    formData.append('lessonId', noteLessonId);
    formData.append('allowDownload', noteAllowDownload);

    try {
      await api.post('/api/lecturer/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Note uploaded successfully!');
      setNoteFile(null);
      setShowModal(null);
      selectCourse(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload note');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/lecturer/assignments', assignmentForm);
      setSuccess('Assignment created successfully!');
      setAssignmentForm({ lessonId: '', title: '', description: '', dueDate: '' });
      setShowModal(null);
      selectCourse(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assignment');
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/lecturer/quizzes', {
        ...quizForm,
        questions
      });
      setSuccess('Quiz and questions created successfully!');
      setQuizForm({ lessonId: '', title: '', attemptLimit: '' });
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
      setShowModal(null);
      selectCourse(selectedCourse);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/lecturer/submissions/grade', gradingForm);
      setSuccess('Submission graded successfully!');
      setShowModal(null);
      fetchSubmissions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to grade submission');
    }
  };

  const updateQuestionText = (index, value) => {
    const newQs = [...questions];
    newQs[index].questionText = value;
    setQuestions(newQs);
  };

  const updateOptionText = (qIndex, optIndex, value) => {
    const newQs = [...questions];
    newQs[qIndex].options[optIndex] = value;
    setQuestions(newQs);
  };

  const updateCorrectIndex = (qIndex, value) => {
    const newQs = [...questions];
    newQs[qIndex].correctOptionIndex = parseInt(value);
    setQuestions(newQs);
  };

  const addQuestionField = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8 border-b border-slate-200 pb-5">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl">Lecturer Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Manage courses, assignments, quizzes, and grade submissions</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <button
            onClick={() => setActiveView('courses')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
              activeView === 'courses' || activeView === 'course-detail' ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            My Courses
          </button>
          <button
            onClick={() => { setActiveView('submissions'); fetchSubmissions(); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
              activeView === 'submissions' ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Pending Assignments
          </button>
          <button
            onClick={() => { setActiveView('quiz-results'); fetchQuizResults(); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
              activeView === 'quiz-results' ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Quiz Summary
          </button>
        </div>
      </div>

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

      {/* 1. Courses List View */}
      {activeView === 'courses' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => selectCourse(course)}
              className="bg-white overflow-hidden shadow-sm hover:shadow border border-slate-200 rounded-xl p-6 cursor-pointer hover:border-indigo-400 transition"
            >
              <div className="rounded-lg bg-indigo-50 p-3 w-fit text-indigo-600 mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{course.description || 'No course syllabus description provided.'}</p>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-500">
              You are not assigned to any courses yet. Please contact the Admin.
            </div>
          )}
        </div>
      )}

      {/* 2. Course Detail / Curriculum Builder View */}
      {activeView === 'course-detail' && selectedCourse && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden">
            <h3 className="text-2xl font-bold mb-2">{selectedCourse.title}</h3>
            <p className="text-slate-300 text-sm max-w-2xl">{selectedCourse.description}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowModal('module')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Add Module
              </button>
              <button
                onClick={() => {
                  if (modules.length === 0) return alert('Create a module first before adding a lesson!');
                  setLessonForm({ ...lessonForm, moduleId: modules[0].id });
                  setShowModal('lesson');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 transition"
              >
                Add Lesson
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {modules.map((mod) => (
              <div key={mod.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900">{mod.title}</h4>
                    <p className="text-xs text-slate-500">{mod.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setLessonForm({ ...lessonForm, moduleId: mod.id }); setShowModal('lesson'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition"
                    >
                      <Plus size={12} /> Lesson
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-400">Curriculum contents will display here. Simulating curriculum actions.</p>
                </div>
              </div>
            ))}
            {modules.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">Create modules and modules sections to structure this course.</div>
            )}
          </div>
        </div>
      )}

      {/* 3. Submissions Grading Tab */}
      {activeView === 'submissions' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Lesson</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submission Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 text-sm">
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{sub.student_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{sub.assignment_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{sub.course_title} / {sub.lesson_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(sub.submitted_at).toDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sub.grade ? (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{sub.grade}</span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-indigo-600 hover:text-indigo-900 font-medium">
                    <button
                      onClick={() => { setGradingForm({ submissionId: sub.id, grade: sub.grade || 'A', feedback: sub.feedback || '' }); setShowModal('grade'); }}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                    >
                      <Award size={14} /> Grade
                    </button>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500 text-xs">No assignments submitted by students yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Quiz Summary Tab */}
      {activeView === 'quiz-results' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submit Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 text-sm">
              {quizResults.map((qr) => (
                <tr key={qr.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{qr.student_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{qr.quiz_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{qr.course_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{qr.score} / {qr.total_questions} ({Math.round((qr.score/qr.total_questions)*100)}%)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(qr.submitted_at).toDateString()}</td>
                </tr>
              ))}
              {quizResults.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-500 text-xs">No students have taken any quizzes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {showModal === 'module' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-65 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Add Module</h3>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            <form onSubmit={handleModuleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Module Title</label>
                <input type="text" required value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Introduction to Networks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Fundamentals of LAN, WAN and OSI Model..."></textarea>
              </div>
              <button type="submit" className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm">Save Module</button>
            </form>
          </div>
        </div>
      )}

      {showModal === 'lesson' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-65 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Add Lesson</h3>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            <form onSubmit={handleLessonSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700">Select Module</label>
                <select value={lessonForm.moduleId} onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Lesson Title</label>
                <input type="text" required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="OSI Layers 1 to 3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">YouTube Video Link</label>
                <input type="text" value={lessonForm.youtubeVideoId} onChange={(e) => setLessonForm({ ...lessonForm, youtubeVideoId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Max Open Counts</label>
                  <input type="number" value={lessonForm.maxOpens} onChange={(e) => setLessonForm({ ...lessonForm, maxOpens: parseInt(e.target.value) })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Expiry Days</label>
                  <input type="number" value={lessonForm.expiryDays} onChange={(e) => setLessonForm({ ...lessonForm, expiryDays: parseInt(e.target.value) })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date (Optional)</label>
                <input type="date" value={lessonForm.startDate} onChange={(e) => setLessonForm({ ...lessonForm, startDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <button type="submit" className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm">Save Lesson</button>
            </form>
          </div>
        </div>
      )}

      {showModal === 'grade' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-65 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Grade Assignment Submission</h3>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Grade</label>
                <select value={gradingForm.grade} onChange={(e) => setGradingForm({ ...gradingForm, grade: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Feedback</label>
                <textarea required value={gradingForm.feedback} onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Great attempt. Write feedback details here..."></textarea>
              </div>
              <button type="submit" className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm">Save Grade</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
