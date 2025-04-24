# 🤖 Prep-Wise: AI Mock Interviewer

**Prep-Wise** is an AI-powered mock interview web application that helps students prepare for interviews by asking dynamic questions based on their uploaded resumes and analyzing facial expressions via webcam in real time.

---

## ✨ Features

- 📄 **Resume Upload & Text Extraction**
- 🧠 **AI-Based Question Generation (GPT-2)**
- 🎥 **Facial Expression Analysis (Webcam + OpenCV + FER)**
- 🔁 **Emotion-Adaptive Questioning**
- 🌐 **Modern, Professional Frontend UI**

---

## 🖼️ UI Design

- **Color Palette**: Navy blue, white, and accent colors
- **Typography**: Clean and readable fonts
- **Design Style**: Sleek, minimalist with smooth animations

---

## 🧪 Tech Stack

| Layer      | Technologies                                |
|------------|---------------------------------------------|
| Frontend   | HTML, CSS, JavaScript (Vanilla)             |
| Backend    | Python (Flask)                              |
| Database   | MySQL                                       |
| AI/ML      | GPT-2 (local), python-docx, OpenCV, FER     |
| Dev Tools  | Git, VS Code                                |

---

## 📁 Folder Structure

ai-mock-interviewer/ ├── backend/ │ ├── app.py │ ├── requirements.txt │ └── uploads/ │ └── uploaded_resume.docx ├── frontend/ │ ├── index.html │ ├── style.css │ └── script.js └── README.md


---

## ⚙️ Setup Instructions

### 1. 📥 Clone the Repository

```bash
git clone https://github.com/civilizedcadet/Prep-Wise.git
cd Prep-Wise
```
### 2. 🐍 Backend Setup (Python + Flask)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
# OR
source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt
python app.py
```
### 3. 💻 Frontend Setup
No build steps needed. Just open frontend/index.html in your browser, or use the Live Server extension in VS Code.

### 4. 🛢️ MySQL Setup
```bash
CREATE DATABASE ai_interviewer;
USE ai_interviewer;

CREATE TABLE resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    skills TEXT,
    experience TEXT
);
```
**Make sure your app.py uses the correct MySQL user and password.**





