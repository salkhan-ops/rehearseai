from typing import Literal, Optional
from pydantic import BaseModel, Field


class AudioConversationState(BaseModel):
    volume_rms: float = 0
    silence_category: Literal["micro_pause", "yielding_pause", "abandoned_pause"] = "micro_pause"
    filler_rate: float = 0
    voice_onset_delay_ms: int = 0
    pitch_rising: bool = False
    volume_rising: bool = False
    sampled_at: int = 0


class VisionConversationState(BaseModel):
    gaze_on_camera: float = 0
    brow_raised: float = 0
    brow_furrowed: float = 0
    mouth_aperture: float = 0
    head_nodding: bool = False
    speech_readiness: float = 0
    engagement_score: float = 0
    confusion_score: float = 0
    sampled_at: int = 0


class TranscriptConversationState(BaseModel):
    final: str = ""
    interim: str = ""
    is_final: bool = False
    speech_final: bool = False


class TimingConversationState(BaseModel):
    silence_ms: int = 0
    speech_duration_ms: int = 0


class ConversationState(BaseModel):
    audio: AudioConversationState = Field(default_factory=AudioConversationState)
    vision: VisionConversationState = Field(default_factory=VisionConversationState)
    transcript: TranscriptConversationState = Field(default_factory=TranscriptConversationState)
    timing: TimingConversationState = Field(default_factory=TimingConversationState)
    turn_complete_probability: float = 0
    engine_state: Literal["LISTENING", "PROCESSING", "AI_SPEAKING", "WAITING", "PROMPTING"] = "WAITING"
    sampled_at: int = 0


class MessageCreate(BaseModel):
    userId: str = Field(default="guest")
    content: str = Field(min_length=1, max_length=4000)
    interimTranscript: str = ""
    speechDurationMs: int = 0
    silenceMs: int = 0
    wordTimings: Optional[list[dict]] = None
    coordinationContext: Optional[dict] = None
    conversationState: Optional[ConversationState] = None
    conversationMode: Optional[Literal["manual", "natural"]] = None
    turnTiming: Optional[dict] = None
    speechEmotion: Optional[dict] = None


class Message(BaseModel):
    id: str
    role: Literal["user", "ai"]
    content: str
    createdAt: str
    metadata: Optional[dict] = None
