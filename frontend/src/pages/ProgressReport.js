import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { patientsAPI } from '../services/api';

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-blue-600">Progress Report</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Exercises</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalExercises}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedExercises}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Completion Rate</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.completionRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Avg Pain Level</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.averagePain}/10</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Avg Sets Done</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.averageEffort}</p>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Completion Rate Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Completion Rate</h2>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray={`${(stats.completionRate / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600">{stats.completionRate}%</p>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Level Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Pain Level Trend</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Current: {stats.averagePain}/10</span>
                  <span className="text-xs text-gray-500">Average</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getProgressColor(stats.averagePain, 10)}`}
                    style={{ width: `${(stats.averagePain / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Exercise Logs</h2>
          {logs.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {logs.slice().reverse().map((log, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {log.exercise?.name || 'Exercise'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.date || log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {log.completedSets || 0} sets
                    </span>
                  </div>
                  {log.painLevel !== undefined && log.painLevel !== null && (
                    <p className="text-sm text-gray-600">
                      Pain Level: {log.painLevel}/10
                    </p>
                  )}
                  {log.notes && (
                    <p className="text-sm text-gray-600 italic mt-1">"{log.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No exercise logs yet. Start logging your exercises!</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Recommendations</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-blue-600">✓</span>
              {stats.completionRate >= 80
                ? 'Excellent completion rate! Keep up the great work.'
                : 'Try to increase your completion rate by doing more exercises consistently.'}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">✓</span>
              {stats.averagePain <= 3
                ? 'Your pain level is well-managed. Continue current routine.'
                : 'Consider a lighter workload if pain is persistent.'}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">✓</span>
              Log exercises regularly to track your recovery progress.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
