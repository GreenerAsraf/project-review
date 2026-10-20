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
  Sparkles, 
  Rocket, 
  User as UserIcon, 
  Mail, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Star
} from "lucide-react";

const registerValidationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

interface RegisterResponse {
  message: string;
  user: User;
  token: string;
}

export default function RegisterPage() {
  const { login } = useAuth();
  const [name, setName] = useState("");
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
    const result = registerValidationSchema.safeParse({ name, email, password });
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
      const res = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      login(res.token, res.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Failed to create student account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient lighting accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar with Logo, Home, Back, and Reload buttons */}
      <div className="relative z-20">
        <NavigationBar
          variant="dark"
          subtitle="Registration"
          rightContent={
            <Link href="/login">
              <Button size="sm" variant="outline" className="text-white border-white/20 bg-white/10 hover:bg-white/20">
                Sign In
              </Button>
            </Link>
          }
        />
      </div>

      {/* Main Container: Split Layout (Image on one side, Text & Form on other side) */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* SIDE 1: Animated Register Image & Visual Showcase */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-2 lg:order-1">
          <div className="relative w-full max-w-lg">
            {/* Glowing Backdrop Aura */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-3xl blur-2xl animate-pulse-soft-glow" />

            {/* Main Animated Card Containing the Register Image */}
            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-4 sm:p-5 animate-float-gentle transition-transform">
              
              {/* Animated Image Wrapper */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner group">
                <Image
                  src="/images/register-hero.jpg"
                  alt="Student working on projects"
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Subtle gradient vignette over the image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Floating Micro-Badge 1: Milestone Progress */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-between animate-float-subtle">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Project Accelerator</div>
                      <div className="text-[11px] text-slate-300">Continuous feedback loops</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Active
                  </div>
                </div>

                {/* Floating Micro-Badge 2: Top Floating Badge */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/20 text-xs font-medium text-cyan-300 shadow-md flex items-center gap-1.5 animate-badge-bounce">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Mentor Approved
                </div>
              </div>

              {/* Bottom Showcase Text under the image */}
              <div className="mt-4 px-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-blue-300 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Launch Your Academic Career
                </div>
                <p className="text-xs text-slate-400">
                  Submit repositories, receive step-by-step mentor evaluations, and level up your software skills.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* SIDE 2: Registration Text & Form */}
        <div className="lg:col-span-6 flex flex-col justify-center order-1 lg:order-2">
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            {/* Main Form Title & Subtitle */}
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Create Student Account
              </h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Join our assessment platform to submit coursework projects, track reviews in real-time, and get certified approvals.
              </p>
            </div>

            {/* Form Card Container */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-xl p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Server Error Alert */}
                {serverError && (
                  <div className="p-3.5 text-sm rounded-lg bg-red-500/15 text-red-200 border border-red-500/30 flex items-center gap-2">
                    <span className="font-semibold text-red-400">Error:</span> {serverError}
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <Input
                      type="text"
                      placeholder="e.g., Alex Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    />
                  </div>
                  {clientErrors.name && (
                    <p className="text-xs text-red-400 font-medium">{clientErrors.name}</p>
                  )}
                </div>

                {/* Email Address Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
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
                      className="pl-10 h-11 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    />
                  </div>
                  {clientErrors.email && (
                    <p className="text-xs text-red-400 font-medium">{clientErrors.email}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 bg-slate-950/60 border-white/15 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    />
                  </div>
                  {clientErrors.password && (
                    <p className="text-xs text-red-400 font-medium">{clientErrors.password}</p>
                  )}
                </div>

                {/* Role Note Banner */}
                <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    Public signups create a <strong className="text-white">Student Account</strong>. Mentor accounts are provisioned securely via system seeding.
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Creating Account..."
                  ) : (
                    <>
                      Register Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                {/* Sign In Link */}
                <div className="pt-2 text-center text-sm text-slate-300">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>

      <div className="h-4" />
    </div>
  );
}
