# Quick Start Guide - Post-Refactoring

## 🚀 Running the Application

### Backend
```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 📋 Testing the New Features

### 1. **Create Test Users**

First, create users via registration:
- **Register a Doctor** → Role: `doctor`
- **Register 3-4 Patients** → Role: `patient`

### 2. **Doctor Assignment Flow**

1. **Doctor Login**
   - Navigate to Dashboard
   - Should see "My Patients (0)" tab

2. **Assign a Patient**
   - Click "+ Assign Patient" button
   - Select patient from dropdown
   - Click "Assign Patient"
   - Patient now appears in "My Patients" list

3. **Add Exercise to Patient**
   - Click "Add Exercise" on patient card
   - Select exercise from dropdown
   - Click "Assign Exercise"
   - Confirmation message appears

4. **Add Diet Plan to Patient**
   - Click "Add Diet" on patient card
   - Fill in injury type, foods, benefits
   - Click "Add Diet Plan"
   - Confirmation message appears

### 3. **Patient Dashboard Flow**

1. **Patient Login**
   - Navigate to Dashboard
   - Should see assigned doctor info

2. **View Assigned Doctor**
   - "Your Medical Professional" card shows doctor details
   - Email, phone, specialization visible

3. **View Exercises**
   - Click "Assigned Exercises" tab
   - Shows all exercises assigned by doctor
   - Can click "Start Exercise" button

4. **View Diet Plans**
   - Click "Diet Plans" tab
   - Shows all diet plans with food recommendations
   - Listed by injury type

5. **Check Activity**
   - In Overview, see "Exercise Status" card
   - Shows: Total Assigned, Completed, Pending
   - Progress bar shows completion %

---

## 🔍 API Testing with Curl/Postman

### Doctor APIs

**Assign Patient:**
```bash
POST /api/doctor/assign-patient
Content-Type: application/json
Authorization: Bearer {doctorToken}

{
  "patientId": "patient_user_id"
}
```

**Assign Exercise:**
```bash
POST /api/doctor/assign-exercise
Authorization: Bearer {doctorToken}

{
  "patientId": "patient_user_id",
  "exerciseId": "exercise_id",
  "notes": "Do 3 sets"
}
```

**Add Diet Plan:**
```bash
POST /api/doctor/add-diet-plan
Authorization: Bearer {doctorToken}

{
  "patientId": "patient_user_id",
  "injuryType": "Knee Injury",
  "foods": [
    {"name": "Salmon", "quantity": "100g", "benefits": "Omega-3 for inflammation"},
    {"name": "Broccoli", "quantity": "150g", "benefits": "Vitamin C for healing"}
  ],
  "description": "Anti-inflammatory diet"
}
```

**Get Assigned Patients:**
```bash
GET /api/doctor/patients
Authorization: Bearer {doctorToken}
```

### Patient APIs

**Get Assigned Doctor:**
```bash
GET /api/patient/assigned-doctor
Authorization: Bearer {patientToken}
```

**Get Assigned Exercises:**
```bash
GET /api/patient/exercises
Authorization: Bearer {patientToken}
```

**Get Diet Plans:**
```bash
GET /api/patient/diet-plans
Authorization: Bearer {patientToken}
```

**Log Exercise:**
```bash
POST /api/patient/exercise-log
Authorization: Bearer {patientToken}

{
  "exerciseId": "exercise_id",
  "completedSets": 3,
  "painLevel": 5,
  "notes": "Felt good"
}
```

---

## ✅ Verification Checklist

- [ ] No "John Doe" appears in Profile page
- [ ] No "Dr. Priya Sharma" in Support page
- [ ] No fake "78%" progress in Patient Dashboard
- [ ] No fake "7 days streak" in stats
- [ ] No "Weekly Improvement Chart" with hardcoded values
- [ ] No fake exercises (Knee Strengthening, Shoulder Rotation) appear
- [ ] Doctor can assign patient successfully
- [ ] Patient appears in doctor's patient list
- [ ] Doctor can assign exercise to patient
- [ ] Patient sees exercise in their exercises tab
- [ ] Doctor can add diet plan to patient
- [ ] Patient sees diet plan with foods and benefits
- [ ] Empty state shows when no data available
- [ ] Error messages show appropriately

---

## 🐛 Troubleshooting

### Issue: "No patients available" after assignment
**Solution:** Refresh the page to reload data from server

### Issue: Patient doesn't see assigned doctor
**Solution:** Ensure doctor assigned patient via dashboard (not via old request system)

### Issue: Exercise assignment fails
**Solution:** Check that patient is assigned to doctor first

### Issue: Diet plan not visible on patient side
**Solution:** Verify diet plan was created successfully in doctor's action

### Issue: API returns 403 Forbidden
**Solution:** Check that authorization token is valid and user role is correct

---

## 📚 Database

### Collections Used
- `users` - Stores doctor, patient, physiotherapist accounts  
- `patientprofiles` - Links patients to doctors and tracks assignments
- `exercises` - All available exercises in the library
- `exercisesessions` - Tracking of assigned exercises to patients
- `exerciseslogs` - Logs of completed exercises by patients
- `dietrecommendations` - Diet plans for patients
- `messages` - (if using messaging system)
- `chatmessages` - (if using AI chat)

### Key Fields for New System
- `PatientProfile.assignedDoctor` - Direct assignment (ObjectId)
- `PatientProfile.assignedDoctorId` - Alternative assignment reference
- `DietRecommendation.patientId` - Links diet to specific patient
- `Exercise.difficulty` - easy/moderate/hard for filtering

---

## 🔐 Security Notes

1. **Always validate user role** before allowing operations
2. **Check doctor-patient relationship** before allowing modifications
3. **Use authentication middleware** on all protected routes
4. **Never trust client-side role** used for authorization

---

## 📞 Support

For issues or questions about the refactoring:
1. Check the `REFACTORING_COMPLETE.md` file for detailed changes
2. Review the new API endpoints documented above
3. Check backend error logs for detailed error messages
4. Verify MongoDB connection and data integrity

---

## 🎓 Learning Resources

- Check `/api/doctor/all-patients` to understand available patients structure
- Check `/api/doctor/patients` to understand assigned patients structure  
- Check `/api/patient/assigned-doctor` response for doctor object structure
- Mongoose lean() queries for better performance
- Populate() for nested data retrieval

---

**Last Updated:** March 24, 2026
**Status:** Production Ready ✅
