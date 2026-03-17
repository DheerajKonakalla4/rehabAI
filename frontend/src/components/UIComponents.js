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
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50'
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
  <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 ${className}`} {...props}>
    {children}
  </div>
);

// Badge Component
export const Badge = ({ children, variant = 'blue', className = '' }) => {
  const variants = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800'
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
    {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
    <input 
      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-2xl ${sizes[size]} w-full mx-4 p-6 animation-fadeIn`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
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
      <Card key={idx} className="text-center">
        <p className="text-gray-600 text-sm font-semibold mb-2">{stat.label}</p>
        <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
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
  <Card className="text-center py-12">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
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
