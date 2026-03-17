# RehabAI - New API Endpoints Reference

## Base URL
```
http://localhost:5000/api
```

All endpoints require authentication with JWT token in header:
```
Authorization: Bearer {token}
```

---

## 🏥 Doctor Endpoints

### 1. Send Connection Request to Patient

**Endpoint:** `POST /doctor/send-request/:patientUserId`

**Description:** Send a connection request to a patient

**Parameters:**
- `patientUserId` (URL param): Patient's user ID

**Request Body:**
```json
{
  "message": "I'd like to oversee your rehabilitation program"
}
```

**Response (201):**
```json
{
  "message": "Request sent successfully",
  "request": {
    "_id": "648f1a2b3c4d5e6f7g8h",
    "doctorId": "507f1f77bcf86cd799439011",
    "patientId": "507f1f77bcf86cd799439012",
    "status": "pending",
    "message": "I'd like to oversee your rehabilitation program",
    "createdAt": "2024-03-12T10:30:00Z"
  }
}
```

**Error Responses:**
```json
// Patient not found
{ "message": "Patient not found" }

// Request already exists
{ "message": "You are already connected with this patient" }
// OR
{ "message": "Request already pending for this patient" }
```

---

### 2. Get Pending Requests

**Endpoint:** `GET /doctor/pending-requests`

**Description:** Get all pending connection requests sent by doctor

**Request Body:** None

**Response (200):**
```json
{
  "message": "Found 2 pending request(s)",
  "requests": [
    {
      "_id": "648f1a2b3c4d5e6f7g8h",
      "doctorId": "507f1f77bcf86cd799439011",
      "patientId": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "555-1234",
        "age": 35,
        "uniqueId": "PAT-1710235467890-1"
      },
      "status": "pending",
      "message": "Connection request",
      "createdAt": "2024-03-12T10:30:00Z"
    }
  ]
}
```

---

### 3. Get Connected Patients

**Endpoint:** `GET /doctor/connected-patients`

**Description:** Get all patients who accepted doctor's connection request

**Request Body:** None

**Response (200):**
```json
{
  "message": "Found 3 connected patient(s)",
  "patients": [
    {
      "_id": "648f1a2b3c4d5e6f7g8h",
      "userId": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "age": 35,
      "uniqueId": "PAT-1710235467890-1",
      "connectedAt": "2024-03-12T10:45:00Z"
    }
  ]
}
```

---

## 👤 Patient Endpoints

### 1. Get Incoming Requests

**Endpoint:** `GET /patient/incoming-requests`

**Description:** Get all pending connection requests from doctors

**Request Body:** None

**Response (200):**
```json
{
  "message": "Found 2 pending request(s)",
  "requests": [
    {
      "_id": "648f1a2b3c4d5e6f7g8h",
      "doctorId": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "email": "sarah@example.com",
        "phone": "555-5678",
        "specialization": "Orthopedics",
        "uniqueId": "DOC-1710235467890-1"
      },
      "patientId": "507f1f77bcf86cd799439012",
      "status": "pending",
      "message": "I'd like to oversee your rehabilitation",
      "createdAt": "2024-03-12T10:30:00Z"
    }
  ]
}
```

---

### 2. Accept Connection Request

**Endpoint:** `PUT /patient/accept-request/:requestId`

**Description:** Accept a doctor's connection request

**Parameters:**
- `requestId` (URL param): Request ID to accept

**Request Body:** None

**Response (200):**
```json
{
  "message": "Request accepted successfully",
  "request": {
    "_id": "648f1a2b3c4d5e6f7g8h",
    "doctorId": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah@example.com",
      "phone": "555-5678",
      "specialization": "Orthopedics",
      "uniqueId": "DOC-1710235467890-1"
    },
    "patientId": "507f1f77bcf86cd799439012",
    "status": "accepted",
    "acceptedAt": "2024-03-12T10:45:00Z"
  }
}
```

**Error Responses:**
```json
// Request not found
{ "message": "Request not found" }

// Unauthorized (wrong patient)
{ "message": "Unauthorized" }

// Request already handled
{ "message": "Request is no longer pending" }
```

---

### 3. Reject Connection Request

**Endpoint:** `PUT /patient/reject-request/:requestId`

**Description:** Reject a doctor's connection request

**Parameters:**
- `requestId` (URL param): Request ID to reject

**Request Body:**
```json
{
  "rejectionReason": "I prefer another doctor"
}
```

**Response (200):**
```json
{
  "message": "Request rejected successfully",
  "request": {
    "_id": "648f1a2b3c4d5e6f7g8h",
    "doctorId": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah@example.com",
      "specialization": "Orthopedics"
    },
    "patientId": "507f1f77bcf86cd799439012",
    "status": "rejected",
    "rejectionReason": "I prefer another doctor"
  }
}
```

---

### 4. Get Connected Doctors

**Endpoint:** `GET /patient/connected-doctors`

**Description:** Get all connected doctors (accepted requests)

**Request Body:** None

**Response (200):**
```json
{
  "message": "Found 2 connected doctor(s)",
  "doctors": [
    {
      "_id": "648f1a2b3c4d5e6f7g8h",
      "userId": "507f1f77bcf86cd799439011",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah@example.com",
      "phone": "555-5678",
      "specialization": "Orthopedics",
      "uniqueId": "DOC-1710235467890-1",
      "connectedAt": "2024-03-12T10:45:00Z"
    }
  ]
}
```

---

## 📊 Database Schema

### DoctorPatientRequest Collection
```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: User),
  patientId: ObjectId (ref: User),
  status: String (enum: ['pending', 'accepted', 'rejected']),
  message: String,
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date,
  acceptedAt: Date
}
```

### User Collection (Updated)
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['patient', 'doctor', 'physiotherapist']),
  uniqueId: String (unique, auto-generated),
  age: Number,
  phone: String,
  profileImage: String,
  specialization: String (doctors only),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### PatientProfile Collection (Updated)
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  uniquePatientId: String (unique, auto-generated),
  injuryType: String,
  rehabilitationPlan: String,
  assignedPhysiotherapist: ObjectId (ref: User),
  assignedDoctor: ObjectId (ref: User),
  connectedDoctors: [
    {
      doctorId: ObjectId (ref: User),
      connectedAt: Date
    }
  ],
  medicalHistory: String,
  currentConditions: [String],
  emergencyContact: {
    name: String,
    phone: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔑 Unique ID Format

### Doctor ID
```
DOC-{timestamp}-{count}
Example: DOC-1710235467890-5
```

### Patient ID
```
PAT-{timestamp}-{count}
Example: PAT-1710235467890-1
```

### Physiotherapist ID
```
PHY-{timestamp}-{count}
Example: PHY-1710235467890-2
```

---

## 📝 Request/Response Examples

### Example 1: Complete Doctor-Patient Connection Flow

**1. Doctor sends request:**
```bash
POST /api/doctor/send-request/507f1f77bcf86cd799439012
Authorization: Bearer doctor_token
Content-Type: application/json

{
  "message": "Let's work on your knee rehabilitation"
}
```

**Response:**
```json
{
  "message": "Request sent successfully",
  "request": {
    "_id": "648f1a2b3c4d5e6f7g8h",
    "doctorId": "507f1f77bcf86cd799439011",
    "patientId": "507f1f77bcf86cd799439012",
    "status": "pending",
    "message": "Let's work on your knee rehabilitation",
    "createdAt": "2024-03-12T10:30:00Z"
  }
}
```

**2. Patient gets incoming requests:**
```bash
GET /api/patient/incoming-requests
Authorization: Bearer patient_token
```

**3. Patient accepts request:**
```bash
PUT /api/patient/accept-request/648f1a2b3c4d5e6f7g8h
Authorization: Bearer patient_token
Content-Type: application/json

{}
```

**4. Doctor gets connected patients:**
```bash
GET /api/doctor/connected-patients
Authorization: Bearer doctor_token
```

---

## ⚠️ Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Token invalid/expired |
| 403 | Forbidden | Not authorized for action |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## 🔐 Authentication

All endpoints require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token obtained from:
- `POST /auth/login` - Login endpoint
- `POST /auth/register` - Registration endpoint

---

## 🧪 Testing with cURL

### Send Request as Doctor
```bash
curl -X POST http://localhost:5000/api/doctor/send-request/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer doctor_token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Lets work together"
  }'
```

### Get Pending Requests
```bash
curl -X GET http://localhost:5000/api/doctor/pending-requests \
  -H "Authorization: Bearer doctor_token"
```

### Accept Request
```bash
curl -X PUT http://localhost:5000/api/patient/accept-request/648f1a2b3c4d5e6f7g8h \
  -H "Authorization: Bearer patient_token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📚 Related Existing Endpoints

These endpoints were already in the system and still work:

### Doctor Endpoints
- `GET /doctor/patients` - Get assigned patients
- `GET /doctor/reports` - Get reports for all patients
- `GET /doctor/patient/:patientId/report` - Get specific patient report
- `POST /doctor/assign-patient` - Assign patient to doctor

### Patient Endpoints
- `GET /patient/dashboard` - Get dashboard data
- `GET /patient/exercises` - Get exercises
- `POST /patient/exercise-log` - Log exercise
- `GET /patient/exercise-logs` - Get exercise logs
- `PUT /patient/profile` - Update profile

---

## 🚀 Integration Tips

### Frontend Integration

```javascript
// Sending request
axios.post(`/api/doctor/send-request/${patientId}`, {
  message: "Connection message"
}, {
  headers: { Authorization: `Bearer ${token}` }
})

// Getting pending requests
axios.get('/api/doctor/pending-requests', {
  headers: { Authorization: `Bearer ${token}` }
})

// Accepting request
axios.put(`/api/patient/accept-request/${requestId}`, {}, {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Error Handling

```javascript
try {
  // API call
} catch (error) {
  console.log(error.response.data.message);
  // Show error to user
}
```

---

## 📞 Support

For endpoint issues:
1. Check Authentication token is valid
2. Verify User/Patient IDs are correct
3. Check Request status (can't modify non-pending requests)
4. Review error message for specific issue
5. Check server logs for detailed errors

---

Good luck with your integration! 🎉
