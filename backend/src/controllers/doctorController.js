const { User, PatientProfile, ExerciseLog, ExerciseSession, DoctorPatientRequest, Exercise, AssignedExercise, DietRecommendation } = require('../models');

const isEncryptedPhoneBlob = (value) => typeof value === 'string' && /^[a-f0-9]{16,}:[a-f0-9]+$/i.test(value.trim());

const sanitizePhoneValue = (value) => {
  if (!value) return '';
  const normalized = String(value).trim();
  return isEncryptedPhoneBlob(normalized) ? '' : normalized;
};

// @route   GET /api/doctor/all-patients
// @desc    Get all patients in system (for connection)
// @access  Private (Doctor)
exports.getAllPatients = async (req, res) => {
  try {
    // Get all patient users
    const allPatients = await User.find({ role: 'patient' })
      .select('_id firstName lastName email phone age uniqueId')
      .sort({ firstName: 1 });

    if (!allPatients || allPatients.length === 0) {
      return res.status(200).json({ 
        message: 'No patients available',
        patients: [] 
      });
    }

    const sanitizedPatients = allPatients.map((patient) => {
      const patientObject = patient.toObject();
      patientObject.phone = sanitizePhoneValue(patientObject.phone);
      return patientObject;
    });

    res.status(200).json({ 
      message: `Found ${allPatients.length} patient(s)`,
      patients: sanitizedPatients
    });
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ message: 'Server error fetching patients', error: error.message });
  }
};

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

    const patientUserIds = patients
      .map((profile) => profile?.patientId?._id)
      .filter(Boolean);

    const [assignedExercises, logs] = await Promise.all([
      AssignedExercise.find({ patientId: { $in: patientUserIds } }),
      ExerciseLog.find({ patientId: { $in: patientUserIds } })
    ]);

    const patientMetricsMap = new Map();
    patientUserIds.forEach((userId) => {
      patientMetricsMap.set(String(userId), {
        totalSessions: 0,
        completedSessions: 0,
        pendingSessions: 0,
        averagePainLevel: 0,
        completionRate: 0
      });
    });

    assignedExercises.forEach((assignment) => {
      const key = String(assignment.patientId);
      const metrics = patientMetricsMap.get(key);
      if (!metrics) return;

      metrics.totalSessions += 1;
      if (assignment.status === 'completed') {
        metrics.completedSessions += 1;
      }
      if (assignment.status === 'pending') {
        metrics.pendingSessions += 1;
      }
    });

    const painByPatient = new Map();
    logs.forEach((log) => {
      const key = String(log.patientId);
      const painLevel = Number(log.painLevel);
      if (!Number.isFinite(painLevel)) return;

      const existing = painByPatient.get(key) || { total: 0, count: 0 };
      existing.total += painLevel;
      existing.count += 1;
      painByPatient.set(key, existing);
    });

    patientMetricsMap.forEach((metrics, key) => {
      const painStats = painByPatient.get(key);
      metrics.averagePainLevel = painStats?.count ? Number((painStats.total / painStats.count).toFixed(2)) : 0;
      metrics.completionRate = metrics.totalSessions
        ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100)
        : 0;
    });

    const sanitizedPatients = patients.map((profile) => {
      const profileObject = profile.toObject();
      if (profileObject.patientId) {
        profileObject.patientId.phone = sanitizePhoneValue(profileObject.patientId.phone);
        profileObject.metrics = patientMetricsMap.get(String(profileObject.patientId._id)) || {
          totalSessions: 0,
          completedSessions: 0,
          pendingSessions: 0,
          averagePainLevel: 0,
          completionRate: 0
        };
      }
      return profileObject;
    });

    res.status(200).json({ 
      message: `Found ${patients.length} assigned patient(s)`,
      patients: sanitizedPatients
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

    const profileObject = patientProfile.toObject();
    if (profileObject.patientId) {
      profileObject.patientId.phone = sanitizePhoneValue(profileObject.patientId.phone);
    }

    res.status(200).json({
      patientProfile: profileObject,
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
// @desc    Directly assign patient to doctor (no request needed)
// @access  Private (Doctor)
exports.assignPatient = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Verify patient exists
    const patientUser = await User.findById(patientId);
    if (!patientUser || patientUser.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify doctor exists
    const doctorUser = await User.findById(doctorId);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(403).json({ message: 'You are not authorized as a doctor' });
    }

    // Get or create patient profile
    let patientProfile = await PatientProfile.findOne({ patientId });
    
    if (!patientProfile) {
      patientProfile = await PatientProfile.create({
        patientId,
        assignedDoctor: doctorId,
        assignedDoctorId: doctorId
      });
    } else {
      // Update existing profile with doctor assignment
      patientProfile.assignedDoctor = doctorId;
      patientProfile.assignedDoctorId = doctorId;
      await patientProfile.save();
    }

    await patientProfile.populate('patientId', 'firstName lastName email phone age');

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

// @route   POST /api/doctor/assign-exercise
// @desc    Assign exercise to a connected patient
// @access  Private (Doctor)
// @route   POST /api/doctor/assign-exercise
// @desc    Assign exercise to patient
// @access  Private (Doctor)
exports.assignExercise = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { patientId, exerciseId, notes, frequency, sets, reps, duration } = req.body;

    if (!patientId || !exerciseId) {
      return res.status(400).json({ message: 'Patient ID and Exercise ID are required' });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify exercise exists
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Verify doctor is assigned to this patient
    const patientProfile = await PatientProfile.findOne({
      patientId,
      assignedDoctorId: doctorId
    });
    
    if (!patientProfile) {
      return res.status(403).json({ message: 'This patient is not assigned to you' });
    }

    // Check if exercise is already assigned
    const existingAssignment = await AssignedExercise.findOne({
      patientId,
      exerciseId,
      status: { $ne: 'completed' }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'This exercise is already assigned to the patient' });
    }

    // Create assigned exercise record
    const assignedExercise = await AssignedExercise.create({
      patientId,
      doctorId,
      exerciseId,
      notes: notes || '',
      frequency: frequency || 'daily',
      sets: sets || 1,
      reps: reps || null,
      duration: duration || null
    });

    // Populate exercise details
    await assignedExercise.populate('exerciseId', 'name description category difficulty bodyParts duration instructions');
    await assignedExercise.populate('patientId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Exercise assigned successfully',
      assignedExercise
    });
  } catch (error) {
    console.error('Assign exercise error:', error);
    res.status(500).json({ success: false, message: 'Server error assigning exercise', error: error.message });
  }
};

// @route   POST /api/doctor/add-diet-plan
// @desc    Add diet plan to a patient
// @access  Private (Doctor)
exports.addDietPlan = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { patientId, injuryType, foods, description } = req.body;

    if (!patientId || !injuryType) {
      return res.status(400).json({ message: 'Patient ID and Injury Type are required' });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify doctor is assigned to this patient
    const patientProfile = await PatientProfile.findOne({ patientId });
    if (!patientProfile || (patientProfile.assignedDoctor?.toString() !== doctorId && patientProfile.assignedDoctorId?.toString() !== doctorId)) {
      return res.status(403).json({ message: 'Patient is not assigned to you' });
    }

    // Create diet recommendation
    const dietRecommendation = await DietRecommendation.create({
      patientId,
      injuryType,
      foods: foods || [],
      description,
      createdBy: doctorId,
      isActive: true
    });

    // Add diet plan reference to patient profile
    if (!patientProfile.dietPlans) {
      patientProfile.dietPlans = [];
    }
    patientProfile.dietPlans.push(dietRecommendation._id);
    await patientProfile.save();

    res.status(201).json({
      message: 'Diet plan added successfully',
      dietPlan: dietRecommendation
    });
  } catch (error) {
    console.error('Add diet plan error:', error);
    res.status(500).json({ message: 'Server error adding diet plan', error: error.message });
  }
};

// @route   GET /api/doctor/patient/:patientId/exercises
// @desc    Get exercises assigned to a patient
// @access  Private (Doctor)
exports.getPatientExercises = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const exercises = await ExerciseSession.find({ patient: patientId })
      .populate('exercise', 'name description difficulty category duration repetitions instructions imageUrl videoUrl')
      .sort({ sessionDate: -1 });

    res.status(200).json({
      message: `Found ${exercises.length} exercise(s)`,
      exercises
    });
  } catch (error) {
    console.error('Get patient exercises error:', error);
    res.status(500).json({ message: 'Server error fetching patient exercises', error: error.message });
  }
};

// @route   GET /api/doctor/patient/:patientId/diets
// @desc    Get diet plans for a patient
// @access  Private (Doctor)
exports.getPatientDietPlans = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientProfile = await PatientProfile.findOne({ patientId });
    
    let dietPlans = [];
    if (patientProfile && patientProfile.dietPlans && patientProfile.dietPlans.length > 0) {
      dietPlans = await DietRecommendation.find({ _id: { $in: patientProfile.dietPlans } });
    }

    res.status(200).json({
      message: `Found ${dietPlans.length} diet plan(s)`,
      dietPlans
    });
  } catch (error) {
    console.error('Get patient diet plans error:', error);
    res.status(500).json({ message: 'Server error fetching diet plans', error: error.message });
  }
};
