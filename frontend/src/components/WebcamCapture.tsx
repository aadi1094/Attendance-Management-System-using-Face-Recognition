"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

const GUIDED_PROMPTS = [
  "Look straight at the camera",
  "Keep looking straight",
  "Slight smile",
  "Neutral expression",
  "Straight, good lighting",
  "Turn head slightly left",
  "A bit more left",
  "Back to center",
  "Turn head slightly right",
  "A bit more right",
  "Back to center",
  "Chin up slightly",
  "Chin down slightly",
  "Straight, final shots",
  "One more clear shot",
];

function getGuidedPrompt(index: number): string {
  return GUIDED_PROMPTS[Math.min(index, GUIDED_PROMPTS.length - 1)] ?? "Capture your face";
}

type WebcamCaptureProps = {
  onCapture: (imageBase64: string) => void;
  disabled?: boolean;
  guided?: boolean;
  totalSteps?: number;
  currentCount?: number;
  /** "hd" = 1280x720 (better for multi-face), "standard" = 640x480 */
  resolution?: "standard" | "hd";
};

export function WebcamCapture({
  onCapture,
  disabled,
  guided = false,
  totalSteps = 15,
  currentCount = 0,
  resolution = "standard",
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  streamRef.current = stream;

  const handleClose = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setModalOpen(false);
  }, []);

  const startCamera = async () => {
    setError("");
    setModalOpen(true);
    const constraints =
      resolution === "hd"
        ? { video: { facingMode: "user", width: 1280, height: 720 } }
        : { video: { facingMode: "user", width: 640, height: 480 } };
    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
    } catch (e) {
      setError("Could not access camera. Please allow camera permission.");
      setModalOpen(false);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream || video.readyState !== 4) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCapture(dataUrl);
  };


  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={startCamera} disabled={disabled}>
        Start Camera
      </Button>

      <Modal isOpen={modalOpen} onClose={handleClose} title="Capture your face">
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
          <p className="text-center text-sm text-zinc-500">
            {guided && currentCount < totalSteps
              ? `Step ${currentCount + 1}/${totalSteps}: ${getGuidedPrompt(currentCount)}`
              : "Position your face in the frame and click Capture"}
          </p>
          <div className="flex gap-3">
            <Button onClick={capture} disabled={disabled} className="flex-1">
              Capture Photo
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
