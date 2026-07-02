import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, changePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // First Login Reset Password Flow State
  const [requireReset, setRequireReset] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.mustChangePassword) {
        // Save current password as oldPassword for the next step
        setOldPassword(password);
        setRequireReset(true);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (newPassword.length < 6) {
      return setResetError('New password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setResetError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setResetSuccess('Password changed successfully! Redirecting...');
      setTimeout(() => {
        // Re-auth or let state update refresh
        window.location.reload();
      }, 1500);
    } catch (err) {
      setResetError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <span className="text-5xl">🎓</span>
          <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
            Academy LMS
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A/L ICT Academy Portal
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-xl rounded-2xl sm:px-10 backdrop-blur-md bg-opacity-80">
          
          {!requireReset ? (
            /* Login Form */
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <h3 className="text-lg font-medium text-white text-center">Sign in to your account</h3>
              
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="you@lms.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150 items-center gap-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  <LogIn size={16} />
                </button>
              </div>
            </form>
          ) : (
            /* First Login Password Reset Form */
            <form className="space-y-6" onSubmit={handleResetSubmit}>
              <div className="text-center">
                <Lock className="mx-auto h-12 w-12 text-indigo-400" />
                <h3 className="mt-2 text-lg font-medium text-white">Change Password Required</h3>
                <p className="mt-1 text-sm text-slate-400">
                  This is your first login. You must update your password before proceeding.
                </p>
              </div>

              {resetError && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="bg-green-900/30 border border-green-500/50 text-green-200 text-sm p-3 rounded-lg">
                  {resetSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition duration-150 items-center gap-2"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                  <Key size={16} />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
