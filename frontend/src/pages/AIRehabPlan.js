import React, { useState } from 'react';
import { Navbar, PageHeader } from '../components/Layout';
import { Card, Button, Skeleton } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const AIRehabPlan = () => {
  const [formData, setFormData] = useState({
    injuryType: '',
    age: '',
    currentPainLevel: 5,
    medicalHistory: ''
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/ai/generate-plan', formData);
      setPlan(response.data.plan);
    } catch (error) {
      alert('Error generating plan: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSavePlan = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const planSummary = `Injury: ${formData.injuryType} | Duration: ${plan.duration} | Difficulty: ${plan.difficulty} | Exercises: ${plan.recommendedExercises.map(ex => `${ex.name} (${ex.sets}x${ex.reps})`).join(', ')}`;
      
      await apiClient.put('/patient/profile', { 
        injuryType: formData.injuryType,
        rehabilitationPlan: planSummary 
      });
      
      alert('Plan saved to your profile successfully!');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a1a]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <PageHeader 
          title="🤖 AI Personalized Rehab Plan"
          subtitle="Generate a safe, customized rehabilitation schedule based on your current condition"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Assessment Form */}
          <div className="lg:col-span-5 animate-fade-in-up">
            <Card className="glass-panel border-slate-700/50">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-indigo-400">📋</span> Patient Assessment
                </h2>
                <p className="text-slate-400 text-sm mt-1">Provide details to help our AI create your plan</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Injury / Condition</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., ACL Tear, Lower Back Pain"
                    className="premium-input px-5 h-14"
                    value={formData.injuryType}
                    onChange={(e) => setFormData({...formData, injuryType: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Age</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Years"
                      className="premium-input px-5 h-14"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pain Level (1-10)</label>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="range" 
                        min="1" max="10" 
                        className="w-full accent-indigo-500 mt-2"
                        value={formData.currentPainLevel}
                        onChange={(e) => setFormData({...formData, currentPainLevel: e.target.value})}
                      />
                      <div className="text-right font-black text-2xl text-indigo-400 drop-shadow-sm leading-none">{formData.currentPainLevel}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Medical History</label>
                  <textarea 
                    rows="4"
                    placeholder="Any previous surgeries, related conditions, or movements that cause sharp pain..."
                    className="premium-input px-5 py-4 min-h-[140px]"
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                  ></textarea>
                </div>

                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-14 text-base font-black shadow-indigo-500/20 shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>ANALYZING CONDITION...</span>
                    </div>
                  ) : (
                    <>✨ GENERATE AI PLAN</>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-7 space-y-6">
            {loading && (
              <div className="animate-pulse space-y-8">
                <div className="glass-panel h-64 bg-slate-800/20"></div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-800/40 h-24 rounded-3xl"></div>
                  <div className="bg-slate-800/40 h-24 rounded-3xl"></div>
                  <div className="bg-slate-800/40 h-24 rounded-3xl"></div>
                </div>
              </div>
            )}

            {!loading && !plan && (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center glass-panel border-dashed border-2 border-slate-700/50 rounded-3xl min-h-[500px]">
                <div className="w-24 h-24 rounded-full bg-slate-800/40 flex items-center justify-center text-5xl mb-8 shadow-inner border border-slate-700/30">
                  🌟
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight mb-3">Ready to Start?</h3>
                <p className="text-slate-500 max-w-sm leading-relaxed font-medium">
                  Complete the assessment to receive an instantly tailored rehabilitation plan based on clinical AI guidelines.
                </p>
              </div>
            )}

            {!loading && plan && (
              <div className="animate-fade-in-up space-y-6">
                <Card className="glass-panel border-indigo-500/30 bg-indigo-500/5 overflow-hidden relative p-1">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  
                  <div className="p-8 relative">
                    <h2 className="text-3xl font-black text-white mb-8 tracking-tighter flex items-center gap-4">
                      <span className="text-indigo-400">⚡</span> Your Recovery Roadmap
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-6 mb-10">
                      <div className="glass-card bg-slate-800/40 p-5 rounded-3xl border-slate-700/30 text-center group hover:border-indigo-500/50 transition-all">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Duration</p>
                        <p className="font-black text-indigo-400 text-xl group-hover:scale-110 transition-transform">{plan.duration}</p>
                      </div>
                      <div className="glass-card bg-slate-800/40 p-5 rounded-3xl border-slate-700/30 text-center group hover:border-indigo-500/50 transition-all">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Intensity</p>
                        <p className="font-black text-indigo-400 text-xl group-hover:scale-110 transition-transform">{plan.difficulty}</p>
                      </div>
                      <div className="glass-card bg-slate-800/40 p-5 rounded-3xl border-slate-700/30 text-center group hover:border-indigo-500/50 transition-all">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Frequency</p>
                        <p className="font-black text-indigo-400 text-xl group-hover:scale-110 transition-transform">{plan.frequency}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-700/50 text-slate-300 p-8 rounded-3xl mb-10 shadow-inner relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                      <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-3 text-indigo-400">
                        <span>👨‍⚕️</span> Clinical AI Assessment
                      </h3>
                      <p className="leading-relaxed text-sm font-medium italic opacity-90">"{plan.aiNotes}"</p>
                    </div>

                    <h3 className="text-lg font-black text-white mb-6 pb-2 border-b border-slate-800/50 tracking-tight">Daily Exercise Routine</h3>
                    <div className="space-y-4">
                      {plan.recommendedExercises.map((ex, idx) => (
                        <div key={idx} className="glass-card bg-slate-800/30 p-6 rounded-3xl border-slate-800/50 flex justify-between items-center group hover:bg-slate-800/50 transition-all">
                          <div className="flex-1">
                            <h4 className="font-black text-slate-100 text-lg flex items-center gap-3">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                              {ex.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm font-medium italic">{ex.notes}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-black text-indigo-400 text-2xl tracking-tighter">
                              {ex.sets} × {ex.reps}
                            </span>
                            <span className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Sets × Reps</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10">
                      <Button 
                        variant="success" 
                        onClick={handleSavePlan}
                        disabled={saving}
                        className="w-full h-14 font-black shadow-lg shadow-green-500/10 text-base"
                      >
                        {saving ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>SAVING PLAN...</span>
                          </div>
                        ) : (
                          <>✅ SAVE TO MY ACTIVE PLAN</>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRehabPlan;
