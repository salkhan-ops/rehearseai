# Local Setup

## Requirements

- Node.js 20+
- Python 3.11+
- Google Cloud project for Firestore when moving beyond mock storage

## Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If `FIRESTORE_PROJECT_ID` is empty, the backend stores data in memory. If `GEMINI_API_KEY` is empty, roleplay and reports use safe mock responses.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Firebase Auth

Create a Firebase project, enable Email/Password and Google providers, then copy the web app config into the frontend environment variables. Backend token verification is marked as a TODO for the production pass.
