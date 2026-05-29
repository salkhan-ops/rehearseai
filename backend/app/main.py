import warnings

warnings.filterwarnings("ignore", category=FutureWarning, module=r"google\..*")
warnings.filterwarnings("ignore", message=r"urllib3 v2 only supports OpenSSL.*")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes import admin, auth, contact, health, payments, reports, sessions, voice
from app.services.cartesia_service import CartesiaService
from app.services.deepgram_service import DeepgramService
from app.services.firestore_service import FirestoreService
from app.services.gemini_service import GeminiService

settings = get_settings()

app = FastAPI(title="RehearseAI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.store = FirestoreService()
app.state.ai = GeminiService()
app.state.deepgram = DeepgramService()
app.state.cartesia = CartesiaService()

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(contact.router)
app.include_router(sessions.router)
app.include_router(reports.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(voice.router)
