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
} from "@/lib/api";

const MIN_IMAGES = 10;

export default function StudentDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);
  const [student, setStudent] = useState<{ imageCount: number } | null>(null);
  const [modelTrained, setModelTrained] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    }
  }, [router]);

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

      {/* Upload face */}
      <Card title="Add face images">
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Capture at least {MIN_IMAGES} clear photos of your face for training.
          Ensure good lighting and look straight at the camera.
        </p>
        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
        {success && <p className="mb-2 text-sm text-emerald-600">{success}</p>}
        <WebcamCapture onCapture={handleCapture} disabled={uploading} />
      </Card>
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
