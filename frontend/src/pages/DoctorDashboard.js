import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, StatsGrid, EmptyState, Skeleton, Modal } from '../components/UIComponents';
import { doctorsAPI, exercisesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const isEncryptedPhoneBlob = (value) => typeof value === 'string' && /^[a-f0-9]{16,}:[a-f0-9]+$/i.test(value.trim());

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [adherenceFilter, setAdherenceFilter] = useState('all');

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

  const tx = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const getSafePhone = (phoneValue) => {
    if (!phoneValue) return '';
    const normalized = String(phoneValue).trim();
    return isEncryptedPhoneBlob(normalized) ? '' : normalized;
  };

  const tabs = [
    { id: 'patients', label: `${tx('doctorMyPatients', 'My Patients')} (${assignedPatients.length})` },
    { id: 'overview', label: t('overview') }
  ];

  const patientReports = reports?.patientReports || [];

  const reportByPatientId = useMemo(() => {
    return patientReports.reduce((acc, item) => {
      if (item?.patientId) {
        acc[String(item.patientId)] = item;
      }
      return acc;
    }, {});
  }, [patientReports]);

  const reportByPatientName = useMemo(() => {
    return patientReports.reduce((acc, item) => {
      if (item?.patientName) {
        acc[item.patientName.toLowerCase()] = item;
      }
      return acc;
    }, {});
  }, [patientReports]);

  const filteredPatients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const enriched = assignedPatients.map((patient) => {
      const patientName = `${patient.patientId.firstName} ${patient.patientId.lastName}`;
      const reportFromOverview =
        reportByPatientId[String(patient._id)] ||
        reportByPatientName[patientName.toLowerCase()];
      const report = patient.metrics
        ? {
            ...reportFromOverview,
            totalSessions: patient.metrics.totalSessions,
            completedSessions: patient.metrics.completedSessions,
            pendingSessions: patient.metrics.pendingSessions,
            averagePainLevel: patient.metrics.averagePainLevel
          }
        : reportFromOverview;
      const completionRate = report?.totalSessions
        ? Math.round((report.completedSessions / report.totalSessions) * 100)
        : 0;

      return {
        ...patient,
        report,
        patientName,
        completionRate
      };
    });

    const bySearch = enriched.filter((item) => {
      if (!normalizedQuery) return true;

      return (
        item.patientName.toLowerCase().includes(normalizedQuery) ||
        (item.patientId.email || '').toLowerCase().includes(normalizedQuery) ||
        (item.injuryType || '').toLowerCase().includes(normalizedQuery)
      );
    });

    const byAdherence = bySearch.filter((item) => {
      if (adherenceFilter === 'all') return true;
      if (adherenceFilter === 'high') return item.completionRate >= 75;
      if (adherenceFilter === 'medium') return item.completionRate >= 40 && item.completionRate < 75;
      return item.completionRate < 40;
    });

    return byAdherence.sort((a, b) => {
      if (sortBy === 'name') return a.patientName.localeCompare(b.patientName);
      if (sortBy === 'pain') return Number(b.report?.averagePainLevel || 0) - Number(a.report?.averagePainLevel || 0);
      if (sortBy === 'completion') return b.completionRate - a.completionRate;
      return Number(b.report?.pendingSessions || 0) - Number(a.report?.pendingSessions || 0);
    });
  }, [assignedPatients, reportByPatientId, reportByPatientName, searchQuery, adherenceFilter, sortBy]);

  const assignedPatientMetrics = assignedPatients.map((patient) => ({
    name: `${patient?.patientId?.firstName || ''} ${patient?.patientId?.lastName || ''}`.trim() || 'Patient',
    totalSessions: Number(patient?.metrics?.totalSessions || 0),
    completedSessions: Number(patient?.metrics?.completedSessions || 0),
    pendingSessions: Number(patient?.metrics?.pendingSessions || 0),
    averagePainLevel: Number(patient?.metrics?.averagePainLevel || 0),
    completionRate: Number(patient?.metrics?.completionRate || 0)
  }));

  const totalAssignedExercises = assignedPatientMetrics.reduce((sum, item) => sum + item.totalSessions, 0);
  const completedSessions = assignedPatientMetrics.reduce((sum, item) => sum + item.completedSessions, 0);
  const pendingSessions = assignedPatientMetrics.reduce((sum, item) => sum + item.pendingSessions, 0);

  const avgPainAcrossPatients = assignedPatientMetrics.length
    ? assignedPatientMetrics.reduce((sum, item) => sum + item.averagePainLevel, 0) / assignedPatientMetrics.length
    : 0;

  const avgCompletionRate = totalAssignedExercises
    ? Math.round((completedSessions / totalAssignedExercises) * 100)
    : 0;

  const highestRiskPatient = assignedPatientMetrics
    .slice()
    .sort((a, b) => b.averagePainLevel - a.averagePainLevel)[0];

  const stats = [
    { label: tx('doctorAssignedPatients', 'Assigned Patients'), value: assignedPatients.length },
    { label: tx('doctorCompletedSessions', 'Completed Sessions'), value: completedSessions },
    { label: tx('doctorPendingSessions', 'Pending Sessions'), value: pendingSessions },
    { label: tx('doctorAvgAdherence', 'Avg Adherence'), value: `${avgCompletionRate}%` }
  ];

  if (loading) return <div className="min-h-screen"><Navbar /><div className="p-6"><Skeleton count={3} /></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader 
          title={`${tx('doctorShortPrefix', 'Dr.')} ${user?.lastName} ${t('dashboard')}`}
          subtitle={tx('doctorDashboardSubtitle', 'Manage your assigned patients and their treatment plans')}
        />

        <Card className="mb-6 p-0 overflow-hidden border border-blue-100 shadow-lg">
          <div className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-cyan-100 text-sm font-semibold tracking-wide uppercase">{tx('doctorClinicalSnapshot', 'Clinical Snapshot')}</p>
                <h2 className="text-2xl font-bold mt-1">{tx('doctorTodayPanel', "Today's Panel")}</h2>
                <p className="text-blue-100 mt-2 text-sm">
                  {highestRiskPatient && highestRiskPatient.averagePainLevel > 0
                    ? `${tx('doctorHighestPainTrend', 'Highest pain trend')}: ${highestRiskPatient.name} (${highestRiskPatient.averagePainLevel.toFixed(1)}/10)`
                    : tx('doctorNoHighRiskAlerts', 'No high-risk alerts yet. Assign patients to start tracking trends.')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                <div className="bg-white/15 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-100">{tx('doctorExercisesLogged', 'Exercises Logged')}</p>
                  <p className="text-xl font-bold">{totalAssignedExercises}</p>
                </div>
                <div className="bg-white/15 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-100">{tx('doctorAvgPain', 'Avg Pain')}</p>
                  <p className="text-xl font-bold">{avgPainAcrossPatients.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <StatsGrid stats={stats} />
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* My Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800">My Assigned Patients</h2>
              {availablePatients.length > 0 && (
                <Button
                  variant="primary"
                  onClick={() => setShowAssignPatientModal(true)}
                >
                  + {tx('doctorAssignPatient', 'Assign Patient')}
                </Button>
              )}
            </div>

            {assignedPatients.length > 0 && (
              <Card className="p-4 border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={tx('doctorSearchPatients', 'Search by name, email or condition')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">{tx('doctorSortName', 'Sort: Name (A-Z)')}</option>
                    <option value="completion">{tx('doctorSortCompletion', 'Sort: Completion Rate')}</option>
                    <option value="pain">{tx('doctorSortPain', 'Sort: Avg Pain Level')}</option>
                    <option value="pending">{tx('doctorSortPending', 'Sort: Pending Sessions')}</option>
                  </select>
                  <select
                    value={adherenceFilter}
                    onChange={(e) => setAdherenceFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">{tx('doctorAllAdherenceBands', 'All Adherence Bands')}</option>
                    <option value="high">{tx('doctorHighAdherence', 'High Adherence (75%+)')}</option>
                    <option value="medium">{tx('doctorMediumAdherence', 'Medium Adherence (40-74%)')}</option>
                    <option value="low">{tx('doctorLowAdherence', 'Low Adherence (<40%)')}</option>
                  </select>
                </div>
              </Card>
            )}
            
            {assignedPatients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => (
                  <Card key={patient._id} className="p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                    {(() => {
                      const adherence = Number.isFinite(patient.completionRate) ? patient.completionRate : 0;
                      const sessions = patient.report?.totalSessions || 0;
                      const done = patient.report?.completedSessions || 0;
                      const pain = Number(patient.report?.averagePainLevel || 0).toFixed(1);

                      return (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-slate-50 rounded-lg px-2 py-2 text-center">
                            <p className="text-[11px] text-slate-500">Adherence</p>
                            <p className="text-sm font-bold text-slate-700">{adherence}%</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-2 py-2 text-center">
                            <p className="text-[11px] text-slate-500">Sessions</p>
                            <p className="text-sm font-bold text-slate-700">{sessions}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg px-2 py-2 text-center">
                            <p className="text-[11px] text-emerald-600">Done</p>
                            <p className="text-sm font-bold text-emerald-700">{done}</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg px-2 py-2 text-center">
                            <p className="text-[11px] text-amber-600">Pain</p>
                            <p className="text-sm font-bold text-amber-700">{pain}</p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        {patient.patientId.firstName} {patient.patientId.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{patient.patientId.email}</p>
                      {getSafePhone(patient.patientId.phone) && (
                        <p className="text-sm text-gray-600">{getSafePhone(patient.patientId.phone)}</p>
                      )}
                      {patient.patientId.age && (
                        <p className="text-sm text-gray-600">{t('age')}: {patient.patientId.age}</p>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Adherence</span>
                        <span>{patient.completionRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${patient.completionRate >= 75 ? 'bg-emerald-500' : patient.completionRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, patient.completionRate)}%` }}
                        />
                      </div>
                    </div>

                    {patient.injuryType && (
                      <div className="mb-3 p-2 bg-red-50 rounded border-l-4 border-red-500">
                        <p className="text-xs text-red-600 font-semibold">Condition:</p>
                        <p className="text-sm text-red-700">{patient.injuryType}</p>
                      </div>
                    )}

                    {patient.rehabilitationPlan && (
                      <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                        <p className="text-xs text-blue-600 font-semibold">Rehabilitation Plan:</p>
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
                title={tx('doctorNoPatientsAssigned', 'No patients assigned yet')}
                description={availablePatients.length > 0 ? tx('doctorAssignPatientsToStart', 'Assign patients to get started') : tx('doctorNoPatientsAvailable', 'No patients available in the system')}
              />
            )}

            {assignedPatients.length > 0 && filteredPatients.length === 0 && (
              <EmptyState
                icon="🔍"
                title={tx('doctorNoMatchingPatients', 'No matching patients')}
                description={tx('doctorTryDifferentSearch', 'Try a different search term or adjust the adherence filter')}
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
                  <p className="text-4xl font-bold text-yellow-600 mt-2">{Number(reports?.averagePainLevel || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">across all patients</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-semibold">Avg Effort Level</p>
                  <p className="text-4xl font-bold text-purple-600 mt-2">{Number(reports?.averageEffortLevel || 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">patient compliance</p>
                </div>
              </div>
            </Card>

            {patientReports.length > 0 && (
              <Card className="p-6 border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Recovery Momentum</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientReports
                    .slice()
                    .sort((a, b) => {
                      const aRate = a.totalSessions ? a.completedSessions / a.totalSessions : 0;
                      const bRate = b.totalSessions ? b.completedSessions / b.totalSessions : 0;
                      return bRate - aRate;
                    })
                    .slice(0, 4)
                    .map((item, idx) => {
                      const completion = item.totalSessions
                        ? Math.round((item.completedSessions / item.totalSessions) * 100)
                        : 0;
                      return (
                        <div key={`${item.patientName}-${idx}`} className="rounded-xl border border-slate-200 p-4 bg-white">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800">{item.patientName}</p>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              {completion}% completion
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{item.injuryType || 'Condition not specified'}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            {item.completedSessions}/{item.totalSessions} sessions complete, pain {Number(item.averagePainLevel || 0).toFixed(1)}/10
                          </p>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Patient Progress Table */}
            {patientReports.length > 0 && (
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
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Pending</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Completion</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Avg Pain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientReports.map((pReport, idx) => {
                        const completion = pReport.totalSessions
                          ? Math.round((pReport.completedSessions / pReport.totalSessions) * 100)
                          : 0;

                        return (
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
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
                              {pReport.pendingSessions || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
                              {completion}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                              {Number(pReport.averagePainLevel || 0).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                      })}
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
