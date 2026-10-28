# 🎓 CampusPulse AI - Student Helpdesk Chatbot

A modern, responsive, and intelligent AI Student Helpdesk Chatbot designed to assist university and college students with questions concerning **Courses**, **Internships**, **Deadlines**, and **Certificates**.

---

## 🌟 Key Highlights

1. **Single Unified AI Chat Stream**:
   - Unlike multi-model comparison grids, this chatbot focuses student engagement into a single conversational interface with session memory, quick suggestion chips, and category navigation.
2. **Native Fetch Google Gemini API & Dynamic Model Discovery (No SDK, No Hardcoded Models)**:
   - Direct REST communication via native `fetch()` to `https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}`.
   - When an API key is entered, available generative models are dynamically fetched live from Google's API and populated in the dropdown (no hardcoded model lists).
   - Zero heavyweight SDKs or OpenRouter dependencies.
3. **Comprehensive Predefined Academic Knowledge Base**:
   - Out-of-the-box support for student FAQs even when offline or without an API key.
   - Covers all 4 required academic pillars:
     - 🎓 **Courses**: Registration steps, prerequisite waivers, syllabus outlines, add/drop windows, credit limits (16–26 credits).
     - 💼 **Internships**: No Objection Certificate (NOC) procedure, converting industrial training to 4–12 academic credits, Training & Placement (T&P) portal drives, stipend rules.
     - ⏰ **Deadlines**: Semester fee dues, late fee penalty windows, examination dates, assignment extension rules, medical leaves.
     - 📜 **Certificates**: Bonafide certificates (visa/bank/passport), official transcripts, WES packets, provisional degrees, migration certificates.
4. **Reused Architecture & Logic from Common AI**:
   - Modular structure (`Logic/fetchAPI.js`, `Logic/router.js`, `Logic/indexDB.js`, `Logic/systemPrompt.js`).
   - Client-side IndexedDB persistence for chat history.
   - Rich Markdown formatting with `marked.js` + `DOMPurify` protection.
   - Mathematical formula rendering using `KaTeX` ($...$ and $$...$$).
   - "Delete" confirmation safeguard modal to prevent accidental data loss.
   - Export transcript functionality (Markdown download).

---

## 📁 Project Structure

```text
student-help-desk/
├── index.html               # Main single-chat HTML interface
├── style.css                # Glassmorphic dark design system & responsive styling
├── script.js                # Chat stream controller, events, and UI interactions
├── README.md                # Documentation and testing guide
└── Logic/
    ├── fetchAPI.js          # Native fetch() wrapper for Google Gemini REST API
    ├── knowledgeBase.js     # Predefined university QA dataset & semantic matcher
    ├── router.js            # Dispatcher switching between Gemini Live AI & Predefined KB
    ├── systemPrompt.js      # Academic advisor persona and formatting instructions
    └── indexDB.js           # Client-side IndexedDB persistence
```

---

## 🚀 How to Run Locally

You can launch this chatbot using any static local server:

### Option A: Using Python
```bash
# Navigate to the folder
cd /Users/arnabbiswas/Documents/Mine/©Covelly/Helping-Friend/student-help-desk

# Start local server
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### Option B: Using Node (`npx serve`)
```bash
npx serve .
```

---

## ⚙️ Configuring Google Gemini API

1. Click on **Gemini Settings ⚙️** (or the model badge in the top right).
2. Enter your free **Google Gemini API Key** (obtainable from [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Click **Validate Key** to test connection directly with Google's API.
4. Select your preferred model (Default: `gemini-2.5-flash`).
5. Click **Save Configuration**. Your key is securely saved in browser `localStorage`.

*Note: If no API key is provided, the chatbot automatically operates in **Predefined Academic KB Mode**.*

---

## 🧪 Testing Scenarios & Sample Questions

Test the chatbot across all 4 pillars to verify response accuracy:

### 1. Courses & Registration
- *"How do I register for semester courses on the ERP portal?"*
- *"Can I drop a course without it affecting my GPA?"*
- *"What are the minimum credit requirements per semester?"*

### 2. Internships & Industrial Training
- *"What is the procedure to get an Internship NOC from the placement cell?"*
- *"Can I convert my 8-week summer internship into academic credits?"*
- *"What documents are needed for internship evaluation?"*

### 3. Deadlines & Exam Dates
- *"When is the deadline for semester fee payment?"*
- *"What is the policy if I miss a mid-term exam due to medical illness?"*
- *"What is the late fee penalty after the standard deadline?"*

### 4. Certificates & Transcripts
- *"How do I apply for an urgent Bonafide Certificate for a passport/visa?"*
- *"How do I request official sealed university transcripts for WES?"*
- *"Can I get a Provisional Degree certificate before the convocation?"*
