# RehabAI Demo Guide - Complete Workflow

## Prerequisites
- Node.js and npm installed
- MongoDB running locally on port 27017
- Both backend and frontend npm dependencies installed

## Starting the Project

### 1. Start MongoDB
```bash
# Make sure MongoDB is running (usually runs as a service on Windows)
mongod
```

### 2. Start Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### 3. Start Frontend Application
Open a new terminal:
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

---

## Demo Workflow

### Step 1: Register Users

#### Register as Doctor
1. Go to `http://localhost:3000/register`
2. Click "Continue" → Select "Doctor" role
3. Fill in details:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `doctor@example.com`
   - Password: `Password123`
   - Specialization: `Orthopedics`
   - Click "Create Account"
4. **Save the doctor's email**

#### Register as Patient
1. Go to `http://localhost:3000/register`
2. Click "Continue" → Select "Patient" role
3. Fill in details:
   - First Name: `Jane`
   - Last Name: `Smith`
   - Email: `patient@example.com`
   - Password: `Password123`
   - Click "Create Account"
4. **Save the patient's email**

---

### Step 2: Doctor Sends Connection Request & Patient Accepts

#### Doctor Dashboard
1. **Login** with doctor credentials (`doctor@example.com` / `Password123`)
2. Go to **Doctor Dashboard**
3. Click **"Send Request to Patient"** button
4. Enter patient's email: `patient@example.com`
5. Click "Send Request"
6. **Note:** Request appears in Doctor's Dashboard

#### Patient Accepts Request
1. **Logout** doctor↔ Click "Logout"
2. **Login** as patient with credentials (`patient@example.com` / `Password123`)
3. Go to **Patient Dashboard**
4. You should see incoming doctor requests
5. Click **"Accept"** on the doctor's request
6. **Status:** Patient is now connected with Doctor ✓

---

### Step 3: Doctor Assigns Exercises to Patient

#### Create/Browse Exercises
1. **Login** as doctor
2. Go to **Doctor Dashboard** → **Connected Patients**
3. Click on patient "Jane Smith"
4. Click **"Add Exercise"** button
5. Select an exercise from the library (or create a new one):
   - Name: `Shoulder Stretch`
   - Category: `Stretching`
   - Duration: `5 minutes`
   - Difficulty: `Easy`
   - Click "Assign"
6. **Confirmation:** Exercise is assigned to patient ✓

#### Patient Views Assigned Exercises
1. **Logout** doctor → **Login** as patient
2. Go to **Exercise Tracking** or **Patient Dashboard**
3. **View assigned exercises** from the doctor
4. Click on exercise to see full details

---

### Step 4: Doctor Adds Diet Plan to Patient

#### Add Diet Plan
1. **Login** as doctor
2. Go to **Connected Patients** → Select patient "Jane Smith"
3. Click **"Add Diet Plan"** button
4. Fill details:
   - Injury Type: `Shoulder Injury`
   - Select Foods:
     - Fish (Rich in Omega-3)
     - Eggs (Protein)
     - Broccoli (Vitamin C)
   - Description: `High protein diet to support shoulder recovery`
   - Click "Add Plan"
5. **Confirmation:** Diet plan added successfully ✓

#### Patient Views Diet Plans
1. **Logout** → **Login** as patient
2. Go to **Patient Dashboard** → **Diet Plans**
3. View the diet plan assigned by doctor
4. See food recommendations

---

### Step 5: Real-Time Messaging Between Doctor & Patient

#### Doctor Initiates Chat
1. **Login** as doctor
2. Go to **Messaging** page
3. Look for "Jane Smith" in conversations
4. Click on the conversation to open chat
5. Type message: `Hi Jane, how are your exercises going?`
6. Click "Send"

#### Patient Receives & Replies
1. **Logout** doctor → **Login** as patient
2. Go to **Messaging** page
3. **See the doctor's message** in conversation
4. Reply with: `Hi Dr. John, going well! Shoulder pain has reduced.`
5. Click "Send"

#### Doctor Sees Reply
1. Stay on messaging page (or refresh)
2. **See patient's reply** appears immediately
3. Continue conversation naturally

---

### Step 6: Patient Logs Exercise Progress

#### Log Exercise Completion
1. **Login** as patient
2. Go to **Exercise Tracking**
3. Select the assigned exercise "Shoulder Stretch"
4. Click **"Log Exercise"**
5. Fill details:
   - Sets Completed: `3`
   - Pain Level: `3/10` (slider)
   - Effort Level: `5/10` (slider)
   - Notes: `Felt good, less pain`
   - Click "Log"
6. **Confirmation:** Exercise logged successfully ✓

#### Doctor Views Patient Progress
1. **Login** as doctor
2. Go to **Connected Patients** → Select "Jane Smith"
3. Click **"View Progress Report"**
4. **See:**
   - Total exercises logged
   - Pain level trends
   - Effort levels
   - Exercise completion rate
   - Notes from patient

---

### Step 7: Complete Patient Dashboard View

#### Patient Can See:
1. **Dashboard:**
   - Connected doctors
   - Recent exercises
   - Upcoming diet plans
   - Exercise statistics

2. **Exercises:**
   - List of assigned exercises
   - Completion status
   - Exercise details and videos

3. **Diet Plans:**
   - Doctor's recommendations
   - Food items and benefits
   - Personalized notes

4. **Messaging:**
   - Chat with doctor
   - Message history
   - Real-time updates

---

### Step 8: Doctor Management Dashboard

#### Doctor Can See:
1. **Connected Patients:**
   - List of patients
   - Connection status
   - Contact information

2. **Patient Management:**
   - Assign exercises
   - Add diet plans
   - View progress reports
   - Track compliance

3. **Analytics:**
   - Patient progress charts
   - Exercise completion rates
   - Pain level trends
   - Overall rehabilitation progress

4. **Messaging:**
   - Chat with each patient
   - Message history
   - Follow-up reminders

---

## Key Features Demonstrated

✅ **Patient-Doctor Linking** - Secure connection requests and acceptance  
✅ **Exercise Assignment** - Doctor assigns targeted exercises  
✅ **Diet Planning** - Personalized nutrition recommendations  
✅ **Progress Tracking** - Patient logs exercises with pain/effort levels  
✅ **Real-Time Messaging** - Instant communication between doctor and patient  
✅ **Analytics Dashboard** - Doctor monitors patient progress  
✅ **Role-Based Access** - Different views for doctors and patients  
✅ **Authentication** - Secure JWT-based login  

---

## Testing Tips

### Test Real-Time Messaging
1. Open two browsers (or incognito windows)
2. Login to one as doctor, other as patient
3. Send messages from both sides
4. Messages appear instantly ✓

### Test Data Flow
1. Add exercise as doctor
2. Switch to patient and refresh
3. Exercise appears in patient's exercise list ✓

### Test Progress Tracking
1. Patient logs multiple exercises with different pain levels
2. Doctor views progress or analytics
3. See trends and statistics ✓

---

## API Endpoints Summary

### Doctor Endpoints
- `POST /api/doctor/send-request/:patientUserId` - Send connection request
- `POST /api/doctor/assign-exercise` - Assign exercise to patient
- `POST /api/doctor/add-diet-plan` - Add diet plan to patient
- `GET /api/doctor/connected-patients` - Get connected patients
- `GET /api/doctor/patient/:patientId/exercises` - Get patient's exercises
- `GET /api/doctor/patient/:patientId/diets` - Get patient's diet plans

### Patient Endpoints
- `GET /api/patient/incoming-requests` - Get doctor requests
- `PUT /api/patient/accept-request/:requestId` - Accept doctor request
- `PUT /api/patient/reject-request/:requestId` - Reject doctor request
- `GET /api/patient/exercises` - Get assigned exercises
- `GET /api/patient/diet-plans` - Get diet plans
- `PUT /api/patient/exercise-session/:sessionId/update-status` - Log exercise

### Messaging Endpoints
- `POST /api/messages/send` - Send message
- `GET /api/messages/history?otherUserId=id` - Get message history
- `GET /api/messages/inbox` - Get all conversations

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

### Port Already in Use
- Backend: Change `PORT` in `.env` file
- Frontend: Use `PORT=3001 npm start`

### CORS Errors
- Backend CORS is configured for all origins in development
- Check browser console for detailed errors

### Messages Not Appearing
- Refresh the page to load latest messages
- Check network tab for API calls
- Verify both users are logged in correctly

---

## Next Steps After Demo

1. **Deploy to Production** - Use cloud services (Heroku, AWS, etc.)
2. **Add WebSocket** - For real-time notifications
3. **Implement File Uploads** - For exercise videos/images
4. **Add Email Notifications** - For important updates
5. **Mobile App** - React Native version
6. **Advanced Analytics** - ML-based progress predictions

---

Enjoy the RehabAI Demo! 🚀
