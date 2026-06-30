import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

// Writes structured debug log entries to session-logs/ at the project root.
// Only active when NEXT_PUBLIC_DEBUG_SESSION_LOG=true (dev use only).

const LOGS_DIR = path.resolve(process.cwd(), "..", "session-logs");

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_DEBUG_SESSION_LOG !== "true") {
    return NextResponse.json({ ok: false, reason: "logging disabled" }, { status: 403 });
  }

  let body: { file: string; entry: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid json" }, { status: 400 });
  }

  const { file, entry } = body;
  if (!file || typeof file !== "string" || !/^session_[\w-]+\.jsonl$/.test(file)) {
    return NextResponse.json({ ok: false, reason: "invalid filename" }, { status: 400 });
  }

  try {
    ensureLogsDir();
    const filePath = path.join(LOGS_DIR, file);
    fs.appendFileSync(filePath, JSON.stringify({ ...entry, _ts: new Date().toISOString() }) + "\n", "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[session-log] write failed:", err);
    return NextResponse.json({ ok: false, reason: "write failed" }, { status: 500 });
  }
}
