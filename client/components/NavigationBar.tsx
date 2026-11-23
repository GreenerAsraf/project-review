"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import {
  GraduationCap,
  Home,
  ArrowLeft,
  RotateCw,
  Settings,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

interface NavigationBarProps {
  variant?: "dark" | "light";
  showHome?: boolean;
  showBack?: boolean;
  showReload?: boolean;
  showSettings?: boolean;
  showShowcase?: boolean;
  showUserMenu?: boolean;
  rightContent?: React.ReactNode;
  subtitle?: string;
}

export function NavigationBar({
  variant = "dark",
  showHome = true,
  showBack = true,
  showReload = true,
  showSettings = true,
  showShowcase = true,
  showUserMenu = true,
  rightContent,
  subtitle,
}: NavigationBarProps) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const isDark = variant === "dark";

  return (
    <nav
      className={`w-full sticky top-0 z-40 transition-all duration-200 ${
        isDark
          ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/10 text-white"
          : "bg-white/90 backdrop-blur-xl border-b border-gray-200 text-gray-900 shadow-xs"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo with Home Link */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/"
            title="Go to Homepage"
            className="flex items-center gap-2 sm:gap-3 group transition-transform active:scale-95 shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/20 group-hover:scale-105 transition-all">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={`text-base sm:text-xl font-bold tracking-tight truncate ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Project<span className="text-blue-500">Pilot</span>
              </span>
              {subtitle && (
                <span
                  className={`text-[10px] sm:text-[11px] font-medium leading-none truncate max-w-[110px] sm:max-w-[200px] md:max-w-xs ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  {subtitle}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Quick Actions: Back, Home, Showcase, Reload, Settings */}
          <div
            className={`hidden md:flex items-center gap-1.5 pl-3 border-l ${
              isDark ? "border-white/15" : "border-gray-200"
            }`}
          >
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                title="Return Back"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {showHome && (
              <Link
                href="/"
                title="Go to Homepage"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Home className="w-3.5 h-3.5 text-blue-400" />
                <span>Home</span>
              </Link>
            )}

            {showShowcase && (
              <Link
                href="/showcase"
                title="Public Project Showcase"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Showcase</span>
              </Link>
            )}

            {showReload && (
              <button
                type="button"
                onClick={handleReload}
                title="Reload Page"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <RotateCw className="w-3.5 h-3.5 hover:rotate-90 transition-transform" />
                <span>Reload</span>
              </button>
            )}

            {showSettings && (
              <Link
                href="/settings"
                title="Account Settings"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Section: Custom Right Content + User Profile (Name + Round Floating Image / Sign In) + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Page-Specific Action (e.g. + New Project) */}
          {rightContent}

          {/* User Profile Menu (Signed in: Name + Floating Round Image | Signed out: Sign In) */}
          {showUserMenu && <UserProfileMenu variant={variant} />}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle navigation menu"
            className={`md:hidden p-1.5 sm:p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
              isDark
                ? "border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                : "border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Navigation (Ensures 100% mobile friendliness) */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-2">
            {showHome && (
              <Link
                href="/"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-slate-200 hover:bg-white/10"
              >
                <Home className="w-4 h-4 text-blue-400" />
                <span>Home</span>
              </Link>
            )}

            {showShowcase && (
              <Link
                href="/showcase"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-slate-200 hover:bg-white/10"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Showcase</span>
              </Link>
            )}

            {showSettings && (
              <Link
                href="/settings"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-slate-200 hover:bg-white/10"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </Link>
            )}

            {showReload && (
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  handleReload();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-slate-200 hover:bg-white/10 text-left cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span>Reload</span>
              </button>
            )}
          </div>

          {showBack && (
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                handleBack();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
