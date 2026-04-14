import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button, Input, Card } from '../components/UIComponents';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
      
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl">
            🏥 Rehab<span className="text-indigo-500">AI</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
            Intelligent Recovery Suite
          </p>
        </div>

        <Card className="glass-panel border-slate-700/50 p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Please enter your credentials to continue</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-shake">
              <p className="text-red-400 font-bold text-xs flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="doctor@test.com"
                value={formData.email}
                onChange={handleChange}
                className="premium-input px-5 h-14"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                >
                  Forgot?
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
              disabled={loading}
              className="w-full h-14 text-base font-black shadow-indigo-500/20 shadow-xl group overflow-hidden relative"
            >
              <span className="relative z-10">{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-20"></div>
            </Button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
            <p className="text-slate-500 text-sm font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors underline underline-offset-4 decoration-slate-800">
                Create one
              </Link>
            </p>
          </div>

          {/* Elegant Demo Credentials */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-default">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Demo Patient</p>
              <p className="text-[10px] font-bold text-slate-300 truncate">patient@test.com</p>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-default">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Demo Doctor</p>
              <p className="text-[10px] font-bold text-slate-300 truncate">doctor@test.com</p>
            </div>
          </div>
        </Card>

        <div className="mt-10 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="text-green-500">🔒</span> HIPAA SECURE
          </span>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="text-indigo-500">🛡️</span> SSL ENCRYPTED
          </span>
        </div>
      </div>
    </div>
  );

};

export default Login;
