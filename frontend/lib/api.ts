import type { Achievement, CalibrationStart, ConversationAnalyzePayload, ConversationControl, ConversationCoordinationState, Course, CourseBundle, CourseGeneratePayload, CourseSession, CourseTemplate, CourseTemplateEnrollmentPayload, CurrentSubscription, DailyChallenge, Difficulty, HintSummary, Message, NotificationItem, PerformanceAnalytics, PracticeHistory, PracticeScenario, PracticeSchedule, PracticeType, Report, Session, SessionAnalysis, SessionHint, SessionPayload, UserProgress, VoiceProfile } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ApiOptions = RequestInit & { token?: string | null };

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {})
      },
      cache: "no-store"
    });
  } catch {
    throw new Error(`Could not reach the backend at ${API_URL}. Make sure FastAPI is running and CORS allows this frontend URL.`);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`API request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
  }
  return response.json() as Promise<T>;
}

export function createSession(payload: SessionPayload, token?: string | null) {
  return request<Session>("/api/sessions", { method: "POST", body: JSON.stringify(payload), token });
}

export function getSession(id: string, token?: string | null) {
  return request<{ session: Session; messages: Message[] }>(`/api/sessions/${id}`, { token });
}

export function sendMessage(sessionId: string, content: string, userId = "guest", token?: string | null, coordination?: Partial<ConversationAnalyzePayload>) {
  return request<{ userMessage: Message; aiMessage: Message; turnCount: number; hint?: SessionHint; dynamics?: Record<string, unknown>; conversationControl?: ConversationControl }>(`/api/sessions/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({ userId, content, ...(coordination || {}) }),
    token
  });
}

export function getSessionHints(sessionId: string, token?: string | null) {
  return request<SessionHint[]>(`/api/sessions/${sessionId}/hints`, { token });
}

export function updateSessionHint(hintId: string, payload: { wasViewed?: boolean; wasExpanded?: boolean }, token?: string | null) {
  return request<SessionHint>(`/api/session-hints/${hintId}`, { method: "POST", body: JSON.stringify(payload), token });
}

export function endSession(sessionId: string, token?: string | null) {
  return request<Session>(`/api/sessions/${sessionId}/end`, { method: "POST", token });
}

export function generateReport(sessionId: string, token?: string | null) {
  return request<Report>(`/api/sessions/${sessionId}/report`, { method: "POST", token });
}

export function analyzeSession(sessionId: string, token?: string | null) {
  return request<{ status: string }>(`/api/sessions/${sessionId}/analyze`, { method: "POST", token });
}

export function getSessionAnalysis(sessionId: string, token?: string | null) {
  return request<SessionAnalysis>(`/api/sessions/${sessionId}/analysis`, { token });
}

export function getReport(reportId: string, token?: string | null) {
  return request<Report>(`/api/reports/${reportId}`, { token });
}

export function getReportAnalytics(reportId: string, token?: string | null) {
  return request<PerformanceAnalytics>(`/api/reports/${reportId}/analytics`, { token });
}

export function getUserSessions(userId = "guest", token?: string | null) {
  return request<Session[]>(`/api/users/${userId}/sessions`, { token });
}

export function getUserHintSummary(userId = "guest", token?: string | null) {
  return request<HintSummary>(`/api/users/${userId}/hint-summary`, { token });
}

export async function synthesizeSpeech(text: string, voiceId?: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`TTS request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
  }
  return response.blob();
}

export async function synthesizeSpeechStream(text: string, voiceId?: string): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_URL}/api/voice/tts/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`TTS stream request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
  }
  if (!response.body) throw new Error("No response body from TTS stream endpoint.");
  return response.body;
}

export function submitContact(payload: { name: string; email: string; category: string; subject: string; message: string; userId?: string }) {
  return request<{ ok: boolean; id: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createPracticeSchedule(payload: Partial<PracticeSchedule> & { userId: string }, token?: string | null) {
  return request<PracticeSchedule>("/api/practice-schedules", { method: "POST", body: JSON.stringify(payload), token });
}

export function getPracticeSchedules(userId = "guest", token?: string | null) {
  return request<PracticeSchedule[]>(`/api/users/${userId}/practice-schedules`, { token });
}

export function updatePracticeSchedule(scheduleId: string, payload: Partial<PracticeSchedule>, token?: string | null) {
  return request<PracticeSchedule>(`/api/practice-schedules/${scheduleId}`, { method: "PATCH", body: JSON.stringify(payload), token });
}

export function getPracticeHistory(userId = "guest", token?: string | null) {
  return request<PracticeHistory[]>(`/api/users/${userId}/practice-history`, { token });
}

export function trackPracticeHistory(payload: Partial<PracticeHistory> & { userId: string }, token?: string | null) {
  return request<PracticeHistory>("/api/practice-history", { method: "POST", body: JSON.stringify(payload), token });
}

export function generateRandomScenario(payload: { userId: string; category: PracticeType; difficulty: Difficulty; practiceLanguage?: string; feedbackLanguage?: string; targetRole?: string; experienceLevel?: string }, token?: string | null) {
  return request<PracticeScenario>("/api/scenarios/random", { method: "POST", body: JSON.stringify(payload), token });
}

export function getDailyChallenge(userId = "guest", token?: string | null) {
  return request<DailyChallenge>(`/api/users/${userId}/daily-challenge`, { token });
}

export function quickStartChallenge(payload: { userId: string; category: PracticeType; difficulty: Difficulty; practiceLanguage?: string; feedbackLanguage?: string; durationPreference?: number }, token?: string | null) {
  return request<{ scenario: PracticeScenario; session: Session }>("/api/scenarios/quick-start", { method: "POST", body: JSON.stringify(payload), token });
}

export function generateCourse(payload: CourseGeneratePayload, token?: string | null) {
  return request<CourseBundle>("/api/courses/generate", { method: "POST", body: JSON.stringify(payload), token });
}

export function getCourseTemplates(token?: string | null) {
  return request<CourseTemplate[]>("/api/courses/templates", { token });
}

export function enrollCourseTemplate(payload: CourseTemplateEnrollmentPayload, token?: string | null) {
  return request<CourseBundle>("/api/courses/enroll-template", { method: "POST", body: JSON.stringify(payload), token });
}

export function getUserCourses(userId = "guest", token?: string | null) {
  return request<Course[]>(`/api/users/${userId}/courses`, { token });
}

export function getCourse(courseId: string, token?: string | null) {
  return request<CourseBundle>(`/api/courses/${courseId}`, { token });
}

export function startCourseSession(courseSessionId: string, token?: string | null) {
  return request<{ sessionId: string; courseSessionId: string }>(`/api/course-sessions/${courseSessionId}/start`, { method: "POST", token });
}

export function completeCourseSession(courseSessionId: string, sessionId?: string, token?: string | null) {
  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  return request(`/api/course-sessions/${courseSessionId}/complete${query}`, { method: "POST", token });
}

export function rescheduleCourseSession(courseSessionId: string, payload: { scheduledDate?: string; scheduledTime?: string; status?: CourseSession["status"] }, token?: string | null) {
  return request<CourseSession>(`/api/course-sessions/${courseSessionId}/reschedule`, { method: "POST", body: JSON.stringify(payload), token });
}

export function getNotifications(token?: string | null) {
  return request<NotificationItem[]>("/api/notifications", { token });
}

export function markNotificationRead(notificationId: string, token?: string | null) {
  return request<NotificationItem>(`/api/notifications/${notificationId}/read`, { method: "POST", token });
}

export function getProgress(token?: string | null) {
  return request<UserProgress>("/api/progress", { token });
}

export function getAchievements(token?: string | null) {
  return request<Achievement[]>("/api/achievements", { token });
}

export function getCurrentSubscription(token?: string | null) {
  return request<CurrentSubscription>("/api/subscription/current", { token });
}

export function cancelSubscription(reason = "", token?: string | null) {
  return request<CurrentSubscription>("/api/subscription/cancel", { method: "POST", body: JSON.stringify({ reason }), token });
}

export function reactivateSubscription(token?: string | null) {
  return request<CurrentSubscription>("/api/subscription/reactivate", { method: "POST", token });
}

export function getSubscriptionPortalLink(token?: string | null) {
  return request<{ url: string | null; provider: "paddle"; message: string; uid: string }>("/api/subscription/portal-link", { token });
}

export function requestAccountDeletion(reason = "", token?: string | null) {
  return request<Record<string, unknown>>("/api/account/delete-request", { method: "POST", body: JSON.stringify({ reason }), token });
}

export function startVoiceCalibration(userId = "guest", token?: string | null) {
  return request<CalibrationStart>("/api/voice/calibration/start", { method: "POST", body: JSON.stringify({ userId }), token });
}

export function completeVoiceCalibration(payload: { userId: string; transcript: string; speechDurationMs: number; pausesMs?: number[]; wordTimings?: Array<{ word: string; startMs?: number; endMs?: number }> }, token?: string | null) {
  return request<VoiceProfile>("/api/voice/calibration/complete", { method: "POST", body: JSON.stringify(payload), token });
}

export function getVoiceProfile(userId = "guest", token?: string | null) {
  return request<VoiceProfile>(`/api/voice/profile/${userId}`, { token });
}

export function analyzeConversationCoordination(payload: ConversationAnalyzePayload, token?: string | null) {
  return request<ConversationCoordinationState>("/api/conversation/coordination/analyze", { method: "POST", body: JSON.stringify(payload), token });
}
