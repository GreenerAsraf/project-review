"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getSubmissionComments,
  addComment,
  deleteComment,
  ProjectComment,
  User,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Send,
  Trash2,
  Clock,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

interface CommentSectionProps {
  submissionId: string;
  currentUser: User | null;
  onCommentCountChange?: (count: number) => void;
}

export function CommentSection({
  submissionId,
  currentUser,
  onCommentCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSubmissionComments(submissionId);
      setComments(res.comments);
      if (onCommentCountChange) {
        onCommentCountChange(res.comments.length);
      }
    } catch (err: unknown) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, [submissionId, onCommentCountChange]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    if (content.trim().length < 2) {
      setError("Comment must be at least 2 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await addComment(submissionId, content.trim());
      setComments((prev) => [...prev, res.comment]);
      setContent("");
      if (onCommentCountChange) {
        onCommentCountChange(comments.length + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post comment.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (onCommentCountChange) {
        onCommentCountChange(Math.max(0, comments.length - 1));
      }
    } catch (err: unknown) {
      console.error("Failed to delete comment:", err);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span>Peer Discussion & Comments</span>
          <span className="text-xs text-slate-400 font-normal">
            ({comments.length})
          </span>
        </h4>
      </div>

      {/* Comment Submission Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              maxLength={400}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Leave encouraging feedback or ask a technical question..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all leading-relaxed"
            />
            <div className="flex items-center justify-between pt-1.5 px-1">
              <span className="text-[10px] text-slate-500">
                {content.length}/400 characters
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !content.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1 h-7 rounded-lg cursor-pointer"
              >
                {submitting ? (
                  <Clock className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" /> Post
                  </>
                )}
              </Button>
            </div>
          </div>
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
        </form>
      ) : (
        <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center text-xs text-slate-400">
          <a href="/login" className="text-blue-400 underline font-semibold">
            Sign in
          </a>{" "}
          to join the discussion and leave feedback.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-500">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center py-4 text-xs text-slate-500 italic">
            No comments yet. Be the first to start the conversation!
          </p>
        ) : (
          comments.map((comment) => {
            const isCommentOwner = currentUser?.id === comment.userId;
            const isMentor = comment.user?.role === "MENTOR";

            return (
              <div
                key={comment.id}
                className="p-3 rounded-xl bg-white/3 border border-white/5 space-y-1 group transition-colors hover:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {comment.user?.name || "Student"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-semibold ${
                        isMentor
                          ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                      }`}
                    >
                      {isMentor ? (
                        <>
                          <ShieldCheck className="w-2.5 h-2.5" /> MENTOR
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-2.5 h-2.5" /> STUDENT
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {(isCommentOwner || currentUser?.role === "MENTOR") && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5 cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
