import React from 'react';

// Button Component with multiple variants
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  loading = false,
  disabled = false,
  ...props 
}) => {
  const baseStyles = 'font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.5)] border border-white/10 hover:-translate-y-0.5',
    secondary: 'bg-slate-800/80 backdrop-blur-md text-slate-200 hover:bg-slate-700 border border-white/5 hover:border-white/10',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/20',
    success: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500 shadow-lg shadow-teal-500/20',
    outline: 'bg-transparent border-2 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400',
    ghost: 'text-slate-400 hover:text-white hover:bg-white/5'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-xs uppercase tracking-wider',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
      ) : children}
    </button>
  );
};

// Card Component
export const Card = ({ children, className = '', ...props }) => (
  <div className={`glass-card p-6 border border-white/5 ${className}`} {...props}>
    {children}
  </div>
);

// Badge Component
export const Badge = ({ children, variant = 'blue', className = '' }) => {
  const variants = {
    blue: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    green: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    red: 'bg-red-500/10 text-red-400 border border-red-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    gray: 'bg-slate-700/20 text-slate-400 border border-slate-700/30'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Input Component
export const Input = ({ 
  label, 
  error, 
  className = '',
  ...props 
}) => (
  <div className="w-full">
    {label && <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">{label}</label>}
    <input 
      className={`premium-input ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1 uppercase tracking-tighter">{error}</p>}
  </div>
);

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };
  
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`glass-card ${sizes[size]} w-full p-8 animate-fade-in-up border border-white/10 shadow-2xl`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-2xl"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
          {children}
        </div>
      </div>
    </div>
  );
};

// Stats Grid Component
export const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
    {stats.map((stat, idx) => (
      <div key={idx} className="glass-card p-6 flex flex-col items-center justify-center group hover:scale-105">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-500/20 transition-colors">
          {stat.icon || '📊'}
        </div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
        <p className="text-3xl font-black text-white drop-shadow-md">{stat.value}</p>
      </div>
    ))}
  </div>
);

// Avatar Component
export const Avatar = ({ name, size = 'md', className = '' }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';
  
  const sizes = {
    sm: 'h-10 w-10 text-xs',
    md: 'h-14 w-14 text-sm',
    lg: 'h-20 w-20 text-xl'
  };
  
  return (
    <div className={`${sizes[size]} rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg border border-white/20 ${className}`}>
      {initials}
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="glass-card text-center py-16 border-dashed border-2 border-slate-700/50 bg-slate-800/20 flex flex-col items-center">
    <div className="text-6xl mb-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500 transform hover:scale-110">{icon}</div>
    <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
    <p className="text-slate-400 max-w-xs mx-auto mb-8 font-medium">{description}</p>
    {action}
  </div>
);

// Loading Skeleton
export const Skeleton = ({ count = 1, height = 100 }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, idx) => (
      <div 
        key={idx} 
        style={{ height: `${height}px` }}
        className="w-full glass-card relative overflow-hidden animate-pulse"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
      </div>
    ))}
  </div>
);

// Alert Notification
export const Alert = ({ title, message, variant = 'info', onClose }) => {
  const variants = {
    info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    danger: 'bg-red-500/10 border-red-500/30 text-red-200'
  };

  return (
    <div className={`border-l-4 p-5 rounded-xl shadow-2xl flex justify-between items-center backdrop-blur-md animate-fade-in-up ${variants[variant]}`}>
      <div className="flex gap-4 items-center">
        <div className="text-2xl">
          {variant === 'success' ? '✓' : variant === 'danger' ? '✕' : variant === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div>
          {title && <h4 className="font-black text-sm uppercase tracking-wider mb-0.5">{title}</h4>}
          <p className="text-sm font-medium opacity-80">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 text-xl transition-all">
          &times;
        </button>
      )}
    </div>
  );
};

