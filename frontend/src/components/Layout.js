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
    <nav className="glass-panel text-slate-200 shadow-xl sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-extrabold tracking-tight flex items-center gap-2 hover:text-indigo-400 transition-colors drop-shadow-md">
          <span className="text-indigo-500">❖</span> RehabAI
        </Link>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link 
            to="/dashboard" 
            className="hover:text-indigo-400 transition-colors"
          >
            Dashboard
          </Link>
          
          {user.role === 'patient' && (
            <>
              <Link to="/sessions" className="hover:text-indigo-400 transition-colors">📅 Sessions</Link>
              <Link to="/exercise-tracking" className="hover:text-indigo-400 transition-colors">📐 Tracking</Link>
              <Link to="/ai-rehab-plan" className="hover:text-indigo-400 transition-colors">🤖 AI Plan</Link>
              <Link to="/doctor-patient-chat" className="hover:text-indigo-400 transition-colors">💬 Doctor Chat</Link>
              <Link to="/chat" className="hover:text-indigo-400 transition-colors">🧠 AI Assistant</Link>
            </>
          )}

          {(user.role === 'doctor' || user.role === 'physiotherapist') && (
            <Link 
              to="/doctor-patient-chat" 
              className="hover:text-blue-100 transition font-semibold"
            >
              💬 Patient Chat
            </Link>
          )}

          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" className="ring-2 ring-indigo-500/50" />
              <span className="hidden sm:inline tracking-wide">{user.firstName}</span>
              <span className="text-xl">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 glass-card overflow-hidden z-50 animate-fade-in-up">
                <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
                  <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-indigo-400 font-medium tracking-wider uppercase mt-1">{user.role}</p>
                </div>
                <div className="py-1">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    👤 My Profile
                  </Link>
                  <Link 
                    to="/progress-report" 
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    📊 Progress Report
                  </Link>
                </div>
                <div className="border-t border-slate-700/50 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                  >
                    🚪 Logout
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
