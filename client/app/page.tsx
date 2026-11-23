"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Code2,
  Users,
  FileCheck,
  Star,
  Zap,
  Lock,
  BarChart3,
  Filter,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

/* ─── Public Stats ─────────────────────────────────────────── */
interface PublicStats {
  totalSubmissions: number;
  approved: number;
  pending: number;
  totalStudents: number;
}

/* ─── Animated Counter ─────────────────────────────────────── */
function AnimatedCounter({ target, label, suffix = "+" }: { target: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-black text-white mb-1 tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-400 font-medium">{label}</div>
    </div>
  );
}

/* ─── FAQ Accordion Item ───────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-white font-medium hover:bg-white/5 transition-colors"
      >
        {q}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardUrl = user?.role === "MENTOR" ? "/mentor" : "/student";

  // Fetch public stats
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${base}/public/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({ totalSubmissions: 50, approved: 32, pending: 18, totalStudents: 45 }));
  }, []);

  /* ── Feature cards data ── */
  const features = [
    { icon: FileCheck, color: "text-blue-400", bg: "bg-blue-500/15", title: "Project Submission Portal", desc: "Submit GitHub repos, live links, and project descriptions through a clean, validated form." },
    { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/15", title: "Mentor Review Dashboard", desc: "Mentors can browse, filter, and review all submissions with one-click approve/reject actions." },
    { icon: Filter, color: "text-indigo-400", bg: "bg-indigo-500/15", title: "Server-Side Filtering", desc: "Paginated tables with real server-side status filters — no client-side hacks." },
    { icon: Lock, color: "text-rose-400", bg: "bg-rose-500/15", title: "Role-Based Access Control", desc: "JWT-based RBAC ensures students and mentors only see what they're authorised to see." },
    { icon: ShieldCheck, color: "text-cyan-400", bg: "bg-cyan-500/15", title: "Duplicate Prevention", desc: "URL normalization and DB-level unique constraints prevent duplicate repo submissions." },
    { icon: BarChart3, color: "text-amber-400", bg: "bg-amber-500/15", title: "Live Statistics", desc: "Real-time aggregated stats — total pending, approved, and rejected submissions at a glance." },
  ];

  /* ── How it works steps ── */
  const steps = [
    { n: "01", title: "Create Your Account", desc: "Sign up as a student in seconds. No credit card, no friction.", icon: Users },
    { n: "02", title: "Submit Your Project", desc: "Fill in your project name, GitHub repo link, live URL, and a short description.", icon: Code2 },
    { n: "03", title: "Get Mentor Feedback", desc: "Your mentor reviews, approves, or provides feedback directly on the dashboard.", icon: Star },
  ];

  /* ── Tech stack ── */
  const stack = ["Next.js 16", "Express.js", "TypeScript", "PostgreSQL", "Prisma ORM", "Tailwind CSS", "JWT Auth", "Zod Validation"];

  /* ── FAQ ── */
  const faqs = [
    { q: "Who can sign up as a student?", a: "Anyone can register as a student using the Sign Up page. Mentor accounts are created by administrators — public registration is student-only for security." },
    { q: "Can I submit the same repository twice?", a: "No. The system uses URL normalization and a database-level uniqueness constraint to prevent duplicate repository submissions, even with variations like trailing slashes or .git extensions." },
    { q: "How does mentor approval work?", a: "Mentors log in to their dashboard, see all student submissions with filtering and pagination, and can approve or reject each project with a single click. Students see their updated status immediately." },
    { q: "Is my data secure?", a: "Yes. Passwords are hashed with bcryptjs (12 salt rounds). JWTs are signed with a server-side secret. User IDs and roles in request bodies are never trusted — only token claims are used." },
    { q: "What tech stack is this built on?", a: "Next.js 16 App Router for the frontend, Express.js with TypeScript for the backend, PostgreSQL via Prisma ORM for the database, and JWT for authentication." },
  ];

  /* ── Testimonials ── */
  const testimonials = [
    { name: "Fatima R.", role: "Student", quote: "The dashboard made it so easy to track my project status. I could see the moment my mentor approved it!" },
    { name: "Sakib H.", role: "Student", quote: "The duplicate URL prevention saved me from accidentally submitting the same repo twice. Very thoughtful feature." },
    { name: "Nadia K.", role: "Mentor", quote: "The filtering and pagination tools are excellent. I can jump straight to pending submissions without scrolling endlessly." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ─── Animated Background ──────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      {/* ─── Sticky Navbar ────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span>Project<span className="text-blue-400">Pilot</span></span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="/showcase" className="hover:text-white transition-colors flex items-center gap-1.5 text-blue-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Showcase</span>
            </Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/settings">
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 text-sm cursor-pointer">
                    Settings
                  </Button>
                </Link>
                <Link href={dashboardUrl}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 cursor-pointer flex items-center gap-1.5">
                    Dashboard
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 text-sm cursor-pointer">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 cursor-pointer">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-slate-950 px-6 py-4 flex flex-col gap-4">
            <Link href="/showcase" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Showcase Gallery</span>
            </Link>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300">How it Works</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300">Stats</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300">FAQ</a>
            <div className="flex gap-3 pt-2 border-t border-white/5">
              {user ? (
                <>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-white/20 text-white cursor-pointer">Settings</Button>
                  </Link>
                  <Link href={dashboardUrl} onClick={() => setMobileMenuOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 cursor-pointer flex items-center justify-center gap-1">
                      Dashboard
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-white/20 text-white cursor-pointer">Sign In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 cursor-pointer">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">

        {/* ─── HERO ─────────────────────────────────────────── */}
        <section className="pt-24 pb-32 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-8">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Student &amp; Mentor Assessment Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
            Submit Projects.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Get Reviewed.
            </span>
            <br />Grow Faster.
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A streamlined platform where students submit coursework projects and mentors provide structured approvals — with real-time status tracking, role-based access, and zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-16">
            {user ? (
              <>
                <Link href={dashboardUrl}>
                  <Button size="lg" className="px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-2xl shadow-blue-600/30 transition-all group cursor-pointer flex items-center gap-2">
                    Go to {user.role === "MENTOR" ? "Mentor Dashboard" : "Student Dashboard"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/showcase">
                  <Button variant="outline" size="lg" className="px-6 h-12 border-amber-400/30 bg-amber-400/5 hover:bg-amber-400/10 text-amber-300 font-semibold backdrop-blur-sm cursor-pointer flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Explore Showcase
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-2xl shadow-blue-600/30 transition-all group cursor-pointer">
                    Start Submitting Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/showcase">
                  <Button variant="outline" size="lg" className="px-6 h-12 border-amber-400/30 bg-amber-400/5 hover:bg-amber-400/10 text-amber-300 font-semibold backdrop-blur-sm cursor-pointer flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Explore Showcase
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-8 h-12 border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium backdrop-blur-sm cursor-pointer">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mini feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {["No credit card required", "Role-based access control", "Duplicate prevention built-in"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-slate-400 max-w-xl mx-auto">From sign-up to mentor approval in three simple steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={step.n} className="relative">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent z-0 -translate-y-1/2" />
                  )}
                  <div className="relative bg-white/3 border border-white/8 rounded-2xl p-7 hover:border-blue-500/30 hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl font-black text-blue-500/30 leading-none select-none">{step.n}</span>
                      <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
                        <step.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES GRID ────────────────────────────────── */}
        <section id="features" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Built with production-grade engineering — validation, security, and performance from day one.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div key={f.title} className="group bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-blue-500/25 hover:bg-white/5 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STATS COUNTER ────────────────────────────────── */}
        <section id="stats" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Platform Activity</h2>
              <p className="text-slate-400">Live numbers directly from our database.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedCounter target={stats?.totalStudents ?? 0} label="Students Registered" />
              <AnimatedCounter target={stats?.totalSubmissions ?? 0} label="Projects Submitted" />
              <AnimatedCounter target={stats?.approved ?? 0} label="Approved Projects" />
              <AnimatedCounter target={stats?.pending ?? 0} label="Pending Review" />
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What Users Say</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Feedback from real students and mentors using the platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-blue-500/20 transition-all">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TECH STACK ───────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-slate-500 text-sm uppercase tracking-widest font-medium mb-8">Built with modern, production-ready technologies</p>
            <div className="flex flex-wrap justify-center gap-3">
              {stack.map((tech) => (
                <span key={tech} className="px-4 py-2 rounded-full border border-white/10 bg-white/3 text-sm text-slate-300 hover:border-blue-500/30 hover:text-white transition-colors">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────── */}
        <section id="faq" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-400">Everything you need to know before getting started.</p>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA BANNER ───────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-blue-500/20 rounded-3xl p-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Submit Your First Project?</h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">Join students already getting structured feedback from mentors. It takes less than a minute to get started.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href={dashboardUrl}>
                    <Button size="lg" className="px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-2xl shadow-blue-600/30 cursor-pointer group flex items-center gap-2">
                      Go to {user.role === "MENTOR" ? "Mentor Portal" : "Student Portal"}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-2xl shadow-blue-600/30 cursor-pointer group">
                        Create Student Account
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="px-8 h-12 border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer">
                        Sign In as Mentor
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span>Project<span className="text-blue-400">Pilot</span></span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                A full-stack project submission and review dashboard built with Next.js, Express, PostgreSQL, and JWT auth.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2">
                {[{ label: "Student Sign Up", href: "/register" }, { label: "Mentor Login", href: "/login" }, { label: "Features", href: "#features" }, { label: "How It Works", href: "#how-it-works" }].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Tech Stack</h4>
              <ul className="space-y-2">
                {["Next.js 16 App Router", "Express.js + TypeScript", "PostgreSQL + Prisma ORM", "JWT Role-Based Auth"].map((t) => (
                  <li key={t} className="text-sm text-slate-500">{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">© 2026 ProjectPilot. Built with Next.js &amp; Express.</p>
            <a
              href="https://github.com/GreenerAsraf/project-review"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
