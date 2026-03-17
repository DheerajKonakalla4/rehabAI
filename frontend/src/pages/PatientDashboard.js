import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { 
  Card, 
  Button, 
  Badge, 
  StatsGrid, 
  EmptyState, 
  RequestCard,
  Skeleton 
} from '../components/UIComponents';
import apiClient from '../services/apiClient';

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [connectedDoctors, setConnectedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState({});

  useEffect(() => {
    fetchDashboardData();
    fetchIncomingRequests();
    fetchConnectedDoctors();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/api/patient/dashboard');
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setLoading(false);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const response = await apiClient.get('/api/patient/incoming-requests');
      setIncomingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchConnectedDoctors = async () => {
    try {
      const response = await apiClient.get('/api/patient/connected-doctors');
      setConnectedDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching connected doctors:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setLoadingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      await apiClient.put(`/api/patient/accept-request/${requestId}`);
      fetchIncomingRequests();
      fetchConnectedDoctors();
    } catch (error) {
      alert('Error accepting request: ' + error.message);
    } finally {
      setLoadingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectRequest = async (requestId) => {
    setLoadingRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      await apiClient.put(`/api/patient/reject-request/${requestId}`);
      fetchIncomingRequests();
    } catch (error) {
      alert('Error rejecting request: ' + error.message);
    } finally {
      setLoadingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) return <div className="min-h-screen"><Navbar /><div className="p-6"><Skeleton count={3} /></div></div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'requests', label: `Doctor Requests (${incomingRequests.length})` },
    { id: 'connected', label: `Connected Doctors (${connectedDoctors.length})` }
  ];

  const stats = [
    { label: 'Recovery Progress', value: dashboardData?.stats?.recoveryProgress || '78%' },
    { label: 'Exercises Completed', value: dashboardData?.stats?.totalExercisesLogged || 42 },
    { label: 'Your Doctors', value: connectedDoctors.length },
    { label: 'Streak', value: dashboardData?.stats?.streak || '7 days' }
  ];

  const weeklyChartData = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 68 },
    { day: 'Wed', value: 71 },
    { day: 'Thu', value: 74 },
    { day: 'Fri', value: 76 },
    { day: 'Sat', value: 78 },
    { day: 'Sun', value: 78 }
  ];

  const maxValue = Math.max(...weeklyChartData.map(d => d.value));

  const todayExercises = [
    { name: 'Knee Strengthening', duration: '15 min', sets: 3 },
    { name: 'Shoulder Rotation', duration: '10 min', sets: '15 reps' },
    { name: 'Back Stretching', duration: '12 min', sets: '8 reps' }
  ];

  const nextAppointment = {
    doctor: 'Dr. Priya Sharma',
    specialty: 'Physiotherapist',
    date: 'Tomorrow',
    time: '10:00 AM'
  };

  const notifications = [
    { id: 1, type: 'appointment', message: 'Time for your afternoon exercise session', time: '3 hours ago' },
    { id: 2, type: 'achievement', message: 'Upcoming appointment with Dr. Priya Sharma', time: 'Tomorrow 10:00 AM' },
    { id: 3, type: 'progress', message: 'Congratulations! You\'ve completed 7 days streak', time: '1 day ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader 
          title={`Welcome back, ${user.firstName}! 👋`}
          subtitle="Here's your recovery progress and today's activities"
        />

        <StatsGrid stats={stats} />

        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Weekly Improvement Chart */}
            <Card>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Weekly Improvement Chart</h2>
              <div className="flex items-end justify-between gap-2 h-64 mb-4">
                {weeklyChartData.map((point, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t-lg overflow-hidden relative h-56 flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 rounded-t-lg"
                        style={{ height: `${(point.value / maxValue) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{point.day}</p>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Badge variant="green">Overall Recovery: 78%</Badge>
              </div>
            </Card>

            {/* Grid: Today's Exercise Plan and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Exercise Plan */}
              <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Exercise Plan</h2>
                {todayExercises.length > 0 ? (
                  <div className="space-y-3">
                    {todayExercises.map((exercise, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <h4 className="font-semibold text-gray-800">{exercise.name}</h4>
                          <p className="text-sm text-gray-600">⏱️ {exercise.duration} • {exercise.sets}</p>
                        </div>
                        <Button variant="primary" size="sm">
                          ▶ Start
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon="📋"
                    title="No exercises scheduled"
                    description="Check back later for today's plan"
                  />
                )}
              </Card>

              {/* Notifications */}
              <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-gray-800 font-semibold">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Next Appointment */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Next Appointment with Physiotherapist</h3>
                  <p className="text-lg text-gray-700 mb-1">{nextAppointment.doctor}</p>
                  <p className="text-sm text-gray-600 mb-3">{nextAppointment.specialty}</p>
                  <div className="flex gap-4">
                    <p className="text-gray-700">📅 <span className="font-semibold">{nextAppointment.date}</span></p>
                    <p className="text-gray-700">🕐 <span className="font-semibold">{nextAppointment.time}</span></p>
                  </div>
                </div>
                <Button variant="primary">
                  📅 View Details
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {incomingRequests.length > 0 ? (
              incomingRequests.map(request => (
                <RequestCard
                  key={request._id}
                  userName={`${request.doctorId.firstName} ${request.doctorId.lastName}`}
                  userEmail={request.doctorId.email}
                  userPhone={request.doctorId.phone}
                  specialization={request.doctorId.specialization}
                  message={request.message}
                  onAccept={() => handleAcceptRequest(request._id)}
                  onReject={() => handleRejectRequest(request._id)}
                  loading={loadingRequests[request._id]}
                  variant="incoming"
                />
              ))
            ) : (
              <EmptyState 
                icon="📬"
                title="No pending requests"
                description="Doctor requests will appear here"
              />
            )}
          </div>
        )}

        {/* Connected Doctors Tab */}
        {activeTab === 'connected' && (
          <div className="space-y-4">
            {connectedDoctors.length > 0 ? (
              connectedDoctors.map(doctor => (
                <Card key={doctor._id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h3>
                    <p className="text-gray-600">{doctor.email}</p>
                    {doctor.specialization && (
                      <Badge variant="blue" className="mt-2">{doctor.specialization}</Badge>
                    )}
                    <p className="text-gray-600 text-sm mt-2">
                      Connected since {new Date(doctor.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="primary" size="sm">
                    Send Message
                  </Button>
                </Card>
              ))
            ) : (
              <EmptyState 
                icon="👨‍⚕️"
                title="No connected doctors"
                description="Accept doctor requests to connect"
                action={incomingRequests.length > 0 && (
                  <Button 
                    variant="primary" 
                    onClick={() => setActiveTab('requests')}
                  >
                    Review Pending Requests
                  </Button>
                )}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
