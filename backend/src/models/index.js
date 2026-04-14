// Export all models from a single file for easier importing

module.exports = {
  User: require('./User'),
  PatientProfile: require('./Patient'),
  Exercise: require('./Exercise'),
  ExerciseLog: require('./ExerciseLog'),
  ExerciseSession: require('./ExerciseSession'),
  AssignedExercise: require('./AssignedExercise'),
  DietRecommendation: require('./DietRecommendation'),
  Message: require('./Message'),
  DoctorPatientRequest: require('./DoctorPatientRequest'),
  Achievement: require('./Achievement'),
  ChatMessage: require('./ChatMessage'),
  Professional: require('./Professional'),
  DailyLog: require('./DailyLog')
};
