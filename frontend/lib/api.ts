import type { Message, Report, Session, SessionPayload } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ApiOptions = RequestInit & { token?: string | null };

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
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

export function getUserSessions(userId = "guest", token?: string | null) {
  return request<Session[]>(`/api/users/${userId}/sessions`, { token });
}
