import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, Badge, Input, Skeleton, EmptyState } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const ExerciseLibrary = () => {
  const { user } = useContext(AuthContext);
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

  const difficultyColors = {
    easy: 'green',
    moderate: 'yellow',
    hard: 'red'
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
    <Card key={exercise._id} className="flex flex-col h-full hover:shadow-xl transition-all duration-200">
      {exercise.imageUrl && (
        <div className="mb-4 h-40 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg overflow-hidden">
          <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
        </div>
      )}
      
      <h3 className="text-lg font-bold text-gray-800 mb-2">{exercise.name}</h3>
      {exercise.description && (
        <p className="text-sm text-gray-600 mb-3 flex-grow">{exercise.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {exercise.duration && (
          <Badge variant="blue" className="text-xs">
            ⏱️ {exercise.duration.value} {exercise.duration.unit?.replace('s', '')}
          </Badge>
        )}
        {exercise.repetitions && (
          <Badge variant="blue" className="text-xs">
            🔄 {exercise.repetitions} reps
          </Badge>
        )}
        <Badge variant={difficultyColors[exercise.difficulty]} className="text-xs">
          {difficultyLevels[exercise.difficulty] || 'Moderate'}
        </Badge>
      </div>

      {exercise.status === 'completed' && (
        <div className="mb-3">
          <Badge variant="green" className="text-xs">✓ Done</Badge>
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={() => handleStartExercise(exercise._id)}
      >
        ▶ Start Exercise
      </Button>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton count={3} height={300} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <PageHeader
          title="Exercise Library"
          subtitle="Browse and start your personalized rehabilitation exercises"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <div className="text-sm opacity-90 mb-1">Total Exercises</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <div className="text-sm opacity-90 mb-1">Completed</div>
            <div className="text-3xl font-bold">{stats.completed}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="text-sm opacity-90 mb-1">This Week</div>
            <div className="text-3xl font-bold">{stats.thisWeek}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="mb-6">
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
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
          <EmptyState
            icon="🔍"
            title="No exercises found"
            subtitle={searchQuery ? "Try a different search term" : "Select another category"}
          />
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;
