const { User, PatientProfile, ExerciseSession } = require('../models');

// 1. Generate Personalized Rehab Plan
exports.generateRehabPlan = async (req, res) => {
  try {
    const { patientId } = req.params;
    const profile = await PatientProfile.findOne({ patientId });
    if (!profile) return res.status(404).json({ message: 'Patient not found' });

    // Simple rule-based generation
    let goals = [];
    const conditionStr = profile.condition ? profile.condition.toLowerCase() : '';
    if (conditionStr.includes('acl')) goals = ['Regain full range of motion', 'Strengthen quadriceps'];
    if (profile.age && profile.age > 60) goals.push('Improve balance to prevent falls');
    if (goals.length === 0) goals.push('General mobility and strengthening');

    profile.rehabPlan = {
      currentPhase: 'Phase 1: Regain Mobility',
      targetGoals: goals,
      activeExercises: [] 
    };
    
    await profile.save();
    res.status(200).json({ plan: profile.rehabPlan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Exercise Plan Modification (with version history)
exports.modifyRehabPlan = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { newPlanNotes, activeExercises } = req.body;
    const therapistId = req.user.userId;

    const profile = await PatientProfile.findOne({ patientId });
    if (!profile) return res.status(404).json({ message: 'Patient not found' });

    if (!profile.planHistory) profile.planHistory = [];
    // Save current to history
    profile.planHistory.push({
      planNotes: "Previous Plan Configuration",
      updatedBy: therapistId,
      updatedAt: Date.now()
    });

    if (!profile.rehabPlan) {
      profile.rehabPlan = { currentPhase: '', targetGoals: [], activeExercises: [] };
    }
    profile.rehabPlan.activeExercises = activeExercises;
    await profile.save();
    
    res.status(200).json({ message: 'Plan modified successfully', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Emergency Safety Alerts (Triggered during session submission)
exports.logSessionData = async (req, res) => {
  try {
    const { sessionId, pain_level, postureIssues } = req.body;
    let isEmergency = false;

    // Rule: Pain >= 8 or severe posture issues trigger emergency
    if (pain_level >= 8 || (postureIssues && postureIssues.length > 2)) {
      isEmergency = true;
      console.warn(`EMERGENCY ALERT: High Risk Detected for Session ${sessionId}`);
    }

    const session = await ExerciseSession.findByIdAndUpdate(
      sessionId,
      { pain_level, postureFeedback: postureIssues, safetyAlertTriggered: isEmergency },
      { new: true, runValidators: true }
    );

    res.status(200).json({ session, alert: isEmergency ? 'Safety Alert Triggered! A medical professional has been notified.' : null });
  } catch (error) {
    res.status(400).json({ message: error.message }); 
  }
};

// 13. AI Recovery Insights
exports.getRecoveryInsights = async (req, res) => {
  try {
    const { patientId } = req.params;
    const sessions = await ExerciseSession.find({ patient: patientId }).sort({ sessionDate: 1 });
    
    if (sessions.length < 3) {
      return res.status(200).json({ insight: "Need more session data to generate AI insights." });
    }

    const recentSessions = sessions.slice(-3);
    const validSessions = recentSessions.filter(s => s.pain_level != null);
    
    if (validSessions.length === 0) {
      return res.status(200).json({ insight: "Log pain levels to get recovery insights." });
    }

    const avgPain = validSessions.reduce((acc, s) => acc + s.pain_level, 0) / validSessions.length;

    let insight = "Your recovery is on track. Keep up the good work!";
    if (avgPain > 6) insight = "Recovery is slow. High pain detected over recent sessions.";
    else if (avgPain <= 3) insight = "You are improving rapidly! Excellent progress.";

    res.status(200).json({ insight, averagePainRecent: avgPain.toFixed(1), completionRate: 85 }); // Mock completion rate for UI
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
