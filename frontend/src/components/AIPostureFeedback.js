import React, { useState, useEffect, useRef } from 'react';

// Simulated Pose estimation / feedback UI overlay
const AIPostureFeedback = ({ isTracking, setFeedbackList }) => {
  const [feedback, setFeedback] = useState('Stand in front of the camera.');
  const videoRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isTracking) {
      setFeedback('Tracking your movements...');
      
      // Simulate receiving feedback from TensorFlow.js / PoseNet model
      interval = setInterval(() => {
        const mockFeedbacks = [
          'Keep your back straight.',
          'Lower your shoulders.',
          'Good posture! Hold it.',
          'Align your hips properly.'
        ];
        const randomFeedback = mockFeedbacks[Math.floor(Math.random() * mockFeedbacks.length)];
        setFeedback(randomFeedback);
        
        // Expose issues directly if they are bad form
        if (randomFeedback.includes('straight') || randomFeedback.includes('Lower') || randomFeedback.includes('Align')) {
          setFeedbackList(prev => [...prev, randomFeedback]);
        }

      }, 5000);
    } else {
      setFeedback('Camera active. Ready to start tracking.');
    }

    return () => clearInterval(interval);
  }, [isTracking, setFeedbackList]);

  return (
    <div className="relative mt-4 bg-gray-900 rounded-lg overflow-hidden w-full h-64 flex items-center justify-center shadow-lg border-2 border-primary-light">
      {/* Simulated camera feed */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gray-500 font-semibold uppercase tracking-widest text-sm">[Camera Feed Active]</span>
      </div>

      {/* AI Posture Feedback Overlay */}
      <div className="absolute bottom-4 left-0 w-full px-4">
        <div className={`py-2 px-4 rounded-full text-center text-sm font-semibold transition-colors duration-500 shadow-xl ${
          feedback.includes('Good') ? 'bg-green-500 bg-opacity-90 text-white' : 
          feedback.includes('Tracking') ? 'bg-blue-500 bg-opacity-90 text-white' :
          'bg-yellow-500 bg-opacity-90 text-gray-900'
        }`}>
          🤖 AI Posture Analysis: {feedback}
        </div>
      </div>
    </div>
  );
};

export default AIPostureFeedback;