const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Auth
export type AuthRole = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  name?: string;
  enrollment?: string;
  assignedSubjectIds?: string[];
}

export async function loginAPI(email: string, password: string, role: AuthRole) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Login failed");
  }
  return res.json() as Promise<{ token: string; user: AuthUser }>;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

export async function apiHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}

// Students
export async function registerStudent(data: {
  enrollment: string;
  name: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/api/students/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Registration failed");
  }
  return res.json();
}

export async function listStudents(params?: { skip?: number; limit?: number }) {
  const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)) : {};
  const q = new URLSearchParams(p as Record<string, string>).toString();
  const res = await fetch(`${API_BASE}/api/students${q ? `?${q}` : ""}`);
  if (!res.ok) throw new Error("Failed to list students");
  return res.json();
}

export async function getStudent(enrollment: string) {
  const res = await fetch(`${API_BASE}/api/students/${enrollment}`);
  if (!res.ok) throw new Error("Student not found");
  return res.json();
}

export async function deleteStudent(enrollment: string) {
  const res = await fetch(`${API_BASE}/api/students/${enrollment}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to delete student");
  }
}

// Face images & training
export async function uploadFaceImage(enrollment: string, imageBase64: string) {
  const res = await fetch(`${API_BASE}/api/students/${enrollment}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Upload failed");
  }
  return res.json();
}

export async function getTrainStatus() {
  const res = await fetch(`${API_BASE}/api/train/status`);
  if (!res.ok) throw new Error("Failed to get train status");
  return res.json() as Promise<{ trained: boolean }>;
}

export async function trainModel() {
  const res = await fetch(`${API_BASE}/api/train`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Training failed");
  }
  return res.json();
}

// Subjects
export async function listSubjects() {
  const res = await fetch(`${API_BASE}/api/subjects`);
  if (!res.ok) throw new Error("Failed to list subjects");
  return res.json() as Promise<{ subjects: { id: string; name: string }[] }>;
}

export async function listTeachers() {
  const res = await fetch(`${API_BASE}/api/teachers`);
  if (!res.ok) throw new Error("Failed to list teachers");
  return res.json() as Promise<{ teachers: { id: string; name: string; email: string; assignedSubjectIds?: string[] }[] }>;
}

export async function getTeacher(teacherId: string) {
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}`);
  if (!res.ok) throw new Error("Failed to get teacher");
  return res.json() as Promise<{ id: string; name: string; email: string; assignedSubjectIds: string[] }>;
}

export async function updateTeacherSubjects(teacherId: string, assignedSubjectIds: string[]) {
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignedSubjectIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to update teacher");
  }
  return res.json();
}

export async function createTeacher(data: { name: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/teachers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to create teacher");
  }
  return res.json();
}

export async function createSubject(name: string) {
  const res = await fetch(`${API_BASE}/api/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to create subject");
  }
  return res.json();
}

// Attendance
export async function recordAutoAttendance(imageBase64: string, subject: string) {
  const res = await fetch(`${API_BASE}/api/attendance/auto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, subject }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Auto attendance failed");
  }
  return res.json();
}

export async function recordManualAttendance(data: {
  enrollment: string;
  name: string;
  subject: string;
  date?: string;
  time?: string;
}) {
  const res = await fetch(`${API_BASE}/api/attendance/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Manual attendance failed");
  }
  return res.json();
}

export async function listAttendance(params?: {
  subject?: string;
  date?: string;
  enrollment?: string;
  dateFrom?: string;
  dateTo?: string;
  skip?: number;
  limit?: number;
}) {
  const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== "")) : {};
  const q = new URLSearchParams(p as Record<string, string>).toString();
  const res = await fetch(`${API_BASE}/api/attendance${q ? `?${q}` : ""}`);
  if (!res.ok) throw new Error("Failed to list attendance");
  return res.json();
}

export function getAttendanceExportUrl(params?: {
  subject?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  enrollment?: string;
}): string {
  const p = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== "")) : {};
  const q = new URLSearchParams(p as Record<string, string>).toString();
  return `${API_BASE}/api/attendance/export${q ? `?${q}` : ""}`;
}

export async function downloadAttendanceCsv(params?: {
  subject?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  enrollment?: string;
}): Promise<void> {
  const url = getAttendanceExportUrl(params);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to export attendance");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = "attendance.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
