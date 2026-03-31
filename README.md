# AI Based Rehabilitation Support Platform

## Project Structure

```
rehabAI/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (database, etc.)
│   │   ├── controllers/     # Route controllers (business logic)
│   │   ├── middleware/      # Custom middleware (auth, validation, etc.)
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API route definitions
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Main server file
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable React components
    │   ├── context/         # React context (authentication, etc.)
    │   ├── hooks/           # Custom React hooks
    │   ├── pages/           # Page components
    │   ├── services/        # API service client
    │   ├── utils/           # Utility functions
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    └── .gitignore
```

## Tech Stack

- **Frontend**: React.js 18 with React Router
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS
- **Security**: bcryptjs for password hashing

## User Roles

1. **Patient**: Users undergoing rehabilitation
2. **Physiotherapist/Mentor**: Healthcare professionals managing exercise programs
3. **Doctor**: Medical professionals overseeing patient care

## Features

- User authentication and role-based access control
- Patient profile management
- Exercise database with categories and difficulty levels
- Exercise session tracking (manual entry by caretaker/physiotherapist)
- Pain and effort level logging
- Multi-user system with role-based permissions
- Responsive UI with Tailwind CSS

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB connection string and JWT secret

5. Start the server:
   ```bash
   npm run dev    # Development mode with nodemon
   npm start      # Production mode
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will open at `http://localhost:3000`

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile

### Patient Routes
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `POST /api/patients/:id/assign-physiotherapist` - Assign physiotherapist

### Physiotherapist Routes
- `GET /api/physiotherapists` - Get all physiotherapists
- `GET /api/physiotherapists/:id` - Get physiotherapist details
- `GET /api/physiotherapists/:id/patients` - Get assigned patients

### Doctor Routes
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `GET /api/doctors/:id/patients` - Get assigned patients

### Exercise Routes
- `GET /api/exercises` - Get all exercises
- `GET /api/exercises/:id` - Get exercise details
- `POST /api/exercises` - Create new exercise
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Session Routes
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions` - Create exercise session
- `PUT /api/sessions/:id` - Update session (log completion)
- `GET /api/sessions/patient/:patientId` - Get patient sessions

## Database Models

### User
- firstName, lastName, email, password, role, phone, profileImage, isActive

### Patient
- userId, age, gender, medicalHistory, currentConditions, assignedPhysiotherapist, assignedDoctor, emergencyContact

### Exercise
- name, description, category, bodyParts, instructions, duration, difficulty, imageUrl, videoUrl, createdBy

### ExerciseSession
- patient, exercise, physiotherapist, sessionDate, completionStatus, durationCompleted, repsCompleted, feedback, notes, pain_level, effort_level

## Next Steps

1. Implement API controllers and business logic
2. Add comprehensive error handling
3. Set up MongoDB database
4. Implement JWT token management
5. Add form validation
6. Create dashboard components for each role
7. Implement data visualization for progress tracking
8. Add file upload functionality for images/videos
9. Set up testing (Jest for backend and frontend)
10. Deploy to production

## Notes

- Exercise data is manually entered by physiotherapist or caretaker
- The system uses JWT for stateless authentication
- All routes require authentication middleware
- Role-based access control is implemented at the route level
