import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await register({ name, email, password, role });
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else if (userData.role === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/staff');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-bold tracking-tight">Create an Account</h2>
          <p className="text-xs text-cyan-300 mt-1">Register for Dynamic Queue Management</p>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Administrator"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@careerbridge.ai"
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
                  placeholder="Create a secure password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 text-slate-400" size={18} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                >
                  <option value="ADMIN">System Administrator (Full Access)</option>
                  <option value="STAFF">Service Counter Staff</option>
                  <option value="CUSTOMER">Customer / Citizen</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Sign Up & Save to Database'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Link to login */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-cyan-600 hover:text-cyan-700 underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
