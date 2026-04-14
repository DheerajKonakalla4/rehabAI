import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [assignedExercises, setAssignedExercises] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingExerciseId, setCompletingExerciseId] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [dailyLog, setDailyLog] = useState({ painLevel: 5, mood: 'Okay', symptoms: '' });

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

  const handleSubmitDailyLog = async (e) => {
    e.preventDefault();
    try {
      await patientsAPI.logDailyHealth(dailyLog);
      alert('Daily log submitted! If pain is severe, your therapist has been notified.');
      setShowLogModal(false);
    } catch (error) {
      alert('Error submitting daily log: ' + (error.response?.data?.message || error.message));
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
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <PageHeader 
            title={`Welcome, ${user?.firstName}! 👋`}
            subtitle="Your recovery progress and treatment plans"
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/sessions')}>
              📅 Book Session
            </Button>
            <Button variant="secondary" onClick={() => navigate('/ai-rehab-plan')}>
              🤖 Generate AI Plan
            </Button>
            <Button variant="primary" onClick={() => setShowLogModal(true)}>
              📝 Log Daily Health
            </Button>
          </div>
        </div>

        <StatsGrid stats={stats} />
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Daily Log Modal */}
        {showLogModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
            <div className="glass-card max-w-md w-full border border-slate-700/80">
              <h2 className="text-2xl font-bold mb-4 text-slate-100">Log Daily Health</h2>
              <form onSubmit={handleSubmitDailyLog}>
                <div className="mb-4">
                  <label className="block text-slate-300 font-medium mb-2">Pain Level (1-10)</label>
                  <input 
                    type="range" min="1" max="10" 
                    value={dailyLog.painLevel}
                    onChange={(e) => setDailyLog({...dailyLog, painLevel: parseInt(e.target.value)})}
                    className="w-full accent-indigo-500" 
                  />
                  <div className="text-center font-bold text-2xl text-indigo-400 drop-shadow-sm">{dailyLog.painLevel}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-slate-300 font-medium mb-2">Mood</label>
                  <select 
                    value={dailyLog.mood}
                    onChange={(e) => setDailyLog({...dailyLog, mood: e.target.value})}
                    className="premium-input bg-slate-800"
                  >
                    <option value="Great">Great</option>
                    <option value="Good">Good</option>
                    <option value="Okay">Okay</option>
                    <option value="Bad">Bad</option>
                    <option value="Terrible">Terrible</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-slate-300 font-medium mb-2">Symptoms/Notes</label>
                  <textarea 
                    value={dailyLog.symptoms}
                    onChange={(e) => setDailyLog({...dailyLog, symptoms: e.target.value})}
                    className="premium-input"
                    rows="3"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowLogModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Submit Log</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Assigned Doctor Card */}
            <Card className="bg-gradient-to-br from-indigo-900/40 to-slate-800/80 border-indigo-500/20">
              <h2 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
                <span>👨‍⚕️</span> Your Medical Professional
              </h2>
              {assignedDoctor ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">
                      Dr. {assignedDoctor.firstName} {assignedDoctor.lastName}
                    </h3>
                    <p className="text-slate-400 mb-1">{assignedDoctor.email}</p>
                    <p className="text-slate-400">{assignedDoctor.phone}</p>
                  </div>
                  <Button variant="primary" onClick={() => navigate('/doctor-patient-chat')}>
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
              <Card>
                <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                  <span>📊</span> Exercise Progress
                </h2>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400 font-medium tracking-wide text-sm uppercase">Overall Completion</span>
                    <span className="text-3xl font-bold text-indigo-400">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden border border-slate-600/50">
                    <div 
                      className="bg-gradient-to-r from-teal-400 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-800/80 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                    <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Total</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-1">{assignedExercises.length}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800/80 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                    <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Pending</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800/80 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                    <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Completed</p>
                    <p className="text-2xl font-bold text-teal-400 mt-1">{completedCount}</p>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card>
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <span>📋</span> Recent Activity
                </h2>
                {assignedExercises.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-2">
                    {assignedExercises.slice(0, 5).map((exercise) => (
                      <div key={exercise._id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-700/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-slate-200 font-semibold text-sm">{exercise.exerciseId?.name}</p>
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">
                              {exercise.exerciseId?.category} • {exercise.exerciseId?.difficulty}
                            </p>
                          </div>
                          {getStatusBadge(exercise.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
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
          <div className="space-y-6 animate-fade-in-up">
            {assignedExercises.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {assignedExercises.map((assignment) => {
                  const exercise = assignment.exerciseId;
                  return (
                    <Card key={assignment._id} className="border-l-4 border-indigo-500 relative overflow-hidden group">
                      {/* Decorative background element */}
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
                      
                      <div className="relative">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-100 mb-2 drop-shadow-sm">
                              {exercise?.name}
                            </h3>
                            <p className="text-slate-400 mb-4 text-sm leading-relaxed max-w-3xl">
                              {exercise?.description}
                            </p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                              <div className="text-center p-3 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Category</p>
                                <p className="font-bold text-slate-200 text-sm whitespace-nowrap">{exercise?.category}</p>
                              </div>
                              <div className="text-center p-3 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Difficulty</p>
                                <p className="font-bold text-slate-200 text-sm capitalize">{exercise?.difficulty}</p>
                              </div>
                              <div className="text-center p-3 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Duration</p>
                                <p className="font-bold text-slate-200 text-sm">
                                  {exercise?.duration?.value} {exercise?.duration?.unit}
                                </p>
                              </div>
                              <div className="text-center p-3 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Reps / Sets</p>
                                <p className="font-bold text-slate-200 text-sm">
                                  {exercise?.repetitions || 'N/A'}
                                </p>
                              </div>
                            </div>

                            {exercise?.instructions && (
                              <div className="mb-6 p-4 bg-indigo-900/30 rounded-xl border border-indigo-500/20 shadow-inner">
                                <p className="text-sm text-indigo-300 font-bold mb-2 uppercase tracking-wider">Instructions</p>
                                <p className="text-sm text-slate-300 leading-relaxed">{exercise.instructions}</p>
                              </div>
                            )}

                          {exercise?.bodyParts && exercise.bodyParts.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Muscle Groups</p>
                              <div className="flex flex-wrap gap-2">
                                {exercise.bodyParts.map((part, idx) => (
                                  <Badge key={idx} variant="blue" className="capitalize tracking-wide">{part}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 font-medium">
                          Assigned: <span className="text-slate-300">{new Date(assignment.assignedDate).toLocaleDateString()}</span>
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
                                onClick={() => navigate('/exercise-tracking')}
                              >
                                📐 Track with AI
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
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate('/exercise-tracking')}
                              >
                                📐 Track with AI
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleCompleteExercise(assignment._id)}
                                disabled={completingExerciseId === assignment._id}
                              >
                                {completingExerciseId === assignment._id ? '⏳...' : '✓ Mark Complete'}
                              </Button>
                            </>
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
          <div className="space-y-4 animate-fade-in-up">
            {dietPlans.length > 0 ? (
              dietPlans.map((diet, idx) => (
                <Card key={idx}>
                  <h2 className="text-2xl font-bold text-teal-400 mb-3 drop-shadow-sm flex items-center gap-2">
                    <span>🥗</span> Diet Plan for {diet.injuryType}
                  </h2>
                  {diet.description && (
                    <p className="text-slate-300 mb-6 leading-relaxed max-w-3xl">{diet.description}</p>
                  )}
                  
                  {diet.foods && diet.foods.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Recommended Nutrition</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {diet.foods.map((food, fIdx) => (
                          <div key={fIdx} className="p-4 bg-slate-800/80 rounded-xl border border-teal-500/20 hover:border-teal-500/50 transition-colors shadow-sm">
                            <p className="font-bold text-slate-100 text-lg mb-1">{food.name}</p>
                            {food.quantity && <p className="text-sm text-slate-400 mb-2 block font-medium tracking-wide">{food.quantity}</p>}
                            {food.benefits && <p className="text-sm text-teal-300 bg-teal-500/10 px-3 py-1.5 rounded-lg inline-block">✓ {food.benefits}</p>}
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
