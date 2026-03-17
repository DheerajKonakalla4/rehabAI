import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { patientsAPI } from '../services/api';

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
              <h1 className="text-2xl font-bold text-blue-600">Exercise Tracking</h1>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Exercises */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Exercises</h2>
              {exercises.length > 0 ? (
                <div className="space-y-4">
                  {exercises.map((exercise) => {
                    const ex = exercise.exercise || exercise;
                    return (
                      <div
                        key={ex._id}
                        onClick={() => setSelectedExercise(ex)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedExercise?._id === ex._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <h3 className="font-bold text-gray-800">{ex.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{ex.description}</p>
                        <div className="flex gap-4 mt-3 text-xs">
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            Difficulty: {ex.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {ex.duration?.value} {ex.duration?.unit}
                          </span>
                          {ex.repetitions && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              Reps: {ex.repetitions}
                            </span>
                          )}
                        </div>
                        {ex.instructions && (
                          <p className="text-xs text-gray-600 mt-2 italic">{ex.instructions.substring(0, 100)}...</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No exercises assigned yet</p>
              )}
            </div>
          </div>

          {/* Log Exercise Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Log Exercise</h2>
            {selectedExercise ? (
              <form onSubmit={handleSubmitLog} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-800">{selectedExercise.name}</p>
                  <p className="text-sm text-gray-600">Selected</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completed Sets / Reps *
                  </label>
                  <input
                    type="number"
                    name="completedSets"
                    value={logData.completedSets}
                    onChange={handleLogChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 3"
                    min="1"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Level (0-10)
                  </label>
                  <input
                    type="number"
                    name="painLevel"
                    value={logData.painLevel}
                    onChange={handleLogChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0-10"
                    min="0"
                    max="10"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={logData.notes}
                    onChange={handleLogChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="How did it feel? Any observations?"
                    rows="3"
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {submitting ? 'Logging...' : 'Log Exercise'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedExercise(null)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                  disabled={submitting}
                >
                  Clear Selection
                </button>
              </form>
            ) : (
              <p className="text-gray-500">Select an exercise to log it</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
