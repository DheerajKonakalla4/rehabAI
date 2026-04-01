import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, StatsGrid, EmptyState, Skeleton, Modal } from '../components/UIComponents';
import { doctorsAPI, exercisesAPI } from '../services/api';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader 
          title={`Dr. ${user?.lastName}'s Dashboard`}
          subtitle="Manage your assigned patients and their treatment plans"
        />

        <StatsGrid stats={stats} />
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* My Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">My Assigned Patients</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedPatients.map((patient) => (
                  <Card key={patient._id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        {patient.patientId.firstName} {patient.patientId.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{patient.patientId.email}</p>
                      {patient.patientId.phone && (
                        <p className="text-sm text-gray-600">{patient.patientId.phone}</p>
                      )}
                      {patient.patientId.age && (
                        <p className="text-sm text-gray-600">Age: {patient.patientId.age}</p>
                      )}
                    </div>

                    {patient.injuryType && (
                      <div className="mb-3 p-2 bg-red-50 rounded border-l-4 border-red-500">
                        <p className="text-xs text-red-600 font-semibold">Condition:</p>
                        <p className="text-sm text-red-700">{patient.injuryType}</p>
                      </div>
                    )}

                    {patient.rehabilitationPlan && (
                      <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                        <p className="text-xs text-blue-600 font-semibold">RehabilitationPlan:</p>
                        <p className="text-sm text-blue-700">{patient.rehabilitationPlan}</p>
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
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 Program Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-semibold">Total Patients</p>
                  <p className="text-4xl font-bold text-blue-600 mt-2">{reports?.totalPatients || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">under your care</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-semibold">Exercises Assigned</p>
                  <p className="text-4xl font-bold text-green-600 mt-2">{reports?.totalExercisesCompleted || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">total exercises</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-semibold">Avg Pain Level</p>
                  <p className="text-4xl font-bold text-yellow-600 mt-2">{(reports?.averagePainLevel || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">across all patients</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-semibold">Avg Effort Level</p>
                  <p className="text-4xl font-bold text-purple-600 mt-2">{(reports?.averageEffortLevel || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">patient compliance</p>
                </div>
              </div>
            </Card>

            {/* Patient Progress Table */}
            {reports?.patientReports && reports.patientReports.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Patient Progress Overview</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Patient Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Condition</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Sessions</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Completed</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Avg Pain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.patientReports.map((pReport, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-800">{pReport.patientName}</td>
                          <td className="px-4 py-3 text-gray-600">{pReport.injuryType || 'N/A'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                              {pReport.totalSessions}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                              {pReport.completedSessions}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Exercise</label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              variant="secondary" 
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Injury/Condition Type *</label>
            <input
              type="text"
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              placeholder="e.g., Shoulder Injury, Knee Pain"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={dietDescription}
              onChange={(e) => setDietDescription(e.target.value)}
              placeholder="Diet recommendations and notes..."
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">Food Items</label>
              <button
                type="button"
                onClick={addFoodItem}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                + Add Food
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {foodItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Food name"
                    value={item.name}
                    onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateFoodItem(index, 'quantity', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Benefits"
                    value={item.benefits}
                    onChange={(e) => updateFoodItem(index, 'benefits', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {foodItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFoodItem(index)}
                      className="px-2 py-2 text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
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
        title="Assign Patient"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAssignPatient(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient *</label>
            <select
              value={selectedPatientToAssign}
              onChange={(e) => setSelectedPatientToAssign(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
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
