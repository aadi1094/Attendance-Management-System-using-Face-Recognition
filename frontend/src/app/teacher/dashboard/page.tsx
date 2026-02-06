"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, WebcamCapture } from "@/components";
import { useToast } from "@/lib/toast";
import {
  getAuthUser,
  clearAuth,
  listSubjects,
  listAttendance,
  downloadAttendanceCsv,
  recordManualAttendance,
  recordAutoAttendance,
  getTrainStatus,
} from "@/lib/api";

type Tab = "auto" | "view" | "manual";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [tab, setTab] = useState<Tab>("auto");
  const [modelTrained, setModelTrained] = useState(false);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [attendance, setAttendance] = useState<{ enrollment: string; name: string; subject: string; date: string; time: string }[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Manual form
  const [manualSubject, setManualSubject] = useState("");
  const [manualEnrollment, setManualEnrollment] = useState("");
  const [manualName, setManualName] = useState("");

  // Auto
  const [autoSubject, setAutoSubject] = useState("");

  useEffect(() => {
    const u = getAuthUser();
    if (!u || u.role !== "teacher") {
      router.push("/login");
      return;
    }
    setUser(u);
    listSubjects()
      .then((r) => {
        const all = r.subjects || [];
        const assignedIds = u.assignedSubjectIds || [];
        // If teacher has assigned subjects, show only those; else show all (backward compat)
        const filtered =
          assignedIds.length > 0 ? all.filter((s) => assignedIds.includes(s.id)) : all;
        setSubjects(filtered);
      })
      .catch(() => setSubjects([]));
    getTrainStatus()
      .then((r) => setModelTrained(r.trained))
      .catch(() => setModelTrained(false));
  }, [router]);

  const loadAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await listAttendance({
        subject: subjectFilter || undefined,
        date: dateFilter || undefined,
      });
      setAttendance(r.attendance || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && tab === "view") loadAttendance();
  }, [user, tab, subjectFilter, dateFilter]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await recordManualAttendance({
        enrollment: manualEnrollment,
        name: manualName,
        subject: manualSubject,
      });
      setSuccess("Attendance recorded.");
      toast("Attendance recorded.", "success");
      setManualEnrollment("");
      setManualName("");
      if (tab === "view") loadAttendance();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to record";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCapture = async (imageBase64: string) => {
    if (!autoSubject.trim()) {
      setError("Select a subject first");
      toast("Select a subject first", "error");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await recordAutoAttendance(imageBase64, autoSubject.trim()) as {
        records?: { name?: string }[];
        count?: number;
      };
      const records = res?.records ?? [];
      const count = res?.count ?? records.length;
      const names = records.map((r) => r.name).filter(Boolean).join(", ");
      const msg =
        count === 1
          ? `Attendance recorded for ${names || "1 student"}.`
          : `Attendance recorded for ${count} students${names ? `: ${names}` : ""}.`;
      setSuccess(msg);
      toast(msg, "success");
      if (tab === "view") loadAttendance();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Face recognition failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                modelTrained
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
              }`}
            >
              {modelTrained ? "✓ Face model trained" : "⚠ Face model not trained — ask admin"}
            </span>
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div
        className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-700"
        role="tablist"
        aria-label="Teacher sections"
      >
        {(["auto", "view", "manual"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => { setTab(t); setError(""); setSuccess(""); }}
            className={`px-3 py-2 sm:px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {t === "auto" ? "Automatic Attendance" : t === "view" ? "View Attendance" : "Manual Entry"}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      {tab === "view" && (
        <Card title="View Attendance">
          <div className="mb-4 flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Subject</label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={loadAttendance} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await downloadAttendanceCsv({
                      subject: subjectFilter || undefined,
                      date: dateFilter || undefined,
                    });
                    toast("CSV downloaded.", "success");
                  } catch {
                    toast("Export failed.", "error");
                  }
                }}
              >
                Export CSV
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-2 text-left">Enrollment</th>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Subject</th>
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No attendance records
                    </td>
                  </tr>
                ) : (
                  attendance.map((a, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-2">{a.enrollment}</td>
                      <td className="py-2">{a.name}</td>
                      <td className="py-2">{a.subject}</td>
                      <td className="py-2">{a.date}</td>
                      <td className="py-2">{a.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "manual" && (
        <Card title="Manual Attendance">
          <form onSubmit={handleManualSubmit} className="max-w-md space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Subject</label>
              <div className="flex gap-2">
                <select
                  onChange={(e) => e.target.value && setManualSubject(e.target.value)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2.5"
                >
                  <option value="">Pick existing</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  placeholder="e.g. Math, Physics"
                  required
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2.5"
                />
              </div>
            </div>
            <Input
              label="Enrollment"
              value={manualEnrollment}
              onChange={(e) => setManualEnrollment(e.target.value)}
              required
            />
            <Input
              label="Name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Record Attendance"}
            </Button>
          </form>
        </Card>
      )}

      {tab === "auto" && (
        <Card title="Automatic Attendance — Face Recognition">
          {!modelTrained && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              The face recognition model is not trained yet. Students must upload their face images, then an admin must run <strong>Train Model</strong> in the Admin dashboard. Until then, use Manual Entry to record attendance.
            </div>
          )}
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            This uses the <strong>trained face recognition model</strong> to identify students from the camera and record attendance automatically. Select a subject, then have one or more students face the camera and click Capture — multiple students in the same frame will all be marked.
          </p>
          {subjects.length === 0 && (
            <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
              No subjects available. Add subjects in Admin dashboard, or ask admin to assign subjects to you.
            </p>
          )}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">Subject</label>
            <select
              value={autoSubject}
              onChange={(e) => setAutoSubject(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2.5"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={autoSubject}
              onChange={(e) => setAutoSubject(e.target.value)}
              placeholder="Or type subject name"
              className="mt-2 w-full max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2.5"
            />
          </div>
          <WebcamCapture
            onCapture={handleAutoCapture}
            disabled={loading || !autoSubject.trim() || !modelTrained}
            resolution="hd"
          />
          {!modelTrained && (
            <p className="mt-2 text-sm text-zinc-500">Enable automatic attendance by training the model (Admin).</p>
          )}
        </Card>
      )}
    </div>
  );
}
