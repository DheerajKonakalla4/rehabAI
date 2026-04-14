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
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border-transparent hover:-translate-y-0.5',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 shadow-md',
    danger: 'bg-red-600/90 text-white hover:bg-red-500 shadow-lg border-transparent',
    success: 'bg-teal-500/90 text-white hover:bg-teal-400 shadow-lg border-transparent',
    outline: 'border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500/10',
    ghost: 'text-indigo-400 hover:bg-slate-800/50'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-md',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </button>
  );
};

// Card Component
export const Card = ({ children, className = '', ...props }) => (
  <div className={`glass-card p-6 ${className}`} {...props}>
    {children}
  </div>
);

// Badge Component
export const Badge = ({ children, variant = 'blue', className = '' }) => {
  const variants = {
    blue: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    green: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    red: 'bg-red-500/20 text-red-300 border border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    gray: 'bg-slate-700/50 text-slate-300 border border-slate-600'
  };
  
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${variants[variant]} ${className}`}>
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
    {label && <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>}
    <input 
      className={`premium-input ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`glass-card ${sizes[size]} w-full mx-4 p-6 animate-fade-in-up border border-slate-700/80`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Request Card Component
export const RequestCard = ({ 
  userName, 
  userEmail, 
  userPhone,
  specialization,
  message, 
  onAccept, 
  onReject, 
  loading = false,
  variant = 'incoming'
}) => (
  <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div className="flex-1">
      <h3 className="text-lg font-bold text-gray-800 mb-1">{userName}</h3>
      <p className="text-gray-600 mb-2">{userEmail}{userPhone && ` • ${userPhone}`}</p>
      {specialization && <Badge variant="blue">{specialization}</Badge>}
      {message && <p className="text-gray-700 mt-2 text-sm">{message}</p>}
    </div>
    {variant === 'incoming' && (
      <div className="flex gap-2">
        <Button 
          variant="danger" 
          size="sm" 
          onClick={onReject}
          disabled={loading}
        >
          Decline
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={onAccept}
          loading={loading}
        >
          Accept
        </Button>
      </div>
    )}
    {variant === 'outgoing' && (
      <Badge variant="yellow">Pending</Badge>
    )}
  </Card>
);

// Stats Grid Component
export const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {stats.map((stat, idx) => (
      <Card key={idx} className="text-center hover:bg-slate-800/80 transition-colors">
        <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
        <p className="text-3xl font-bold text-indigo-400 drop-shadow-sm">{stat.value}</p>
      </Card>
    ))}
  </div>
);

// Avatar Component
export const Avatar = ({ name, size = 'md', className = '' }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg'
  };
  
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500'];
  const colorIdx = initials.charCodeAt(0) % colors.length;
  
  return (
    <div className={`${sizes[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-bold ${className}`}>
      {initials}
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ icon, title, description, action }) => (
  <Card className="text-center py-12 border-dashed border-2 border-slate-700/50 bg-slate-800/30">
    <div className="text-5xl mb-4 opacity-80">{icon}</div>
    <h3 className="text-xl font-bold text-slate-200 mb-2">{title}</h3>
    <p className="text-slate-400 mb-6">{description}</p>
    {action}
  </Card>
);

// Loading Skeleton
export const Skeleton = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, idx) => (
      <Card key={idx} className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </Card>
    ))}
  </div>
);

// Alert Notification
export const Alert = ({ title, message, variant = 'info', onClose }) => {
  const variants = {
    info: 'bg-blue-900/40 border-blue-500/50 text-blue-200',
    success: 'bg-teal-900/40 border-teal-500/50 text-teal-200',
    warning: 'bg-amber-900/40 border-amber-500/50 text-amber-200',
    danger: 'bg-red-900/40 border-red-500/50 text-red-200'
  };

  return (
    <div className={`border-l-4 p-4 rounded-r shadow-md flex justify-between items-start ${variants[variant]}`}>
      <div>
        {title && <h4 className="font-bold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-70 hover:opacity-100 text-xl font-bold leading-none ml-4">
          &times;
        </button>
      )}
    </div>
  );
};

// Progress Ring
export const ProgressRing = ({ radius = 60, stroke = 8, progress = 0, color = '#6366f1' }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold" style={{ color }}>{progress}%</span>
      </div>
    </div>
  );
};

