import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { 
  Card, 
  Button, 
  Badge, 
  StatsGrid, 
  EmptyState,
  Skeleton 
} from '../components/UIComponents';
import { patientsAPI } from '../services/api';

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [assignedExercises, setAssignedExercises] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingExerciseId, setCompletingExerciseId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, doctorRes, exercisesRes, dietsRes, logsRes] = await Promise.all([
        patientsAPI.getDashboard(),
        patientsAPI.getAssignedDoctor().catch(() => ({ data: { doctor: null } })),
        patientsAPI.getExercises().catch(() => ({ data: { exercises: [] } })),
        patientsAPI.getDietPlans().catch(() => ({ data: { dietPlans: [] } })),
        patientsAPI.getExerciseLogs().catch(() => ({ data: { logs: [] } }))
      ]);
      
      setDashboardData(dashboardRes.data);
      setAssignedDoctor(doctorRes.data.doctor);
      setAssignedExercises(exercisesRes.data.exercises || []);
      setDietPlans(dietsRes.data.dietPlans || []);
      setExerciseLogs(logsRes.data.logs || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleCompleteExercise = async (assignmentId) => {
    try {
      setCompletingExerciseId(assignmentId);
      await patientsAPI.completeExercise(assignmentId);
      alert('Exercise marked as completed! Great work! 🎉');
      fetchData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setCompletingExerciseId(null);
    }
  };

  const handleStartExercise = async (assignmentId) => {
    try {
      await patientsAPI.startExercise(assignmentId);
      fetchData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };


  if (loading) return <div className="min-h-screen"><Navbar /><div className="p-6"><Skeleton count={3} /></div></div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'exercises', label: `Assigned Exercises (${assignedExercises.length})` },
    { id: 'diet', label: `Diet Plans (${dietPlans.length})` }
  ];

  const pendingCount = assignedExercises.filter(e => e.status === 'pending' || e.status === 'in-progress').length;
  const completedCount = assignedExercises.filter(e => e.status === 'completed').length;
  const progressPercentage = assignedExercises.length > 0 
    ? Math.round((completedCount / assignedExercises.length) * 100)
    : 0;

  const stats = [
    { label: 'Assigned Doctor', value: assignedDoctor ? `Dr. ${assignedDoctor.lastName}` : 'Awaiting Assignment' },
    { label: 'Total Exercises', value: assignedExercises.length },
    { label: 'Completed', value: completedCount },
    { label: 'Progress', value: `${progressPercentage}%` }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <Badge variant="success">✓ Completed</Badge>;
      case 'in-progress':
        return <Badge variant="warning">▶ In Progress</Badge>;
      case 'pending':
        return <Badge variant="gray">⏳ Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'in-progress':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'pending':
        return 'border-l-4 border-gray-500 bg-gray-50';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader 
          title={`Welcome, ${user?.firstName}! 👋`}
          subtitle="Your recovery progress and treatment plans"
        />

        <StatsGrid stats={stats} />
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Assigned Doctor Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">👨‍⚕️ Your Medical Professional</h2>
              {assignedDoctor ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Dr. {assignedDoctor.firstName} {assignedDoctor.lastName}
                    </h3>
                    <p className="text-gray-700 mb-1">{assignedDoctor.email}</p>
                    <p className="text-gray-700">{assignedDoctor.phone}</p>
                  </div>
                  <Button variant="primary">
                    📧 Contact Doctor
                  </Button>
                </div>
              ) : (
                <EmptyState 
                  icon="👨‍⚕️"
                  title="No doctor assigned yet"
                  description="Your assigned doctor will appear here once they connect with you"
                />
              )}
            </Card>

            {/* Progress Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exercise Progress Card */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Exercise Progress</h2>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-semibold">Overall Progress</span>
                    <span className="text-3xl font-bold text-blue-600">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600 text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{assignedExercises.length}</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-gray-600 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-gray-600 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{completedCount}</p>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Recent Activity</h2>
                {assignedExercises.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {assignedExercises.slice(0, 5).map((exercise) => (
                      <div key={exercise._id} className={`p-3 rounded-lg ${getStatusColor(exercise.status)}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-gray-800 font-semibold text-sm">{exercise.exerciseId?.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {exercise.exerciseId?.category} • {exercise.exerciseId?.difficulty}
                            </p>
                          </div>
                          {getStatusBadge(exercise.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Assigned: {new Date(exercise.assignedDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon="📋"
                    title="No exercises yet"
                    description="Exercises assigned by your doctor will appear here"
                  />
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Assigned Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="space-y-6">
            {assignedExercises.length > 0 ? (
              <div className="space-y-4">
                {assignedExercises.map((assignment) => {
                  const exercise = assignment.exerciseId;
                  return (
                    <Card key={assignment._id} className={`p-6 ${getStatusColor(assignment.status)}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            {exercise?.name}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {exercise?.description}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="text-center p-2 bg-white rounded border border-gray-200">
                              <p className="text-xs text-gray-600">Category</p>
                              <p className="font-semibold text-gray-800 text-sm">{exercise?.category}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border border-gray-200">
                              <p className="text-xs text-gray-600">Difficulty</p>
                              <p className="font-semibold text-gray-800 text-sm capitalize">{exercise?.difficulty}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border border-gray-200">
                              <p className="text-xs text-gray-600">Duration</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {exercise?.duration?.value} {exercise?.duration?.unit}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border border-gray-200">
                              <p className="text-xs text-gray-600">Reps</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {exercise?.repetitions || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {exercise?.instructions && (
                            <div className="mb-4 p-3 bg-blue-100 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm text-blue-900 font-semibold mb-1">Instructions:</p>
                              <p className="text-sm text-blue-800">{exercise.instructions}</p>
                            </div>
                          )}

                          {exercise?.bodyParts && exercise.bodyParts.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Target Areas:</p>
                              <div className="flex flex-wrap gap-2">
                                {exercise.bodyParts.map((part, idx) => (
                                  <Badge key={idx} variant="blue" className="capitalize">{part}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-between items-center">
                        <p className="text-xs text-gray-600">
                          Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                          {assignment.completedDate && ` • Completed: ${new Date(assignment.completedDate).toLocaleDateString()}`}
                        </p>
                        
                        <div className="flex gap-2">
                          {assignment.status === 'pending' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStartExercise(assignment._id)}
                              >
                                ▶ Start
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCompleteExercise(assignment._id)}
                                disabled={completingExerciseId === assignment._id}
                              >
                                {completingExerciseId === assignment._id ? '⏳...' : '✓ Complete'}
                              </Button>
                            </>
                          )}
                          {assignment.status === 'in-progress' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleCompleteExercise(assignment._id)}
                              disabled={completingExerciseId === assignment._id}
                            >
                              {completingExerciseId === assignment._id ? '⏳...' : '✓ Mark Complete'}
                            </Button>
                          )}
                          {assignment.status === 'completed' && (
                            <Button
                              variant="success"
                              size="sm"
                              disabled
                            >
                              ✓ Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState 
                icon="🏋️"
                title="No exercises assigned yet"
                description="Your doctor will assign exercises once you're connected"
              />
            )}
          </div>
        )}

        {/* Diet Plans Tab */}
        {activeTab === 'diet' && (
          <div className="space-y-4">
            {dietPlans.length > 0 ? (
              dietPlans.map((diet, idx) => (
                <Card key={idx} className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Diet Plan for {diet.injuryType}
                  </h2>
                  {diet.description && (
                    <p className="text-gray-700 mb-4">{diet.description}</p>
                  )}
                  
                  {diet.foods && diet.foods.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommended Foods</h3>
                      <div className="space-y-2">
                        {diet.foods.map((food, fIdx) => (
                          <div key={fIdx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="font-semibold text-gray-800">{food.name}</p>
                            {food.quantity && <p className="text-sm text-gray-600">Quantity: {food.quantity}</p>}
                            {food.benefits && <p className="text-sm text-green-700">Benefits: {food.benefits}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState 
                icon="🥗"
                title="No diet plans assigned"
                description="Your doctor will add diet plans as needed"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
