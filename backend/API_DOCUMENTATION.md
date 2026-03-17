# RehabAI REST API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except registration and login require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "role": "patient",
  "age": 30,
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

---

### POST /auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "patient",
    "age": 30
  }
}
```

---

### GET /auth/profile
Get current logged-in user's profile. **Requires Authentication**

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "patient",
    "age": 30,
    "phone": "9876543210",
    "profileImage": null
  }
}
```

---

### POST /auth/logout
Logout current user. **Requires Authentication**

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## Patient Endpoints

All patient endpoints require authentication and patient role.

### GET /patient/dashboard
Get patient dashboard with profile, recent logs, and stats. 

**Response:**
```json
{
  "patientProfile": {
    "_id": "507f1f77bcf86cd799439012",
    "patientId": "507f1f77bcf86cd799439011",
    "injuryType": "Knee Sprain",
    "rehabilitationPlan": "Phase 2 - Strengthening",
    "assignedPhysiotherapist": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "phone": "9876543211"
    },
    "assignedDoctor": {
      "_id": "507f1f77bcf86cd799439014",
      "firstName": "Dr. Mark",
      "lastName": "Johnson",
      "email": "mark@example.com",
      "phone": "9876543212"
    }
  },
  "recentLogs": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "exerciseId": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Knee Extension",
        "difficulty": "moderate"
      },
      "completedSets": 3,
      "painLevel": 4,
      "date": "2026-03-11T10:30:00Z"
    }
  ],
  "stats": {
    "pendingSessions": 2,
    "completedSessions": 5,
    "totalExercisesLogged": 15
  }
}
```

---

### GET /patient/exercises
Get assigned exercises for the patient.

**Response:**
```json
{
  "exercises": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "exercise": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Knee Extension",
        "description": "Strengthen quadriceps muscles",
        "difficulty": "moderate",
        "duration": { "value": 15, "unit": "minutes" },
        "repetitions": 10,
        "category": "strengthening",
        "instructions": "Sit upright...",
        "imageUrl": "https://...",
        "videoUrl": "https://..."
      },
      "sessionDate": "2026-03-11T08:00:00Z",
      "completionStatus": "pending"
    }
  ]
}
```

---

### POST /patient/exercise-log
Log a completed exercise.

**Request Body:**
```json
{
  "exerciseId": "507f1f77bcf86cd799439016",
  "completedSets": 3,
  "painLevel": 5,
  "notes": "Felt good, minimal pain"
}
```

**Response:**
```json
{
  "message": "Exercise logged successfully",
  "exerciseLog": {
    "_id": "507f1f77bcf86cd799439017",
    "patientId": "507f1f77bcf86cd799439011",
    "exerciseId": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Knee Extension",
      "difficulty": "moderate"
    },
    "completedSets": 3,
    "painLevel": 5,
    "notes": "Felt good, minimal pain",
    "date": "2026-03-11T10:30:00Z"
  }
}
```

---

### GET /patient/exercise-logs
Get patient's exercise logs with optional date filtering.

**Query Parameters:**
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Example:** `GET /patient/exercise-logs?startDate=2026-03-01&endDate=2026-03-11`

**Response:**
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "patientId": "507f1f77bcf86cd799439011",
      "exerciseId": {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Knee Extension",
        "difficulty": "moderate",
        "category": "strengthening"
      },
      "completedSets": 3,
      "painLevel": 5,
      "notes": "Felt good, minimal pain",
      "date": "2026-03-11T10:30:00Z"
    }
  ]
}
```

---

### PUT /patient/profile
Update patient profile.

**Request Body:**
```json
{
  "injuryType": "Knee Sprain",
  "rehabilitationPlan": "Phase 3 - Return to Activity",
  "medicalHistory": "Previous ACL surgery 2020",
  "currentConditions": ["Swelling", "Limited Movement"]
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "patientProfile": {
    "_id": "507f1f77bcf86cd799439012",
    "patientId": "507f1f77bcf86cd799439011",
    "injuryType": "Knee Sprain",
    "rehabilitationPlan": "Phase 3 - Return to Activity",
    "medicalHistory": "Previous ACL surgery 2020",
    "currentConditions": ["Swelling", "Limited Movement"],
    "assignedPhysiotherapist": { ... },
    "assignedDoctor": { ... }
  }
}
```

---

## Physiotherapist/Mentor Endpoints

All mentor endpoints require authentication and physiotherapist role.

### GET /mentor/patients
Get all patients assigned to the physiotherapist.

**Response:**
```json
{
  "message": "Found 5 assigned patient(s)",
  "patients": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "patientId": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "age": 30
      },
      "injuryType": "Knee Sprain",
      "rehabilitationPlan": "Phase 2 - Strengthening",
      "assignedDoctor": {
        "_id": "507f1f77bcf86cd799439014",
        "firstName": "Dr. Mark",
        "lastName": "Johnson",
        "email": "mark@example.com"
      }
    }
  ]
}
```

---

### POST /mentor/add-exercise
Create a new exercise.

**Request Body:**
```json
{
  "name": "Knee Extension",
  "description": "Strengthen quadriceps muscles",
  "category": "strengthening",
  "difficulty": "moderate",
  "duration": { "value": 15, "unit": "minutes" },
  "repetitions": 10,
  "bodyParts": ["Quadriceps", "Knee"],
  "instructions": "Sit upright on a chair...",
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4"
}
```

**Response:**
```json
{
  "message": "Exercise created successfully",
  "exercise": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Knee Extension",
    "description": "Strengthen quadriceps muscles",
    "category": "strengthening",
    "difficulty": "moderate",
    "duration": { "value": 15, "unit": "minutes" },
    "repetitions": 10,
    "bodyParts": ["Quadriceps", "Knee"],
    "instructions": "Sit upright on a chair...",
    "createdBy": "507f1f77bcf86cd799439013",
    "isActive": true,
    "createdAt": "2026-03-11T10:30:00Z"
  }
}
```

---

### POST /mentor/assign-exercise
Assign an exercise to a patient.

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "exerciseId": "507f1f77bcf86cd799439016"
}
```

**Response:**
```json
{
  "message": "Exercise assigned successfully",
  "session": {
    "_id": "507f1f77bcf86cd799439018",
    "patient": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe"
    },
    "exercise": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Knee Extension"
    },
    "physiotherapist": "507f1f77bcf86cd799439013",
    "sessionDate": "2026-03-11T10:30:00Z",
    "completionStatus": "pending"
  }
}
```

---

### POST /mentor/update-progress/{sessionId}
Update patient's exercise session progress.

**Request Body:**
```json
{
  "completionStatus": "completed",
  "durationCompleted": { "value": 15, "unit": "minutes" },
  "repsCompleted": 10,
  "feedback": "Good form, pain level minimal",
  "notes": "Patient showed improvement",
  "pain_level": 3,
  "effort_level": 7
}
```

**Response:**
```json
{
  "message": "Progress updated successfully",
  "session": {
    "_id": "507f1f77bcf86cd799439018",
    "patient": { ... },
    "exercise": { ... },
    "completionStatus": "completed",
    "durationCompleted": { "value": 15, "unit": "minutes" },
    "repsCompleted": 10,
    "feedback": "Good form, pain level minimal",
    "notes": "Patient showed improvement",
    "pain_level": 3,
    "effort_level": 7,
    "updatedAt": "2026-03-11T10:45:00Z"
  }
}
```

---

### GET /mentor/patient/{patientId}/progress
Get a specific patient's progress and exercise logs.

**Response:**
```json
{
  "patientProfile": { ... },
  "logs": [ ... ],
  "sessions": [ ... ]
}
```

---

## Doctor Endpoints

All doctor endpoints require authentication and doctor role.

### GET /doctor/patients
Get all patients assigned to the doctor.

**Response:**
```json
{
  "message": "Found 3 assigned patient(s)",
  "patients": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "patientId": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "age": 30
      },
      "injuryType": "Knee Sprain",
      "rehabilitationPlan": "Phase 2 - Strengthening",
      "assignedPhysiotherapist": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      }
    }
  ]
}
```

---

### GET /doctor/reports
Get aggregated reports for all assigned patients.

**Response:**
```json
{
  "report": {
    "totalPatients": 3,
    "totalExercisesCompleted": 45,
    "averagePainLevel": "4.5",
    "averageEffortLevel": "6.8",
    "patientReports": [
      {
        "patientId": "507f1f77bcf86cd799439011",
        "patientName": "John Doe",
        "injuryType": "Knee Sprain",
        "rehabilitationPlan": "Phase 2 - Strengthening",
        "totalSessions": 10,
        "completedSessions": 8,
        "pendingSessions": 2,
        "totalExercisesLogged": 25,
        "totalSetsCompleted": 75,
        "averagePainLevel": "4.2"
      }
    ]
  }
}
```

---

### GET /doctor/patient/{patientId}/report
Get detailed report for a specific patient.

**Response:**
```json
{
  "patientProfile": { ... },
  "stats": {
    "totalSessions": 10,
    "completedSessions": 8,
    "pendingSessions": 2,
    "inProgressSessions": 0,
    "totalExercisesLogged": 25,
    "totalSetsCompleted": 75,
    "averagePainLevel": "4.2"
  },
  "logs": [ ... ],
  "sessions": [ ... ]
}
```

---

## Messaging Endpoints

All messaging endpoints require authentication.

### POST /messages/send
Send a message to another user.

**Request Body:**
```json
{
  "receiverId": "507f1f77bcf86cd799439013",
  "message": "Hi Jane, how is my recovery progressing?"
}
```

**Response:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439019",
    "senderId": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "receiverId": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    },
    "message": "Hi Jane, how is my recovery progressing?",
    "isRead": false,
    "timestamp": "2026-03-11T10:30:00Z"
  }
}
```

---

### GET /messages/history
Get message history with a specific user.

**Query Parameters:**
- `otherUserId` (required): The ID of the other user

**Example:** `GET /messages/history?otherUserId=507f1f77bcf86cd799439013`

**Response:**
```json
{
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439019",
      "senderId": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "profileImage": null
      },
      "receiverId": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "profileImage": null
      },
      "message": "Hi Jane, how is my recovery progressing?",
      "isRead": true,
      "timestamp": "2026-03-11T10:30:00Z"
    }
  ]
}
```

---

### GET /messages/inbox
Get all conversations (latest message from each).

**Response:**
```json
{
  "conversations": [
    {
      "otherUser": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "profileImage": null
      },
      "lastMessage": "You're doing great! Keep it up.",
      "timestamp": "2026-03-11T12:00:00Z",
      "isRead": true
    }
  ]
}
```

---

### PUT /messages/{messageId}/mark-read
Mark a message as read.

**Response:**
```json
{
  "message": "Message marked as read",
  "data": {
    "_id": "507f1f77bcf86cd799439019",
    "senderId": "507f1f77bcf86cd799439011",
    "receiverId": "507f1f77bcf86cd799439013",
    "message": "Hi Jane, how is my recovery progressing?",
    "isRead": true,
    "timestamp": "2026-03-11T10:30:00Z"
  }
}
```

---

### DELETE /messages/{messageId}
Delete a message.

**Response:**
```json
{
  "message": "Message deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid email or password"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "message": "Patient not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error during registration",
  "error": "Error details..."
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Notes

- All timestamps are in ISO 8601 format
- Dates can be provided in ISO format or Unix timestamp
- Token should be included in every authenticated request
- Most endpoints support pagination via query parameters (to be implemented)
- Rate limiting may be implemented in production
