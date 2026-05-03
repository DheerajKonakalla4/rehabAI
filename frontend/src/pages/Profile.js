import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, TabBar } from '../components/Layout';
import { 
  Skeleton, 
  Button, 
  Card, 
  Badge, 
  StatsGrid, 
  Avatar, 
  Alert 
} from '../components/UIComponents';
import apiClient from '../services/apiClient';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfileData();
    fetchAchievements();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'patient' ? '/patient/profile' : '/auth/profile';
      const response = await apiClient.get(endpoint);
      const data = response.data;
      
      // auth/profile returns { user: {...} }, patient/profile returns direct data
      const actualData = data.user || data;
      setProfileData(actualData);
      
      setFormData({
        fullName: actualData.fullName || (actualData.firstName ? `${actualData.firstName} ${actualData.lastName || ''}` : ''),
        email: actualData.email || '',
        phoneNumber: actualData.phone || actualData.phoneNumber || '',
        dateOfBirth: actualData.dateOfBirth || '',
        address: actualData.address || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
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
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      if (user?.role === 'patient') {
        await apiClient.put('/patient/profile', formData);
      } else {
        // Prepare split names for auth endpoint
        const parts = formData.fullName.trim().split(' ');
        const updatePayload = {
          firstName: parts[0],
          lastName: parts.slice(1).join(' ').trim() || '',
          phone: formData.phoneNumber
        };
        await apiClient.put('/auth/profile', updatePayload);
      }
      
      await fetchProfileData();
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to update profile';
      setSaveMessage({ type: 'danger', text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-grid">
      <Navbar />
      <div className="max-w-4xl mx-auto p-12">
        <Skeleton count={1} height={200} />
        <div className="mt-12 grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} count={1} height={100} />)}
        </div>
        <div className="mt-12">
          <Skeleton count={3} height={80} />
        </div>
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Tasks', value: profileData?.stats?.totalExercises || 0, icon: '🏃' },
    { label: 'Days Active', value: profileData?.stats?.daysActive || 0, icon: '📅' },
    { label: 'Recovery', value: `${profileData?.stats?.recoveryProgress || 0}%`, icon: '📈' },
    { label: 'Streak', value: `${profileData?.stats?.streak || 0}d`, icon: '🔥' }
  ];

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'medical', label: 'Clinical' },
    { id: 'achievements', label: 'Badges' }
  ];

  return (
    <div className="min-h-screen relative bg-grid pb-20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
        {saveMessage && (
          <div className="mb-8 max-w-2xl mx-auto">
            <Alert 
              variant={saveMessage.type} 
              message={saveMessage.text} 
              onClose={() => setSaveMessage(null)} 
            />
          </div>
        )}

        {/* Profile Header */}
        <div className="glass-card p-1 relative overflow-hidden mb-12">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>
          <div className="p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <Avatar name={profileData?.fullName || `${user?.firstName} ${user?.lastName}`} size="lg" className="relative" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                {profileData?.fullName || `${user?.firstName} ${user?.lastName}`}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Badge variant="blue">ID: {profileData?.patientId || user?.uniqueId}</Badge>
                <Badge variant="green">Active Plan</Badge>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">• Member since {new Date().getFullYear()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {!isEditing ? (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button variant="ghost" onClick={() => logout()}>Logout</Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Tab Navigation */}
        <div className="mb-12">
          <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in-up">
          {activeTab === 'personal' && (
            <Card className="max-w-4xl mx-auto overflow-hidden">
              <div className="p-2 border-b border-white/5 bg-white/[0.01]">
                <h3 className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Personal Details</h3>
              </div>
              <div className="p-10">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                      <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleFormChange}
                        className="premium-input px-5 h-14"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Email</label>
                      <input
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="premium-input px-5 h-14 opacity-50 cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Phone</label>
                      <input
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleFormChange}
                        className="premium-input px-5 h-14"
                        maxLength="10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Birth Date</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleFormChange}
                        className="premium-input px-5 h-14"
                      />
                    </div>
                    <div className="md:col-span-2 pt-6">
                      <Button variant="primary" size="lg" className="w-full" onClick={handleSaveProfile} loading={saving}>
                        Save All Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {[
                      { label: 'Full Identity', value: profileData?.fullName || `${user?.firstName} ${user?.lastName}` },
                      { label: 'Electronic Mail', value: profileData?.email || user?.email },
                      { label: 'Communication', value: profileData?.phoneNumber || 'Not linked' },
                      { label: 'Date of Birth', value: profileData?.dateOfBirth || 'Not specified' }
                    ].map((item, i) => (
                      <div key={i} className="group">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">
                          {item.label}
                        </p>
                        <p className="text-lg font-bold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'medical' && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <h3 className="text-lg font-black text-white mb-8 tracking-tight">Active Condition</h3>
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Primary Injury</p>
                    <p className="text-xl font-black text-white">{profileData?.medical?.condition || 'Awaiting diagnosis'}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Program Start</p>
                    <p className="font-bold text-white">{profileData?.medical?.startDate || 'Not started'}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-black text-white mb-8 tracking-tight">Supervising Team</h3>
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl">👨‍⚕️</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Assigned Professional</p>
                      <p className="font-bold text-white">{profileData?.medical?.primaryTherapist || 'Assigning soon...'}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Completion</p>
                    <p className="font-bold text-white">{profileData?.medical?.expectedCompletion || 'Determining...'}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="max-w-5xl mx-auto">
              {achievements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id}
                      className={`glass-card p-8 text-center transition-all group hover:-translate-y-2 ${
                        ach.earned 
                          ? 'border-indigo-500/30 bg-indigo-500/5' 
                          : 'opacity-40 grayscale'
                      }`}
                    >
                      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">
                        {ach.icon}
                      </div>
                      <h4 className="font-black text-white text-sm uppercase tracking-tight mb-2">{ach.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{ach.description}</p>
                      {ach.earned && (
                        <div className="mt-6">
                          <Badge variant="green">Unlocked</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-20 border-dashed border-2">
                  <div className="text-6xl mb-6">🏆</div>
                  <h3 className="text-2xl font-black text-white mb-2">No badges unlocked yet</h3>
                  <p className="text-slate-400 font-medium">Keep completing your daily tasks to earn exclusive awards.</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
