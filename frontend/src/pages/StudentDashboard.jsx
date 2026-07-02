import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BookOpen, Play, FileDown, Edit3, Award, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStructure, setCourseStructure] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [activeView, setActiveView] = useState('courses'); // courses, course-view, dashboard-stats

  // Video State
  const [videoAllowed, setVideoAllowed] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [videoError, setVideoError] = useState('');

  // Assignment upload
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState([]); // { questionId, selectedOptionIndex }
  const [quizScore, setQuizScore] = useState(null);
  const [quizSuccess, setQuizSuccess] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/student/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/student/dashboard');
      setDashboardStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setActiveView('course-view');
    try {
      const res = await api.get(`/api/student/courses/${course.id}`);
      setCourseStructure(res.data);
      if (res.data.length > 0 && res.data[0].lessons.length > 0) {
        selectLesson(res.data[0].lessons[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setVideoAllowed(false);
    setYoutubeVideoId('');
    setVideoError('');
    setSubmissionText('');
    setSubmissionFile(null);
    setSubmitSuccess('');
    setSubmitError('');
    setQuizQuestions([]);
    setQuizAnswers([]);
    setQuizScore(null);
    setQuizSuccess('');
  };

  const handleWatchVideo = async () => {
    setVideoError('');
    setVideoAllowed(false);
    try {
      const res = await api.post('/api/student/watch-video', { lessonId: selectedLesson.id });
      setYoutubeVideoId(res.data.youtubeVideoId);
      setVideoAllowed(true);
      fetchStats();
    } catch (err) {
      setVideoError(err.response?.data?.error || 'Access to video was denied.');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(''); setSubmitSuccess('');

    const formData = new FormData();
    formData.append('assignmentId', selectedLesson.assignment_id);
    formData.append('submissionText', submissionText);
    if (submissionFile) {
      formData.append('submissionFile', submissionFile);
    }

    try {
      await api.post('/api/student/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitSuccess('Assignment submitted successfully!');
      fetchStats();
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit assignment');
    }
  };

  const startQuiz = async (quizId) => {
    setQuizSuccess('');
    setQuizScore(null);
    try {
      const res = await api.get(`/api/student/quizzes/${quizId}/questions`);
      setQuizQuestions(res.data);
      setQuizAnswers(res.data.map(q => ({ questionId: q.id, selectedOptionIndex: 0 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOptionSelect = (qId, optIdx) => {
    setQuizAnswers(prev => prev.map(ans => ans.questionId === qId ? { ...ans, selectedOptionIndex: optIdx } : ans));
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/student/quizzes/submit', {
        quizId: selectedLesson.quiz_id,
        answers: quizAnswers
      });
      setQuizScore(res.data);
      setQuizSuccess('Quiz submitted and graded successfully!');
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-6 flex justify-between items-center pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveView('courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeView === 'courses' || activeView === 'course-view' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Courses
          </button>
          <button
            onClick={() => { setActiveView('dashboard-stats'); fetchStats(); }}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeView === 'dashboard-stats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Progress & Grades
          </button>
        </div>
        {dashboardStats && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Overall Course Progress:</span>
            <div className="w-24 bg-slate-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${dashboardStats.progressPercentage}%` }}></div>
            </div>
            <span>{dashboardStats.progressPercentage}%</span>
          </div>
        )}
      </div>

      {/* VIEW 1: Courses Grid */}
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
              <div className="mt-4 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                Lecturer: {course.lecturer_name || 'Unassigned'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: Course details curriculum & lesson player */}
      {activeView === 'course-view' && selectedCourse && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-4 bg-white p-4 border border-slate-200 rounded-xl h-fit">
            <h4 className="font-bold text-slate-900 border-b pb-2 mb-3">{selectedCourse.title}</h4>
            <div className="space-y-4 overflow-y-auto max-h-[70vh]">
              {courseStructure.map(mod => (
                <div key={mod.id} className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{mod.title}</span>
                  {mod.lessons.map(les => (
                    <button
                      key={les.id}
                      onClick={() => selectLesson(les)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                        selectedLesson?.id === les.id ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {les.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Lesson Details Viewer */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            {selectedLesson ? (
              <>
                <div>
                  <h3 className="text-2xl font-bold text-slate-950 mb-1">{selectedLesson.title}</h3>
                  <p className="text-sm text-slate-500">{selectedLesson.description || 'No summary syllabus provided.'}</p>
                </div>

                {/* 1. Video Player Section */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-1.5"><Play size={18} /> Video Lesson</h4>
                  
                  {videoError && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start gap-3">
                      <AlertCircle className="text-red-500 mt-0.5" size={18} />
                      <p className="text-sm text-red-700 font-medium">{videoError}</p>
                    </div>
                  )}

                  {!videoAllowed ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg py-12 px-4 bg-white text-center">
                      <p className="text-sm text-slate-500 mb-4">
                        Watch limit: <span className="font-semibold">{selectedLesson.max_opens} views</span>. Expiry: <span className="font-semibold">{selectedLesson.expiry_days} days</span> from first watch.
                      </p>
                      <button
                        onClick={handleWatchVideo}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow-sm"
                      >
                        Watch Lesson Video
                      </button>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                        title={selectedLesson.title}
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>

                {/* 2. Download Notes Section */}
                {selectedLesson.note_id && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600"><FileText size={20} /></div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{selectedLesson.note_name}</h4>
                        <p className="text-xs text-slate-400">PDF study notes</p>
                      </div>
                    </div>
                    {selectedLesson.note_allow_download ? (
                      <a
                        href={`${api.defaults.baseURL || ''}/api/student/notes/download/${selectedLesson.note_id}`}
                        className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200 text-sm font-semibold rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition"
                      >
                        <FileDown size={16} /> Download Note
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Download disabled by lecturer</span>
                    )}
                  </div>
                )}

                {/* 3. Assignment Submission Section */}
                {selectedLesson.assignment_id && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                    <h4 className="font-semibold text-slate-950 flex items-center gap-1.5"><Edit3 size={18} /> Assignment: {selectedLesson.assignment_title}</h4>
                    
                    {submitError && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">{submitError}</div>
                    )}
                    {submitSuccess && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-700">{submitSuccess}</div>
                    )}

                    <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Your Submission (Text response or details)</label>
                        <textarea
                          required
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          placeholder="Type details or add Google Drive links..."
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload Work File (Optional - PDF)</label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSubmissionFile(e.target.files[0])}
                          className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <button type="submit" className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition">
                        Submit Work
                      </button>
                    </form>
                  </div>
                )}

                {/* 4. Quiz MCQ Section */}
                {selectedLesson.quiz_id && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                    <h4 className="font-semibold text-slate-950 flex items-center gap-1.5"><Award size={18} /> Quiz: {selectedLesson.quiz_title}</h4>
                    
                    {quizSuccess && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-700">{quizSuccess}</div>
                    )}

                    {quizScore !== null ? (
                      <div className="bg-white border p-6 rounded-lg text-center space-y-2">
                        <p className="text-lg font-bold text-slate-800">Quiz Completed!</p>
                        <p className="text-3xl font-extrabold text-indigo-600">{quizScore.score} / {quizScore.totalQuestions}</p>
                        <p className="text-sm font-medium text-slate-500">Your score percentage: {quizScore.percentage}%</p>
                      </div>
                    ) : quizQuestions.length === 0 ? (
                      <button
                        onClick={() => startQuiz(selectedLesson.quiz_id)}
                        className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition"
                      >
                        Start MCQ Quiz
                      </button>
                    ) : (
                      <form onSubmit={handleQuizSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                        {quizQuestions.map((q, idx) => (
                          <div key={q.id} className="space-y-2">
                            <p className="text-sm font-semibold text-slate-900">{idx + 1}. {q.question_text}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => (
                                <label
                                  key={optIdx}
                                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition ${
                                    quizAnswers.find(ans => ans.questionId === q.id)?.selectedOptionIndex === optIdx
                                      ? 'border-indigo-600 bg-indigo-50/50'
                                      : 'border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    checked={quizAnswers.find(ans => ans.questionId === q.id)?.selectedOptionIndex === optIdx}
                                    onChange={() => handleOptionSelect(q.id, optIdx)}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button type="submit" className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold transition">
                          Submit Answers
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">Select a lesson to begin learning!</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: Dashboard Analytics */}
      {activeView === 'dashboard-stats' && dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Edit3 size={18} /> Assignment Submissions</h3>
            <div className="space-y-3 overflow-y-auto max-h-[50vh]">
              {dashboardStats.assignments.map(sub => (
                <div key={sub.submission_id} className="border border-slate-100 rounded-lg p-4 flex justify-between items-start bg-slate-50">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{sub.assignment_title}</h4>
                    <p className="text-xs text-slate-400">Submitted: {new Date(sub.submitted_at).toDateString()}</p>
                    {sub.feedback && <p className="text-xs text-slate-500 italic mt-2">Lecturer Feedback: "{sub.feedback}"</p>}
                  </div>
                  <div>
                    {sub.grade ? (
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-800">Grade: {sub.grade}</span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-100 text-amber-800">Ungraded</span>
                    )}
                  </div>
                </div>
              ))}
              {dashboardStats.assignments.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No assignments submitted yet.</p>}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Award size={18} /> Quiz Performance</h3>
            <div className="space-y-3 overflow-y-auto max-h-[50vh]">
              {dashboardStats.quizResults.map(qr => (
                <div key={qr.id} className="border border-slate-100 rounded-lg p-4 flex justify-between items-center bg-slate-50">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{qr.quiz_title}</h4>
                    <p className="text-xs text-slate-400">Date: {new Date(qr.submitted_at).toDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">{qr.score} / {qr.total_questions}</span>
                    <p className="text-xs text-indigo-600 font-semibold">{Math.round((qr.score/qr.total_questions)*100)}%</p>
                  </div>
                </div>
              ))}
              {dashboardStats.quizResults.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No quizzes completed yet.</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
