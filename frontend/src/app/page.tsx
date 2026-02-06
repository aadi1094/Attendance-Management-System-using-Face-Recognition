import Link from "next/link";
import { Button } from "@/components";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 px-6 py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
        Attendance Management System
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Mark attendance automatically using face recognition. Students register and upload their face; teachers capture once to record attendance.
      </p>

      <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-left dark:border-emerald-800 dark:bg-emerald-950/30">
        <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Automatic Attendance</h2>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
          Teachers: log in and use <strong>Automatic Attendance</strong> to identify students by face and record attendance in one click. No manual roll call.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block text-sm font-medium text-emerald-700 underline hover:no-underline dark:text-emerald-300"
        >
          Login as Teacher →
        </Link>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Button href="/register" size="lg">
          Register as Student
        </Button>
        <Button href="/login" variant="outline" size="lg">
          Login
        </Button>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          Next.js
        </span>
        <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-800 dark:bg-sky-900 dark:text-sky-200">
          Tailwind CSS
        </span>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          Flask
        </span>
        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
          MongoDB
        </span>
      </div>
    </div>
  );
}
