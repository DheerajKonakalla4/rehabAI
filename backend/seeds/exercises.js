const mongoose = require('mongoose');
const Exercise = require('../src/models/Exercise');
const dotenv = require('dotenv');

dotenv.config();

// Default exercises to seed
const defaultExercises = [
  {
    name: 'Knee Strengthening',
    description: 'Build strength in your knee muscles with controlled movements to improve stability and support.',
    category: 'strengthening',
    bodyParts: ['knee'],
    instructions: 'Stand with feet shoulder-width apart. Bend knees slowly and return to standing. Keep movements controlled.',
    duration: { value: 15, unit: 'minutes' },
    repetitions: 10,
    difficulty: 'easy',
    videoUrl: 'http://www.youtube.com/watch?v=rsSV_lqbEVo',
    isActive: true
  },
  {
    name: 'Shoulder Rotation',
    description: 'Improve shoulder mobility and range of motion through gentle rotational movements.',
    category: 'mobility',
    bodyParts: ['shoulder'],
    instructions: 'Extend arms at shoulder height. Rotate shoulders forward in circles, then backward. Move slowly and steadily.',
    duration: { value: 10, unit: 'minutes' },
    repetitions: 15,
    difficulty: 'easy',
    videoUrl: 'http://www.youtube.com/watch?v=ldUwIBccnuw',
    isActive: true
  },
  {
    name: 'Back Stretching',
    description: 'Gentle stretches to relieve back tension and improve flexibility along the spine.',
    category: 'stretching',
    bodyParts: ['back'],
    instructions: 'Sit on floor with legs extended. Bend forward gently from the hips. Hold and breathe deeply.',
    duration: { value: 12, unit: 'minutes' },
    repetitions: 8,
    difficulty: 'easy',
    videoUrl: 'http://www.youtube.com/watch?v=mORoTbGfhPU',
    isActive: true
  },
  {
    name: 'Hip Flexor Stretch',
    description: 'Increase hip flexibility and reduce tightness in the hip flexor muscles.',
    category: 'stretching',
    bodyParts: ['hip'],
    instructions: 'Lunge position with front knee bent. Push hips forward gently. Hold for 30 seconds each side.',
    duration: { value: 10, unit: 'minutes' },
    repetitions: 12,
    difficulty: 'easy',
    videoUrl: 'http://www.youtube.com/watch?v=mWOWpBGGY4k',
    isActive: true
  },
  {
    name: 'Knee Extension',
    description: 'Advanced knee strengthening for improved stability and support, with increased resistance.',
    category: 'strengthening',
    bodyParts: ['knee'],
    instructions: 'Sit with back against wall. Extend one leg fully, hold 2 seconds. Lower slowly without touching floor.',
    duration: { value: 20, unit: 'minutes' },
    repetitions: 10,
    difficulty: 'hard',
    videoUrl: 'http://www.youtube.com/watch?v=0Nt2EmOEcJQ',
    isActive: true
  },
  {
    name: 'Shoulder Blade Squeeze',
    description: 'Strengthen upper back and improve posture through focused muscle engagement.',
    category: 'strengthening',
    bodyParts: ['shoulder'],
    instructions: 'Stand upright. Pull shoulder blades down and back. Squeeze for 2 seconds, release. Repeat slowly.',
    duration: { value: 15, unit: 'minutes' },
    repetitions: 15,
    difficulty: 'moderate',
    videoUrl: 'http://www.youtube.com/watch?v=QN1oZVMMRjE',
    isActive: true
  },
  {
    name: 'Quad Stretch',
    description: 'Improve flexibility in the quadriceps muscle at the front of the thigh.',
    category: 'stretching',
    bodyParts: ['leg'],
    instructions: 'Stand on one leg. Pull other foot toward buttock. Hold for 30 seconds each side.',
    duration: { value: 8, unit: 'minutes' },
    repetitions: 10,
    difficulty: 'easy',
    videoUrl: 'http://www.youtube.com/watch?v=LXjYdUS8NBM',
    isActive: true
  },
  {
    name: 'Hamstring Stretch',
    description: 'Improve hamstring flexibility and reduce tightness in the back of the thigh.',
    category: 'stretching',
    bodyParts: ['leg'],
    instructions: 'Sit with one leg extended. Lean forward from hips toward the extended leg. Hold for 30 seconds.',
    duration: { value: 10, unit: 'minutes' },
    repetitions: 8,
    difficulty: 'easy',
    videoUrl: 'http://www.youtube.com/watch?v=zpOVtbN-Uyk',
    isActive: true
  }
];

// Function to seed exercises
async function seedExercises() {
  try {
    // Don't connect again if already connected (in server context)
    // If running standalone, connect
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rehab-ai', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Check if exercises already exist
    const exerciseCount = await Exercise.countDocuments();

    if (exerciseCount === 0) {
      console.log('No exercises found. Seeding default exercises...');

      // Insert default exercises
      const insertedExercises = await Exercise.insertMany(defaultExercises);
      console.log(`✓ Successfully seeded ${insertedExercises.length} exercises`);

      insertedExercises.forEach(ex => {
        console.log(`  - ${ex.name} (${ex.difficulty})`);
      });
    } else {
      console.log(`✓ Database already has ${exerciseCount} exercises. Syncing video URLs...`);

      const videoSyncTasks = defaultExercises
        .filter((exercise) => exercise.videoUrl)
        .map((exercise) => Exercise.updateMany(
          { name: exercise.name },
          { $set: { videoUrl: exercise.videoUrl, updatedAt: Date.now() } }
        ));

      const syncResults = await Promise.all(videoSyncTasks);
      const syncedCount = syncResults.reduce((acc, result) => acc + (result.modifiedCount || 0), 0);
      console.log(`✓ Synced video URLs for ${syncedCount} existing exercise record(s).`);
    }

    // Only disconnect if this script was run directly (not called from server)
    if (require.main === module) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error seeding exercises:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

// Run seeding
if (require.main === module) {
  seedExercises();
}

module.exports = { seedExercises, defaultExercises };
