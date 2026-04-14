const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.getAppointments = async (req, res) => {
  try {
    const roleMap = {
      patient: 'patient',
      doctor: 'professional',
      physiotherapist: 'professional'
    };

    const query = { [roleMap[req.user.role]]: req.user.userId };
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email')
      .populate('professional', 'firstName lastName email specialization')
      .sort({ date: 1, time: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { patientId, professionalId, date, time, type, notes } = req.body;
    
    // Default to self if not provided and role permits
    const patient = patientId || (req.user.role === 'patient' ? req.user.userId : null);
    const professional = professionalId || (['doctor', 'physiotherapist'].includes(req.user.role) ? req.user.userId : null);

    if (!patient || !professional) {
      return res.status(400).json({ message: 'Both patient and professional are required' });
    }

    const appointment = new Appointment({
      patient,
      professional,
      date,
      time,
      type,
      notes,
      status: 'upcoming'
    });

    await appointment.save();
    
    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName')
      .populate('professional', 'firstName lastName');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
};
