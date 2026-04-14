import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../components/UIComponents';
import apiClient from '../services/apiClient';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: reset password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Request password reset via email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setSuccess('An OTP has been sent to your email. Please check your inbox.');
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      setSuccess('OTP verified successfully. Please enter your new password.');
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
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
            Recovery Access Portal
          </p>
        </div>

        <Card className="glass-panel border-slate-700/50 p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-10 px-2 relative">
            <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-800/50 -z-0">
              <div 
                className="h-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${step === 1 ? '0%' : step === 2 ? '50%' : '100%'}` }}
              ></div>
            </div>
            
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 border-2 ${
                  step === s 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' 
                    : step > s 
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-2 transition-colors ${
                  step === s ? 'text-indigo-400' : 'text-slate-600'
                }`}>
                  {s === 1 ? 'Email' : s === 2 ? 'Verify' : 'Reset'}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">
              {step === 1 && 'Identify Account'}
              {step === 2 && 'Verify Security'}
              {step === 3 && 'New Credentials'}
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {step === 1 && 'Enter your email to receive an OTP'}
              {step === 2 && 'Check your inbox for the 6-digit code'}
              {step === 3 && 'Choose a strong, unique password'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-shake">
              <p className="text-red-400 font-bold text-xs flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          {success && step !== 3 && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-fade-in">
              <p className="text-green-400 font-bold text-[11px] flex items-start gap-2">
                <span className="mt-0.5">ℹ️</span> {success}
              </p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="doctor@test.com"
                  className="premium-input px-5 h-14"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                />
              </div>
              
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="w-full h-14 text-base font-black shadow-indigo-500/20 shadow-xl"
              >
                {loading ? 'SENDING OTP...' : 'REQUEST RESET CODE'}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 animate-fade-in-up">
              <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20 mb-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  We've dispatched a secure code to: <br/>
                  <span className="font-black text-indigo-300 ml-1">{email}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">OTP CODE</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="premium-input px-5 h-14 text-center tracking-[0.5em] text-lg font-black"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError('');
                  }}
                  required
                />
              </div>
              
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="w-full h-14 text-base font-black shadow-indigo-500/20 shadow-xl"
              >
                {loading ? 'VERIFYING...' : 'CONFIRM OTP'}
              </Button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-indigo-400 hover:text-indigo-300 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <span>←</span> Back to Email
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handlePasswordReset} className="space-y-6 animate-fade-in-up">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="premium-input px-5 h-14"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="premium-input px-5 h-14"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  required
                />
              </div>
              
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="w-full h-14 text-base font-black shadow-indigo-500/20 shadow-xl"
              >
                {loading ? 'RESETTING...' : 'UPDATE PASSWORD'}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
            <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
              <span>🔒</span> Return to Login
            </Link>
          </div>
        </Card>

        <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-8">
          Self-Service Identity Management
        </p>
      </div>
    </div>
  );

};

export default ForgotPassword;
