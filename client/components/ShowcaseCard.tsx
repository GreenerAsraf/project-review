"use client";

import React, { useState } from "react";
import { Submission } from "@/lib/api";
import { CoverImage } from "@/components/CoverImage";
import { StarRating } from "@/components/StarRating";
import {
  Heart,
  MessageCircle,
  ExternalLink,
  Code2,
  Trash2,
  Sparkles,
  User as UserIcon,
} from "lucide-react";

interface ShowcaseCardProps {
  submission: Submission;
  currentUserId?: string;
  onViewDetails: (sub: Submission) => void;
  onLikeToggle: (id: string) => void;
  onDeleteRequest?: (sub: Submission) => void;
}

export function ShowcaseCard({
  submission,
  currentUserId,
  onViewDetails,
  onLikeToggle,
  onDeleteRequest,
}: ShowcaseCardProps) {
  const [likeAnimating, setLikeAnimating] = useState(false);
  const isOwner = currentUserId && submission.studentId === currentUserId;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    onLikeToggle(submission.id);
  };

  return (
    <div
      onClick={() => onViewDetails(submission)}
      className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-white/10 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden cursor-pointer backdrop-blur-md hover:-translate-y-1"
    >
      <div>
        {/* Top Cover Image Area */}
        <div className="relative w-full h-44 overflow-hidden bg-slate-950">
          <CoverImage
            screenshotUrl={submission.screenshotUrl}
            category={submission.category}
            alt={submission.projectName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Dark gradient overlay for bottom text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30 pointer-events-none" />

          {/* Badges on Top of Image */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
            {/* Category Badge */}
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/15 shadow-md">
              {submission.category || "Full Stack"}
            </span>

            {/* "Your Project" badge */}
            {isOwner && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600/90 text-white border border-blue-400/30 shadow-md shadow-blue-600/30 animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-300" /> Your Project
              </span>
            )}
          </div>

          {/* Star Rating Badge on Bottom of Image */}
          {submission.rating && (
            <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-amber-500/30 shadow-md">
              <StarRating value={submission.rating} readOnly size="sm" />
              <span className="text-xs font-bold text-amber-400">
                {submission.rating}.0
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug">
              {submission.projectName}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-300">
                {submission.student?.name || "Student"}
              </span>
              <span>•</span>
              <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description snippet */}
          <p className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
            {submission.description}
          </p>

          {/* Mentor Feedback Snippet Quote */}
          {submission.feedback && (
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/90 italic line-clamp-2">
              "{submission.feedback}"
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Social & Action Links */}
      <div className="p-5 pt-0 border-t border-white/5 mt-2">
        <div className="flex items-center justify-between pt-3">
          {/* Social Interaction Buttons */}
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLikeClick}
              aria-label="Like project"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                submission.isLikedByMe
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  submission.isLikedByMe
                    ? "fill-rose-500 text-rose-500"
                    : "text-slate-400"
                } ${likeAnimating ? "scale-130" : "scale-100"}`}
              />
              <span>{submission.likesCount ?? 0}</span>
            </button>

            {/* Comment Count */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{submission.commentsCount ?? 0}</span>
            </div>
          </div>

          {/* Action Links & Delete */}
          <div className="flex items-center gap-2">
            {submission.liveUrl && (
              <a
                href={submission.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open Live Preview"
                className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <a
              href={submission.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="View Source Code"
              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
            </a>

            {/* Self-removal button for project author */}
            {isOwner && onDeleteRequest && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(submission);
                }}
                title="Remove your project"
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
