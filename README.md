
# 🎥 AI Proctoring System

An end-to-end **real-time AI Proctoring Web App** built with **React + Node.js + MongoDB + TensorFlow.js**.  
The system monitors candidates during online interviews or exams, detects suspicious behavior, and generates PDF reports.

---

## 🌍 Live Demo
🚀 **Try it here:** [AI Proctoring System](https://videoproctoring.netlify.app/)

---

## 🚀 Features

✅ **Real-time Camera Monitoring**  
- Face detection (alerts when no face is detected for >10s)  
- Multiple face detection  
- Candidate looking away detection (>5s)  
- Eye-closure / drowsiness detection (>2s)  
- Suspicious object detection (cell phones, books, laptops)

✅ **Session Recording**  
- Captures full audio/video stream  
- Saves recorded file to backend (`uploads/`)  

✅ **Event Logging**  
- Each detection triggers a timestamped event stored in MongoDB  
- Events displayed live in a scrollable log

✅ **Reporting**  
- One-click PDF report generation for a candidate  
- Option to download reports for **all candidates**  
- Includes integrity score & event breakdown

✅ **Real-time Alerts**  
- On-screen banner alerts for drowsiness, looking away, or suspicious object detection  

✅ **Session Management**  
- Start / Stop / End Session controls  
- Auto refresh after session ends  

---

## 🏗️ Tech Stack

| **Frontend** | **Backend** | **AI / Detection** | **Database** |
|-------------|-------------|------------------|-------------|
| React + Vite / CRA | Node.js + Express | TensorFlow.js (FaceMesh + Coco-SSD) | MongoDB |

---

## 📂 Project Structure

```
project-root/
│
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/ProctorPage.jsx
│   │   ├── hooks/useDetection.js
│   │   ├── components/
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── DetectionCanvas.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   └── EventLog.jsx
│   │   └── api/api.js
│   └── index.css
│
├── server/
│   ├── controllers/
│   │   ├── eventController.js
│   │   └── reportController.js
│   ├── models/Event.js
│   ├── routes/
│   │   ├── eventRoutes.js
│   │   └── reportRoutes.js
│   └── server.js
│
├── uploads/               # Recorded videos are stored here
├── .env                   # Environment variables
└── README.md
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
https://github.com/Vinay-Rastogi/VideoProctoringSystem.git
cd VideoProctoringSystem
```

### 2️⃣ Backend Setup
```bash
cd server
npm install
```

Create a `.env` file:
```env
PORT=5000
MONGO_URI=yourMongoURI
```

Run the backend:
```bash
npm start
```

### 3️⃣ Frontend Setup
```bash
cd ../client
npm install
npm start
```

The React app should open at **http://localhost:3000**

---

## 🎯 Usage

1. **Enter Candidate Name**  
2. Click **Start Session** → Camera starts + detection begins  
3. Candidate is monitored in real-time, events logged  
4. Click **Stop Session** → Recording stops + video uploaded  
5. Click **Download Report** to get a candidate PDF  
6. Click **Download All Logs** for a combined report

---

## 🧠 AI Models

- **FaceMesh** (MediaPipe) → face landmarks, eye tracking, multiple faces  
- **Coco-SSD** → object detection for "cell phone", "book", "laptop"

---

## 📄 Example Report

- Candidate name + session duration  
- Number of "No Face", "Looking Away", and "Suspicious" events  
- Integrity score (100 → fully attentive)  
- Full chronological event log

---

## 🛠️ Future Improvements

- Add **audio analysis** (detect background speech)  
- Add **custom object detection** (train model for specific cheat objects)  
- Deploy with **Docker + Nginx** for production

---

## 🏆 Credits

Developed by **Vinay Rastogi**  
Built with ❤️ using React, Node.js, and TensorFlow.js , MongoDb

---

## 📜 License

MIT License – feel free to modify and use for educational or commercial purposes.
