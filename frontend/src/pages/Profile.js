import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, Badge, Input, Skeleton, Avatar } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfileData();
    fetchAchievements();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/patient/profile');
      const data = response.data;
      setProfileData(data);
      setFormData({
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        dateOfBirth: data.dateOfBirth || '',
        address: data.address || ''
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
      const response = await apiClient.get('/achievements/user');
      if (response.data.success) {
        setAchievements(response.data.achievements || []);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    try {
      await apiClient.put('/patient/profile', formData);
      setProfileData({ ...profileData, ...formData });
      setIsEditing(false);
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
    { label: 'Total Exercises', value: profileData?.stats?.totalExercises || 42, icon: '🏃' },
    { label: 'Days Active', value: profileData?.stats?.daysActive || 28, icon: '📅' },
    { label: 'Recovery Progress', value: `${profileData?.stats?.recoveryProgress || 78}%`, icon: '📈' },
    { label: 'Current Streak', value: `${profileData?.stats?.streak || 7} days`, icon: '🔥' }
  ];

  const tabs = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'medical', label: 'Medical Information' },
    { id: 'achievements', label: 'Achievements' }
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
                : 'JD'}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{profileData?.fullName || `${user?.firstName} ${user?.lastName}`}</h1>
              <p className="text-blue-100 mb-1">Patient ID: {profileData?.patientId || 'PAT-2024-001'}</p>
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
                ✏️ Edit Profile
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
            onTabChange={setActiveTab}
          />
        </div>

        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h3>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="primary" onClick={handleSaveProfile}>
                      Save Changes
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.fullName || `${user?.firstName} ${user?.lastName}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.email || 'john.doe@example.com'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.phoneNumber || '+91 98765 43210'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.dateOfBirth || 'January 15, 1990'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="text-lg font-semibold text-gray-800">{profileData?.address || '123 Recovery Lane, Mumbai, Maharashtra 400001'}</p>
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
              <h3 className="text-2xl font-bold text-gray-800">Medical Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Condition</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData?.medical?.condition || 'Post ACL Surgery Rehabilitation'}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData?.medical?.startDate || 'February 7, 2024'}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Primary Therapist</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData?.medical?.primaryTherapist || 'Dr. Priya Sharma'}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Expected Completion</p>
                  <p className="text-lg font-semibold text-gray-800">{profileData?.medical?.expectedCompletion || 'May 7, 2024'}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-gray-700">{profileData?.medical?.notes || 'Patient is making excellent progress with knee strengthening exercises. Continue current exercise regimen and gradually increase intensity. Next evaluation scheduled for March 15, 2024.'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <Card>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">🏆 Achievements & Badges</h3>

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
            🚪 Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
