import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "YogaCorrector AI 2.0 - Real-Time Posture AI Coach",
  description: "Computer Vision & Gemini AI Powered Yoga Pose Correction Workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-100 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">{children}</main>
      </body>
    </html>
  );
}
