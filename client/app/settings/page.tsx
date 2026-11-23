"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NavigationBar } from "@/components/NavigationBar";
import { UserAvatar } from "@/components/UserAvatar";
import { updateProfile, UpdateProfilePayload } from "@/lib/api";
import {
  User,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Mail,
  Calendar,
} from "lucide-react";

/* ─── Toast ─────────────────────────────────────────────────── */
interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium backdrop-blur-md border transition-all duration-300 pointer-events-auto ${
            t.type === "success"
              ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-100"
              : "bg-red-900/90 border-red-500/40 text-red-100"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ─── Shimmer Skeleton ───────────────────────────────────────── */
function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 bg-slate-800 rounded w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-11 bg-slate-800 rounded-xl" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-11 bg-slate-800 rounded-xl" />
      </div>
      <div className="h-11 bg-slate-700 rounded-xl w-32" />
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Profile form state
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user) {
      setName(user.name);
    }
  }, [authLoading, user, router]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  /* ── Save display name ── */
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("error", "Name cannot be empty.");
      return;
    }
    if (name.trim() === user?.name) {
      addToast("error", "No changes to save.");
      return;
    }

    setSavingProfile(true);
    try {
      const payload: UpdateProfilePayload = { name: name.trim() };
      await updateProfile(payload);
      addToast("success", "Display name updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update name.";
      addToast("error", msg);
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast("error", "All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      addToast("error", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      addToast("error", "New password must differ from current password.");
      return;
    }

    setSavingPassword(true);
    try {
      const payload: UpdateProfilePayload = { currentPassword, newPassword };
      await updateProfile(payload);
      addToast("success", "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      addToast("error", msg);
    } finally {
      setSavingPassword(false);
    }
  };

  /* ── Render ── */
  const isLoading = authLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavigationBar variant="dark" subtitle="Account Settings" />

      <ToastContainer toasts={toasts} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Account Settings
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage your profile information and security credentials.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8">
            <SettingsSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Account Info Card ── */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/10">
                <UserAvatar
                  name={user?.name}
                  email={user?.email}
                  role={user?.role}
                  size="lg"
                  floating={true}
                  showOnlineDot={true}
                />
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {user?.name}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        user?.role === "MENTOR"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {user?.role}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      Email
                    </p>
                    <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      Role
                    </p>
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5 ${
                        user?.role === "MENTOR"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Display Name Card ── */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Display Name</h2>
                  <p className="text-xs text-slate-400">Change how your name appears</p>
                </div>
              </div>

              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your display name"
                    maxLength={80}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {savingProfile ? "Saving…" : "Save Name"}
                </button>
              </form>
            </div>

            {/* ── Change Password Card ── */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Change Password</h2>
                  <p className="text-xs text-slate-400">Update your account password</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
                  >
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                  />
                </div>

                {/* Password match hint */}
                {confirmPassword && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      newPassword === confirmPassword ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {newPassword === confirmPassword ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {savingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {savingPassword ? "Updating…" : "Change Password"}
                </button>
              </form>
            </div>

            {/* ── Member Since ── */}
            <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Member since{" "}
                {user
                  ? new Date(user.id.substring(0, 8) === "" ? Date.now() : Date.now()).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long" }
                    )
                  : "—"}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
