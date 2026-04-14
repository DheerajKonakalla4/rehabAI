import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PatientDashboard from './pages/PatientDashboard';
import PhysiotherapistDashboard from './pages/PhysiotherapistDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ExerciseTracking from './pages/ExerciseTracking';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ProgressReport from './pages/ProgressReport';
import Messaging from './pages/Messaging';
import AIChatAssistant from './pages/AIChatAssistant';
import Support from './pages/Support';
import Profile from './pages/Profile';
import DoctorPatientChat from './pages/DoctorPatientChat';
import AIRehabPlan from './pages/AIRehabPlan';
import SessionScheduling from './pages/SessionScheduling';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based Dashboard Redirect
const RoleDashboard = () => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'patient':
      return <PatientDashboard />;
    case 'physiotherapist':
      return <PhysiotherapistDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function AppRoutes() {
  const { user } = useContext(AuthContext);
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercise-tracking"
        element={
          <ProtectedRoute>
            <ExerciseTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercise-library"
        element={
          <ProtectedRoute>
            <ExerciseLibrary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <AIChatAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <Support />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress-report"
        element={
          <ProtectedRoute>
            <ProgressReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messaging"
        element={
          <ProtectedRoute>
            <Messaging />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor-patient-chat"
        element={
          <ProtectedRoute>
            <DoctorPatientChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <SessionScheduling />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-rehab-plan"
        element={
          <ProtectedRoute>
            <AIRehabPlan />
          </ProtectedRoute>
        }
      />
      
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
