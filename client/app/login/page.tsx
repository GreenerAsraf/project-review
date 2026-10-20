"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationBar } from "@/components/NavigationBar";
import { z } from "zod";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2
} from "lucide-react";

const loginValidationSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setClientErrors({});

    // Immediate Client-Side Validation
    const result = loginValidationSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setClientErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      login(res.token, res.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Invalid credentials. Please verify your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
      {/* Background Image Under the Text */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/signin-bg.jpg"
          alt="Sign In Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-100 contrast-105"
        />
        {/* Layered overlays tuned to reveal background details while keeping 100% crystal-clear contrast */}
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-slate-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Top Navigation Bar with Logo, Home, Back, and Reload buttons */}
      <div className="relative z-20">
        <NavigationBar
          variant="dark"
          subtitle="Authentication"
          rightContent={
            <Link href="/register">
              <Button size="sm" variant="outline" className="text-white border-white/20 bg-white/10 hover:bg-white/20">
                Register
              </Button>
            </Link>
          }
        />
      </div>

      {/* Main Content (Positioned on top of the background image) */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {/* High-Contrast Frosted Glass Card Container */}
        <div className="rounded-2xl border border-white/25 bg-slate-950/85 backdrop-blur-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              Sign In
            </h1>
            <p className="text-sm text-slate-200 mt-1">
              Access your personalized dashboard (Student or Mentor)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Server Error Message */}
            {serverError && (
              <div className="p-3.5 text-sm rounded-lg bg-red-500/20 text-red-200 border border-red-500/40 font-medium">
                {serverError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-100 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-slate-900/90 border-white/25 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                />
              </div>
              {clientErrors.email && (
                <p className="text-xs text-red-400 font-medium">{clientErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-100 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-slate-900/90 border-white/25 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                />
              </div>
              {clientErrors.password && (
                <p className="text-xs text-red-400 font-medium">{clientErrors.password}</p>
              )}
            </div>

            {/* Role Gateway Badge */}
            <div className="p-3 bg-blue-500/15 border border-blue-400/30 rounded-xl text-xs text-blue-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Smart redirection routes you directly to Student or Mentor portals.</span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/40 border border-blue-400/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Registration link */}
            <div className="pt-3 text-center text-sm text-slate-200">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors ml-1"
              >
                Create a Student Account
              </Link>
            </div>
          </form>
        </div>

        {/* Quick feature indicators */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 drop-shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Secure JWT Auth</span>
          </div>
          <div className="flex items-center gap-1.5 drop-shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Live Reviews</span>
          </div>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
