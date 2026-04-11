const cron = require('node-cron');
const User = require('../models/User');
const ExerciseSession = require('../models/ExerciseSession');

// 6. Daily Exercise Reminders
const startCronJobs = () => {
  // Run everyday at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      const pendingSessions = await ExerciseSession.find({ completionStatus: 'pending' })
        .populate('patient', 'email firstName');

      pendingSessions.forEach(session => {
        if (session.patient) {
          // Simulate notification sending (Email/Push)
          console.log(`[CRON EXERCISE REMINDER] Notification sent to ${session.patient.email}: Hi ${session.patient.firstName}, you have exercises pending today!`);
        }
      });
    } catch (error) {
      console.error('[CRON Error] Failed to process daily reminders', error);
    }
  });

  console.log('Cron jobs initialized.');
};

module.exports = startCronJobs;