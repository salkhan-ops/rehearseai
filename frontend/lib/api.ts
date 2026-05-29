import type { Message, PerformanceAnalytics, Report, Session, SessionPayload } from "./types";

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

export function sendMessage(sessionId: string, content: string, userId = "guest", token?: string | null) {
  return request<{ userMessage: Message; aiMessage: Message; turnCount: number }>(`/api/sessions/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({ userId, content }),
    token
  });
}

export function endSession(sessionId: string, token?: string | null) {
  return request<Session>(`/api/sessions/${sessionId}/end`, { method: "POST", token });
}

export function generateReport(sessionId: string, token?: string | null) {
  return request<Report>(`/api/sessions/${sessionId}/report`, { method: "POST", token });
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

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`TTS request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
  }
  return response.blob();
}
