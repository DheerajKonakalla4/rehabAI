import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader, TabBar } from '../components/Layout';
import { Card, Button, Badge, Input, Skeleton, EmptyState } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const Support = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('professionals');
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedChat, setSelectedChat] = useState(null);

  const specialties = [
    { id: 'all', label: 'All Professionals' },
    { id: 'physiotherapist', label: 'Physiotherapist' },
    { id: 'sports-medicine', label: 'Sports Medicine' },
    { id: 'orthopedic', label: 'Orthopedic' },
    { id: 'post-surgery', label: 'Post-Surgery Recovery' }
  ];

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, searchQuery, selectedSpecialty]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/professionals');
      setProfessionals(response.data.professionals || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      // Use mock data
      setProfessionals(getMockProfessionals());
    } finally {
      setLoading(false);
    }
  };

  const filterProfessionals = () => {
    let filtered = professionals;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(prof =>
        prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by specialty
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(prof =>
        prof.specialization.toLowerCase().includes(selectedSpecialty)
      );
    }

    setFilteredProfessionals(filtered);
  };

  const handleChatNow = (professional) => {
    setSelectedChat(professional);
    // In real app, this would navigate to chat or open chat modal
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
          {professional.initials || professional.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">{professional.name}</h3>
          <p className="text-sm text-gray-600">{professional.specialization}</p>
          {professional.subSpecialty && (
            <p className="text-xs text-gray-500">{professional.subSpecialty}</p>
          )}
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
        <p className="text-xs text-gray-500">Available for appointment</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mt-auto">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleCall(professional)}
            title="Phone Call"
          >
            📞 Call
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => handleVideo(professional)}
            title="Video Call"
          >
            📹 Video
          </Button>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => handleChatNow(professional)}
        >
          💬 Chat Now
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleBookAppointment(professional._id)}
        >
          📅 Book Appointment
        </Button>
      </div>
    </Card>
  );

  const tabs = [
    { id: 'professionals', label: 'Find Professionals' },
    { id: 'active', label: 'Active Chats' }
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
          title="Support & Medical Professionals"
          subtitle="Connect with expert physiotherapists for personalized guidance"
        />

        {/* Tab Navigation */}
        <div className="mb-8">
          <TabBar 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Find Professionals Tab */}
        {activeTab === 'professionals' && (
          <div>
            {/* Search and Filter */}
            <div className="mb-8">
              <div className="mb-6 flex gap-4">
                <Input
                  placeholder="Search by name or specialty..."
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
                title="No professionals found"
                subtitle="Try adjusting your search filters"
              />
            )}
          </div>
        )}

        {/* Active Chats Tab */}
        {activeTab === 'active' && (
          <div>
            <p className="text-gray-600 mb-6">Your active conversations with medical professionals</p>
            {/* This would show active chats - implementation depends on your chat system */}
            <EmptyState
              icon="💬"
              title="No active chats"
              subtitle="Start a conversation with a professional to see it here"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data for demo
const getMockProfessionals = () => [
  {
    _id: '1',
    name: 'Dr. Priya Sharma',
    specialization: 'Physiotherapist',
    subSpecialty: 'Orthopedic Rehabilitation',
    rating: 4.9,
    reviews: 52,
    nextAvailable: 'Today, 2:00 PM',
    services: ['Rehabilitation', 'Sports Injury'],
    online: true,
    initials: 'PS'
  },
  {
    _id: '2',
    name: 'Dr. Rajesh Kumar',
    specialization: 'Sports Physiotherapist',
    subSpecialty: 'Sports Injury Recovery',
    rating: 4.8,
    reviews: 38,
    nextAvailable: 'Tomorrow, 10:00 AM',
    services: ['Sports Medicine', 'Recovery'],
    online: false,
    initials: 'RK'
  },
  {
    _id: '3',
    name: 'Dr. Anjali Mehta',
    specialization: 'Rehabilitation Specialist',
    subSpecialty: 'Post-Surgery Specialist',
    rating: 4.9,
    reviews: 45,
    nextAvailable: 'Today, 4:00 PM',
    services: ['Post-Surgery Recovery', 'Rehabilitation'],
    online: true,
    initials: 'AM'
  },
  {
    _id: '4',
    name: 'Dr. Vikram Singh',
    specialization: 'Orthopedic Surgeon',
    subSpecialty: 'Joint Replacement',
    rating: 4.7,
    reviews: 28,
    nextAvailable: 'Tomorrow, 3:30 PM',
    services: ['Orthopedic Consultation', 'Surgery'],
    online: false,
    initials: 'VS'
  },
  {
    _id: '5',
    name: 'Dr. Neha Gupta',
    specialization: 'Physiotherapist',
    subSpecialty: 'Sports Rehabilitation',
    rating: 4.8,
    reviews: 41,
    nextAvailable: 'Today, 5:00 PM',
    services: ['Athletic Training', 'Injury Prevention'],
    online: true,
    initials: 'NG'
  },
  {
    _id: '6',
    name: 'Dr. Arun Patel',
    specialization: 'Rehabilitation Medicine',
    subSpecialty: 'Neurological Rehabilitation',
    rating: 4.6,
    reviews: 35,
    nextAvailable: 'Wednesday, 11:00 AM',
    services: ['Neurological Rehab', 'Mobility'],
    online: false,
    initials: 'AP'
  }
];

export default Support;
