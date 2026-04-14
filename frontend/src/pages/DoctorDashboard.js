import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, StatsGrid, EmptyState, Skeleton, Modal, Alert } from '../components/UIComponents';
import { doctorsAPI, exercisesAPI } from '../services/api';
import { SocketContext } from '../context/SocketContext';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('patients');
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showAssignPatientModal, setShowAssignPatientModal] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [selectedPatientToAssign, setSelectedPatientToAssign] = useState('');
  const [foodItems, setFoodItems] = useState([{ name: '', quantity: '', benefits: '' }]);
  const [dietType, setDietType] = useState('');
  const [dietDescription, setDietDescription] = useState('');
  const [sending, setSending] = useState(false);

  // Socket for emergency alerts
  const { socket } = useContext(SocketContext);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('emergency_alert', (data) => {
        setEmergencyAlerts(prev => [...prev, data]);
        // Also could play a sound here
      });
      return () => socket.off('emergency_alert');
    }
  }, [socket]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, assignedRes, reportsRes, exercisesRes] = await Promise.all([
        doctorsAPI.getAllPatients(),
        doctorsAPI.getPatients(),
        doctorsAPI.getReports(),
        exercisesAPI.getAllExercises()
      ]);
      
      const assigned = assignedRes.data.patients || [];
      const available = patientsRes.data.patients || [];
      
      // Filter out already assigned patients from available list
      const unassignedPatients = available.filter(
        p => !assigned.some(ap => ap.patientId._id === p._id)
      );
      
      setAssignedPatients(assigned);
      setAvailablePatients(unassignedPatients);
      setReports(reportsRes.data.report);
      setExercises(exercisesRes.data.exercises || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatientToAssign) {
      alert('Please select a patient');
      return;
    }

    setSending(true);
    try {
      await doctorsAPI.assignPatient({ patientId: selectedPatientToAssign });
      alert('Patient assigned successfully!');
      setShowAssignPatientModal(false);
      setSelectedPatientToAssign('');
      fetchData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleAssignExercise = async () => {
    if (!selectedPatient || !selectedExerciseId) {
      alert('Please select both patient and exercise');
      return;
    }

    setSending(true);
    try {
      await doctorsAPI.assignExercise({
        patientId: selectedPatient.patientId._id,
        exerciseId: selectedExerciseId,
        notes: ''
      });
      alert('Exercise assigned successfully!');
      setShowExerciseModal(false);
      setSelectedExerciseId('');
      setSelectedPatient(null);
      fetchData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleAddDiet = async () => {
    if (!selectedPatient || !dietType) {
      alert('Please fill all required fields');
      return;
    }

    setSending(true);
    try {
      await doctorsAPI.addDietPlan({
        patientId: selectedPatient.patientId._id,
        injuryType: dietType,
        foods: foodItems.filter(item => item.name),
        description: dietDescription
      });
      alert('Diet plan added successfully!');
      setShowDietModal(false);
      setFoodItems([{ name: '', quantity: '', benefits: '' }]);
      setDietType('');
      setDietDescription('');
      setSelectedPatient(null);
      fetchData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const addFoodItem = () => {
    setFoodItems([...foodItems, { name: '', quantity: '', benefits: '' }]);
  };

  const updateFoodItem = (index, field, value) => {
    const updated = [...foodItems];
    updated[index][field] = value;
    setFoodItems(updated);
  };

  const removeFoodItem = (index) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  if (loading) return <div className="min-h-screen"><Navbar /><div className="p-6"><Skeleton count={3} /></div></div>;

  const tabs = [
    { id: 'patients', label: `My Patients (${assignedPatients.length})` },
    { id: 'overview', label: 'Overview' }
  ];

  const stats = [
    { label: 'Assigned Patients', value: assignedPatients.length },
    { label: 'Total Exercises Assigned', value: reports?.totalExercisesCompleted || 0 },
    { label: 'Avg Pain Level', value: (reports?.averagePainLevel || 0).toFixed(1) }
  ];

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />
      
      {/* Emergency Alerts Overlay */}
      {emergencyAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4 space-y-2 z-50 relative">
          {emergencyAlerts.map((alert, idx) => (
            <Alert 
              key={idx}
              variant="danger"
              title={`⚠️ CRITICAL: Patient ${alert.patientName} (Pain Level: ${alert.painLevel}/10)`}
              message={alert.message}
              onClose={() => setEmergencyAlerts(prev => prev.filter((_, i) => i !== idx))}
            />
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <PageHeader 
          title={`Dr. ${user?.lastName}'s Dashboard`}
          subtitle="Manage your assigned patients and their treatment plans"
        />

        <StatsGrid stats={stats} />
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* My Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>👥</span> My Assigned Patients
              </h2>
              {availablePatients.length > 0 && (
                <Button
                  variant="primary"
                  onClick={() => setShowAssignPatientModal(true)}
                >
                  + Assign Patient
                </Button>
              )}
            </div>
            
            {assignedPatients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedPatients.map((patient) => (
                  <Card key={patient._id} className="border-t-4 border-indigo-500 hover:-translate-y-1 transition-transform group relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 pointer-events-none"></div>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-100 drop-shadow-sm mb-1">
                        {patient.patientId.firstName} {patient.patientId.lastName}
                      </h3>
                      <p className="text-sm text-slate-400">{patient.patientId.email}</p>
                      {patient.patientId.phone && (
                        <p className="text-sm text-slate-400 mt-1">{patient.patientId.phone}</p>
                      )}
                      {patient.patientId.age && (
                        <p className="text-sm text-slate-400 mt-1">Age: <span className="text-slate-300 font-medium">{patient.patientId.age}</span></p>
                      )}
                    </div>

                    {patient.injuryType && (
                      <div className="mb-3 p-3 bg-red-900/20 rounded-xl border border-red-500/30">
                        <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Condition</p>
                        <p className="text-sm text-slate-200">{patient.injuryType}</p>
                      </div>
                    )}

                    {patient.rehabilitationPlan && (
                      <div className="mb-4 p-3 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Rehabilitation Plan</p>
                        <p className="text-sm text-slate-200 line-clamp-2" title={patient.rehabilitationPlan}>{patient.rehabilitationPlan}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowExerciseModal(true);
                        }}
                        className="flex-1"
                      >
                        + Exercise
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowDietModal(true);
                        }}
                        className="flex-1"
                      >
                        + Diet
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon="👥"
                title="No patients assigned yet"
                description={availablePatients.length > 0 ? "Assign patients to get started" : "No patients available in the system"}
              />
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in-up">
            <Card className="bg-gradient-to-br from-indigo-900/40 to-slate-800/80 border-indigo-500/20">
              <h2 className="text-2xl font-bold text-indigo-300 mb-6 drop-shadow-sm flex items-center gap-2">
                <span>📊</span> Program Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Patients</p>
                  <p className="text-4xl font-bold text-indigo-400 mt-2">{reports?.totalPatients || 0}</p>
                  <p className="text-xs text-slate-500 mt-2">under your care</p>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Exercises Assigned</p>
                  <p className="text-4xl font-bold text-teal-400 mt-2">{reports?.totalExercisesCompleted || 0}</p>
                  <p className="text-xs text-slate-500 mt-2">total exercises</p>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Pain Level</p>
                  <p className="text-4xl font-bold text-amber-400 mt-2">{(reports?.averagePainLevel || 0).toFixed(1)}</p>
                  <p className="text-xs text-slate-500 mt-2">across all patients</p>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Effort Level</p>
                  <p className="text-4xl font-bold text-purple-400 mt-2">{(reports?.averageEffortLevel || 0).toFixed(1)}</p>
                  <p className="text-xs text-slate-500 mt-2">patient compliance</p>
                </div>
              </div>
            </Card>

            {/* Patient Progress Table */}
            {reports?.patientReports && reports.patientReports.length > 0 && (
              <Card>
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <span>👥</span> Patient Progress Overview
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/80 border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-xs">Patient Name</th>
                        <th className="px-4 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-xs">Condition</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Sessions</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Completed</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Avg Pain</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {reports.patientReports.map((pReport, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4 font-semibold text-slate-200">{pReport.patientName}</td>
                          <td className="px-4 py-4 text-slate-400">{pReport.injuryType || 'N/A'}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold">
                              {pReport.totalSessions}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-bold">
                              {pReport.completedSessions}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                              {(pReport.averagePainLevel || 0).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Assign Exercise Modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => {
          setShowExerciseModal(false);
          setSelectedExerciseId('');
          setSelectedPatient(null);
        }}
        title={`Assign Exercise to ${selectedPatient?.patientId?.firstName || 'Patient'}`}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAssignExercise(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Select Exercise</label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="premium-input px-3 py-2 bg-slate-800"
              required
            >
              <option value="">-- Select exercise --</option>
              {exercises.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name} ({ex.difficulty}) - {ex.category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="ghost" 
              type="button"
              onClick={() => {
                setShowExerciseModal(false);
                setSelectedExerciseId('');
                setSelectedPatient(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              loading={sending}
            >
              Assign Exercise
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Diet Plan Modal */}
      <Modal
        isOpen={showDietModal}
        onClose={() => {
          setShowDietModal(false);
          setFoodItems([{ name: '', quantity: '', benefits: '' }]);
          setDietType('');
          setDietDescription('');
          setSelectedPatient(null);
        }}
        title={`Add Diet Plan for ${selectedPatient?.patientId?.firstName || 'Patient'}`}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddDiet(); }} className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Injury/Condition Type *</label>
            <input
              type="text"
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              placeholder="e.g., Shoulder Injury, Knee Pain"
              className="premium-input px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
            <textarea
              value={dietDescription}
              onChange={(e) => setDietDescription(e.target.value)}
              placeholder="Diet recommendations and notes..."
              rows="2"
              className="premium-input px-3 py-2"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-300">Food Items</label>
              <button
                type="button"
                onClick={addFoodItem}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-bold"
              >
                + Add Food
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin pr-2">
              {foodItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Food name"
                    value={item.name}
                    onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                    className="flex-1 premium-input px-3 py-2 text-sm bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateFoodItem(index, 'quantity', e.target.value)}
                    className="w-20 premium-input px-3 py-2 text-sm bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Benefits"
                    value={item.benefits}
                    onChange={(e) => updateFoodItem(index, 'benefits', e.target.value)}
                    className="flex-1 premium-input px-3 py-2 text-sm bg-slate-900"
                  />
                  {foodItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFoodItem(index)}
                      className="px-2 py-2 text-red-500 hover:text-red-400 flex items-center justify-center font-bold text-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700/50 mt-4">
            <Button 
              variant="ghost" 
              type="button"
              onClick={() => {
                setShowDietModal(false);
                setFoodItems([{ name: '', quantity: '', benefits: '' }]);
                setDietType('');
                setDietDescription('');
                setSelectedPatient(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              loading={sending}
            >
              Add Diet Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Patient Modal */}
      <Modal
        isOpen={showAssignPatientModal}
        onClose={() => {
          setShowAssignPatientModal(false);
          setSelectedPatientToAssign('');
        }}
        title="👥 Assign Patient"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAssignPatient(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Select Patient *</label>
            <select
              value={selectedPatientToAssign}
              onChange={(e) => setSelectedPatientToAssign(e.target.value)}
              className="premium-input px-3 py-2 bg-slate-800"
              required
            >
              <option value="">-- Select a patient --</option>
              {availablePatients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName} ({patient.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700/50 mt-4">
            <Button 
              variant="ghost" 
              type="button"
              onClick={() => {
                setShowAssignPatientModal(false);
                setSelectedPatientToAssign('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              loading={sending}
            >
              Assign Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
