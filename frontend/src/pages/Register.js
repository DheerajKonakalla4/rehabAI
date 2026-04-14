import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button, Input, Card } from '../components/UIComponents';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    age: '',
    phone: '',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      setError('First and Last names are required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    if (!validateStep2()) return;

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-[#0a0a1a]">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
      
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl">
            🏥 Rehab<span className="text-indigo-500">AI</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
            Join the Intelligent Recovery Suite
          </p>
        </div>

        <Card className="glass-panel border-slate-700/50 p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Phase {step} of 2
              </span>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {Math.round((step / 2) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden p-[1px] border border-slate-700/30">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${(step / 2) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">
              {step === 1 ? 'Personal Profile' : 'Account Security'}
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {step === 1 ? 'Tell us a bit about yourself' : 'Secure your clinical workspace'}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-shake">
              <p className="text-red-400 font-bold text-xs flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="premium-input px-5 h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="premium-input px-5 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">I am registering as</label>
                  <div className="relative group">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="premium-input px-5 h-12 appearance-none cursor-pointer"
                    >
                      <option value="patient" className="bg-slate-900">Patient</option>
                      <option value="doctor" className="bg-slate-900">Doctor</option>
                      <option value="physiotherapist" className="bg-slate-900">Physiotherapist</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-400 transition-colors">▼</div>
                  </div>
                </div>

                {formData.role !== 'patient' && (
                  <div className="space-y-2 animate-fade-in-up">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      placeholder="e.g., Orthopedics, Sports Medicine"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="premium-input px-5 h-12"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      placeholder="30"
                      value={formData.age}
                      onChange={handleChange}
                      className="premium-input px-5 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="premium-input px-5 h-12"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="premium-input px-5 h-14"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="premium-input px-5 h-14"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Identity</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="premium-input px-5 h-14"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {step === 2 && (
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 glass-card bg-slate-800/40 border border-slate-700/50 text-slate-400 font-black hover:bg-slate-800 transition-all rounded-2xl text-xs uppercase tracking-widest"
                >
                  Back
                </button>
              )}
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="flex-1 h-14 text-base font-black shadow-indigo-500/20 shadow-xl"
              >
                {loading ? 'PROCESSING...' : (step === 1 ? 'CONTINUE' : 'CREATE ACCOUNT')}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
            <p className="text-slate-500 text-sm font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors underline underline-offset-4 decoration-slate-800">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
          <span>✔️</span> ISO 27001 Compliant <span>•</span> <span>✔️</span> END-TO-END ENCRYPTED
        </p>
      </div>
    </div>
  );

};

export default Register;
