const { User, PatientProfile, Exercise, ExerciseLog, ExerciseSession, DoctorPatientRequest, AssignedExercise } = require('../models');

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
    const { status } = req.query; // Optional: filter by status (pending, in-progress, completed)

    let query = { patientId };
    
    if (status) {
      query.status = status;
    }

    // Get patient's assigned exercises with full exercise details
    const assignedExercises = await AssignedExercise.find(query)
      .populate({
        path: 'exerciseId',
        select: 'name description difficulty duration repetitions category instructions imageUrl videoUrl bodyParts'
      })
      .populate('doctorId', 'firstName lastName email')
      .sort({ assignedDate: -1 });

    res.status(200).json({
      success: true,
      exercises: assignedExercises,
      message: `Found ${assignedExercises.length} exercise(s)`
    });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching exercises', error: error.message });
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
    const { injuryType, rehabilitationPlan, medicalHistory, currentConditions, phoneNumber } = req.body;

    if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== '' && !/^\d{10}$/.test(String(phoneNumber).trim())) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }

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

    if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== '') {
      await User.findByIdAndUpdate(patientId, {
        phone: String(phoneNumber).trim(),
        updatedAt: Date.now()
      });
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

// @route   GET /api/patient/assigned-doctor
// @desc    Get the doctor assigned to this patient
// @access  Private (Patient)
exports.getAssignedDoctor = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const patientProfile = await PatientProfile.findOne({ patientId })
      .populate('assignedDoctor', 'firstName lastName email phone specialization _id');

    if (!patientProfile || !patientProfile.assignedDoctor) {
      return res.status(200).json({
        message: 'No doctor assigned yet',
        doctor: null
      });
    }

    res.status(200).json({
      message: 'Assigned doctor retrieved successfully',
      doctor: patientProfile.assignedDoctor
    });
  } catch (error) {
    console.error('Get assigned doctor error:', error);
    res.status(500).json({ message: 'Server error fetching assigned doctor', error: error.message });
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

// @route   GET /api/patient/diet-plans
// @desc    Get all diet plans assigned to patient
// @access  Private (Patient)
exports.getDietPlans = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const patientProfile = await PatientProfile.findOne({ patientId });
    if (!patientProfile) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let dietPlans = [];
    if (patientProfile.dietPlans && patientProfile.dietPlans.length > 0) {
      const { DietRecommendation } = require('../models');
      dietPlans = await DietRecommendation.find({ _id: { $in: patientProfile.dietPlans } })
        .populate('createdBy', 'firstName lastName email');
    }

    res.status(200).json({
      message: `Found ${dietPlans.length} diet plan(s)`,
      dietPlans
    });
  } catch (error) {
    console.error('Get diet plans error:', error);
    res.status(500).json({ message: 'Server error fetching diet plans', error: error.message });
  }
};

// @route   PUT /api/patient/exercise-session/:sessionId/update-status
// @desc    Update completion status of exercise session
// @access  Private (Patient)
exports.updateExerciseSessionStatus = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { sessionId } = req.params;
    const { completionStatus, painLevel, effortLevel, feedback, repsCompleted } = req.body;

    const session = await ExerciseSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Exercise session not found' });
    }

    if (session.patient.toString() !== patientId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update session
    if (completionStatus) session.completionStatus = completionStatus;
    if (painLevel !== undefined) session.pain_level = painLevel;
    if (effortLevel !== undefined) session.effort_level = effortLevel;
    if (feedback) session.feedback = feedback;
    if (repsCompleted !== undefined) session.repsCompleted = repsCompleted;
    session.updatedAt = Date.now();

    await session.save();
    await session.populate('exercise', 'name description difficulty category');

    res.status(200).json({
      message: 'Exercise session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update exercise session error:', error);
    res.status(500).json({ message: 'Server error updating exercise session', error: error.message });
  }
};

// @route   POST /api/patient/complete-exercise/:assignmentId
// @desc    Mark an assigned exercise as completed
// @access  Private (Patient)
exports.completeExercise = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { assignmentId } = req.params;

    // Find the assigned exercise
    const assignedExercise = await AssignedExercise.findById(assignmentId);
    if (!assignedExercise) {
      return res.status(404).json({ success: false, message: 'Assigned exercise not found' });
    }

    // Verify patient owns this assignment
    if (assignedExercise.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Mark as completed
    assignedExercise.status = 'completed';
    assignedExercise.completedDate = new Date();
    await assignedExercise.save();

    await assignedExercise.populate('exerciseId', 'name description difficulty');

    res.status(200).json({
      success: true,
      message: 'Exercise marked as completed',
      assignedExercise
    });
  } catch (error) {
    console.error('Complete exercise error:', error);
    res.status(500).json({ success: false, message: 'Server error completing exercise', error: error.message });
  }
};

// @route   POST /api/patient/start-exercise/:assignmentId
// @desc    Mark an assigned exercise as in-progress
// @access  Private (Patient)
exports.startExercise = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { assignmentId } = req.params;

    // Find the assigned exercise
    const assignedExercise = await AssignedExercise.findById(assignmentId);
    if (!assignedExercise) {
      return res.status(404).json({ success: false, message: 'Assigned exercise not found' });
    }

    // Verify patient owns this assignment
    if (assignedExercise.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Mark as in-progress
    assignedExercise.status = 'in-progress';
    await assignedExercise.save();

    await assignedExercise.populate('exerciseId', 'name description difficulty');

    res.status(200).json({
      success: true,
      message: 'Exercise started',
      assignedExercise
    });
  } catch (error) {
    console.error('Start exercise error:', error);
    res.status(500).json({ success: false, message: 'Server error starting exercise', error: error.message });
  }
};
