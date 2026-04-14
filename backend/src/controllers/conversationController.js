const { User, PatientProfile, DoctorPatientRequest } = require('../models');

// @route   GET /api/conversations/contacts
// @desc    Get available chat contacts based on role (doctor sees patients, patient sees doctors)
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let contacts = [];

    if (userRole === 'doctor') {
      // Method 1: Check PatientProfile where this doctor is assigned
      const assignedProfiles = await PatientProfile.find({
        $or: [
          { assignedDoctor: userId },
          { assignedDoctorId: userId }
        ]
      }).populate('patientId', 'firstName lastName email profileImage role');

      const fromProfiles = assignedProfiles
        .filter(p => p.patientId)
        .map(p => ({
          _id: p.patientId._id,
          firstName: p.patientId.firstName,
          lastName: p.patientId.lastName,
          email: p.patientId.email,
          profileImage: p.patientId.profileImage,
          role: p.patientId.role || 'patient'
        }));

      // Method 2: Check DoctorPatientRequest with accepted status
      const acceptedRequests = await DoctorPatientRequest.find({
        doctorId: userId,
        status: 'accepted'
      }).populate('patientId', 'firstName lastName email profileImage role');

      const fromRequests = acceptedRequests
        .filter(r => r.patientId)
        .map(r => ({
          _id: r.patientId._id,
          firstName: r.patientId.firstName,
          lastName: r.patientId.lastName,
          email: r.patientId.email,
          profileImage: r.patientId.profileImage,
          role: r.patientId.role || 'patient'
        }));

      contacts = [...fromProfiles, ...fromRequests];
    } else if (userRole === 'patient') {
      // Method 1: Check PatientProfile for assigned doctor
      const profile = await PatientProfile.findOne({ patientId: userId })
        .populate('assignedDoctor', 'firstName lastName email profileImage role specialization')
        .populate('assignedDoctorId', 'firstName lastName email profileImage role specialization');

      if (profile) {
        // Add assigned doctor
        const doctor = profile.assignedDoctor || profile.assignedDoctorId;
        if (doctor && doctor._id) {
          contacts.push({
            _id: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            email: doctor.email,
            profileImage: doctor.profileImage,
            role: doctor.role || 'doctor',
            specialization: doctor.specialization
          });
        }

        // Add connected doctors
        if (profile.connectedDoctors && profile.connectedDoctors.length > 0) {
          const connectedDoctorIds = profile.connectedDoctors.map(cd => cd.doctorId);
          const connectedDoctors = await User.find({
            _id: { $in: connectedDoctorIds }
          }).select('firstName lastName email profileImage role specialization');

          connectedDoctors.forEach(d => {
            contacts.push({
              _id: d._id,
              firstName: d.firstName,
              lastName: d.lastName,
              email: d.email,
              profileImage: d.profileImage,
              role: d.role || 'doctor',
              specialization: d.specialization
            });
          });
        }
      }

      // Method 2: Check DoctorPatientRequest with accepted status
      const acceptedRequests = await DoctorPatientRequest.find({
        patientId: userId,
        status: 'accepted'
      }).populate('doctorId', 'firstName lastName email profileImage role specialization');

      acceptedRequests
        .filter(r => r.doctorId)
        .forEach(r => {
          contacts.push({
            _id: r.doctorId._id,
            firstName: r.doctorId.firstName,
            lastName: r.doctorId.lastName,
            email: r.doctorId.email,
            profileImage: r.doctorId.profileImage,
            role: r.doctorId.role || 'doctor',
            specialization: r.doctorId.specialization
          });
        });
    } else if (userRole === 'physiotherapist') {
      // Physiotherapist sees patients assigned to them
      const assignedProfiles = await PatientProfile.find({
        assignedPhysiotherapist: userId
      }).populate('patientId', 'firstName lastName email profileImage role');

      contacts = assignedProfiles
        .filter(p => p.patientId)
        .map(p => ({
          _id: p.patientId._id,
          firstName: p.patientId.firstName,
          lastName: p.patientId.lastName,
          email: p.patientId.email,
          profileImage: p.patientId.profileImage,
          role: p.patientId.role || 'patient'
        }));
    }

    // Remove duplicates by _id
    const uniqueContacts = [];
    const seenIds = new Set();
    for (const contact of contacts) {
      const id = contact._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueContacts.push(contact);
      }
    }

    res.status(200).json({
      success: true,
      contacts: uniqueContacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contacts',
      error: error.message
    });
  }
};
