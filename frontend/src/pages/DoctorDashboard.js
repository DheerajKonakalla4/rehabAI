import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, Badge, StatsGrid, EmptyState, RequestCard, Skeleton, Modal, Input } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [connectedPatients, setConnectedPatients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [connectedRes, pendingRes, reportsRes] = await Promise.all([
        apiClient.get('/api/doctor/connected-patients'),
        apiClient.get('/api/doctor/pending-requests'),
        apiClient.get('/api/doctor/reports')
      ]);
      setConnectedPatients(connectedRes.data.patients || []);
      setPendingRequests(pendingRes.data.requests || []);
      setReports(reportsRes.data.report);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setSendingRequest(true);
    try {
      // First find patient by email
      await apiClient.post(`/api/doctor/send-request/${searchEmail}`, {
        message: searchMessage
      });
      alert('Request sent successfully!');
      setShowSearchModal(false);
      setSearchEmail('');
      setSearchMessage('');
      fetchDashboardData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) return <div className="min-h-screen"><Navbar /><div className="p-6"><Skeleton count={3} /></div></div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'connected', label: `Connected Patients (${connectedPatients.length})` },
    { id: 'pending', label: `Pending Requests (${pendingRequests.length})` }
  ];

  const stats = [
    { label: 'Connected Patients', value: connectedPatients.length },
    { label: 'Pending Requests', value: pendingRequests.length },
    { label: 'Total Exercises', value: reports?.totalExercisesCompleted || 0 },
    { label: 'Avg Pain Level', value: reports?.averagePainLevel || '0' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader 
          title={`Welcome, Dr. ${user.lastName}`}
          subtitle="Manage your patient connections and track progress"
          action={
            <Button 
              variant="primary" 
              onClick={() => setShowSearchModal(true)}
            >
              + Send Request to Patient
            </Button>
          }
        />

        <StatsGrid stats={stats} />

        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Program Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Patients</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{reports?.totalPatients || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Exercises Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{reports?.totalExercisesCompleted || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Avg Pain Level</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{reports?.averagePainLevel || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Avg Effort Level</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{reports?.averageEffortLevel || 0}</p>
                </div>
              </div>
            </Card>

            {/* Recent Patient Reports */}
            <Card>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Progress</h2>
              {reports?.patientReports?.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reports.patientReports.map((patient) => (
                    <div key={patient.patientId} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{patient.patientName}</p>
                          <p className="text-sm text-gray-600">{patient.injuryType}</p>
                        </div>
                        <Badge variant="blue">{patient.completedSessions}/{patient.totalSessions} Completed</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div><span className="text-gray-600">Exercises:</span> <span className="font-semibold">{patient.totalExercisesLogged}</span></div>
                        <div><span className="text-gray-600">Avg Pain:</span> <span className="font-semibold">{patient.averagePainLevel}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No patient data available yet</p>
              )}
            </Card>
          </div>
        )}

        {/* Connected Patients Tab */}
        {activeTab === 'connected' && (
          <div className="space-y-4">
            {connectedPatients.length > 0 ? (
              connectedPatients.map(patient => (
                <Card key={patient.userId} className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{patient.firstName} {patient.lastName}</h3>
                    <p className="text-gray-600">{patient.email}</p>
                    {patient.phone && <p className="text-gray-600 text-sm">{patient.phone}</p>}
                    <Badge variant="green" className="mt-2">Connected</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Profile</Button>
                    <Button variant="primary" size="sm">Send Message</Button>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState 
                icon="👥"
                title="No connected patients"
                description="Send requests to patients to connect"
                action={
                  <Button 
                    variant="primary"
                    onClick={() => setShowSearchModal(true)}
                  >
                    Find Patient
                  </Button>
                }
              />
            )}
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <RequestCard
                  key={request._id}
                  userName={`${request.patientId.firstName} ${request.patientId.lastName}`}
                  userEmail={request.patientId.email}
                  userPhone={request.patientId.phone}
                  message={request.message}
                  variant="outgoing"
                />
              ))
            ) : (
              <EmptyState 
                icon="📤"
                title="No pending requests"
                description="All your requests have been accepted or rejected"
              />
            )}
          </div>
        )}
      </div>

      {/* Search & Send Request Modal */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          setSearchEmail('');
          setSearchMessage('');
        }}
        title="Send Connection Request to Patient"
        size="md"
      >
        <form onSubmit={handleSendRequest} className="space-y-4">
          <Input
            label="Patient Email"
            type="email"
            placeholder="patient@example.com"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message (Optional)</label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Introduce yourself and explain why you want to connect..."
              value={searchMessage}
              onChange={(e) => setSearchMessage(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowSearchModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              loading={sendingRequest}
            >
              Send Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
