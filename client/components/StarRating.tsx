"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value?: number | null;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = "md",
  showScore = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const currentRating = hoverRating ?? value ?? 0;

  return (
    <div
      className="inline-flex items-center gap-1.5"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={readOnly ? `Rating: ${value ?? 0} out of 5 stars` : "Rate this project out of 5 stars"}
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentRating;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (!readOnly && onChange) {
                  onChange(star);
                }
              }}
              onMouseEnter={() => {
                if (!readOnly) {
                  setHoverRating(star);
                }
              }}
              onMouseLeave={() => {
                if (!readOnly) {
                  setHoverRating(null);
                }
              }}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              aria-checked={value === star}
              role={readOnly ? undefined : "radio"}
              className={`${
                readOnly
                  ? "cursor-default pointer-events-none"
                  : "cursor-pointer transition-transform duration-150 hover:scale-115 active:scale-95"
              } p-0.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm`}
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                    : "fill-transparent text-slate-600 hover:text-amber-300/60"
                }`}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className="text-xs font-bold text-amber-400 ml-1">
          {(value ?? 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}
