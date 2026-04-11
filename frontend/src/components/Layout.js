import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Avatar } from './UIComponents';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold hover:text-blue-100 transition">
          🏥 RehabAI
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/dashboard" 
            className="hover:text-blue-100 transition font-semibold"
          >
            {t('dashboard') || "Dashboard"}
          </Link>
          
          {user.role === 'patient' && (
            <>
              <Link 
                to="/exercise-library" 
                className="hover:text-blue-100 transition font-semibold"
              >
                {t('exercises') || "Exercises"}
              </Link>
              <Link 
                to="/chat" 
                className="hover:text-blue-100 transition font-semibold"
              >
                {t('chat') || 'Chat'}
              </Link>
              <Link 
                to="/support" 
                className="hover:text-blue-100 transition font-semibold"
              >
                {t('support') || 'Support'}
              </Link>
              <Link 
                to="/messaging" 
                className="hover:text-blue-100 transition font-semibold"
              >
                {t('messages') || 'Messages'}
              </Link>
            </>
          )}

          {/* Language Selector */}
          <div className="relative">
             <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-blue-700 text-white border-0 font-semibold px-3 py-1 rounded"
             >
                 {supportedLanguages.map((option) => (
                   <option key={option.code} value={option.code}>{option.label}</option>
                 ))}
             </select>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded-lg transition"
            >
              <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" className="border-2 border-white" />
              <span className="hidden sm:inline">{user.firstName}</span>
              <span className="text-xl">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="font-semibold">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                </div>
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 hover:bg-blue-50 transition"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  👤 {t('profile') || 'My Profile'}
                </Link>
                <Link 
                  to="/progress-report" 
                  className="block px-4 py-2 hover:bg-blue-50 transition"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  📊 {t('progressReport') || 'Progress Report'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition font-semibold"
                >
                  🚪 {t('logout') || 'Logout'}
                </button>
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
  <div className="mb-8">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
    {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const TabBar = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-gray-200 mb-6">
    <div className="flex gap-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-3 font-semibold transition border-b-2 ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);
