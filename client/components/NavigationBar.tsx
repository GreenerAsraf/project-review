"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Home, ArrowLeft, RotateCw } from "lucide-react";

interface NavigationBarProps {
  variant?: "dark" | "light";
  showHome?: boolean;
  showBack?: boolean;
  showReload?: boolean;
  rightContent?: React.ReactNode;
  subtitle?: string;
}

export function NavigationBar({
  variant = "dark",
  showHome = true,
  showBack = true,
  showReload = true,
  rightContent,
  subtitle,
}: NavigationBarProps) {
  const router = useRouter();

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
      className={`w-full transition-all duration-200 ${
        isDark
          ? "bg-slate-950/40 backdrop-blur-md border-b border-white/10 text-white"
          : "bg-white/90 backdrop-blur-md border-b border-gray-200 text-gray-900 shadow-xs"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Logo with Home Link */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            title="Go to Homepage"
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/20 group-hover:scale-105 transition-all">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Project<span className="text-blue-500">Pilot</span>
              </span>
              {subtitle && (
                <span
                  className={`text-[11px] font-medium leading-none ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  {subtitle}
                </span>
              )}
            </div>
          </Link>

          {/* Quick Actions: Back, Home, Reload */}
          <div
            className={`hidden sm:flex items-center gap-1.5 pl-3 border-l ${
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
          </div>
        </div>

        {/* Mobile controls & Right Content */}
        <div className="flex items-center gap-2">
          {/* Compact icons on mobile */}
          <div className="flex sm:hidden items-center gap-1">
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                title="Back"
                className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {showHome && (
              <Link
                href="/"
                title="Home"
                className={`p-2 rounded-lg text-xs transition-colors ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Home className="w-4 h-4 text-blue-400" />
              </Link>
            )}
            {showReload && (
              <button
                type="button"
                onClick={handleReload}
                title="Reload"
                className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {rightContent}
        </div>
      </div>
    </nav>
  );
}
