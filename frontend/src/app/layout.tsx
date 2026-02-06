import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Providers } from "@/components";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Attendance Management System",
  description: "Attendance Management System using Face Recognition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950`}>
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" role="main">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
