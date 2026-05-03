import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Avatar } from './UIComponents';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="glass-panel sticky top-0 z-50 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <span className="text-xl font-black">❖</span>
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">Rehab<span className="text-indigo-400">AI</span></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/dashboard" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          
          {user.role === 'patient' && (
            <div className="flex items-center gap-8">
              <Link to="/sessions" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Sessions</Link>
              <Link to="/exercise-tracking" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Tracking</Link>
              <Link to="/ai-rehab-plan" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">AI Plan</Link>
              <Link to="/chat" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">AI Assistant</Link>
            </div>
          )}

          {(user.role === 'doctor' || user.role === 'physiotherapist') && (
            <div className="flex items-center gap-8">
              <Link to="/sessions" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Sessions</Link>
              <Link to="/doctor-patient-chat" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Patient Chat</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
            >
              <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-black text-white leading-none mb-0.5">{user.firstName}</p>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">{user.role}</p>
              </div>
              <span className="text-[10px] text-slate-500 ml-1">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-4 w-64 glass-card border border-white/10 overflow-hidden z-50 animate-fade-in-up origin-top-right">
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                  <p className="font-black text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                </div>
                <div className="p-2">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors text-slate-300 font-bold text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>👤</span> My Profile
                  </Link>
                  <Link 
                    to="/progress-report" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors text-slate-300 font-bold text-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>📊</span> Progress Report
                  </Link>
                </div>
                <div className="p-2 border-t border-white/5 bg-white/[0.01]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors font-bold text-sm"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const Sidebar = ({ items, activeItem }) => (
  <aside className="bg-gray-900 text-white w-64 min-h-screen p-6 hidden md:block">
    <Link to="/" className="text-2xl font-bold mb-8 block hover:text-blue-400">
      🏥 RehabAI
    </Link>
    <nav className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.path}
          className={`block px-4 py-3 rounded-lg transition ${
            activeItem === item.id
              ? 'bg-blue-600 font-semibold'
              : 'hover:bg-gray-800'
          }`}
        >
          {item.icon} {item.label}
        </Link>
      ))}
    </nav>
  </aside>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-8 animate-fade-in-up">
    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 mb-2 drop-shadow-sm">{title}</h1>
    {subtitle && <p className="text-slate-400 text-lg">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const TabBar = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-slate-700/50 mb-6">
    <div className="flex gap-8 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-3 font-semibold transition-all whitespace-nowrap border-b-2 px-1 ${
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);
