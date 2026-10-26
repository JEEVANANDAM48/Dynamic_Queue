import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Monitor, UserCheck, Shield, Clock } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-navy-900 border-b border-navy-700 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-cyan-500/20">
            Q
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">DYNAMIC QUEUE</h1>
            <p className="text-xs text-cyan-400 font-medium tracking-wide">Real-Time Estimation Engine</p>
          </div>
        </Link>

        {/* Navigation Links & User Info */}
        <div className="flex items-center space-x-4">
          <Link
            to="/display/demo"
            target="_blank"
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-medium text-cyan-300 border border-navy-700 transition"
          >
            <Monitor size={15} />
            <span>Public Display Board</span>
          </Link>

          <Link
            to="/kiosk"
            target="_blank"
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-medium text-slate-300 border border-navy-700 transition"
          >
            <Clock size={15} />
            <span>Kiosk Print Station</span>
          </Link>

          {user && (
            <div className="flex items-center space-x-3 pl-3 border-l border-navy-700">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  user.role === 'STAFF' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg bg-navy-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
