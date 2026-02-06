"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/components";
import { useToast } from "@/lib/toast";
import {
  getAuthUser,
  clearAuth,
  listStudents,
  listTeachers,
  listSubjects,
  listAttendance,
  registerStudent,
  deleteStudent,
  createTeacher,
  createSubject,
  trainModel,
  getTrainStatus,
} from "@/lib/api";

type Tab = "overview" | "students" | "teachers" | "subjects" | "train" | "attendance";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [students, setStudents] = useState<{ students: { enrollment: string; name: string; email: string; imageCount: number }[]; total: number }>({ students: [], total: 0 });
  const [teachers, setTeachers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [attendance, setAttendance] = useState<{ enrollment: string; name: string; subject: string; date: string; time: string }[]>([]);
  const [modelTrained, setModelTrained] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add student form
  const [newEnrollment, setNewEnrollment] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Add teacher form
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");

  // Add subject form
  const [newSubjectName, setNewSubjectName] = useState("");

  // Attendance filters
  const [attSubject, setAttSubject] = useState("");
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));

  const loadData = async () => {
    try {
      const [s, t, sub, trainStatus] = await Promise.all([
        listStudents({ limit: 100 }),
        listTeachers(),
        listSubjects(),
        getTrainStatus(),
      ]);
      setStudents(s);
      setTeachers(t.teachers || []);
      setSubjects(sub.subjects || []);
      setModelTrained(trainStatus.trained);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const u = getAuthUser();
    if (!u || u.role !== "admin") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadData();
  }, [router]);

  const loadAttendance = async () => {
    try {
      const r = await listAttendance({ subject: attSubject || undefined, date: attDate || undefined });
      setAttendance(r.attendance || []);
    } catch {
      setAttendance([]);
    }
  };

  useEffect(() => {
    if (user && tab === "attendance") loadAttendance();
  }, [user, tab, attSubject, attDate]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await registerStudent({ enrollment: newEnrollment, name: newName, email: newEmail, password: newPassword });
      setSuccess("Student added.");
      toast("Student added.", "success");
      setNewEnrollment("");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (enrollment: string) => {
    if (!confirm(`Delete student ${enrollment}?`)) return;
    setError("");
    setLoading(true);
    try {
      await deleteStudent(enrollment);
      setSuccess("Student deleted.");
      toast("Student deleted.", "success");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await createTeacher({ name: newTeacherName, email: newTeacherEmail, password: newTeacherPassword });
      setSuccess("Teacher added.");
      toast("Teacher added.", "success");
      setNewTeacherName("");
      setNewTeacherEmail("");
      setNewTeacherPassword("");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await createSubject(newSubjectName.trim());
      setSuccess("Subject added.");
      toast("Subject added.", "success");
      setNewSubjectName("");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const r = await trainModel();
      const msg = `Model trained. ${r.imageCount} images, ${r.studentCount} students.`;
      setSuccess(msg);
      toast(msg, "success");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Training failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8">Loading...</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "students", label: "Students" },
    { id: "teachers", label: "Teachers" },
    { id: "subjects", label: "Subjects" },
    { id: "train", label: "Train Model" },
    { id: "attendance", label: "Attendance" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div
        className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-700"
        role="tablist"
        aria-label="Admin sections"
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => { setTab(id); setError(""); setSuccess(""); }}
            className={`px-3 py-2 sm:px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-2xl font-bold">{students.total}</p>
            <p className="text-sm text-zinc-500">Students</p>
          </Card>
          <Card>
            <p className="text-2xl font-bold">{teachers.length}</p>
            <p className="text-sm text-zinc-500">Teachers</p>
          </Card>
          <Card>
            <p className="text-2xl font-bold">{subjects.length}</p>
            <p className="text-sm text-zinc-500">Subjects</p>
          </Card>
          <Card>
            <p className="text-2xl font-bold">{modelTrained ? "Yes" : "No"}</p>
            <p className="text-sm text-zinc-500">Model Trained</p>
          </Card>
        </div>
      )}

      {tab === "students" && (
        <Card title="Students">
          <form onSubmit={handleAddStudent} className="mb-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Input label="Enrollment" value={newEnrollment} onChange={(e) => setNewEnrollment(e.target.value)} required />
            <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <Input label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            <Input label="Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>Add Student</Button>
            </div>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-2 text-left">Enrollment</th>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Email</th>
                  <th className="py-2 text-left">Images</th>
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.students.map((s) => (
                  <tr key={s.enrollment} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2">{s.enrollment}</td>
                    <td className="py-2">{s.name}</td>
                    <td className="py-2">{s.email}</td>
                    <td className="py-2">{s.imageCount ?? 0}</td>
                    <td className="py-2">
                      <button onClick={() => handleDeleteStudent(s.enrollment)} className="text-red-600 hover:underline text-xs">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "teachers" && (
        <Card title="Teachers">
          <form onSubmit={handleAddTeacher} className="mb-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Input label="Name" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} required />
            <Input label="Email" type="email" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} required />
            <Input label="Password" type="password" value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} required />
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>Add Teacher</Button>
            </div>
          </form>
          <ul className="space-y-2">
            {teachers.map((t) => (
              <li key={t.id} className="flex items-center gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-medium">{t.name}</span>
                <span className="text-zinc-500">{t.email}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "subjects" && (
        <Card title="Subjects">
          <form onSubmit={handleAddSubject} className="mb-6 flex flex-col sm:flex-row gap-3">
            <Input label="Subject name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Math" required className="max-w-xs" />
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>Add Subject</Button>
            </div>
          </form>
          <ul className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <li key={s.id} className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm">{s.name}</li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "train" && (
        <Card title="Train Model">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Trains the face recognition model on all images in TrainingImage. Requires at least one student with face images.
          </p>
          <p className="mb-4 text-sm">Status: <strong>{modelTrained ? "Trained" : "Not trained"}</strong></p>
          <Button onClick={handleTrain} disabled={loading}>
            {loading ? "Training..." : "Train Model"}
          </Button>
        </Card>
      )}

      {tab === "attendance" && (
        <Card title="Attendance Report">
          <div className="mb-4 flex flex-wrap gap-3">
            <select
              value={attSubject}
              onChange={(e) => setAttSubject(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <Button onClick={loadAttendance}>Refresh</Button>
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
                {attendance.map((a, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2">{a.enrollment}</td>
                    <td className="py-2">{a.name}</td>
                    <td className="py-2">{a.subject}</td>
                    <td className="py-2">{a.date}</td>
                    <td className="py-2">{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
