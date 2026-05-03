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
  Skeleton,
  Modal
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
      setLoading(true);
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
      setShowLogModal(false);
    } catch (error) {
      alert('Error submitting daily log: ' + (error.response?.data?.message || error.message));
    }
  };


  if (loading) return (
    <div className="min-h-screen bg-grid">
      <Navbar />
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-12">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-4 w-48 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[1,2,3,4].map(i => <div key={i} className="h-32 glass-card animate-pulse" />)}
        </div>
        <Skeleton count={3} height={200} />
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'exercises', label: `Exercises (${assignedExercises.length})` },
    { id: 'diet', label: `Diet Plans (${dietPlans.length})` }
  ];

  const pendingCount = assignedExercises.filter(e => e.status === 'pending' || e.status === 'in-progress').length;
  const completedCount = assignedExercises.filter(e => e.status === 'completed').length;
  const progressPercentage = assignedExercises.length > 0 
    ? Math.round((completedCount / assignedExercises.length) * 100)
    : 0;

  const stats = [
    { label: 'Assigned Doc', value: assignedDoctor ? `Dr. ${assignedDoctor.lastName}` : 'None', icon: '👨‍⚕️' },
    { label: 'Total Tasks', value: assignedExercises.length, icon: '📋' },
    { label: 'Completed', value: completedCount, icon: '✅' },
    { label: 'Overall Progress', value: `${progressPercentage}%`, icon: '📈' }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <Badge variant="green">Completed</Badge>;
      case 'in-progress': return <Badge variant="blue">Active</Badge>;
      case 'pending': return <Badge variant="gray">Pending</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen relative bg-grid pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl font-black tracking-tighter text-white mb-4">
              Welcome back, <span className="text-gradient-primary">{user?.firstName}</span> 👋
            </h1>
            <p className="text-xl text-slate-400 font-medium">Your recovery journey is <span className="text-white font-bold">{progressPercentage}%</span> complete. Keep it up!</p>
          </div>
          
          <div className="flex flex-wrap gap-4 animate-fade-in-up animate-stagger-1">
            <Button variant="secondary" onClick={() => navigate('/sessions')}>
              📅 Book Session
            </Button>
            <Button variant="secondary" onClick={() => navigate('/ai-rehab-plan')}>
              🤖 AI Planner
            </Button>
            <Button variant="primary" onClick={() => setShowLogModal(true)}>
              📝 Log Health
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="animate-fade-in-up animate-stagger-1">
          <StatsGrid stats={stats} />
        </div>

        {/* Main Content Tabs */}
        <div className="animate-fade-in-up animate-stagger-2">
          <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Daily Log Modal */}
        {showLogModal && (
          <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="Log Daily Health">
            <form onSubmit={handleSubmitDailyLog} className="space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Pain Level (1-10)</label>
                <input 
                  type="range" min="1" max="10" 
                  value={dailyLog.painLevel}
                  onChange={(e) => setDailyLog({...dailyLog, painLevel: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
                <div className="flex justify-between mt-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Minimal</span>
                  <span className="text-4xl font-black text-indigo-400">{dailyLog.painLevel}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Severe</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {['Great', 'Good', 'Okay', 'Bad', 'Terrible'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDailyLog({...dailyLog, mood: m})}
                    className={`py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                      dailyLog.mood === m 
                        ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                        : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Symptoms/Notes</label>
                <textarea 
                  value={dailyLog.symptoms}
                  onChange={(e) => setDailyLog({...dailyLog, symptoms: e.target.value})}
                  className="premium-input min-h-[120px] resize-none"
                  placeholder="Describe any discomfort or unusual symptoms..."
                ></textarea>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowLogModal(false)}>Cancel</Button>
                <Button variant="primary" className="flex-[2]" type="submit">Submit Log</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fade-in-up">
            {/* Top Row: Doctor + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Doctor Card */}
              <div className="lg:col-span-2 glass-card overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-4xl border border-indigo-500/20">
                    👨‍⚕️
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Your Assigned Professional</p>
                    {assignedDoctor ? (
                      <>
                        <h3 className="text-3xl font-black text-white mb-2">Dr. {assignedDoctor.firstName} {assignedDoctor.lastName}</h3>
                        <p className="text-slate-400 font-medium">{assignedDoctor.email} • {assignedDoctor.phone}</p>
                      </>
                    ) : (
                      <h3 className="text-3xl font-black text-white/20">Awaiting Assignment</h3>
                    )}
                  </div>
                  <Button variant="primary" size="lg" onClick={() => navigate('/doctor-patient-chat')}>
                    Send Message
                  </Button>
                </div>
              </div>

              {/* Progress Card */}
              <div className="glass-card p-8 flex flex-col justify-center items-center text-center">
                <div className="relative w-32 h-32 mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray="351.85" 
                      strokeDashoffset={351.85 - (351.85 * progressPercentage) / 100}
                      className="text-indigo-500 transition-all duration-1000 ease-out" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{progressPercentage}%</span>
                  </div>
                </div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Completion</p>
              </div>
            </div>

            {/* Bottom Row: Activity + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight">Recent Activity</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('exercises')}>View All</Button>
                </div>
                {assignedExercises.length > 0 ? (
                  <div className="space-y-4">
                    {assignedExercises.slice(0, 4).map((ex) => (
                      <div key={ex._id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">🏃</div>
                          <div>
                            <p className="font-bold text-white text-sm">{ex.exerciseId?.name}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{ex.exerciseId?.category}</p>
                          </div>
                        </div>
                        {getStatusBadge(ex.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="📋" title="No activity" description="Complete your first exercise to see progress here." />
                )}
              </Card>

              <Card className="flex flex-col justify-between">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-2">Exercise Breakdown</h2>
                  <p className="text-sm text-slate-400 font-medium">Tracking your effort across categories</p>
                </div>
                <div className="space-y-6">
                  {[
                    { label: 'Completed', count: completedCount, total: assignedExercises.length, color: 'bg-emerald-500' },
                    { label: 'In Progress', count: assignedExercises.filter(e => e.status === 'in-progress').length, total: assignedExercises.length, color: 'bg-indigo-500' },
                    { label: 'Pending', count: assignedExercises.filter(e => e.status === 'pending').length, total: assignedExercises.length, color: 'bg-slate-700' }
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="text-white">{row.count} / {row.total}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${row.color} transition-all duration-1000`} 
                          style={{ width: `${row.total > 0 ? (row.count / row.total) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
            {assignedExercises.length > 0 ? (
              assignedExercises.map((assignment) => {
                const exercise = assignment.exerciseId;
                return (
                  <div key={assignment._id} className="glass-card flex flex-col group overflow-hidden">
                    <div className="p-8 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl group-hover:bg-indigo-500/20 transition-colors">
                          🏋️
                        </div>
                        {getStatusBadge(assignment.status)}
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{exercise?.name}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2">{exercise?.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target</p>
                          <p className="font-bold text-white text-sm">{exercise?.category}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Effort</p>
                          <p className="font-bold text-white text-sm capitalize">{exercise?.difficulty}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                      {assignment.status !== 'completed' ? (
                        <>
                          <Button variant="primary" className="flex-1" onClick={() => handleStartExercise(assignment._id)}>
                            ▶ Start
                          </Button>
                          <Button variant="secondary" className="flex-1" onClick={() => handleCompleteExercise(assignment._id)} loading={completingExerciseId === assignment._id}>
                            ✓ Done
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" className="w-full" disabled>Completed on {new Date(assignment.completedDate).toLocaleDateString()}</Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2">
                <EmptyState icon="🏋️" title="No tasks assigned" description="Your therapist will assign exercises once your plan is ready." />
              </div>
            )}
          </div>
        )}

        {/* Diet Tab */}
        {activeTab === 'diet' && (
          <div className="space-y-8 animate-fade-in-up">
            {dietPlans.length > 0 ? (
              dietPlans.map((diet, idx) => (
                <div key={idx} className="glass-card overflow-hidden">
                  <div className="p-8 md:p-12 border-b border-white/5 bg-gradient-to-br from-teal-500/5 to-emerald-600/5">
                    <Badge variant="green" className="mb-4">Nutritional Guide</Badge>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Diet for {diet.injuryType}</h2>
                    <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">{diet.description}</p>
                  </div>
                  <div className="p-8 md:p-12">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Recommended Foods</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {diet.foods?.map((food, fIdx) => (
                        <div key={fIdx} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-all group">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-lg group-hover:bg-teal-500/20 transition-colors">🥗</div>
                            <div>
                              <p className="font-bold text-white">{food.name}</p>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{food.quantity}</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/5 mt-4">
                            <p className="text-xs text-teal-400 font-bold leading-relaxed tracking-tight">✓ {food.benefits}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon="🥗" title="No diet plans" description="Nutritional advice from your therapist will appear here." />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
