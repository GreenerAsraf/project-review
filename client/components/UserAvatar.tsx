"use client";

import React, { useState } from "react";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  role?: "STUDENT" | "MENTOR" | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  floating?: boolean;
  showOnlineDot?: boolean;
  className?: string;
}

export function UserAvatar({
  name,
  email,
  role,
  size = "md",
  floating = true,
  showOnlineDot = true,
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const displayName = name || email?.split("@")[0] || "User";

  // Size mapping
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 sm:w-10 sm:h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const dotSizeClasses = {
    xs: "w-1.5 h-1.5 -bottom-0.5 -right-0.5",
    sm: "w-2 h-2 -bottom-0.5 -right-0.5",
    md: "w-2.5 h-2.5 bottom-0 right-0",
    lg: "w-3 h-3 bottom-0.5 right-0.5",
    xl: "w-3.5 h-3.5 bottom-1 right-1",
  };

  // Generate initials (e.g. "Sakib H" -> "SH")
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || displayName.slice(0, 2).toUpperCase();

  // Avatar URL from DiceBear with fallback seed
  const avatarUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(displayName)}&radius=50&backgroundColor=1e293b,0f172a,1e1b4b`;

  const isMentor = role === "MENTOR";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        sizeClasses[size]
      } ${
        floating ? "animate-float-subtle" : ""
      } ${
        isMentor
          ? "ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/25"
          : "ring-2 ring-blue-400/60 shadow-lg shadow-blue-500/25"
      } bg-slate-900 transition-all duration-300 hover:scale-105 ${className}`}
      title={`${displayName} (${role || "User"})`}
    >
      {!imgError ? (
        <img
          src={avatarUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        /* Fallback SVG / initials gradient */
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white ${
            isMentor
              ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
              : "bg-gradient-to-tr from-blue-600 to-cyan-500"
          }`}
        >
          {initials}
        </div>
      )}

      {/* Online Status Dot */}
      {showOnlineDot && (
        <span
          className={`absolute rounded-full ring-2 ring-slate-950 bg-emerald-400 ${
            dotSizeClasses[size]
          }`}
        />
      )}
    </div>
  );
}
