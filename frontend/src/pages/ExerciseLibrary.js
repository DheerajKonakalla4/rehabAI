import React, { useState, useEffect } from 'react';
import { Navbar, PageHeader } from '../components/Layout';
import { Skeleton } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    thisWeek: 0
  });

  const categories = [
    { id: 'all', label: 'All Exercises', icon: '🏃' },
    { id: 'knee', label: 'Knee', icon: '🦵' },
    { id: 'shoulder', label: 'Shoulder', icon: '💪' },
    { id: 'back', label: 'Back', icon: '🔙' },
    { id: 'hip', label: 'Hip', icon: '🧘' }
  ];

  const difficultyLevels = {
    easy: 'Beginner',
    moderate: 'Intermediate',
    hard: 'Advanced'
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchQuery, selectedCategory]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/exercises');
      setExercises(response.data.exercises || []);
      setStats(response.data.stats || { total: 0, completed: 0, thisWeek: 0 });
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => {
        const bodyParts = ex.bodyParts || [];
        return bodyParts.some(part => part.toLowerCase().includes(selectedCategory));
      });
    }

    setFilteredExercises(filtered);
  };

  const handleStartExercise = (exerciseId) => {
    // Navigate to exercise detail/start page
    window.location.href = `/exercise/${exerciseId}`;
  };

  const renderExerciseCard = (exercise) => (
    <div key={exercise._id} className="glass-card p-6 flex flex-col h-full hover:scale-[1.02] hover:border-indigo-500/30 transition-all duration-200">
      {exercise.imageUrl && (
        <div className="mb-4 h-40 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl overflow-hidden border border-slate-700/30">
          <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
        </div>
      )}
      
      <h3 className="text-lg font-black text-slate-100 mb-2">{exercise.name}</h3>
      {exercise.description && (
        <p className="text-sm text-slate-400 mb-3 flex-grow leading-relaxed">{exercise.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {exercise.duration && (
          <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold">
            ⏱️ {exercise.duration.value} {exercise.duration.unit?.replace('s', '')}
          </span>
        )}
        {exercise.repetitions && (
          <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold">
            🔄 {exercise.repetitions} reps
          </span>
        )}
        <span className={`px-2 py-1 border rounded-md text-[10px] font-bold ${
          exercise.difficulty === 'easy' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : exercise.difficulty === 'hard'
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {difficultyLevels[exercise.difficulty] || 'Moderate'}
        </span>
      </div>

      {exercise.status === 'completed' && (
        <div className="mb-3">
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-black uppercase tracking-widest">✓ Done</span>
        </div>
      )}

      <button
        onClick={() => handleStartExercise(exercise._id)}
        className="w-full h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20"
      >
        ▶ Start Exercise
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <Skeleton count={3} height={300} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Header */}
        <PageHeader
          title="Exercise Library"
          subtitle="Browse and start your personalized rehabilitation exercises"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-600/80 to-indigo-700/80 text-white rounded-2xl p-6 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total Exercises</div>
            <div className="text-3xl font-black">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/80 to-emerald-700/80 text-white rounded-2xl p-6 shadow-lg shadow-emerald-500/10 border border-emerald-500/20">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Completed</div>
            <div className="text-3xl font-black">{stats.completed}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/80 to-purple-700/80 text-white rounded-2xl p-6 shadow-lg shadow-purple-500/10 border border-purple-500/20">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">This Week</div>
            <div className="text-3xl font-black">{stats.thisWeek}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="mb-6">
            <input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input max-w-md px-5 h-12"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-indigo-500/40 hover:text-slate-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Grid */}
        {filteredExercises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map(exercise => renderExerciseCard(exercise))}
          </div>
        ) : (
          <div className="text-center py-20 opacity-60">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-200">No exercises found</h3>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery ? "Try a different search term" : "Select another category"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;
