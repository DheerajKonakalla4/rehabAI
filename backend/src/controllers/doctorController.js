const { User, PatientProfile, ExerciseLog, ExerciseSession, DoctorPatientRequest } = require('../models');

// @route   GET /api/doctor/patients
// @desc    Get all patients assigned to doctor
// @access  Private (Doctor)
exports.getPatients = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const patients = await PatientProfile.find({ assignedDoctor: doctorId })
      .populate('patientId', 'firstName lastName email phone age')
      .populate('assignedPhysiotherapist', 'firstName lastName email');

    if (!patients || patients.length === 0) {
      return res.status(200).json({ 
        message: 'No patients assigned',
        patients: [] 
      });
    }

    res.status(200).json({ 
      message: `Found ${patients.length} assigned patient(s)`,
      patients 
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error fetching patients', error: error.message });
  }
};

// @route   GET /api/doctor/reports
// @desc    Get aggregated reports for all assigned patients
// @access  Private (Doctor)
exports.getReports = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    // Get all patients assigned to the doctor
    const patients = await PatientProfile.find({ assignedDoctor: doctorId })
      .populate('patientId', 'firstName lastName email');

    if (!patients || patients.length === 0) {
      return res.status(200).json({
        report: {
          totalPatients: 0,
          totalExercisesCompleted: 0,
          averagePainLevel: 0,
          averageEffortLevel: 0,
          patientReports: []
        }
      });
    }

    const patientIds = patients.map(p => p.patientId);

    // Get exercise logs for all patients
    const logs = await ExerciseLog.find({ patientId: { $in: patientIds } })
      .populate('exerciseId', 'name category difficulty');

    // Get exercise sessions for all patients
    const sessions = await ExerciseSession.find({ patient: { $in: patientIds } });

    // Calculate aggregated stats
    const totalExercisesCompleted = sessions.filter(s => s.completionStatus === 'completed').length;
    const completedSessions = sessions.filter(s => s.completionStatus === 'completed');
    
    const painLevels = completedSessions
      .map(s => s.pain_level)
      .filter(p => p !== undefined && p !== null);
    const averagePainLevel = painLevels.length > 0 
      ? (painLevels.reduce((a, b) => a + b, 0) / painLevels.length).toFixed(2)
      : 0;

    const effortLevels = completedSessions
      .map(s => s.effort_level)
      .filter(e => e !== undefined && e !== null);
    const averageEffortLevel = effortLevels.length > 0 
      ? (effortLevels.reduce((a, b) => a + b, 0) / effortLevels.length).toFixed(2)
      : 0;

    // Individual patient reports
    const patientReports = patients.map(patient => {
      const patientSessions = sessions.filter(s => s.patient.toString() === patient.patientId.toString());
      const patientLogs = logs.filter(l => l.patientId.toString() === patient.patientId.toString());
      const completedSets = patientLogs.reduce((sum, log) => sum + log.completedSets, 0);
      const avgPain = patientLogs.length > 0 
        ? (patientLogs.filter(l => l.painLevel !== undefined).reduce((sum, l) => sum + l.painLevel, 0) / patientLogs.filter(l => l.painLevel !== undefined).length).toFixed(2)
        : 0;

      return {
        patientId: patient._id,
        patientName: `${patient.patientId.firstName} ${patient.patientId.lastName}`,
        injuryType: patient.injuryType,
        rehabilitationPlan: patient.rehabilitationPlan,
        totalSessions: patientSessions.length,
        completedSessions: patientSessions.filter(s => s.completionStatus === 'completed').length,
        pendingSessions: patientSessions.filter(s => s.completionStatus === 'pending').length,
        totalExercisesLogged: patientLogs.length,
        totalSetsCompleted: completedSets,
        averagePainLevel: avgPain
      };
    });

    res.status(200).json({
      report: {
        totalPatients: patients.length,
        totalExercisesCompleted,
        averagePainLevel,
        averageEffortLevel,
        patientReports
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error fetching reports', error: error.message });
  }
};

// @route   GET /api/doctor/patient/:patientId/report
// @desc    Get detailed report for specific patient
// @access  Private (Doctor)
exports.getPatientReport = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { patientId } = req.params;

    // Verify patient is assigned to this doctor
    const patientProfile = await PatientProfile.findOne({
      patientId,
      assignedDoctor: doctorId
    }).populate('patientId', 'firstName lastName email phone age')
      .populate('assignedPhysiotherapist', 'firstName lastName email');

    if (!patientProfile) {
      return res.status(403).json({ message: 'Patient not assigned to you' });
    }

    // Get exercise logs
    const logs = await ExerciseLog.find({ patientId })
      .populate('exerciseId', 'name category difficulty')
      .sort({ date: -1 });

    // Get exercise sessions
    const sessions = await ExerciseSession.find({ patient: patientId })
      .populate('exercise', 'name difficulty category')
      .sort({ sessionDate: -1 });

    // Calculate patient specific stats
    const completedSessions = sessions.filter(s => s.completionStatus === 'completed');
    const totalSetsCompleted = logs.reduce((sum, log) => sum + log.completedSets, 0);
    
    const painLevels = completedSessions.map(s => s.pain_level).filter(p => p !== undefined);
    const avgPainLevel = painLevels.length > 0 
      ? (painLevels.reduce((a, b) => a + b, 0) / painLevels.length).toFixed(2)
      : 0;

    res.status(200).json({
      patientProfile,
      stats: {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        pendingSessions: sessions.filter(s => s.completionStatus === 'pending').length,
        inProgressSessions: sessions.filter(s => s.completionStatus === 'in-progress').length,
        totalExercisesLogged: logs.length,
        totalSetsCompleted,
        averagePainLevel: avgPainLevel
      },
      logs,
      sessions
    });
  } catch (error) {
    console.error('Get patient report error:', error);
    res.status(500).json({ message: 'Server error fetching patient report', error: error.message });
  }
};

// @route   POST /api/doctor/assign-patient
// @desc    Assign patient to doctor
// @access  Private (Doctor)
exports.assignPatient = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const patientProfile = await PatientProfile.findOneAndUpdate(
      { patientId },
      { assignedDoctor: doctorId },
      { new: true }
    ).populate('patientId', 'firstName lastName email');

    if (!patientProfile) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient assigned successfully',
      patientProfile
    });
  } catch (error) {
    console.error('Assign patient error:', error);
    res.status(500).json({ message: 'Server error assigning patient', error: error.message });
  }
};

// @route   POST /api/doctor/send-request/:patientUserId
// @desc    Send a connection request to a patient
// @access  Private (Doctor)
exports.sendPatientRequest = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { patientUserId } = req.params;
    const { message } = req.body;

    // Validate patient exists and is a patient
    const patientUser = await User.findById(patientUserId);
    if (!patientUser || patientUser.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Validate doctor exists
    const doctorUser = await User.findById(doctorId);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(403).json({ message: 'You are not authorized as a doctor' });
    }

    // Check if request already exists
    const existingRequest = await DoctorPatientRequest.findOne({
      doctorId,
      patientId: patientUserId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        message: existingRequest.status === 'accepted' 
          ? 'You are already connected with this patient'
          : 'Request already pending for this patient'
      });
    }

    // Create new request
    const request = await DoctorPatientRequest.create({
      doctorId,
      patientId: patientUserId,
      message: message || `${doctorUser.firstName} ${doctorUser.lastName} wants to connect with you.`
    });

    res.status(201).json({
      message: 'Request sent successfully',
      request
    });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ message: 'Server error sending request', error: error.message });
  }
};

// @route   GET /api/doctor/pending-requests
// @desc    Get all pending patient requests sent by doctor
// @access  Private (Doctor)
exports.getPendingRequests = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const requests = await DoctorPatientRequest.find({
      doctorId,
      status: 'pending'
    }).populate('patientId', 'firstName lastName email phone age uniqueId');

    res.status(200).json({
      message: `Found ${requests.length} pending request(s)`,
      requests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error fetching pending requests', error: error.message });
  }
};

// @route   GET /api/doctor/connected-patients
// @desc    Get all patients connected with doctor (accepted requests)
// @access  Private (Doctor)
exports.getConnectedPatients = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const acceptedRequests = await DoctorPatientRequest.find({
      doctorId,
      status: 'accepted'
    }).populate('patientId', 'firstName lastName email phone age uniqueId');

    const patients = acceptedRequests.map(req => ({
      _id: req._id,
      userId: req.patientId._id,
      firstName: req.patientId.firstName,
      lastName: req.patientId.lastName,
      email: req.patientId.email,
      phone: req.patientId.phone,
      age: req.patientId.age,
      uniqueId: req.patientId.uniqueId,
      connectedAt: req.acceptedAt
    }));

    res.status(200).json({
      message: `Found ${patients.length} connected patient(s)`,
      patients
    });
  } catch (error) {
    console.error('Get connected patients error:', error);
    res.status(500).json({ message: 'Server error fetching connected patients', error: error.message });
  }
};
