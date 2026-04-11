import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { physiotherapistsAPI } from '../services/api';
import apiClient from '../services/apiClient';

export default function PhysiotherapistDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Plan Modification State
  const [editingPatient, setEditingPatient] = useState(null);
  const [newPlanNotes, setNewPlanNotes] = useState('');
  const [activeExercises, setActiveExercises] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await physiotherapistsAPI.getPatients();
        setPatients(response.data.patients || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setNewPlanNotes(patient?.profile?.rehabPlan?.currentPhase || '');
    setActiveExercises(JSON.stringify(patient?.profile?.rehabPlan?.activeExercises || []));
  };

  const closeEditModal = () => {
    setEditingPatient(null);
    setNewPlanNotes('');
    setActiveExercises('');
  };

  const handleUpdatePlan = async () => {
    try {
      let parsedExercises = [];
      try {
        parsedExercises = JSON.parse(activeExercises);
      } catch(e) {
        alert('Invalid JSON for active exercises array');
        return;
      }

      await apiClient.put(`/advanced/plan/modify/${editingPatient.patientId._id || editingPatient._id}`, {
        newPlanNotes: newPlanNotes,
        activeExercises: parsedExercises
      });
      alert('Plan successfully updated.');
      
      // refresh patients
      closeEditModal();
      const response = await physiotherapistsAPI.getPatients();
      setPatients(response.data.patients || []);
    } catch(err) {
       alert(err.response?.data?.message || 'Failed to update plan');
    }
  };

  const handleGeneratePlan = async (patientId) => {
    try {
       const res = await apiClient.post(`/advanced/plan/generate/${patientId}`);
       alert('AI Plan Generated: ' + res.data?.plan?.currentPhase);
       // Refresh
       const response = await physiotherapistsAPI.getPatients();
       setPatients(response.data.patients || []);
    } catch (e) {
       alert('Failed to generate AI plan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">RehabAI</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Physiotherapist
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.firstName}!</span>
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

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Assigned Patients</h2>
          <p className="text-gray-600">Manage your patients and assign exercises</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/exercises')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
          >
            <span className="text-3xl block mb-2">➕</span>
            <p className="font-bold">Create Exercise</p>
          </button>
          <button
            onClick={() => navigate('/messaging')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
          >
            <span className="text-3xl block mb-2">💬</span>
            <p className="font-bold">Messages</p>
          </button>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <span className="text-3xl block mb-2">👥</span>
            <p className="font-bold">Patients: {patients.length}</p>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-xl font-bold text-gray-800">My Patients</h3>
          </div>
          {patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Injury</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">
                          {patient.patientId.firstName} {patient.patientId.lastName}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {patient.injuryType || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {patient.rehabilitationPlan || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {patient.patientId.email}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleGeneratePlan(patient.patientId._id)}
                          className="text-purple-600 hover:text-purple-800 font-semibold text-sm mr-2"
                        >
                          Generate AI Plan
                        </button>
                        <button
                          onClick={() => navigate(`/mentor/patient/${patient.patientId._id}/progress`)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm mr-2"
                        >
                          View Progress
                        </button>
                        <button
                          onClick={() => openEditModal(patient)}
                          className="text-green-600 hover:text-green-800 font-semibold text-sm"
                        >
                          Modify Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No patients assigned yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Modify Rehab Plan</h2>
            <p className="text-gray-600 mb-6">Updating plan for {editingPatient?.patientId?.firstName}</p>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Plan Notes / Current Phase</label>
              <textarea 
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows="3"
                value={newPlanNotes}
                onChange={(e) => setNewPlanNotes(e.target.value)}
                placeholder="Phase 2: Strengthening..."
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">Active Exercises (JSON Array)</label>
              <textarea 
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" 
                rows="4"
                value={activeExercises}
                onChange={(e) => setActiveExercises(e.target.value)}
                placeholder='["ex1_id", "ex2_id"]'
              ></textarea>
            </div>

            <div className="flex justify-end gap-4">
              <button 
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 font-semibold"
                onClick={closeEditModal}
              >Cancel</button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                onClick={handleUpdatePlan}
              >Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
