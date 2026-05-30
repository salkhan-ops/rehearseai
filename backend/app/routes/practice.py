from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request

from app.models.practice import PracticeHistoryCreate, PracticeScheduleCreate, QuickStartRequest, ScenarioRequest
from app.models.session import SessionCreate
from app.services.firestore_service import FirestoreService
from app.services.reminder_service import ReminderService
from app.services.scenario_service import ScenarioService
from app.utils.security import get_current_user_id

router = APIRouter()


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


def get_scenarios(request: Request) -> ScenarioService:
    return request.app.state.scenarios


@router.post("/api/practice-schedules")
async def create_practice_schedule(payload: PracticeScheduleCreate, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    schedule = await get_store(request).create_practice_schedule(payload)
    return {**schedule.model_dump(), "nextReminderAt": ReminderService().next_reminder_at(schedule.model_dump())}


@router.get("/api/users/{user_id}/practice-schedules")
async def list_practice_schedules(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    schedules = await get_store(request).list_practice_schedules(resolved_user_id)
    reminder = ReminderService()
    return [{**item.model_dump(), "nextReminderAt": reminder.next_reminder_at(item.model_dump())} for item in schedules]


@router.patch("/api/practice-schedules/{schedule_id}")
async def update_practice_schedule(schedule_id: str, updates: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    schedule = await get_store(request).get_practice_schedule(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if current_user_id and schedule.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Schedule does not belong to this user")
    updated = await get_store(request).update_practice_schedule(schedule_id, updates)
    return updated


@router.post("/api/practice-history")
async def create_practice_history(payload: PracticeHistoryCreate, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    return await get_store(request).create_practice_history(payload)


@router.get("/api/users/{user_id}/practice-history")
async def list_practice_history(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    return await get_store(request).list_practice_history(resolved_user_id)


@router.post("/api/scenarios/random")
async def random_scenario(payload: ScenarioRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    history = [item.model_dump() for item in await get_store(request).list_practice_history(payload.userId)]
    return await get_scenarios(request).generate_random_scenario(payload, history)


@router.get("/api/users/{user_id}/daily-challenge")
async def daily_challenge(user_id: str, request: Request, category: Optional[str] = None, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    return await get_scenarios(request).generate_daily_challenge(resolved_user_id, category)


@router.post("/api/scenarios/quick-start")
async def quick_start(payload: QuickStartRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    store = get_store(request)
    history = [item.model_dump() for item in await store.list_practice_history(payload.userId)]
    scenario = await get_scenarios(request).generate_progressive_difficulty_scenario(payload, history)
    session = await store.create_session(SessionCreate(
        userId=payload.userId,
        practiceType=scenario.category,
        difficulty=scenario.difficulty,
        practiceLanguage=payload.practiceLanguage,
        feedbackLanguage=payload.feedbackLanguage,
        durationPreference=payload.durationPreference,
        topic=scenario.topic,
        context=f"{scenario.setting}\n\nEmotional context: {scenario.emotionalContext}\nPressure: {scenario.pressureSituation}",
        goal=scenario.objective,
        optionalNotes=scenario.optionalNotes,
    ))
    await store.create_practice_history(PracticeHistoryCreate(userId=payload.userId, sessionId=session.id, completed=False, streakDay=len(history) + 1))
    return {"scenario": scenario, "session": session}
