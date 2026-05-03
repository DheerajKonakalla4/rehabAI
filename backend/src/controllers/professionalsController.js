const Professional = require('../models/Professional');
const User = require('../models/User');

// Get all professionals
exports.getAllProfessionals = async (req, res) => {
  try {
    const { specialization, isOnline } = req.query;
    
    let query = { isActive: true, isVerified: true };
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    if (isOnline === 'true') {
      query.online = true;
    }

    const professionals = await Professional.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort({ rating: -1 });

    res.json({
      success: true,
      professionals: professionals.map(prof => ({
        _id: prof._id,
        name: prof.name,
        specialization: prof.specialization,
        subSpecialty: prof.subSpecialty,
        bio: prof.bio,
        rating: prof.rating,
        reviews: prof.reviews,
        services: prof.services,
        nextAvailable: prof.nextAvailable,
        online: prof.online,
        responseTime: prof.responseTime
      }))
    });
  } catch (error) {
    console.error('Error fetching professionals:', error);
    res.status(500).json({ success: false, message: 'Error fetching professionals', error: error.message });
  }
};

// Get professional by ID
exports.getProfessionalById = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone');

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    res.json({ success: true, professional });
  } catch (error) {
    console.error('Error fetching professional:', error);
    res.status(500).json({ success: false, message: 'Error fetching professional', error: error.message });
  }
};

// Get professionals by specialization
exports.getProfessionalsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;

    const professionals = await Professional.find({
      specialization,
      isActive: true,
      isVerified: true
    })
      .populate('userId', 'firstName lastName email')
      .sort({ rating: -1 });

    res.json({ success: true, professionals });
  } catch (error) {
    console.error('Error fetching professionals:', error);
    res.status(500).json({ success: false, message: 'Error fetching professionals', error: error.message });
  }
};

// Create professional profile
exports.createProfessional = async (req, res) => {
  try {
    const {
      name,
      specialization,
      subSpecialty,
      bio,
      services,
      availability,
      nextAvailable,
      responseTime
    } = req.body;

    const userId = req.user.userId;

    // Check if professional profile already exists
    const existingProfile = await Professional.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ success: false, message: 'Professional profile already exists' });
    }

    const professional = new Professional({
      userId,
      name,
      specialization,
      subSpecialty,
      bio,
      services,
      availability,
      nextAvailable,
      responseTime,
      rating: 0,
      reviews: 0
    });

    await professional.save();
    res.status(201).json({ success: true, message: 'Professional profile created', professional });
  } catch (error) {
    console.error('Error creating professional:', error);
    res.status(500).json({ success: false, message: 'Error creating professional', error: error.message });
  }
};

// Update professional profile
exports.updateProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const professional = await Professional.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    res.json({ success: true, message: 'Professional updated successfully', professional });
  } catch (error) {
    console.error('Error updating professional:', error);
    res.status(500).json({ success: false, message: 'Error updating professional', error: error.message });
  }
};

// Book appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { appointmentDate, notes } = req.body;
    const patientId = req.user.userId;

    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    professional.appointments.push({
      patientId,
      appointmentDate: new Date(appointmentDate),
      status: 'scheduled',
      notes
    });

    await professional.save();

    res.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: professional.appointments[professional.appointments.length - 1]
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, message: 'Error booking appointment', error: error.message });
  }
};

// Get professional's appointments
exports.getProfessionalAppointments = async (req, res) => {
  try {
    const { professionalId } = req.params;

    const professional = await Professional.findById(professionalId)
      .select('appointments')
      .populate('appointments.patientId', 'firstName lastName');

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    res.json({ success: true, appointments: professional.appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Error fetching appointments', error: error.message });
  }
};

// Set online status
exports.setOnlineStatus = async (req, res) => {
  try {
    const { online } = req.body;
    const userId = req.user.userId;

    const professional = await Professional.findOneAndUpdate(
      { userId },
      { online, updatedAt: Date.now() },
      { new: true }
    );

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional profile not found' });
    }

    res.json({ success: true, message: `Status updated to ${online ? 'online' : 'offline'}`, professional });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
};
