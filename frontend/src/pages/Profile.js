import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, Badge, Input, Skeleton, Avatar } from '../components/UIComponents';
import { authAPI, patientsAPI } from '../services/api';
import apiClient from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';

const isValidPhoneNumber = (value) => /^\d{10}$/.test(value);

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProfileData();
    fetchAchievements();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [userResponse, dashboardResponse] = await Promise.all([
        authAPI.getProfile(),
        patientsAPI.getDashboard()
      ]);

      const userData = userResponse.data.user;
      const patientData = dashboardResponse.data.patientProfile;

      setProfileData({
        user: userData,
        patient: patientData,
        stats: dashboardResponse.data.stats || {}
      });
      setFormData({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        phoneNumber: userData?.phone || '',
        age: userData?.age ? String(userData.age) : '',
        injuryType: patientData?.injuryType || '',
        rehabilitationPlan: patientData?.rehabilitationPlan || '',
        medicalHistory: patientData?.medicalHistory || '',
        currentConditions: Array.isArray(patientData?.currentConditions) ? patientData.currentConditions.join(', ') : ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await apiClient.get('/api/achievements/user');
      if (response.data.success) {
        setAchievements(response.data.achievements || []);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phoneNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;

    setFormData({
      ...formData,
      [name]: nextValue
    });

    if (formError) {
      setFormError('');
    }
  };

  const handleSaveProfile = async () => {
    if (!isValidPhoneNumber(formData.phoneNumber || '')) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (formData.age && Number.isNaN(Number(formData.age))) {
      setFormError('Age must be a valid number.');
      return;
    }

    try {
      const response = await patientsAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        age: formData.age,
        injuryType: formData.injuryType,
        rehabilitationPlan: formData.rehabilitationPlan,
        medicalHistory: formData.medicalHistory,
        currentConditions: formData.currentConditions
      });

      setProfileData((currentProfile) => ({
        ...currentProfile,
        user: response.data.user || currentProfile?.user,
        patient: response.data.patientProfile || currentProfile?.patient
      }));
      setIsEditing(false);
      setFormError('');
      alert('Profile updated successfully');
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton count={3} height={200} />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Pending Sessions', value: profileData?.stats?.pendingSessions || 0, icon: '🏃' },
    { label: 'Completed Sessions', value: profileData?.stats?.completedSessions || 0, icon: '📅' },
    { label: t('totalExercises'), value: profileData?.stats?.totalExercisesLogged || 0, icon: '📈' },
    { label: 'Active Plan', value: profileData?.patient?.rehabilitationPlan ? 'Yes' : 'No', icon: '🔥' }
  ];

  const tabs = [
    { id: 'personal', label: t('personalInformation') },
    { id: 'medical', label: t('medicalInformation') },
    { id: 'achievements', label: t('achievements') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white p-8 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-6xl">
              {user?.firstName && user?.lastName
                ? `${user.firstName[0]}${user.lastName[0]}`
                : 'U'}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{`${profileData?.user?.firstName || user?.firstName || ''} ${profileData?.user?.lastName || user?.lastName || ''}`.trim()}</h1>
              <p className="text-blue-100 mb-1">Patient ID: {profileData?.patient?.uniquePatientId || 'Not available'}</p>
              <Badge variant="green" className="inline-block">
                Active Recovery Plan
              </Badge>
            </div>
            {!isEditing && (
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="text-blue-700"
              >
                ✏️ {t('editProfile')}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('personalInformation')}</h3>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {formError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-semibold text-sm">{formError}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('firstName')}</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{t('lastName')}</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailAddress')}</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{t('phoneNumber')}</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10-digit phone number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{t('age')}</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('injuryType')}</label>
                    <input
                      type="text"
                      name="injuryType"
                      value={formData.injuryType}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('rehabilitationPlan')}</label>
                    <textarea
                      name="rehabilitationPlan"
                      value={formData.rehabilitationPlan}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('medicalHistory')}</label>
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('currentConditions')}</label>
                    <input
                      type="text"
                      name="currentConditions"
                      value={formData.currentConditions}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Comma-separated values"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="primary" onClick={handleSaveProfile}>
                      {t('saveChanges')}
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('firstName')}</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.user?.firstName || user?.firstName || t('noData')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('lastName')}</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.user?.lastName || user?.lastName || t('noData')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('emailAddress')}</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.user?.email || t('noData')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('phoneNumber')}</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.user?.phone || t('noData')}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">{t('age')}</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.user?.age || t('noData')}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Medical Information Tab */}
        {activeTab === 'medical' && (
          <Card>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">{t('medicalInformation')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{t('injuryType')}</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData?.patient?.injuryType || t('noData')}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{t('rehabilitationPlan')}</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData?.patient?.rehabilitationPlan || t('noData')}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{t('medicalHistory')}</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData?.patient?.medicalHistory || t('noData')}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{t('currentConditions')}</p>
                  <p className="text-lg font-semibold text-gray-800">{Array.isArray(profileData?.patient?.currentConditions) && profileData.patient.currentConditions.length > 0 ? profileData.patient.currentConditions.join(', ') : t('noData')}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-gray-700">{profileData?.patient?.rehabilitationPlan || t('noData')}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <Card>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">🏆 {t('achievements')} & Badges</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`border-2 rounded-xl p-4 text-center transition-all ${
                      achievement.earned
                        ? 'border-yellow-400 bg-yellow-50 shadow-md'
                        : 'border-gray-300 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <h4 className="font-bold text-gray-800 mb-1">{achievement.name}</h4>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    {achievement.earned && (
                      <Badge variant="green" className="mt-3 text-xs">
                        ✓ Earned
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="danger" onClick={handleLogout}>
            🚪 {t('logout') || 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
