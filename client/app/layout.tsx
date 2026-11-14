import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "ProjectPilot - Submission & Review Dashboard",
  description: "Next.js & Express role-based project submission dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
