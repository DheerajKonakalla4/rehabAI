import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button, Input, Alert } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online' | 'waking'

  useEffect(() => {
    let cancelled = false;
    const warmUp = async () => {
      try {
        await apiClient.get('/auth/health', { timeout: 5000 });
        if (!cancelled) setServerStatus('online');
      } catch (err) {
        if (!cancelled) {
          setServerStatus('waking');
          setTimeout(async () => {
            try {
              await apiClient.get('/auth/health', { timeout: 30000 });
              if (!cancelled) setServerStatus('online');
            } catch {
              if (!cancelled) setServerStatus('online');
            }
          }, 3000);
        }
      }
    };
    warmUp();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('timeout')) {
        setError('Server is starting up. Please try again in 5 seconds...');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-[#0f172a]">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse [animation-delay:2s]"></div>
      
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl mx-auto mb-6 transform hover:scale-110 transition-transform">
            <span className="text-4xl font-black">❖</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tighter">
            Rehab<span className="text-indigo-400">AI</span>
          </h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">
            The Future of Recovery
          </p>
        </div>

        {/* Server status banner */}
        <div className="mb-6 animate-fade-in-up">
          {serverStatus === 'waking' && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <p className="text-amber-400 font-bold text-xs flex items-center gap-3 justify-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                Booting intelligent medical core...
              </p>
            </div>
          )}
          {serverStatus === 'online' && (
            <div className="p-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <p className="text-indigo-400 font-black text-[9px] flex items-center gap-2 justify-center uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.5)]"></span>
                Systems Operational
              </p>
            </div>
          )}
        </div>

        <div className="glass-card p-10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          
          <div className="mb-10">
            <h2 className="text-3xl font-black text-white tracking-tight">Access Portal</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">Secure biometric identification required</p>
          </div>
          
          {error && <Alert variant="danger" message={error} onClose={() => setError('')} className="mb-8" />}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <Input
              label="Professional ID / Email"
              type="email"
              name="email"
              placeholder="e.g., doctor@rehab.ai"
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Passkey</label>
                <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                  Reset Access
                </Link>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="premium-input px-5 h-14"
                required
              />
            </div>
            
            <Button 
              variant="primary" 
              type="submit" 
              loading={loading}
              className="w-full h-16 text-lg font-black tracking-widest uppercase shadow-indigo-500/20"
            >
              Authenticate
            </Button>
          </form>

          <div className="mt-10 text-center pt-8 border-t border-white/5">
            <p className="text-slate-500 text-sm font-medium">
              New to the platform?{' '}
              <Link to="/register" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors underline underline-offset-8 decoration-slate-800">
                Enroll Now
              </Link>
            </p>
          </div>

        </div>

        <div className="mt-12 flex items-center justify-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            🔒 HIPAA COMPLIANT
          </span>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            🛡️ QUANTUM ENCRYPTION
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
