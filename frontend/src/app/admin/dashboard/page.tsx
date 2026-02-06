"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Modal } from "@/components";
import { useToast } from "@/lib/toast";
import {
  getAuthUser,
  clearAuth,
  listStudents,
  listTeachers,
  listSubjects,
  listAttendance,
  downloadAttendanceCsv,
  registerStudent,
  deleteStudent,
  createTeacher,
  createSubject,
  trainModel,
  getTrainStatus,
  getTeacher,
  updateTeacherSubjects,
} from "@/lib/api";

type Tab = "overview" | "students" | "teachers" | "subjects" | "train" | "attendance";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [students, setStudents] = useState<{ students: { enrollment: string; name: string; email: string; imageCount: number }[]; total: number }>({ students: [], total: 0 });
  const [teachers, setTeachers] = useState<{ id: string; name: string; email: string; assignedSubjectIds?: string[] }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [attendance, setAttendance] = useState<{ enrollment: string; name: string; subject: string; date: string; time: string }[]>([]);
  const [modelTrained, setModelTrained] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trainingStudent, setTrainingStudent] = useState<string | null>(null);
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

  // Assign subjects modal
  const [assignModalTeacher, setAssignModalTeacher] = useState<{ id: string; name: string } | null>(null);
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);

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

  const handleOpenAssignSubjects = async (teacher: { id: string; name: string }) => {
    setAssignModalTeacher(teacher);
    setError("");
    try {
      const t = await getTeacher(teacher.id);
      setAssignSelectedIds(t.assignedSubjectIds || []);
    } catch {
      setAssignSelectedIds([]);
    }
  };

  const handleSaveAssignSubjects = async () => {
    if (!assignModalTeacher) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await updateTeacherSubjects(assignModalTeacher.id, assignSelectedIds);
      setSuccess(`Subjects assigned to ${assignModalTeacher.name}.`);
      toast(`Subjects assigned.`, "success");
      setAssignModalTeacher(null);
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
    setTrainingStudent(null);
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
      setTrainingStudent(null);
    }
  };

  const handleTrainForStudent = async (enrollment: string) => {
    setError("");
    setSuccess("");
    setLoading(true);
    setTrainingStudent(enrollment);
    try {
      const r = await trainModel();
      const student = students.students.find((s) => s.enrollment === enrollment);
      const baseMsg = `Model trained. ${r.imageCount} images, ${r.studentCount} students.`;
      const msg = student
        ? `${baseMsg} Latest images for ${student.name} (${student.enrollment}) are now included.`
        : baseMsg;
      setSuccess(msg);
      toast(msg, "success");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Training failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
      setTrainingStudent(null);
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
          <form onSubmit={handleAddTeacher} className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Input
              label="Name"
              value={newTeacherName}
              onChange={(e) => setNewTeacherName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={newTeacherEmail}
              onChange={(e) => setNewTeacherEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={newTeacherPassword}
              onChange={(e) => setNewTeacherPassword(e.target.value)}
              required
            />
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>
                Add Teacher
              </Button>
            </div>
          </form>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">#</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Assigned subjects</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      No teachers found. Add a teacher using the form above.
                    </td>
                  </tr>
                ) : (
                  teachers.map((t, index) => {
                    const assignedNames = (t.assignedSubjectIds || [])
                      .map((sid) => subjects.find((s) => s.id === sid)?.name)
                      .filter(Boolean)
                      .join(", ") || "—";
                    return (
                      <tr
                        key={t.id}
                        className="border-t border-zinc-100 dark:border-zinc-800 even:bg-zinc-50/40 dark:even:bg-zinc-900/40"
                      >
                        <td className="px-3 py-2 text-xs text-zinc-500">{index + 1}</td>
                        <td className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {t.name}
                        </td>
                        <td className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                          {t.email}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">
                          {assignedNames}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAssignSubjects(t)}
                          >
                            Assign subjects
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={!!assignModalTeacher}
        onClose={() => setAssignModalTeacher(null)}
        title={assignModalTeacher ? `Assign subjects to ${assignModalTeacher.name}` : ""}
      >
        {assignModalTeacher && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Select subjects this teacher can mark attendance for.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {subjects.length === 0 ? (
                <p className="text-sm text-zinc-500">No subjects yet. Add subjects in the Subjects tab.</p>
              ) : (
                subjects.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 cursor-pointer rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={assignSelectedIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignSelectedIds((prev) => [...prev, s.id]);
                        } else {
                          setAssignSelectedIds((prev) => prev.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="text-sm">{s.name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveAssignSubjects} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setAssignModalTeacher(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {tab === "subjects" && (
        <Card title="Subjects">
          <form onSubmit={handleAddSubject} className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Input
              label="Subject name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="e.g. Mathematics"
              required
              className="max-w-xs"
            />
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>
                Add Subject
              </Button>
            </div>
          </form>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">#</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Subject Name</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      No subjects found. Add a subject using the form above.
                    </td>
                  </tr>
                ) : (
                  subjects.map((s, index) => (
                    <tr
                      key={s.id}
                      className="border-t border-zinc-100 dark:border-zinc-800 even:bg-zinc-50/40 dark:even:bg-zinc-900/40"
                    >
                      <td className="px-3 py-2 text-xs text-zinc-500">{index + 1}</td>
                      <td className="px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50">{s.name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "train" && (
        <Card title="Train Model">
          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 p-4">
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Train the face recognition model on all uploaded student images. Use this after new students register
                and upload their face images.
              </p>
              <p className="mb-4 text-sm">
                Status:{" "}
                <strong className={modelTrained ? "text-emerald-600" : "text-amber-600"}>
                  {modelTrained ? "Trained" : "Not trained"}
                </strong>
              </p>
              <Button onClick={handleTrain} disabled={loading} className="w-full sm:w-auto">
                {loading && !trainingStudent ? "Training..." : "Train Model on All Students"}
              </Button>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Train for Specific Student
              </h2>
              <p className="mb-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Select a student who has recently registered and uploaded images to trigger training with their latest
                data. The model is still trained on all students, but this makes it easy to train right after adding a
                specific student.
              </p>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        Enrollment
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Images</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400"
                        >
                          No students found. Add students in the Students tab first.
                        </td>
                      </tr>
                    ) : (
                      students.students.map((s) => {
                        const hasImages = (s.imageCount ?? 0) > 0;
                        const lowImages = (s.imageCount ?? 0) > 0 && (s.imageCount ?? 0) < 15;
                        return (
                          <tr
                            key={s.enrollment}
                            className="border-t border-zinc-100 dark:border-zinc-800 even:bg-zinc-50/40 dark:even:bg-zinc-900/40"
                          >
                            <td className="px-3 py-2 font-mono text-xs sm:text-sm">{s.enrollment}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm">{s.name}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm">{s.imageCount ?? 0}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm">
                              {hasImages ? (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    lowImages
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                                  }`}
                                >
                                  {lowImages ? "Add more images (15+ recommended)" : "Ready for training"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                  No images uploaded
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTrainForStudent(s.enrollment)}
                                disabled={loading || !hasImages}
                              >
                                {trainingStudent === s.enrollment ? "Training..." : "Train for this student"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await downloadAttendanceCsv({
                    subject: attSubject || undefined,
                    date: attDate || undefined,
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
