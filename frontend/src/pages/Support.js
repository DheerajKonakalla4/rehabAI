import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, Badge, Input, Skeleton, EmptyState } from '../components/UIComponents';
import apiClient from '../services/apiClient';
import { messagesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Support = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('professionals');
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [activeChats, setActiveChats] = useState([]);

  const specialties = [
    { id: 'all', label: t('allProfessionals') },
    { id: 'physiotherapist', label: t('physiotherapist') },
    { id: 'sports medicine', label: t('sportsMedicine') },
    { id: 'orthopedic', label: t('orthopedic') },
    { id: 'post-surgery recovery', label: t('postSurgeryRecovery') }
  ];

  useEffect(() => {
    fetchProfessionals();
    fetchActiveChats();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/professionals');
      setProfessionals(response.data.professionals || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveChats = async () => {
    try {
      const response = await messagesAPI.getInbox();
      setActiveChats(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching active chats:', error);
      setActiveChats([]);
    }
  };

  const filterProfessionals = useCallback(() => {
    let filtered = professionals;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(prof =>
        (prof.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prof.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prof.bio || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by specialty
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(prof =>
        (prof.specialization || '').toLowerCase().includes(selectedSpecialty)
      );
    }

    setFilteredProfessionals(filtered);
  }, [professionals, searchQuery, selectedSpecialty]);

  useEffect(() => {
    filterProfessionals();
  }, [filterProfessionals]);

  const handleChatNow = (professional) => {
    navigate(`/messaging?userId=${professional.userId}`);
  };

  const handleBookAppointment = (professionalId) => {
    alert(`Booking appointment with ${professionals.find(p => p._id === professionalId)?.name}`);
  };

  const handleCall = (professional) => {
    alert(`Initiating call with ${professional.name}...`);
  };

  const handleVideo = (professional) => {
    alert(`Starting video call with ${professional.name}...`);
  };

  const renderProfessionalCard = (professional) => (
    <Card key={professional._id} className="flex flex-col h-full hover:shadow-xl transition-all duration-200">
      {/* Professional Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {professional.initials || (professional.name || '').split(' ').filter(Boolean).map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">{professional.name}</h3>
          <p className="text-sm text-gray-600">{professional.specialization}</p>
          {professional.subSpecialty && (
            <p className="text-xs text-gray-500">{professional.subSpecialty}</p>
          )}
          {professional.email && <p className="text-xs text-gray-500">{professional.email}</p>}
          {professional.phone && <p className="text-xs text-gray-500">{professional.phone}</p>}
        </div>
        {professional.online && (
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        )}
      </div>

      {/* Rating and Info */}
      <div className="mb-4 pb-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-400">⭐ {professional.rating}</span>
          <span className="text-sm text-gray-600">({professional.reviews} reviews)</span>
        </div>
        {professional.bio && (
          <p className="text-sm text-gray-700 mb-2">{professional.bio}</p>
        )}
        <div className="flex gap-1 flex-wrap">
          {professional.services?.map((service, idx) => (
            <Badge key={idx} variant="blue" className="text-xs">
              {service}
            </Badge>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="mb-4 pb-4 border-b">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">📅 {professional.nextAvailable}</span>
        </p>
        <p className="text-xs text-gray-500">{professional.responseTime || t('availableForAppointment')}</p>
        <p className="text-xs text-gray-500">{professional.isVerified ? t('verifiedProfessional') : t('verificationPending')}</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mt-auto">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleCall(professional)}
            title={t('call')}
          >
            📞 {t('call')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleVideo(professional)}
            title={t('video')}
          >
            📹 {t('video')}
          </Button>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => handleChatNow(professional)}
        >
          💬 {t('chatNow')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleBookAppointment(professional._id)}
        >
          📅 {t('bookAppointment')}
        </Button>
      </div>
    </Card>
  );

  const tabs = [
    { id: 'professionals', label: t('findProfessionals') },
    { id: 'active', label: t('activeChats') }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton count={3} height={300} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <PageHeader
          title={t('supportTitle')}
          subtitle={t('supportSubtitle')}
        />

        {/* Tab Navigation */}
        <div className="mb-8">
          <TabBar 
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Find Professionals Tab */}
        {activeTab === 'professionals' && (
          <div>
            {/* Search and Filter */}
            <div className="mb-8">
              <div className="mb-6 flex gap-4">
                <Input
                  placeholder={t('searchByNameOrSpecialty')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 max-w-md"
                />
              </div>

              {/* Specialty Filter Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {specialties.map(specialty => (
                  <button
                    key={specialty.id}
                    onClick={() => setSelectedSpecialty(specialty.id)}
                    className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                      selectedSpecialty === specialty.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {specialty.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Professionals Grid */}
            {filteredProfessionals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfessionals.map(professional => renderProfessionalCard(professional))}
              </div>
            ) : (
              <EmptyState
                icon="🔍"
                title={t('noProfessionalsFound')}
                subtitle={t('tryAdjustingSearchFilters')}
              />
            )}
          </div>
        )}

        {/* Active Chats Tab */}
        {activeTab === 'active' && (
          <div>
            <p className="text-gray-600 mb-6">{t('yourActiveConversations')}</p>
            {activeChats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeChats.map((chat) => {
                  const other = chat.otherUser || {};
                  const displayName = `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email || t('unknownUser');
                  return (
                    <Card key={other._id || chat.timestamp} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{displayName}</h3>
                          <p className="text-sm text-gray-600 mb-2">{other.email || t('noEmailAvailable')}</p>
                          <p className="text-sm text-gray-700">{chat.lastMessage || t('noMessagesYetStart')}</p>
                          <p className="text-xs text-gray-500 mt-2">{chat.timestamp ? new Date(chat.timestamp).toLocaleString() : ''}</p>
                        </div>
                        {!chat.isRead && (
                          <Badge variant="red" className="text-xs">{t('unread')}</Badge>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/messaging?userId=${other._id}`)}
                        >
                          {t('openChat')}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="💬"
                title={t('noActiveChats')}
                subtitle={t('startConversationHint')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
