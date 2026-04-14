const cron = require('node-cron');
const { PatientProfile, ExerciseSession } = require('../models');

// Run every Sunday at midnight
const initCronJobs = () => {
  cron.schedule('0 0 * * 0', async () => {
    console.log('--- CRON JOB: Running Weekly Progress Reports Aggregation ---');
    try {
      const patients = await PatientProfile.find().populate('assignedPhysiotherapist', 'email');
      
      for (const patient of patients) {
        // Aggregate weekly sessions
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const sessions = await ExerciseSession.find({
          patient: patient.patientId,
          sessionDate: { $gte: weekAgo },
          completionStatus: 'completed'
        });

        // Generate report mock
        console.log(`Generated Weekly Progress Report for Patient ID: ${patient.patientId}`);
        console.log(`Completed Sessions this week: ${sessions.length}`);
        
        // Mock email notification to therapist
        if (patient.assignedPhysiotherapist) {
          console.log(`Sending weekly progress report via email to Physiotherapist: ${patient.assignedPhysiotherapist.email}`);
        }
      }
      console.log('--- CRON JOB: Finished Weekly Progress Reports ---');
    } catch (error) {
      console.error('Weekly Report CRON failed:', error);
    }
  });
};

module.exports = initCronJobs;
