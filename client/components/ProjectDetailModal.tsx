"use client";

import React, { useEffect, useState } from "react";
import { Submission, User } from "@/lib/api";
import { CoverImage } from "@/components/CoverImage";
import { StarRating } from "@/components/StarRating";
import { CommentSection } from "@/components/CommentSection";
import { Button } from "@/components/ui/button";
import {
  X,
  ExternalLink,
  Code2,
  Heart,
  Share2,
  Check,
  MessageSquareQuote,
  Sparkles,
  Calendar,
  User as UserIcon,
  Trash2,
} from "lucide-react";

interface ProjectDetailModalProps {
  submission: Submission | null;
  currentUser: User | null;
  onClose: () => void;
  onLikeToggle: (id: string) => void;
  onDeleteRequest?: (sub: Submission) => void;
}

export function ProjectDetailModal({
  submission,
  currentUser,
  onClose,
  onLikeToggle,
  onDeleteRequest,
}: ProjectDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!submission) return null;

  const isOwner = currentUser && submission.studentId === currentUser.id;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/showcase?project=${submission.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/15 text-white shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Cover Image Header */}
        <div className="relative w-full h-48 sm:h-56 bg-slate-950 shrink-0">
          <CoverImage
            screenshotUrl={submission.screenshotUrl}
            category={submission.category}
            alt={submission.projectName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40 pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-slate-400 hover:text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on Top */}
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/20">
              {submission.category || "Full Stack"}
            </span>
            {isOwner && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600/90 text-white border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Your Project
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {submission.projectName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                <span className="flex items-center gap-1 text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  {submission.student?.name || "Student Developer"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(submission.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick Actions: Like + Share */}
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => {
                  setLikeAnimating(true);
                  setTimeout(() => setLikeAnimating(false), 450);
                  onLikeToggle(submission.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  submission.isLikedByMe
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-colors duration-200 ${
                    submission.isLikedByMe ? "fill-rose-500 text-rose-500" : ""
                  } ${likeAnimating ? "animate-heart-pulse" : ""}`}
                />
                <span>{submission.likesCount ?? 0}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Copy shareable link"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Links Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {submission.liveUrl && (
              <a
                href={submission.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-bold transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Live Demo Preview
              </a>
            )}

            <a
              href={submission.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 text-xs font-bold transition-all"
            >
              <Code2 className="w-4 h-4" /> GitHub Source Code
            </a>

            {isOwner && onDeleteRequest && (
              <button
                type="button"
                onClick={() => onDeleteRequest(submission)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Project
              </button>
            )}
          </div>

          {/* Description Narrative */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              About the Project
            </h4>
            <div className="p-4 rounded-xl bg-white/3 border border-white/5 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {submission.description}
            </div>
          </div>

          {/* Mentor Evaluation Box */}
          {(submission.rating || submission.feedback) && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4" /> Verified Mentor Review
                </span>
                {submission.rating && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={submission.rating} readOnly size="sm" />
                    <span className="text-xs font-bold text-amber-400">
                      {submission.rating}.0 / 5
                    </span>
                  </div>
                )}
              </div>
              {submission.feedback && (
                <p className="text-sm text-slate-200 italic leading-relaxed pt-1">
                  "{submission.feedback}"
                </p>
              )}
            </div>
          )}

          {/* Peer Comments Thread */}
          <CommentSection
            submissionId={submission.id}
            currentUser={currentUser}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end bg-slate-950/60 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
