import apiClient from './apiClient';

// Authentication API
export const authAPI = {
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (userData) => 
    apiClient.post('/auth/register', userData),
  
  getProfile: () => 
    apiClient.get('/auth/profile'),
  
  logout: () => 
    apiClient.post('/auth/logout'),
};

// Patient API
export const patientsAPI = {
  getDashboard: () => 
    apiClient.get('/patient/dashboard'),
  
  getExercises: () => 
    apiClient.get('/patient/exercises'),
  
  logExercise: (data) => 
    apiClient.post('/patient/exercise-log', data),
  
  getExerciseLogs: () => 
    apiClient.get('/patient/exercise-logs'),
  
  updateProfile: (data) => 
    apiClient.put('/patient/profile', data),
  
  getAllPatients: () => 
    apiClient.get('/patients'),
  
  getPatientById: (id) => 
    apiClient.get(`/patients/${id}`),
  
  assignPhysiotherapist: (patientId, physiotherapistId) => 
    apiClient.post(`/patients/${patientId}/assign-physiotherapist`, { physiotherapistId }),
};

// Physiotherapist API
export const physiotherapistsAPI = {
  getPatients: () => 
    apiClient.get('/mentor/patients'),
  
  addExercise: (data) => 
    apiClient.post('/mentor/add-exercise', data),
  
  assignExercise: (data) => 
    apiClient.post('/mentor/assign-exercise', data),
  
  updateProgress: (patientId, data) => 
    apiClient.put(`/mentor/update-progress/${patientId}`, data),
  
  getPatientProgress: (patientId) => 
    apiClient.get(`/mentor/patient/${patientId}/progress`),
  
  getAllPhysiotherapists: () => 
    apiClient.get('/physiotherapists'),
  
  getPhysiotherapistById: (id) => 
    apiClient.get(`/physiotherapists/${id}`),
};

// Doctor API
export const doctorsAPI = {
  getPatients: () => 
    apiClient.get('/doctor/patients'),
  
  getReports: () => 
    apiClient.get('/doctor/reports'),
  
  getPatientReport: (patientId) => 
    apiClient.get(`/doctor/patient/${patientId}/report`),
  
  assignPatient: (data) => 
    apiClient.post('/doctor/assign-patient', data),
  
  getAllDoctors: () => 
    apiClient.get('/doctors'),
  
  getDoctorById: (id) => 
    apiClient.get(`/doctors/${id}`),
};

// Messaging API
export const messagesAPI = {
  sendMessage: (data) => 
    apiClient.post('/messages/send', data),
  
  getMessageHistory: (userId) => 
    apiClient.get(`/messages/history/${userId}`),
  
  getInbox: () => 
    apiClient.get('/messages/inbox'),
  
  markAsRead: (messageId) => 
    apiClient.put(`/messages/${messageId}/mark-read`),
  
  deleteMessage: (messageId) => 
    apiClient.delete(`/messages/${messageId}`),
};

// Exercise API
export const exercisesAPI = {
  getAllExercises: () => 
    apiClient.get('/exercises'),
  
  getExerciseById: (id) => 
    apiClient.get(`/exercises/${id}`),
  
  createExercise: (exerciseData) => 
    apiClient.post('/exercises', exerciseData),
  
  updateExercise: (id, data) => 
    apiClient.put(`/exercises/${id}`, data),
  
  deleteExercise: (id) => 
    apiClient.delete(`/exercises/${id}`),
};

// Session API
export const sessionsAPI = {
  getAllSessions: () => 
    apiClient.get('/sessions'),
  
  getSessionById: (id) => 
    apiClient.get(`/sessions/${id}`),
  
  getPatientSessions: (patientId) => 
    apiClient.get(`/sessions/patient/${patientId}`),
  
  createSession: (sessionData) => 
    apiClient.post('/sessions', sessionData),
  
  updateSession: (id, data) => 
    apiClient.put(`/sessions/${id}`, data),
};
