# RehearseAI Backend

FastAPI backend for sessions, Gemini roleplay, structured reports, Firestore storage, and Paddle placeholders.

## Local development

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Without `FIRESTORE_PROJECT_ID` and Google credentials, the app uses in-memory storage. Without `GEMINI_API_KEY`, it uses mock AI responses.
