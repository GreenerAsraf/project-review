"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { NavigationBar } from "@/components/NavigationBar";
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "MENTOR") {
        router.push("/mentor");
      } else {
        router.push("/student");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
      {/* Background Image Under The Text */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/landing-hero-bg.jpg"
          alt="ProjectPilot Platform Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-100 contrast-105"
        />
        {/* Layered translucent overlays to reveal the background image while guaranteeing crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950/85" />
        <div className="absolute inset-0 bg-slate-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Top Header / Navigation Bar with Logo, Home, Back, and Reload buttons */}
      <div className="relative z-20">
        <NavigationBar
          variant="dark"
          showBack={false}
          rightContent={
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-100 hover:text-white hover:bg-white/15 text-sm font-medium transition-colors backdrop-blur-sm"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/40 border border-blue-400/40 transition-all font-medium"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          }
        />
      </div>

      {/* Main Hero Content (Positioned Directly Over the Background Image) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/60 border border-blue-400/40 text-blue-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md mb-6 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          Student & Mentor Assessment Platform
        </div>

        {/* Hero Title with High Contrast Gradient Accent */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight drop-shadow-lg">
          Master Your Projects. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent drop-shadow">
            Guided by Mentors.
          </span>
        </h1>

        {/* Hero Description with High Contrast Readability */}
        <p className="text-lg sm:text-xl text-slate-100 max-w-2xl mx-auto mb-10 leading-relaxed font-normal drop-shadow-md">
          A streamlined coursework submission dashboard for students to submit projects, 
          track real-time evaluations, and receive actionable mentor approvals.
        </p>

        {/* CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-md mx-auto mb-14">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-blue-600/40 border border-blue-400/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 h-12 border-white/30 bg-slate-900/60 hover:bg-slate-800/80 text-white backdrop-blur-md shadow-lg shadow-black/30 font-medium transition-all cursor-pointer"
            >
              Create Student Account
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Pills under the Hero Text */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 backdrop-blur-md text-left shadow-lg">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Project Submissions</div>
              <div className="text-xs text-slate-300">GitHub & Live links</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 backdrop-blur-md text-left shadow-lg">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Mentor Reviews</div>
              <div className="text-xs text-slate-300">Constructive feedback</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 backdrop-blur-md text-left shadow-lg">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Role-Based Security</div>
              <div className="text-xs text-slate-300">Protected dashboard</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/15 text-center text-xs text-slate-300 bg-slate-950/40 backdrop-blur-sm">
        © 2026 ProjectPilot Assessment System. Built with Next.js &amp; Express.
      </footer>
    </div>
  );
}
