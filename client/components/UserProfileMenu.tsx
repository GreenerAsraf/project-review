"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  GraduationCap,
  LogIn,
} from "lucide-react";

interface UserProfileMenuProps {
  className?: string;
  variant?: "dark" | "light";
}

export function UserProfileMenu({ className = "", variant = "dark" }: UserProfileMenuProps) {
  const { user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const dashboardUrl = user?.role === "MENTOR" ? "/mentor" : "/student";
  const isMentor = user?.role === "MENTOR";

  if (loading) {
    return (
      <div className={`flex items-center gap-2 animate-pulse ${className}`}>
        <div className="w-8 h-8 rounded-full bg-slate-800" />
        <div className="hidden sm:block w-16 h-4 rounded bg-slate-800" />
      </div>
    );
  }

  // When not logged in: show "Sign In"
  if (!user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link href="/login">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-lg shadow-blue-600/30 text-xs sm:text-sm px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Button>
        </Link>
        <Link href="/register" className="hidden sm:inline-block">
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm cursor-pointer"
          >
            Get Started
          </Button>
        </Link>
      </div>
    );
  }

  // When signed in: show logged in user name and round floating image
  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger Button with User Name & Floating Round Image */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 transition-all cursor-pointer group shadow-md"
      >
        {/* Round Floating Image */}
        <UserAvatar
          name={user.name}
          email={user.email}
          role={user.role}
          size="sm"
          floating={true}
          showOnlineDot={true}
        />

        {/* User Name & Role (Responsive) */}
        <div className="flex flex-col text-left">
          <span className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-tight max-w-[85px] sm:max-w-[140px] truncate group-hover:text-blue-400 transition-colors">
            {user.name}
          </span>
          <span className="text-[10px] text-slate-400 font-medium leading-none flex items-center gap-1">
            {isMentor ? (
              <span className="text-purple-400 font-semibold flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5 inline" /> Mentor
              </span>
            ) : (
              <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                <GraduationCap className="w-2.5 h-2.5 inline" /> Student
              </span>
            )}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-slate-950/95 border border-white/15 backdrop-blur-xl shadow-2xl p-2 z-50 animate-fade-in-up"
          role="menu"
        >
          {/* Header Card with User info & Large Floating Avatar */}
          <div className="p-3 bg-white/3 rounded-xl border border-white/5 flex items-center gap-3 mb-2">
            <UserAvatar
              name={user.name}
              email={user.email}
              role={user.role}
              size="md"
              floating={true}
              showOnlineDot={true}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                  isMentor
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="space-y-1">
            <Link
              href={dashboardUrl}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/showcase"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Project Showcase</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Account Settings</span>
            </Link>
          </div>

          {/* Sign Out Divider & Button */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
