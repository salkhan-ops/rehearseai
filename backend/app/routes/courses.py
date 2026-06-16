from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request

from app.models.course import Course, CourseBundle, CourseGenerateRequest, CourseModule, CourseProgress, CourseTemplateEnrollmentRequest
from app.models.practice import PracticeHistoryCreate
from app.models.session import SessionCreate
from app.services.course_service import CourseService
from app.services.course_template_service import CourseTemplateService
from app.services.course_schedule_service import CourseScheduleService
from app.services.firestore_service import FirestoreService
from app.services.gamification_service import GamificationService
from app.services.notification_service import NotificationService
from app.utils.timestamps import utc_now_iso
from app.utils.security import get_current_user_id, get_current_user_id_or_guest

router = APIRouter()


def get_store(request: Request) -> FirestoreService:
    return request.app.state.store


def get_courses(request: Request) -> CourseService:
    return request.app.state.courses


def get_templates(request: Request) -> CourseTemplateService:
    return request.app.state.course_templates


def get_schedule(request: Request) -> CourseScheduleService:
    return request.app.state.course_schedule


def get_notifications(request: Request) -> NotificationService:
    return request.app.state.notifications


def get_gamification(request: Request) -> GamificationService:
    return request.app.state.gamification


@router.get("/api/courses/templates")
async def course_templates(request: Request):
    return get_templates(request).get_course_templates()


@router.post("/api/courses/enroll-template")
async def enroll_template(payload: CourseTemplateEnrollmentRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    template = get_templates(request).get_template(payload.templateId)
    if not template:
        raise HTTPException(status_code=404, detail="Course template not found")
    now = utc_now_iso()
    course_id = f"{payload.userId}_{template.id}_{now.replace(':', '').replace('-', '')[:15]}"
    course = Course(
        id=course_id,
        userId=payload.userId,
        templateId=template.id,
        title=template.title,
        goal=template.description,
        status="active",
        durationDays=template.durationDays,
        difficulty=payload.difficulty,
        targetSkills=template.targetSkills,
        weeklyHours=3 if "3" in template.frequency else 5,
        startDate=payload.preferredStartDate,
        endDate=None,
        preferredDays=payload.preferredDays,
        preferredTime=payload.preferredTime,
        timezone=payload.timezone,
        reminderMinutesBefore=payload.reminderMinutesBefore,
        progressPercent=0,
        milestones=_milestones(template.durationDays),
        practiceLanguage=payload.practiceLanguage,
        feedbackLanguage=payload.feedbackLanguage,
        createdAt=now,
        updatedAt=now,
    )
    sessions = get_schedule(request).generate_course_schedule(course, template, payload)
    modules = [
        CourseModule(id=f"{course_id}_module_{index}", courseId=course_id, title=f"{skill.title()} Track", objective=f"Develop {skill} through scheduled pressure missions.", order=index + 1, createdAt=now)
        for index, skill in enumerate(template.targetSkills[:4])
    ]
    progress = CourseProgress(id=f"{course_id}_progress", userId=payload.userId, courseId=course_id, totalSessions=len(sessions), updatedAt=now)
    bundle = await get_store(request).save_course_bundle(CourseBundle(course=course, modules=modules, sessions=sessions, progress=progress))
    for notification in get_notifications(request).create_course_reminders(payload.userId, course.id, course.title, len(sessions)):
        await get_store(request).create_notification(notification)
    return bundle


def _milestones(duration_days: int) -> list[dict]:
    if duration_days <= 7:
        days = [1, 3, 7]
    elif duration_days <= 30:
        days = [3, 7, 14, 21, duration_days]
    else:
        days = [7, 21, 42, 63, duration_days]
    labels = ["Baseline measured", "First pressure benchmark", "Improvement checkpoint", "Advanced interruption challenge", "Final cognitive performance test"]
    return [{"day": day, "title": labels[index] if index < len(labels) else "Training milestone", "completed": False} for index, day in enumerate(days)]


@router.post("/api/courses/generate")
async def generate_course(payload: CourseGenerateRequest, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    if current_user_id:
        payload.userId = current_user_id
    store = get_store(request)
    history = [item.model_dump() for item in await store.list_practice_history(payload.userId)]
    bundle = await get_courses(request).generate_course(payload, history)
    return await store.save_course_bundle(bundle)


@router.get("/api/users/{user_id}/courses")
async def list_courses(user_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    resolved_user_id = current_user_id or user_id
    return await get_store(request).list_user_courses(resolved_user_id)


@router.get("/api/courses/{course_id}")
async def get_course(course_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    bundle = await get_store(request).get_course_bundle(course_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user_id and bundle.course.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Course does not belong to this user")
    return bundle


@router.get("/api/courses/{course_id}/calendar")
async def course_calendar(course_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    bundle = await get_store(request).get_course_bundle(course_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user_id and bundle.course.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Course does not belong to this user")
    return {"course": bundle.course, "sessions": bundle.sessions, "milestones": bundle.course.milestones}


@router.post("/api/course-sessions/{course_session_id}/start")
async def start_course_session(course_session_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    course_session = await store.get_course_session(course_session_id)
    if not course_session:
        raise HTTPException(status_code=404, detail="Course session not found")
    if current_user_id and course_session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Course session does not belong to this user")
    course = await store.get_course(course_session.courseId)
    scenario = course_session.generatedScenario
    session = await store.create_session(SessionCreate(
        userId=course_session.userId,
        practiceType=course_session.practiceType,
        difficulty=course.difficulty if course else "Intermediate",
        practiceLanguage=course.practiceLanguage if course else "en",
        feedbackLanguage=course.feedbackLanguage if course else "en",
        durationPreference=course_session.durationMinutes,
        topic=scenario.get("topic", course_session.reasoningFocus),
        context=f"{scenario.get('setting', '')}\n\nEmotional context: {scenario.get('emotionalContext', '')}\nPressure: {scenario.get('pressureSituation', '')}",
        goal=scenario.get("objective", f"Practice {course_session.reasoningFocus}"),
        optionalNotes=scenario.get("optionalNotes", ""),
    ))
    await store.create_practice_history(PracticeHistoryCreate(userId=course_session.userId, sessionId=session.id, completed=False, streakDay=0))
    return {"sessionId": session.id, "courseSessionId": course_session.id}


@router.post("/api/course-sessions/{course_session_id}/complete")
async def complete_course_session(course_session_id: str, request: Request, session_id: Optional[str] = None, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    course_session = await store.get_course_session(course_session_id)
    if not course_session:
        raise HTTPException(status_code=404, detail="Course session not found")
    if current_user_id and course_session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Course session does not belong to this user")
    completed = await store.complete_course_session(course_session_id, session_id)
    progress = await store.get_user_progress(course_session.userId)
    progress.completedSessions += 1
    progress.streak += 1
    progress.longestStreak = max(progress.longestStreak, progress.streak)
    gamification = get_gamification(request)
    progress = gamification.award_xp(progress, 50 + (20 if course_session.status == "scheduled" else 0) + (75 if course_session.pressureLevel >= 85 else 0))
    unlocked = []
    for key in ["first_session", "streak_3" if progress.streak >= 3 else "", "streak_7" if progress.streak >= 7 else "", "brutal_survivor" if course_session.pressureLevel >= 85 else "", "logic_clarity" if "logical" in course_session.reasoningFocus else "", "concise_streak" if "concise" in course_session.reasoningFocus else ""]:
        if not key:
            continue
        achievement = gamification.unlock_achievement(course_session.userId, key, progress.achievements)
        if achievement:
            progress.achievements.append(key)
            unlocked.append(await store.save_achievement(achievement))
            await store.create_notification(get_notifications(request).create_notification(course_session.userId, "achievement_earned", achievement.title, achievement.description, "/notifications"))
    course = await store.get_course(course_session.courseId)
    bundle = await store.get_course_bundle(course_session.courseId)
    if course and bundle and bundle.progress.completedSessions >= bundle.progress.totalSessions:
        progress.completedCourses += 1
        key = "course_7" if course.durationDays <= 7 else "course_30" if course.durationDays <= 30 else "course_executive"
        achievement = gamification.unlock_achievement(course_session.userId, key, progress.achievements)
        if achievement:
            progress.achievements.append(key)
            unlocked.append(await store.save_achievement(achievement))
        await store.create_notification(get_notifications(request).create_notification(course_session.userId, "course_completion", "Course completed", f"You completed {course.title}. Your certificate is ready.", f"/course/{course.id}"))
    await store.save_user_progress(progress)
    return {"session": completed, "userProgress": progress, "achievements": unlocked}


@router.post("/api/course-sessions/{course_session_id}/reschedule")
async def reschedule_course_session(course_session_id: str, updates: dict, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    store = get_store(request)
    course_session = await store.get_course_session(course_session_id)
    if not course_session:
        raise HTTPException(status_code=404, detail="Course session not found")
    if current_user_id and course_session.userId != current_user_id:
        raise HTTPException(status_code=403, detail="Course session does not belong to this user")
    updated = course_session.model_copy(update={
        "scheduledDate": updates.get("scheduledDate", course_session.scheduledDate),
        "scheduledTime": updates.get("scheduledTime", course_session.scheduledTime),
        "status": updates.get("status", "rescheduled"),
    })
    return await store.update_course_session(updated)


@router.get("/api/notifications")
async def notifications(request: Request, current_user_id: Optional[str] = Depends(get_current_user_id_or_guest)):
    return await get_store(request).list_notifications(current_user_id or "guest")


@router.post("/api/notifications/{notification_id}/read")
async def read_notification(notification_id: str, request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    notification = await get_store(request).mark_notification_read(notification_id, current_user_id or "guest")
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.get("/api/progress")
async def user_progress(request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    progress = await get_store(request).get_user_progress(current_user_id or "guest")
    return {**progress.model_dump(), "nextLevelXp": get_gamification(request).next_level_xp(progress.xp)}


@router.get("/api/achievements")
async def achievements(request: Request, current_user_id: Optional[str] = Depends(get_current_user_id)):
    return await get_store(request).list_achievements(current_user_id or "guest")
