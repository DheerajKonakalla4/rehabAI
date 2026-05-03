import React, { useState, useEffect, useContext, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { patientsAPI } from '../services/api';
import { Navbar } from '../components/Layout';

// Lazy-load CameraTracker so TensorFlow.js only downloads when tracking starts
const CameraTracker = React.lazy(() => import('../components/CameraTracker'));

export default function ExerciseTracking() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [logData, setLogData] = useState({
    completedSets: '',
    painLevel: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackerFeedback, setTrackerFeedback] = useState('');
  const [repCount, setRepCount] = useState(0);
  const [formQuality, setFormQuality] = useState(100);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [sessionSummary, setSessionSummary] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await patientsAPI.getExercises();
        setExercises(response.data.exercises || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exercises');
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const handleLogChange = (e) => {
    setLogData({
      ...logData,
      [e.target.name]: e.target.value
    });
  };

  const handleStartTracking = () => {
    setIsTracking(true);
    setRepCount(0);
    setFormQuality(100);
    setSessionSummary(null);
    setTrackerFeedback('');
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    // Save session summary
    setSessionSummary({
      reps: repCount,
      formQuality: formQuality,
      duration: 'Session ended'
    });
    // Auto-fill the log form
    setLogData(prev => ({
      ...prev,
      completedSets: repCount > 0 ? String(repCount) : prev.completedSets,
      notes: prev.notes || `AI tracked: ${repCount} reps, ${formQuality}% form quality`
    }));
  };

  const getExerciseType = (exercise) => {
    if (!exercise) return 'squats';
    const name = (exercise.name || '').toLowerCase();
    const category = (exercise.category || '').toLowerCase();
    const combined = `${name} ${category}`;
    
    if (combined.includes('squat')) return 'squats';
    if (combined.includes('curl') || combined.includes('bicep')) return 'bicep_curls';
    if (combined.includes('shoulder') || combined.includes('press')) return 'shoulder_press';
    if (combined.includes('leg') && combined.includes('raise')) return 'leg_raises';
    if (combined.includes('arm') && combined.includes('raise')) return 'arm_raises';
    if (combined.includes('knee') || combined.includes('extension')) return 'knee_extensions';
    return 'squats';
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!selectedExercise) {
      setError('Please select an exercise');
      return;
    }
    if (!logData.completedSets) {
      setError('Please enter completed sets');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await patientsAPI.logExercise({
        exerciseId: selectedExercise._id || selectedExercise.exerciseId._id,
        completedSets: parseInt(logData.completedSets),
        painLevel: logData.painLevel ? parseInt(logData.painLevel) : undefined,
        notes: logData.notes
      });
      setSuccessMessage('Exercise logged successfully!');
      setLogData({ completedSets: '', painLevel: '', notes: '' });
      setSelectedExercise(null);
      setSessionSummary(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log exercise');
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-gray-600">Loading exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-teal-500/20 border border-teal-500 text-teal-300 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Exercises */}
          <div className="lg:col-span-1">
            <div className="glass-card shadow-md p-6 border-slate-700/50">
              <h2 className="text-2xl font-bold text-slate-100 mb-6 drop-shadow-sm">My Exercises</h2>
              {exercises.length > 0 ? (
                <div className="space-y-3">
                  {exercises.map((exercise) => {
                    const ex = exercise.exerciseId || exercise.exercise || exercise;
                    return (
                      <div
                        key={ex._id}
                        onClick={() => {
                          setSelectedExercise(ex);
                          if (isTracking) handleStopTracking();
                        }}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedExercise?._id === ex._id
                            ? 'border-indigo-500 bg-indigo-500/20'
                            : 'border-slate-700 hover:border-indigo-400/50 hover:bg-slate-800/50 bg-slate-800/20'
                        }`}
                      >
                        <h3 className="font-bold text-slate-200">{ex.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">{ex.description}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <span className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded text-xs">
                            {ex.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded text-xs">
                            {ex.duration?.value} {ex.duration?.unit}
                          </span>
                          {ex.repetitions && (
                            <span className="px-2 py-1 bg-indigo-900/50 border border-indigo-500/50 text-indigo-300 font-bold rounded text-xs">
                              Reps: {ex.repetitions}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500">No exercises assigned yet</p>
              )}
            </div>
          </div>

          {/* Camera Tracking & Log Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Motion Tracking Section */}
            {selectedExercise && (
              <div className="glass-card shadow-md p-6 border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-100">
                    🎯 AI Motion Tracking — {selectedExercise.name}
                  </h3>
                  <button 
                    onClick={isTracking ? handleStopTracking : handleStartTracking}
                    className={`py-2 px-6 rounded-lg font-bold shadow-lg transition-all ${
                      isTracking ? 'bg-red-600 hover:bg-red-500 text-red-50' : 'bg-green-600 hover:bg-green-500 text-green-50'
                    }`}
                  >
                    {isTracking ? '⏹ Stop' : '▶ Start Tracking'}
                  </button>
                </div>
                
                {/* Real-time Stats Bar */}
                {isTracking && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-xl p-3 text-center">
                      <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">REPS</p>
                      <p className="text-3xl font-bold text-indigo-300 drop-shadow-md">{repCount}</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center border ${formQuality >= 70 ? 'bg-teal-900/40 border-teal-500/30' : 'bg-red-900/40 border-red-500/30'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wider ${formQuality >= 70 ? 'text-teal-400' : 'text-red-400'}`}>
                        FORM QUALITY
                      </p>
                      <p className={`text-3xl font-bold drop-shadow-md ${formQuality >= 70 ? 'text-teal-300' : 'text-red-300'}`}>
                        {formQuality}%
                      </p>
                    </div>
                    <div className="bg-purple-900/40 border border-purple-500/30 rounded-xl p-3 text-center">
                      <p className="text-xs text-purple-400 font-bold uppercase tracking-wider">ANGLE</p>
                      <p className="text-3xl font-bold text-purple-300 drop-shadow-md">{currentAngle}°</p>
                    </div>
                  </div>
                )}

                {/* Camera Feed */}
                {isTracking && (
                  <div className="rounded-lg overflow-hidden" style={{ height: 420 }}>
                    <Suspense fallback={
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', background: '#000', borderRadius: 12, color: '#fff'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: 40, height: 40, border: '3px solid rgba(99,102,241,0.3)',
                            borderTopColor: '#6366f1', borderRadius: '50%',
                            animation: 'spin 1s linear infinite', margin: '0 auto 12px'
                          }} />
                          <p style={{ fontWeight: 600, fontSize: 14 }}>Loading AI Tracking...</p>
                          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>First load may take a moment</p>
                        </div>
                      </div>
                    }>
                      <CameraTracker 
                        isTracking={isTracking}
                        exerciseType={getExerciseType(selectedExercise)}
                        setRepCount={setRepCount}
                        setFeedback={setTrackerFeedback}
                        setFormQuality={setFormQuality}
                        setCurrentAngle={setCurrentAngle}
                      />
                    </Suspense>
                  </div>
                )}
                
                {/* Feedback */}
                {trackerFeedback && isTracking && (
                  <div className={`mt-4 p-4 rounded-xl border-l-4 font-medium backdrop-blur-md ${
                    trackerFeedback.includes('⚠️') 
                      ? 'bg-amber-900/40 border-amber-500 text-amber-300'
                      : trackerFeedback.includes('📷')
                        ? 'bg-slate-800/80 border-slate-500 text-slate-300'
                        : 'bg-teal-900/40 border-teal-500 text-teal-300'
                  }`}>
                    <p className="font-bold text-sm tracking-wider uppercase opacity-80">Real-time Feedback</p>
                    <p className="text-md mt-1">{trackerFeedback}</p>
                  </div>
                )}

                {/* Session Summary */}
                {sessionSummary && !isTracking && (
                  <div className="mt-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 shadow-lg">
                    <h4 className="font-bold text-slate-100 mb-4 drop-shadow-sm flex items-center gap-2">
                      <span>📊</span> Session Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Reps</p>
                        <p className="text-3xl font-bold text-indigo-400 drop-shadow-md">{sessionSummary.reps}</p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Form Quality</p>
                        <p className={`text-3xl font-bold drop-shadow-md ${sessionSummary.formQuality >= 70 ? 'text-teal-400' : 'text-red-400'}`}>
                          {sessionSummary.formQuality}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 text-center italic">
                      Reps and form data have been auto-filled in the log form below
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Log Exercise Form */}
            <div className="glass-card shadow-md p-6 border-slate-700/50">
              <h2 className="text-2xl font-bold text-slate-100 mb-6 drop-shadow-sm">Log Exercise</h2>
              {selectedExercise ? (
                <form onSubmit={handleSubmitLog} className="space-y-4">
                  <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5 mb-4">
                    <p className="font-bold text-indigo-100 text-lg">{selectedExercise.name}</p>
                    <p className="text-sm text-indigo-400 mt-1 uppercase font-bold tracking-wider opacity-80">Selected Target</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Completed Sets / Reps *
                    </label>
                    <input
                      type="number"
                      name="completedSets"
                      value={logData.completedSets}
                      onChange={handleLogChange}
                      className="premium-input px-3 py-2 bg-slate-900 focus:ring-indigo-500"
                      placeholder="e.g., 3"
                      min="1"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Pain Level (0-10)
                    </label>
                    <input
                      type="number"
                      name="painLevel"
                      value={logData.painLevel}
                      onChange={handleLogChange}
                      className="premium-input px-3 py-2 bg-slate-900 focus:ring-indigo-500"
                      placeholder="0-10"
                      min="0"
                      max="10"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={logData.notes}
                      onChange={handleLogChange}
                      className="premium-input px-3 py-2 bg-slate-900 focus:ring-indigo-500"
                      placeholder="How did it feel? Any observations?"
                      rows="3"
                      disabled={submitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500/50 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg"
                  >
                    {submitting ? 'Logging...' : 'Log Exercise'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExercise(null);
                      if (isTracking) handleStopTracking();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-3 px-4 rounded-xl transition-all"
                    disabled={submitting}
                  >
                    Clear Selection
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20">
                  <span className="text-4xl mb-4 opacity-50">👆</span>
                  <p className="text-slate-400 font-medium text-center text-sm">Select an exercise from the list to start tracking and logging.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
