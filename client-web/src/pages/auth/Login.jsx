import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else if (userData.role === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/staff');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please check credentials or register.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-navy-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"></div>
          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 font-bold text-2xl shadow-lg shadow-cyan-500/30">
            Q
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Staff & Admin Portal</h2>
          <p className="text-xs text-cyan-300 mt-1">Dynamic Queue Management System</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff1@queue.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Create new account link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-600">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-cyan-600 hover:text-cyan-700 underline">
                Sign Up / Register
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center">
              <ShieldCheck size={14} className="mr-1 text-cyan-600" />
              <span>Demo Quick Logins (Password: password123)</span>
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('staff1@queue.com')}
                className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-left border border-slate-200 transition"
              >
                <div className="font-semibold text-slate-900">Counter 1 Staff</div>
                <div className="text-[10px] text-slate-500">staff1@queue.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff2@queue.com')}
                className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-left border border-slate-200 transition"
              >
                <div className="font-semibold text-slate-900">Counter 2 Staff</div>
                <div className="text-[10px] text-slate-500">staff2@queue.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@queue.com')}
                className="col-span-2 p-2 rounded bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium text-left border border-purple-200 transition"
              >
                <div className="font-semibold">System Administrator</div>
                <div className="text-[10px] text-purple-700">admin@queue.com</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
