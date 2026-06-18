import warnings

warnings.filterwarnings("ignore", category=FutureWarning, module=r"google\..*")
warnings.filterwarnings("ignore", message=r"urllib3 v2 only supports OpenSSL.*")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes import admin, auth, contact, conversation, courses, health, payments, practice, reports, session_analysis, sessions, subscription, telemetry, voice
from app.services.cartesia_service import CartesiaService
from app.services.deepgram_service import DeepgramService
from app.services.firestore_service import FirestoreService
from app.services.gemini_service import GeminiService
from app.services.scenario_service import ScenarioService
from app.services.course_service import CourseService
from app.services.course_template_service import CourseTemplateService
from app.services.course_schedule_service import CourseScheduleService
from app.services.gamification_service import GamificationService
from app.services.notification_service import NotificationService
from app.services.conversation_coordination_service import ConversationCoordinationService
from app.services.telemetry_service import TelemetryService
from app.services.safety_scope_service import SafetyScopeService
from app.services.coach_service import CoachService
from app.services.cross_examination_service import CrossExaminationService
from app.services.prosody_extractor import ProsodyExtractor

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
app.state.scenarios = ScenarioService(app.state.ai)
app.state.courses = CourseService(app.state.ai)
app.state.course_templates = CourseTemplateService()
app.state.course_schedule = CourseScheduleService()
app.state.gamification = GamificationService()
app.state.notifications = NotificationService()
app.state.conversation_coordination = ConversationCoordinationService(app.state.store)
app.state.telemetry = TelemetryService(app.state.store)
app.state.safety_scope = SafetyScopeService(app.state.store)
app.state.coach = CoachService(app.state.store)
app.state.cross_examination = CrossExaminationService(app.state.store)
app.state.deepgram = DeepgramService()
app.state.cartesia = CartesiaService()
app.state.prosody = ProsodyExtractor()

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(contact.router)
app.include_router(sessions.router)
app.include_router(reports.router)
app.include_router(payments.router)
app.include_router(practice.router)
app.include_router(courses.router)
app.include_router(subscription.router)
app.include_router(admin.router)
app.include_router(conversation.router)
app.include_router(telemetry.router)
app.include_router(voice.router)
app.include_router(session_analysis.router)
