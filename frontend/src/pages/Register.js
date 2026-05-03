import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button, Alert, Input } from '../components/UIComponents';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phoneNumber: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const onlyNums = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: onlyNums });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-20 px-4 overflow-hidden bg-[#0f172a]">
      {/* Background patterns and glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse"></div>

      <div className="w-full max-w-2xl z-10 animate-fade-in">
        <div className="text-center mb-12">
          <Link to="/" className="inline-block group mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform mb-4 mx-auto">
              <span className="text-3xl font-black">❖</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">
              Create <span className="text-gradient-primary">Account</span>
            </h1>
          </Link>
          <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            Join thousands of patients and professionals using RehabAI for data-driven recovery.
          </p>
        </div>

        <div className="glass-card p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500"></div>

          {error && <Alert variant="danger" message={error} onClose={() => setError('')} className="mb-8" />}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Select Your Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'patient', label: 'Patient', icon: '🤕' },
                  { id: 'doctor', label: 'Doctor', icon: '👨‍⚕️' },
                  { id: 'physiotherapist', label: 'Physio', icon: '🧘' }
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.id })}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 font-bold ${
                      formData.role === role.id 
                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10' 
                        : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xl">{role.icon}</span>
                    <span className="text-sm">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="First Name"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Phone Number"
                name="phoneNumber"
                placeholder="10-digit number"
                value={formData.phoneNumber}
                onChange={handleChange}
                maxLength="10"
                required
              />
              <Input
                label="Age"
                type="number"
                name="age"
                placeholder="25"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/5 pt-8">
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <Button 
              variant="primary" 
              type="submit" 
              loading={loading}
              className="w-full h-16 text-lg font-black tracking-wider uppercase mt-4"
            >
              Initialize Account
            </Button>
          </form>

          <div className="mt-10 text-center pt-8 border-t border-white/5">
            <p className="text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors underline underline-offset-4 decoration-slate-800">
                Sign In Instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
