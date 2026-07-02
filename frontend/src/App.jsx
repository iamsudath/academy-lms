import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { LogOut, GraduationCap } from 'lucide-react';

function DashboardRouter() {
  const { user, logout } = useAuth();

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Shared Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-indigo-600 h-8 w-8" />
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">Academy LMS</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-100">MVP</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.roleName}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-950 transition shadow-sm"
            >
              Sign Out
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-grow">
        {user.roleName === 'Admin' && <AdminDashboard />}
        {user.roleName === 'Lecturer' && <LecturerDashboard />}
        {user.roleName === 'Student' && <StudentDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Academy LMS. All rights reserved. A/L ICT MVP System.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardRouter />
    </AuthProvider>
  );
}
