const { User, PatientProfile, Exercise, ExerciseLog, ExerciseSession, DoctorPatientRequest } = require('../models');

// @route   GET /api/patient/dashboard
// @desc    Get patient dashboard data
// @access  Private (Patient)
exports.getDashboard = async (req, res) => {
  try {
    const patientId = req.user.userId;

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ patientId })
      .populate('assignedPhysiotherapist', 'firstName lastName email phone')
      .populate('assignedDoctor', 'firstName lastName email phone');

    if (!patientProfile) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Get recent exercise logs
    const recentLogs = await ExerciseLog.find({ patientId })
      .populate('exerciseId', 'name difficulty')
      .sort({ date: -1 })
      .limit(5);

    // Get exercise sessions count
    const pendingSessions = await ExerciseSession.countDocuments({
      patient: patientId,
      completionStatus: 'pending'
    });

    const completedSessions = await ExerciseSession.countDocuments({
      patient: patientId,
      completionStatus: 'completed'
    });

    res.status(200).json({
      patientProfile,
      recentLogs,
      stats: {
        pendingSessions,
        completedSessions,
        totalExercisesLogged: recentLogs.length
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard', error: error.message });
  }
};

// @route   GET /api/patient/exercises
// @desc    Get assigned exercises for patient
// @access  Private (Patient)
exports.getExercises = async (req, res) => {
  try {
    const patientId = req.user.userId;

    // Get patient's assigned exercises through sessions
    const exercises = await ExerciseSession.find({ patient: patientId })
      .populate({
        path: 'exercise',
        select: 'name description difficulty duration repetitions category instructions imageUrl videoUrl'
      })
      .select('exercise sessionDate completionStatus');

    // Also get all active exercises if no specific ones are assigned
    if (exercises.length === 0) {
      const allExercises = await Exercise.find({ isActive: true })
        .select('name description difficulty duration repetitions category instructions imageUrl videoUrl');
      return res.status(200).json({ exercises: allExercises });
    }

    res.status(200).json({ exercises });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ message: 'Server error fetching exercises', error: error.message });
  }
};

// @route   POST /api/patient/exercise-log
// @desc    Log completed exercise
// @access  Private (Patient)
exports.logExercise = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { exerciseId, completedSets, painLevel, notes } = req.body;

    // Validate input
    if (!exerciseId || completedSets === undefined) {
      return res.status(400).json({ message: 'Exercise ID and completed sets are required' });
    }

    // Check if exercise exists
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Create exercise log
    const exerciseLog = await ExerciseLog.create({
      patientId,
      exerciseId,
      completedSets,
      painLevel: painLevel || undefined,
      notes,
      date: new Date()
    });

    res.status(201).json({
      message: 'Exercise logged successfully',
      exerciseLog: await exerciseLog.populate('exerciseId', 'name difficulty')
    });
  } catch (error) {
    console.error('Log exercise error:', error);
    res.status(500).json({ message: 'Server error logging exercise', error: error.message });
  }
};

// @route   GET /api/patient/exercise-logs
// @desc    Get patient's exercise logs
// @access  Private (Patient)
exports.getExerciseLogs = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { startDate, endDate } = req.query;

    let query = { patientId };

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await ExerciseLog.find(query)
      .populate('exerciseId', 'name difficulty category')
      .sort({ date: -1 });

    res.status(200).json({ logs });
  } catch (error) {
    console.error('Get exercise logs error:', error);
    res.status(500).json({ message: 'Server error fetching exercise logs', error: error.message });
  }
};

// @route   PUT /api/patient/profile
// @desc    Update patient profile
// @access  Private (Patient)
exports.updateProfile = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { injuryType, rehabilitationPlan, medicalHistory, currentConditions } = req.body;

    const patientProfile = await PatientProfile.findOneAndUpdate(
      { patientId },
      {
        injuryType,
        rehabilitationPlan,
        medicalHistory,
        currentConditions,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('assignedPhysiotherapist assignedDoctor', 'firstName lastName email');

    if (!patientProfile) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      patientProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

// @route   GET /api/patient/incoming-requests
// @desc    Get all incoming connection requests from doctors
// @access  Private (Patient)
exports.getIncomingRequests = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const requests = await DoctorPatientRequest.find({
      patientId,
      status: 'pending'
    }).populate('doctorId', 'firstName lastName email phone specialization uniqueId');

    res.status(200).json({
      message: `Found ${requests.length} pending request(s)`,
      requests
    });
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ message: 'Server error fetching incoming requests', error: error.message });
  }
};

// @route   PUT /api/patient/accept-request/:requestId
// @desc    Accept a doctor's connection request
// @access  Private (Patient)
exports.acceptRequest = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { requestId } = req.params;

    // Find and verify the request
    const request = await DoctorPatientRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    // Update request status
    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save();

    // Add doctor to patient's connected doctors
    await PatientProfile.findOneAndUpdate(
      { patientId },
      {
        $addToSet: {
          connectedDoctors: {
            doctorId: request.doctorId,
            connectedAt: new Date()
          }
        },
        assignedDoctor: request.doctorId
      }
    );

    const populatedRequest = await request.populate('doctorId', 'firstName lastName email phone specialization uniqueId');

    res.status(200).json({
      message: 'Request accepted successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error accepting request', error: error.message });
  }
};

// @route   PUT /api/patient/reject-request/:requestId
// @desc    Reject a doctor's connection request
// @access  Private (Patient)
exports.rejectRequest = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    // Find and verify the request
    const request = await DoctorPatientRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    // Update request status
    request.status = 'rejected';
    request.rejectionReason = rejectionReason || null;
    await request.save();

    const populatedRequest = await request.populate('doctorId', 'firstName lastName email specialization');

    res.status(200).json({
      message: 'Request rejected successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error rejecting request', error: error.message });
  }
};

// @route   GET /api/patient/connected-doctors
// @desc    Get all connected doctors (accepted requests)
// @access  Private (Patient)
exports.getConnectedDoctors = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const acceptedRequests = await DoctorPatientRequest.find({
      patientId,
      status: 'accepted'
    }).populate('doctorId', 'firstName lastName email phone specialization uniqueId');

    const doctors = acceptedRequests.map(req => ({
      _id: req._id,
      userId: req.doctorId._id,
      firstName: req.doctorId.firstName,
      lastName: req.doctorId.lastName,
      email: req.doctorId.email,
      phone: req.doctorId.phone,
      specialization: req.doctorId.specialization,
      uniqueId: req.doctorId.uniqueId,
      connectedAt: req.acceptedAt
    }));

    res.status(200).json({
      message: `Found ${doctors.length} connected doctor(s)`,
      doctors
    });
  } catch (error) {
    console.error('Get connected doctors error:', error);
    res.status(500).json({ message: 'Server error fetching connected doctors', error: error.message });
  }
};
