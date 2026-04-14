import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { patientsAPI } from '../services/api';
import { Navbar } from '../components/Layout';

export default function ProgressReport() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // days
  const [stats, setStats] = useState({
    totalExercises: 0,
    completedExercises: 0,
    averagePain: 0,
    averageEffort: 0,
    completionRate: 0
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await patientsAPI.getExerciseLogs();
        const allLogs = response.data.logs || [];
        setLogs(allLogs);
        calculateStats(allLogs);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const calculateStats = (logsData) => {
    if (!logsData || logsData.length === 0) {
      setStats({
        totalExercises: 0,
        completedExercises: 0,
        averagePain: 0,
        averageEffort: 0,
        completionRate: 0
      });
      return;
    }

    const total = logsData.length;
    const completed = logsData.filter(log => log.completed === true).length;
    const painLevels = logsData
      .filter(log => log.painLevel !== undefined && log.painLevel !== null)
      .map(log => parseInt(log.painLevel));
    const effortLevels = logsData
      .map(log => log.completedSets || 0);

    setStats({
      totalExercises: total,
      completedExercises: completed,
      averagePain: painLevels.length > 0
        ? (painLevels.reduce((a, b) => a + b, 0) / painLevels.length).toFixed(1)
        : 0,
      averageEffort: effortLevels.length > 0
        ? (effortLevels.reduce((a, b) => a + b, 0) / effortLevels.length).toFixed(1)
        : 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  };

  const getProgressColor = (value, max) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="glass-card shadow-md p-6 border-slate-700/50 hover:-translate-y-1 transition-transform">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Exercises</p>
            <p className="text-3xl font-bold text-indigo-400 mt-2">{stats.totalExercises}</p>
          </div>
          <div className="glass-card shadow-md p-6 border-slate-700/50 hover:-translate-y-1 transition-transform">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</p>
            <p className="text-3xl font-bold text-teal-400 mt-2">{stats.completedExercises}</p>
          </div>
          <div className="glass-card shadow-md p-6 border-slate-700/50 hover:-translate-y-1 transition-transform">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completion Rate</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{stats.completionRate}%</p>
          </div>
          <div className="glass-card shadow-md p-6 border-slate-700/50 hover:-translate-y-1 transition-transform">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Pain Level</p>
            <p className="text-3xl font-bold text-amber-500 mt-2">{stats.averagePain}/10</p>
          </div>
          <div className="glass-card shadow-md p-6 border-slate-700/50 hover:-translate-y-1 transition-transform">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Sets Done</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{stats.averageEffort}</p>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Completion Rate Chart */}
          <div className="glass-card shadow-md p-6 border-slate-700/50 flex flex-col items-center">
            <h2 className="text-xl font-bold text-slate-100 mb-6 drop-shadow-sm self-start">Completion Rate</h2>
            <div className="flex items-center justify-center flex-1">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="8"
                    strokeDasharray={`${(stats.completionRate / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-teal-400 drop-shadow-md">{stats.completionRate}%</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Level Trend */}
          <div className="glass-card shadow-md p-6 border-slate-700/50 flex flex-col justify-center">
            <h2 className="text-xl font-bold text-slate-100 mb-6 drop-shadow-sm">Pain Level Trend</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-amber-500 uppercase tracking-wider">Current: {stats.averagePain}/10</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-1000 ${getProgressColor(stats.averagePain, 10)}`}
                    style={{ width: `${(stats.averagePain / 10) * 100}%`, boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4 font-medium">
                {stats.averagePain <= 3
                  ? '✓ Low pain level - Great progress!'
                  : stats.averagePain <= 6
                  ? '→ Moderate pain level - Keep working'
                  : '⚠ Elevated pain level - Consider adjusting'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Logs Timeline */}
        <div className="glass-card shadow-md p-6 border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-100 mb-6 drop-shadow-sm">Recent Exercise Logs</h2>
          {logs.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin pr-2">
              {logs.slice().reverse().map((log, index) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4 py-3 bg-slate-800/30 rounded-r-xl transition-colors hover:bg-slate-800/60">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-200 text-lg">
                        {log.exercise?.name || 'Exercise'}
                      </p>
                      <p className="text-sm text-slate-400 font-medium">
                        {new Date(log.date || log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-xs font-bold drop-shadow-sm">
                      {log.completedSets || 0} sets
                    </span>
                  </div>
                  {log.painLevel !== undefined && log.painLevel !== null && (
                    <p className="text-sm font-semibold text-amber-500/90 flex items-center gap-1">
                      <span>⚡</span> Pain Level: {log.painLevel}/10
                    </p>
                  )}
                  {log.notes && (
                    <p className="text-sm text-slate-400 italic mt-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">"{log.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No exercise logs yet. Start logging your exercises!</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-slate-800/80 rounded-xl p-6 border border-indigo-500/20 shadow-lg">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2 drop-shadow-sm">
            <span>📋</span> Recommendations
          </h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-teal-400 font-bold text-xl drop-shadow-sm">✓</span>
              {stats.completionRate >= 80
                ? 'Excellent completion rate! Keep up the great work.'
                : 'Try to increase your completion rate by doing more exercises consistently.'}
            </li>
            <li className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-teal-400 font-bold text-xl drop-shadow-sm">✓</span>
              {stats.averagePain <= 3
                ? 'Your pain level is well-managed. Continue current routine.'
                : 'Consider a lighter workload if pain is persistent.'}
            </li>
            <li className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-teal-400 font-bold text-xl drop-shadow-sm">✓</span>
              Log exercises regularly to track your recovery progress.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
