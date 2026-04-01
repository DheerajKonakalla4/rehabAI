# RehabAI - Quick Setup & Demo Instructions

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Node.js** v14+ installed
- **MongoDB** running locally
- **npm** or **yarn**

### Installation Steps

#### 1. Start MongoDB
```bash
# Windows - MongoDB usually runs as a service
# If not running, start it manually:
mongod

# Or use MongoDB Atlas (cloud): Update MONGODB_URI in .env
```

#### 2. Install & Run Backend
```bash
cd backend
npm install
npm start
# Backend runs on http://localhost:5000
# You'll see: "RehabAI Backend Server is running on port 5000"
```

#### 3. Install & Run Frontend (new terminal)
```bash
cd frontend
npm install
npm start
# Frontend opens at http://localhost:3000
# App automatically opens in your browser
```

---

## 👥 Demo Users - Ready to Use

### Doctor Account
- **Email**: `doctor@example.com`
- **Password**: `Password123`
- **Role**: Doctor

### Patient Account
- **Email**: `patient@example.com`
- **Password**: `Password123`
- **Role**: Patient

---

## ✨ Complete Demo Flow (10 minutes)

### 1. Register & Login (1 min)
- Go to http://localhost:3000
- Click Register
- Create a Doctor account with email/password
- Create a Patient account with email/password

### 2. Doctor-Patient Linking (2 min)
- **Login as Doctor** → Dashboard
- **Send Connection Request** to patient
- **Logout → Login as Patient** → Accept Request
- ✅ Patient & Doctor now connected

### 3. Assign Exercises (2 min)
- **Login as Doctor** → Connected Patients
- Click on patient
- **Add Exercise** → Select from library
- ✅ Patient can now see assigned exercises

### 4. Add Diet Plans (1 min)
- Still logged in as Doctor
- Click **"Add Diet Plan"**
- Fill in nutrition details
- ✅ Patient receives diet recommendations

### 5. Real-Time Messaging (2 min)
- **Go to Messaging** page
- Send message: `Hi, how are your exercises going?`
- **Logout → Login as Patient**
- **Go to Messaging** → See message
- Reply message
- ✅ Bi-directional messaging working

### 6. Patient Logs Progress (1 min)
- **Still logged as Patient**
- Go to Exercise Tracking
- Click exercise → **Log Exercise**
- Enter pain level, effort level
- ✅ Doctor can now see progress

### 7. Doctor Views Analytics (1 min)
- **Logout → Login as Doctor**
- Go to Patient Reports
- See progress charts, exercise completion
- ✅ Full analytics dashboard

---

## 🔗 Key Features Implemented

| Feature | Status | Demo Path |
|---------|--------|-----------|
| User Registration/Login | ✅ Complete | Register → Login |
| Patient-Doctor Linking | ✅ Complete | Send Request + Accept |
| Exercise Assignment | ✅ Complete | Doctor Dashboard → Add Exercise |
| Diet Plans | ✅ Complete | Doctor Dashboard → Add Diet |
| Messaging (Real-time) | ✅ Complete | Messaging Page |
| Progress Tracking | ✅ Complete | Patient Dashboard → Log Exercise |
| Analytics | ✅ Complete | Doctor → View Reports |
| Role-Based Access | ✅ Complete | Different UI per role |

---

## 🔧 Configuration

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rehab-ai
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
```

### Frontend `.env.local`
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🌐 API Endpoints (for Reference)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get logged-in user profile

### Patient Operations
- `PUT /api/patient/accept-request/:requestId` - Accept doctor
- `GET /api/patient/exercises` - Get assigned exercises
- `GET /api/patient/diet-plans` - Get diet plans
- `PUT /api/patient/exercise-session/:sessionId/update-status` - Log exercise

### Doctor Operations
- `POST /api/doctor/send-request/:patientUserId` - Send connection request
- `POST /api/doctor/assign-exercise` - Assign exercise to patient
- `POST /api/doctor/add-diet-plan` - Add diet plan
- `GET /api/doctor/connected-patients` - Get all connected patients

### Messaging
- `POST /api/messages/send` - Send message
- `GET /api/messages/history?otherUserId=id` - Get chat history
- `GET /api/messages/inbox` - Get all conversations

---

## ✅ Demo Checklist

Before showing to teacher:

- [ ] MongoDB is running
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login as Doctor
- [ ] Can login as Patient
- [ ] Can send connection request (Doctor → Patient)
- [ ] Can accept connection request (Patient)
- [ ] Can assign exercise (Doctor)
- [ ] Can view exercise (Patient)
- [ ] Can add diet plan (Doctor)
- [ ] Can view diet plan (Patient)
- [ ] Can send message (both directions)
- [ ] Can log exercise (Patient)
- [ ] Can view progress (Doctor)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Ensure `mongod` is running. Check MONGODB_URI in `.env` |
| Port 5000 already in use | Change PORT in backend `.env` |
| Port 3000 already in use | Run `PORT=3001 npm start` in frontend |
| Login not working | Clear browser cache & cookies |
| Messages not showing | Refresh page. Check Network tab in Dev Tools |
| Exercise not visible | Log out and log back in as patient |

---

## 📞 Support

For issues with specific features:
1. Check browser Console for errors
2. Check terminal output for backend errors
3. Verify all credentials are correct
4. Try clearing browser cache
5. Ensure both servers are running

---

## 🎯 Next Demo Enhancements

1. **WebSocket Chat** - Real-time notifications
2. **Video Uploads** - For exercise demonstrations
3. **PDF Reports** - Downloadable progress reports
4. **Mobile App** - React Native version
5. **Admin Dashboard** - System management

---

**Happy Demoing! 🎉**
