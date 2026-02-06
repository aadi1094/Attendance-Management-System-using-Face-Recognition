"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, WebcamCapture } from "@/components";
import { useToast } from "@/lib/toast";
import {
  getAuthUser,
  clearAuth,
  getStudent,
  uploadFaceImage,
  getTrainStatus,
  listSubjects,
  listAttendance,
} from "@/lib/api";

const MIN_IMAGES = 15;

export default function StudentDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [student, setStudent] = useState<{ imageCount: number } | null>(null);
  const [modelTrained, setModelTrained] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [myAttSubject, setMyAttSubject] = useState("");
  const [myAttDateFrom, setMyAttDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [myAttDateTo, setMyAttDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [myAttRecords, setMyAttRecords] = useState<{ subject: string; date: string; time: string }[]>([]);
  const [myAttLoading, setMyAttLoading] = useState(false);

  useEffect(() => {
    const u = getAuthUser();
    if (!u || u.role !== "student") {
      router.push("/login");
      return;
    }
    setUser(u);
    if (u.enrollment) {
      getStudent(u.enrollment)
        .then((s) => setStudent(s))
        .catch(() => setStudent({ imageCount: 0 }));
      getTrainStatus()
        .then((r) => setModelTrained(r.trained))
        .catch(() => setModelTrained(false));
      listSubjects()
        .then((r) => setSubjects(r.subjects || []))
        .catch(() => setSubjects([]));
    }
  }, [router]);

  const loadMyAttendance = async () => {
    if (!user?.enrollment) return;
    setMyAttLoading(true);
    try {
      const r = await listAttendance({
        enrollment: user.enrollment,
        subject: myAttSubject || undefined,
        dateFrom: myAttDateFrom || undefined,
        dateTo: myAttDateTo || undefined,
        limit: 200,
      });
      setMyAttRecords(r.attendance || []);
    } catch {
      setMyAttRecords([]);
    } finally {
      setMyAttLoading(false);
    }
  };

  useEffect(() => {
    if (user?.enrollment && myAttDateFrom && myAttDateTo) loadMyAttendance();
  }, [user?.enrollment, myAttSubject, myAttDateFrom, myAttDateTo]);

  const refreshData = async () => {
    if (!user?.enrollment) return;
    try {
      const s = await getStudent(user.enrollment);
      setStudent(s);
      const r = await getTrainStatus();
      setModelTrained(r.trained);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const handleCapture = async (imageBase64: string) => {
    if (!user?.enrollment) return;
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      await uploadFaceImage(user.enrollment, imageBase64);
      setSuccess("Image uploaded! Capture more for better recognition.");
      toast("Image uploaded! Capture more for better recognition.", "success");
      await refreshData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <div className="p-8">Loading...</div>;

  const imageCount = student?.imageCount ?? 0;
  const imagesReady = imageCount >= MIN_IMAGES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Status */}
      <Card title="Your Status">
        <div className="space-y-3">
          <StatusRow done label="Registered" />
          <StatusRow
            done={imagesReady}
            label={`Face images: ${imageCount}/${MIN_IMAGES}`}
          />
          <StatusRow
            done={modelTrained}
            label="Model trained (admin triggers this)"
          />
        </div>
      </Card>

      {/* Profile */}
      <Card title="Profile">
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Enrollment</dt>
            <dd className="font-medium">{user.enrollment}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Name</dt>
            <dd className="font-medium">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>
      </Card>

      {/* My Attendance */}
      <Card title="My Attendance">
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          View your attendance records for a subject and date range.
        </p>
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Subject</label>
            <select
              value={myAttSubject}
              onChange={(e) => setMyAttSubject(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">From</label>
            <input
              type="date"
              value={myAttDateFrom}
              onChange={(e) => setMyAttDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">To</label>
            <input
              type="date"
              value={myAttDateTo}
              onChange={(e) => setMyAttDateTo(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={loadMyAttendance} disabled={myAttLoading} variant="outline" size="sm">
              {myAttLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
        {myAttSubject ? (
          <MyAttendanceBySubject
            records={myAttRecords}
            subject={myAttSubject}
            dateFrom={myAttDateFrom}
            dateTo={myAttDateTo}
          />
        ) : (
          <MyAttendanceAll records={myAttRecords} />
        )}
      </Card>

      {/* Upload face */}
      <Card title="Add face images">
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Capture at least {MIN_IMAGES} clear photos for best recognition. Use the guided prompts for variety.
        </p>
        <p className="mb-4 text-xs text-zinc-500">
          Tips: Good lighting, face the camera, vary angles slightly. Avoid blurry or dark images.
        </p>
        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
        {success && <p className="mb-2 text-sm text-emerald-600">{success}</p>}
        <WebcamCapture
          onCapture={handleCapture}
          disabled={uploading}
          guided
          totalSteps={MIN_IMAGES}
          currentCount={imageCount}
        />
      </Card>
    </div>
  );
}

function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function MyAttendanceBySubject({
  records,
  subject,
  dateFrom,
  dateTo,
}: {
  records: { subject: string; date: string; time: string }[];
  subject: string;
  dateFrom: string;
  dateTo: string;
}) {
  const dates = getDatesInRange(dateFrom, dateTo);
  const presentSet = new Set(records.filter((r) => r.subject === subject).map((r) => r.date));
  const presentCount = dates.filter((d) => presentSet.has(d)).length;
  const absentCount = dates.length - presentCount;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Summary: <span className="text-emerald-600">{presentCount} present</span>
        {", "}
        <span className="text-red-600">{absentCount} absent</span>
      </p>
      <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => {
              const rec = records.find((r) => r.subject === subject && r.date === d);
              const status = rec ? "Present" : "Absent";
              return (
                <tr key={d} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{d}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        status === "Present"
                          ? "text-emerald-600 font-medium"
                          : "text-red-600"
                      }
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{rec?.time ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MyAttendanceAll({
  records,
}: {
  records: { subject: string; date: string; time: string }[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {records.length} attendance record{records.length !== 1 ? "s" : ""} in range
      </p>
      <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Subject</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                  No attendance records in selected range
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.subject}</td>
                  <td className="px-3 py-2">{r.time}</td>
                  <td className="px-3 py-2 text-emerald-600 font-medium">Present</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusRow({
  done,
  label,
}: {
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
          done
            ? "bg-emerald-500 text-white"
            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
        }`}
      >
        {done ? "✓" : "—"}
      </span>
      <span className={done ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500"}>
        {label}
      </span>
    </div>
  );
}
