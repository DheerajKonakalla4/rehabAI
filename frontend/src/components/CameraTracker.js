import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// ──────────────────────────────────────────
// Angle calculation between 3 keypoints
// ──────────────────────────────────────────
function calculateAngle(a, b, c) {
  // a, b, c are {x, y} — b is the vertex
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// ──────────────────────────────────────────
// Exercise configurations
// ──────────────────────────────────────────
const EXERCISE_CONFIGS = {
  squats: {
    name: 'Squats',
    joints: { a: 'left_hip', b: 'left_knee', c: 'left_ankle' },
    downAngle: 90,
    upAngle: 160,
    formCheck: (keypoints) => {
      const knee = keypoints.find(k => k.name === 'left_knee');
      const ankle = keypoints.find(k => k.name === 'left_ankle');
      if (knee && ankle && knee.score > 0.3 && ankle.score > 0.3) {
        if (knee.x > ankle.x + 40) {
          return { good: false, msg: '⚠️ Knees going too far forward! Keep them behind toes.' };
        }
      }
      return { good: true, msg: '✅ Great form! Keep your back straight.' };
    }
  },
  bicep_curls: {
    name: 'Bicep Curls',
    joints: { a: 'left_shoulder', b: 'left_elbow', c: 'left_wrist' },
    downAngle: 160,
    upAngle: 40,
    formCheck: (keypoints) => {
      const shoulder = keypoints.find(k => k.name === 'left_shoulder');
      const elbow = keypoints.find(k => k.name === 'left_elbow');
      if (shoulder && elbow && shoulder.score > 0.3 && elbow.score > 0.3) {
        if (Math.abs(elbow.x - shoulder.x) > 60) {
          return { good: false, msg: '⚠️ Keep your elbow close to your body!' };
        }
      }
      return { good: true, msg: '✅ Good curl! Full range of motion.' };
    }
  },
  shoulder_press: {
    name: 'Shoulder Press',
    joints: { a: 'left_hip', b: 'left_shoulder', c: 'left_elbow' },
    downAngle: 80,
    upAngle: 170,
    formCheck: (keypoints) => {
      const shoulder = keypoints.find(k => k.name === 'left_shoulder');
      const hip = keypoints.find(k => k.name === 'left_hip');
      if (shoulder && hip && shoulder.score > 0.3 && hip.score > 0.3) {
        if (Math.abs(shoulder.x - hip.x) > 50) {
          return { good: false, msg: '⚠️ Keep core tight, avoid leaning!' };
        }
      }
      return { good: true, msg: '✅ Excellent press! Fully extend arms.' };
    }
  },
  leg_raises: {
    name: 'Leg Raises',
    joints: { a: 'left_shoulder', b: 'left_hip', c: 'left_knee' },
    downAngle: 170,
    upAngle: 90,
    formCheck: () => ({ good: true, msg: '✅ Control the movement. Don\'t swing!' })
  },
  arm_raises: {
    name: 'Arm Raises',
    joints: { a: 'left_hip', b: 'left_shoulder', c: 'left_wrist' },
    downAngle: 30,
    upAngle: 160,
    formCheck: (keypoints) => {
      const wrist = keypoints.find(k => k.name === 'left_wrist');
      const shoulder = keypoints.find(k => k.name === 'left_shoulder');
      if (wrist && shoulder && wrist.score > 0.3 && shoulder.score > 0.3) {
        if (wrist.y > shoulder.y + 20) {
          return { good: false, msg: '⚠️ Raise arm higher! Above shoulder level.' };
        }
      }
      return { good: true, msg: '✅ Great range of motion!' };
    }
  },
  knee_extensions: {
    name: 'Knee Extensions',
    joints: { a: 'left_hip', b: 'left_knee', c: 'left_ankle' },
    downAngle: 80,
    upAngle: 165,
    formCheck: () => ({ good: true, msg: '✅ Extend fully and hold briefly!' })
  },
  shoulder_rotation: {
    name: 'Shoulder Rotation',
    joints: { a: 'left_shoulder', b: 'left_elbow', c: 'left_wrist' },
    downAngle: 60,
    upAngle: 150,
    isArmExercise: true,
    formCheck: (keypoints) => {
      const elbow = keypoints.find(k => k.name === 'left_elbow');
      const shoulder = keypoints.find(k => k.name === 'left_shoulder');
      if (elbow && shoulder && elbow.score > 0.3 && shoulder.score > 0.3) {
        if (Math.abs(elbow.y - shoulder.y) > 50) {
          return { good: false, msg: '⚠️ Try to keep your elbow level with your shoulder.' };
        }
      }
      return { good: true, msg: '✅ Good rotation! Keep it controlled.' };
    }
  }
};

// Map exercise names/categories to config keys
function getExerciseConfig(exerciseType) {
  if (!exerciseType) return EXERCISE_CONFIGS.squats;
  const key = exerciseType.toLowerCase().replace(/[\s-]+/g, '_');
  
  // Direct match
  if (EXERCISE_CONFIGS[key]) return EXERCISE_CONFIGS[key];
  
  // Partial match
  for (const [configKey, config] of Object.entries(EXERCISE_CONFIGS)) {
    if (key.includes(configKey) || configKey.includes(key)) return config;
  }
  
  // Category-based fallback
  if (key.includes('arm') || key.includes('curl') || key.includes('bicep')) return EXERCISE_CONFIGS.bicep_curls;
  if (key.includes('shoulder') || key.includes('press')) return EXERCISE_CONFIGS.shoulder_press;
  if (key.includes('leg') || key.includes('raise')) return EXERCISE_CONFIGS.leg_raises;
  if (key.includes('knee') || key.includes('extension')) return EXERCISE_CONFIGS.knee_extensions;
  if (key.includes('squat') || key.includes('lower')) return EXERCISE_CONFIGS.squats;
  if (key.includes('rotation') || key.includes('rotate')) return EXERCISE_CONFIGS.shoulder_rotation;
  
  return EXERCISE_CONFIGS.squats; // default
}

const CameraTracker = ({ isTracking, exerciseType, setRepCount, setFeedback, setFormQuality, setCurrentAngle }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const stateRef = useRef({
    phase: 'up', // 'up' or 'down'
    reps: 0,
    goodFormCount: 0,
    totalFormChecks: 0,
    lastAngle: 0,
    lastUpdate: 0 // For throttling state updates
  });

  const requestRef = useRef();
  const isProcessingRef = useRef(false);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const lastDetectionTimeRef = useRef(0);
  const FPS_CAP = 10; // 10 FPS detection — balanced for performance and accuracy
  const MS_PER_FRAME = 1000 / FPS_CAP;

  // Reset state when exercise changes or tracking starts
  useEffect(() => {
    stateRef.current = {
      phase: 'up',
      reps: 0,
      goodFormCount: 0,
      totalFormChecks: 0,
      lastAngle: 0
    };
    if (setRepCount) setRepCount(0);
    if (setFormQuality) setFormQuality(100);
  }, [exerciseType, isTracking, setRepCount, setFormQuality]);

  // Initialize the pose detection model
  useEffect(() => {
    let active = true;
    const initModel = async () => {
      try {
        await tf.ready();
        // Force WebGL backend for better performance
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl');
        }
        
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true
        };
        const newDetector = await poseDetection.createDetector(model, detectorConfig);
        if (active) {
          setDetector(newDetector);
          console.log('Pose detection model loaded with backend:', tf.getBackend());
        } else {
          newDetector.dispose();
        }
      } catch (err) {
        console.error('Failed to load detector:', err);
      }
    };
    initModel();
    return () => {
      active = false;
    };
  }, []);

  // Cleanup detector on unmount
  useEffect(() => {
    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, [detector]);

  const config = getExerciseConfig(exerciseType);

  const drawKeypoints = useCallback((keypoints, ctx, formGood) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = formGood ? '#22c55e' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, []);

  const drawSkeleton = useCallback((keypoints, ctx, formGood) => {
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    const color = formGood ? '#22c55e' : '#ef4444';
    
    adjacentPairs.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      if (kp1.score > 0.3 && kp2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  }, []);

  const drawAngleArc = useCallback((keypoints, ctx) => {
    const a = keypoints.find(k => k.name === config.joints.a);
    const b = keypoints.find(k => k.name === config.joints.b);
    const c = keypoints.find(k => k.name === config.joints.c);
    
    if (a && b && c && a.score > 0.3 && b.score > 0.3 && c.score > 0.3) {
      const angle = calculateAngle(a, b, c);
      
      // Draw angle arc at the vertex
      ctx.beginPath();
      ctx.arc(b.x, b.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw angle text
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(`${Math.round(angle)}°`, b.x + 24, b.y - 8);
      ctx.fillText(`${Math.round(angle)}°`, b.x + 24, b.y - 8);
    }
  }, [config]);

  const drawOverlay = useCallback((ctx, width, height, state) => {
    // Save the mirrored state and reset transform for text
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to normal (un-mirror)
    
    // Semi-transparent overlay panel at top-right
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    const panelWidth = 200;
    const panelHeight = 90;
    const panelX = width - panelWidth - 10;
    const panelY = 10;
    
    // Rounded rect
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    
    // Stats text
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Reps: ${state.reps}`, panelX + 12, panelY + 26);
    
    ctx.font = '13px Arial';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(`Angle: ${Math.round(state.lastAngle)}°`, panelX + 12, panelY + 48);
    
    const quality = state.totalFormChecks > 0
      ? Math.round((state.goodFormCount / state.totalFormChecks) * 100)
      : 100;
    ctx.fillStyle = quality >= 70 ? '#86efac' : '#fca5a5';
    ctx.fillText(`Form: ${quality}%`, panelX + 12, panelY + 68);
    
    // Exercise name label at top-left
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 180, 34, 10);
    ctx.fill();
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(`📐 ${config.name}`, 22, 32);
    
    ctx.restore(); // Restore mirrored state
  }, [config]);

  const detectPose = useCallback(async () => {
    if (
      !webcamRef.current?.video || 
      webcamRef.current.video.readyState !== 4 || 
      !detector || 
      !canvasRef.current
    ) return;

    const video = webcamRef.current.video;
    const { videoWidth, videoHeight } = video;

    // Only update dimensions if they changed
    if (dimensionsRef.current.width !== videoWidth || dimensionsRef.current.height !== videoHeight) {
      video.width = videoWidth;
      video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      dimensionsRef.current = { width: videoWidth, height: videoHeight };
    }

    const poses = await detector.estimatePoses(video);

    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    // Mirror the canvas context to match the mirrored webcam
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-videoWidth, 0);

    if (poses && poses.length > 0) {
      const keypoints = poses[0].keypoints;
      const a = keypoints.find(k => k.name === config.joints.a);
      const b = keypoints.find(k => k.name === config.joints.b);
      const c = keypoints.find(k => k.name === config.joints.c);

      let formGood = true;
      const now = Date.now();
      const shouldUpdateUI = now - stateRef.current.lastUpdate > 100;

      if (a && b && c && a.score > 0.3 && b.score > 0.3 && c.score > 0.3) {
        const angle = calculateAngle(a, b, c);
        stateRef.current.lastAngle = angle;
        
        if (shouldUpdateUI && setCurrentAngle) {
          setCurrentAngle(Math.round(angle));
        }

        const { downAngle, upAngle } = config;
        const isDown = (downAngle < upAngle) ? angle >= upAngle : angle <= downAngle;
        const isUp = (downAngle < upAngle) ? angle <= downAngle : angle >= upAngle;

        if (stateRef.current.phase === 'up' && isDown) {
          stateRef.current.phase = 'down';
        } else if (stateRef.current.phase === 'down' && isUp) {
          stateRef.current.phase = 'up';
          stateRef.current.reps += 1;
          if (setRepCount) setRepCount(stateRef.current.reps);
        }

        const formResult = config.formCheck(keypoints);
        formGood = formResult.good;
        stateRef.current.totalFormChecks += 1;
        if (formGood) stateRef.current.goodFormCount += 1;

        if (shouldUpdateUI) {
          if (setFormQuality) {
            const quality = stateRef.current.totalFormChecks > 0
              ? Math.round((stateRef.current.goodFormCount / stateRef.current.totalFormChecks) * 100)
              : 100;
            setFormQuality(quality);
          }
          if (setFeedback) setFeedback(formResult.msg);
          stateRef.current.lastUpdate = now;
        }
      } else {
        if (shouldUpdateUI && setFeedback) {
          setFeedback(config.isArmExercise 
            ? '📷 Ensure your shoulder, elbow, and wrist are visible.' 
            : '📷 Position yourself so your full body is visible.');
          stateRef.current.lastUpdate = now;
        }
      }

      // Draw skeleton and keypoints (in mirrored context)
      drawSkeleton(keypoints, ctx, formGood);
      drawKeypoints(keypoints, ctx, formGood);
      drawAngleArc(keypoints, ctx);
      
      // Restore context before drawing text overlay (so text is not mirrored)
      ctx.restore();
      drawOverlay(ctx, videoWidth, videoHeight, stateRef.current);
    } else {
      ctx.restore(); // Restore mirrored context even if no pose
      if (setFeedback && (Date.now() - stateRef.current.lastUpdate > 500)) {
        setFeedback('📷 No person detected. Please step into frame.');
        stateRef.current.lastUpdate = Date.now();
      }
    }
  }, [detector, config, setFeedback, setRepCount, setFormQuality, setCurrentAngle, drawKeypoints, drawSkeleton, drawAngleArc, drawOverlay]);

  useEffect(() => {
    const loop = async () => {
      const now = Date.now();
      const elapsed = now - lastDetectionTimeRef.current;

      if (isTracking && !isProcessingRef.current && elapsed >= MS_PER_FRAME) {
        isProcessingRef.current = true;
        lastDetectionTimeRef.current = now;
        await detectPose();
        isProcessingRef.current = false;
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    if (isTracking) {
      requestRef.current = requestAnimationFrame(loop);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      isProcessingRef.current = false;
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isTracking, detectPose]);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: '#000', borderRadius: 12, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {detector ? (
        <>
          <Webcam
            ref={webcamRef}
            videoConstraints={{
              width: 640,
              height: 480,
              frameRate: 15
            }}
            style={{
              position: 'absolute', zIndex: 10,
              width: '100%', height: '100%', objectFit: 'cover'
            }}
            mirrored={true}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', zIndex: 20,
              width: '100%', height: '100%', objectFit: 'cover'
            }}
          />
        </>
      ) : (
        <div style={{
          color: '#fff', padding: 20, textAlign: 'center'
        }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 12px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Loading AI Tracking Model...</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>This may take a moment</p>
        </div>
      )}
    </div>
  );
};

export default CameraTracker;
