import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar, PageHeader } from '../components/Layout';
import { Card, Button } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const SessionScheduling = () => {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', type: 'Video Call' });
  const [submitting, setSubmitting] = useState(false);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchSessions();
    if (user?.role === 'patient') {
      fetchAssignedDoctor();
    }
  }, []);

  const fetchAssignedDoctor = async () => {
    try {
      const response = await apiClient.get('/patient/assigned-doctor');
      setAssignedDoctor(response.data.doctor);
    } catch (error) {
      console.error('Error fetching assigned doctor:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const professionalId = assignedDoctor?._id || null;
      
      if (!professionalId) {
        alert('No doctor assigned yet. Please ask your doctor to connect with you first.');
        setSubmitting(false);
        return;
      }

      const payload = {
        patientId: user.userId || user._id,
        professionalId,
        date: bookingForm.date,
        time: bookingForm.time,
        type: bookingForm.type
      };

      await apiClient.post('/sessions', payload);
      await fetchSessions();
      setShowBooking(false);
      setBookingForm({ date: '', time: '', type: 'Video Call' });
    } catch (error) {
      alert('Failed to book session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelSession = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    setUpdatingId(id);
    try {
      await apiClient.put(`/sessions/${id}/status`, { status: 'cancelled' });
      fetchSessions();
    } catch (error) {
      alert('Failed to cancel session.');
    } finally {
      setUpdatingId(null);
    }
  };

  const approveSession = async (id) => {
    setUpdatingId(id);
    try {
      await apiClient.put(`/sessions/${id}/status`, { status: 'upcoming' });
      fetchSessions();
    } catch (error) {
      alert('Failed to approve session.');
    } finally {
      setUpdatingId(null);
    }
  };

  const declineSession = async (id) => {
    if (!window.confirm('Are you sure you want to decline this appointment?')) return;
    setUpdatingId(id);
    try {
      await apiClient.put(`/sessions/${id}/status`, { status: 'cancelled' });
      fetchSessions();
    } catch (error) {
      alert('Failed to decline session.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[9px] font-black uppercase tracking-widest">⏳ Pending</span>;
      case 'upcoming':
        return <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[9px] font-black uppercase tracking-widest">✓ Approved</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-[9px] font-black uppercase tracking-widest">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[9px] font-black uppercase tracking-widest">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-md text-[9px] font-black uppercase tracking-widest">{status}</span>;
    }
  };

  const isDoctor = user?.role === 'doctor' || user?.role === 'physiotherapist';

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <PageHeader 
            title="📅 Session Scheduling"
            subtitle={isDoctor 
              ? "Review and manage patient appointment requests" 
              : "Securely manage your upcoming recovery sessions and consultations"
            }
          />
          {user?.role === 'patient' && (
            <Button 
              variant="primary" 
              onClick={() => setShowBooking(true)}
              className="h-12 px-8 font-black shadow-indigo-500/20 shadow-lg"
            >
              + New Appointment
            </Button>
          )}
        </div>

        {showBooking && (
          <div className="animate-fade-in-up mb-10">
            <Card className="glass-panel border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden overflow-visible">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowBooking(false)} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
              </div>
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <span className="text-indigo-400">📝</span> Schedule Appointment
              </h2>

              {/* Show assigned doctor info */}
              {assignedDoctor ? (
                <div className="mb-6 p-3 glass-card bg-slate-800/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {assignedDoctor.firstName?.[0]}{assignedDoctor.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-slate-200 font-bold text-sm">Dr. {assignedDoctor.firstName} {assignedDoctor.lastName}</p>
                    <p className="text-slate-500 text-xs">Your assigned doctor</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-amber-400 text-sm font-bold">⚠️ No doctor assigned yet. Please connect with a doctor first.</p>
                </div>
              )}

              <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Date</label>
                  <input 
                    type="date" 
                    required
                    className="premium-input px-4 h-12"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Session Time</label>
                  <input 
                    type="time" 
                    required
                    className="premium-input px-4 h-12"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Session Type</label>
                  <select 
                    className="premium-input px-4 h-12 bg-slate-900 appearance-none"
                    value={bookingForm.type}
                    onChange={(e) => setBookingForm({...bookingForm, type: e.target.value})}
                  >
                    <option>Video Call</option>
                    <option>In-person Clinic</option>
                    <option>Home Visit</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={submitting || !assignedDoctor}
                    className="flex-1 h-12 font-black shadow-indigo-500/10 shadow-lg"
                  >
                    {submitting ? 'BOOKING...' : 'CONFIRM'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <div className="glass-panel border-slate-700/50 overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Schedule...</p>
              </div>
            ) : sessions.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Appointment</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {user?.role === 'patient' ? 'Specialist' : 'Patient'}
                    </th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Modality</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sessions.map((session) => (
                    <tr key={session._id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-100 text-sm">{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-500 font-bold tracking-widest mt-0.5 uppercase">{session.time}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-xs font-black text-indigo-400">
                            {user?.role === 'patient' 
                              ? (session.professional?.firstName?.[0] || 'D')
                              : (session.patient?.firstName?.[0] || 'P')}
                          </div>
                          <div className="font-bold text-slate-200 text-sm">
                            {user?.role === 'patient' 
                              ? `Dr. ${session.professional?.firstName || 'Assigned'} ${session.professional?.lastName || 'Expert'}`
                              : `${session.patient?.firstName || ''} ${session.patient?.lastName || ''}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <span className="text-base">{session.type === 'Video Call' ? '🎥' : session.type === 'Home Visit' ? '🏠' : '🏥'}</span>
                          {session.type}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex">
                          {getStatusBadge(session.status)}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end items-center">
                          {/* Doctor/Physiotherapist: Approve & Decline for pending */}
                          {isDoctor && session.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => approveSession(session._id)}
                                disabled={updatingId === session._id}
                                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                              >
                                {updatingId === session._id ? '...' : '✓ Approve'}
                              </button>
                              <button 
                                onClick={() => declineSession(session._id)}
                                disabled={updatingId === session._id}
                                className="h-8 px-4 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                              >
                                ✕ Decline
                              </button>
                            </>
                          )}

                          {/* Patient: Cancel for pending or upcoming */}
                          {user?.role === 'patient' && (session.status === 'upcoming' || session.status === 'pending') && (
                            <button 
                              onClick={() => cancelSession(session._id)}
                              disabled={updatingId === session._id}
                              className="text-red-400 hover:text-red-300 font-black text-[9px] uppercase tracking-widest transition-colors underline decoration-red-900/50 underline-offset-4"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Doctor: Cancel for upcoming */}
                          {isDoctor && session.status === 'upcoming' && (
                            <button 
                              onClick={() => cancelSession(session._id)}
                              disabled={updatingId === session._id}
                              className="text-red-400 hover:text-red-300 font-black text-[9px] uppercase tracking-widest transition-colors underline decoration-red-900/50 underline-offset-4"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Join Call for upcoming video sessions */}
                          {session.status === 'upcoming' && session.type === 'Video Call' && (
                            <button className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">
                              Join Call
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-slate-800/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-slate-700/30">
                  📅
                </div>
                <h3 className="text-xl font-bold text-slate-200">No sessions scheduled</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                  {isDoctor 
                    ? 'Patient appointment requests will appear here.'
                    : 'Book your first recovery session with a professional to get started on your plan.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionScheduling;
