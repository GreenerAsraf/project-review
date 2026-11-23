"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, deleteSubmission, Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NavigationBar } from "@/components/NavigationBar";
import { StarRating } from "@/components/StarRating";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  AlertCircle,
  Check,
  MessageSquareQuote,
  Star,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  "Full Stack",
  "Frontend",
  "API & Backend",
  "Mobile",
  "UI/UX",
] as const;

const submissionClientSchema = z.object({
  projectName: z.string().trim().min(3, "Project name must be at least 3 characters long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters long"),
  category: z.enum(CATEGORIES).optional(),
  screenshotUrl: z
    .string()
    .trim()
    .url("Please enter a valid image URL (e.g. https://...)")
    .refine((url) => /^https?:\/\//i.test(url), "Must begin with http:// or https://")
    .optional()
    .or(z.literal("")),
  repoUrl: z
    .string()
    .trim()
    .url("Please enter a valid URL (e.g. https://github.com/user/repo)")
    .refine((url) => /^https?:\/\//i.test(url), "Must begin with http:// or https://"),
  liveUrl: z
    .string()
    .trim()
    .url("Please enter a valid live preview URL")
    .refine((url) => /^https?:\/\//i.test(url), "Must begin with http:// or https://")
    .optional()
    .or(z.literal("")),
});

const editClientSchema = z.object({
  projectName: z.string().trim().min(3, "Project name must be at least 3 characters long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters long"),
  category: z.enum(CATEGORIES).optional(),
  screenshotUrl: z
    .string()
    .trim()
    .url("Please enter a valid image URL (e.g. https://...)")
    .refine((url) => /^https?:\/\//i.test(url), "Must begin with http:// or https://")
    .optional()
    .or(z.literal("")),
  liveUrl: z
    .string()
    .trim()
    .url("Please enter a valid live preview URL")
    .refine((url) => /^https?:\/\//i.test(url), "Must begin with http:// or https://")
    .optional()
    .or(z.literal("")),
});

export default function StudentDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Full Stack");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal state
  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<string>("Full Stack");
  const [editScreenshotUrl, setEditScreenshotUrl] = useState("");
  const [editLiveUrl, setEditLiveUrl] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete state
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchMySubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ submissions: Submission[] }>("/submissions/my");
      setSubmissions(res.submissions);
    } catch (err: unknown) {
      console.error("Failed to fetch student submissions", err);
      showToast("Failed to load your submissions.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "STUDENT") {
        router.push("/mentor");
      } else {
        fetchMySubmissions();
      }
    }
  }, [user, authLoading, router, fetchMySubmissions]);

  // Handle Create Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const validation = submissionClientSchema.safeParse({
      projectName,
      description,
      category,
      screenshotUrl,
      repoUrl,
      liveUrl,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      await apiRequest<{ message: string; submission: Submission }>("/submissions", {
        method: "POST",
        body: JSON.stringify({
          projectName,
          description,
          category,
          screenshotUrl: screenshotUrl.trim() || undefined,
          repoUrl,
          liveUrl: liveUrl.trim() || undefined,
        }),
      });

      showToast("Your project submission was created successfully!");
      setShowModal(false);
      setProjectName("");
      setDescription("");
      setScreenshotUrl("");
      setRepoUrl("");
      setLiveUrl("");
      setFieldErrors({});
      fetchMySubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create submission.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (sub: Submission) => {
    setEditingSub(sub);
    setEditProjectName(sub.projectName);
    setEditDescription(sub.description);
    setEditCategory(sub.category || "Full Stack");
    setEditScreenshotUrl(sub.screenshotUrl || "");
    setEditLiveUrl(sub.liveUrl || "");
    setEditFieldErrors({});
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setEditFieldErrors({});

    const validation = editClientSchema.safeParse({
      projectName: editProjectName,
      description: editDescription,
      category: editCategory,
      screenshotUrl: editScreenshotUrl,
      liveUrl: editLiveUrl,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
      });
      setEditFieldErrors(errors);
      return;
    }

    setEditSubmitting(true);

    try {
      await apiRequest<{ message: string; submission: Submission }>(
        `/submissions/${editingSub.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            projectName: editProjectName,
            description: editDescription,
            category: editCategory,
            screenshotUrl: editScreenshotUrl.trim() || undefined,
            liveUrl: editLiveUrl.trim() || undefined,
          }),
        }
      );

      showToast("Submission updated successfully!");
      setEditingSub(null);
      fetchMySubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update submission.";
      showToast(msg, "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!confirmDeleteSub) return;
    try {
      setDeleting(true);
      await deleteSubmission(confirmDeleteSub.id);
      showToast("Submission deleted successfully.");
      setConfirmDeleteSub(null);
      fetchMySubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete submission.";
      showToast(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: Submission["status"]) => {
    const badgeColors: Record<
      Submission["status"],
      { bg: string; text: string; icon: React.ReactNode; label: string }
    > = {
      PENDING: {
        bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        text: "text-amber-400",
        icon: <Clock className="w-3.5 h-3.5" />,
        label: "Under Review",
      },
      APPROVED: {
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        text: "text-emerald-400",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        label: "Approved & Live",
      },
      REJECTED: {
        bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        text: "text-rose-400",
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: "Needs Revision",
      },
    };
    const current = badgeColors[status] || badgeColors.PENDING;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}
      >
        {current.icon}
        {current.label}
      </span>
    );
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400 font-medium">
          <Clock className="w-5 h-5 animate-spin text-blue-400" />
          Loading Student Portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <NavigationBar
          variant="dark"
          subtitle={`Student Portal • ${user?.name || "Student"}`}
          rightContent={
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-lg shadow-blue-600/30 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5"
            >
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">New</span>
            </Button>
          }
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 animate-bounce duration-300">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
                toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/90 border-rose-500/30 text-rose-300"
              }`}
            >
              {toast.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-xs opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                My Projects & Portfolio
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Track status, review mentor evaluation scores, and manage your portfolio showcases.
              </p>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-lg shadow-blue-600/30 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Submit New Project
            </Button>
          </div>

          {loading ? (
            /* Shimmer Skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-white/5 rounded-2xl animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            /* Empty State */
            <Card className="text-center py-16 bg-white/2 border-dashed border-white/15">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">No submissions yet</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Get started by submitting your repository URL and project details for your mentor to evaluate.
                </p>
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 cursor-pointer"
                >
                  Create Your First Submission
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Submissions Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {submissions.map((sub) => {
                const isPending = sub.status === "PENDING";
                return (
                  <Card
                    key={sub.id}
                    className="flex flex-col justify-between bg-white/3 border border-white/10 hover:border-white/20 transition-all rounded-2xl overflow-hidden shadow-xl"
                  >
                    <div>
                      {/* Optional Screenshot Header */}
                      {sub.screenshotUrl && (
                        <div className="w-full h-36 overflow-hidden border-b border-white/10 relative group">
                          <img
                            src={sub.screenshotUrl}
                            alt={sub.projectName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-white border border-white/20">
                              {sub.category || "Full Stack"}
                            </span>
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {!sub.screenshotUrl && (
                              <div className="mb-1.5">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {sub.category || "Full Stack"}
                                </span>
                              </div>
                            )}
                            <CardTitle className="text-lg font-bold text-white leading-snug">
                              {sub.projectName}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400 mt-1">
                              Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div>{getStatusBadge(sub.status)}</div>
                        </div>

                        {/* Visual Status Stepper */}
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
                            <span className="text-blue-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Submitted
                            </span>
                            <span
                              className={
                                isPending
                                  ? "text-amber-400 font-semibold flex items-center gap-1"
                                  : "text-emerald-400 font-semibold flex items-center gap-1"
                              }
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                                }`}
                              />
                              {isPending ? "Under Review" : "Evaluation Completed"}
                            </span>
                            <span
                              className={
                                sub.status === "APPROVED"
                                  ? "text-emerald-400 font-bold"
                                  : sub.status === "REJECTED"
                                  ? "text-rose-400 font-bold"
                                  : "text-slate-500"
                              }
                            >
                              {sub.status === "APPROVED"
                                ? "Approved"
                                : sub.status === "REJECTED"
                                ? "Rejected"
                                : "Pending"}
                            </span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                sub.status === "APPROVED"
                                  ? "w-full bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-400"
                                  : sub.status === "REJECTED"
                                  ? "w-full bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500"
                                  : "w-1/2 bg-gradient-to-r from-blue-500 to-amber-400"
                              }`}
                            />
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-0">
                        <p className="text-sm text-slate-300 whitespace-pre-line line-clamp-3 leading-relaxed">
                          {sub.description}
                        </p>

                        {/* Mentor Rating & Feedback Box */}
                        {(sub.rating || sub.feedback) && (
                          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                <MessageSquareQuote className="w-3.5 h-3.5" /> Mentor Evaluation
                              </span>
                              {sub.rating && (
                                <div className="flex items-center gap-1">
                                  <StarRating value={sub.rating} readOnly size="sm" />
                                  <span className="text-xs font-bold text-amber-400">
                                    {sub.rating}.0 / 5
                                  </span>
                                </div>
                              )}
                            </div>
                            {sub.feedback && (
                              <p className="text-xs text-slate-200 italic leading-relaxed pt-1">
                                "{sub.feedback}"
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-6 pt-0 border-t border-white/5 mt-4">
                      <div className="flex items-center justify-between pt-3">
                        {/* External Links */}
                        <div className="flex flex-wrap gap-3 text-xs font-semibold">
                          <a
                            href={sub.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            Repo <ExternalLink className="w-3 h-3" />
                          </a>
                          {sub.liveUrl && (
                            <a
                              href={sub.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                            >
                              Live Demo <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Edit & Delete Controls */}
                        <div className="flex items-center gap-1">
                          {isPending && (
                            <button
                              onClick={() => openEditModal(sub)}
                              className="p-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit submission"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteSub(sub)}
                            className="p-1.5 text-xs text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Delete submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-slate-500 bg-slate-950">
        © 2026 ProjectPilot Assessment System • Student Dashboard
      </footer>

      {/* ─── Create Submission Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border border-white/20 text-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" /> Submit New Project
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Submit your repository, live demo, and showcase details for evaluation.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Project Name *</label>
                  <Input
                    placeholder="e.g. AI Content Synthesizer"
                    className="bg-white/5 border-white/15 text-white placeholder:text-slate-500"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                  {fieldErrors.projectName && (
                    <p className="text-xs text-rose-400">{fieldErrors.projectName}</p>
                  )}
                </div>

                {/* Track Category Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Track Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex w-full rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    GitHub Repository URL *
                  </label>
                  <Input
                    placeholder="https://github.com/username/project"
                    className="bg-white/5 border-white/15 text-white placeholder:text-slate-500"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                  {fieldErrors.repoUrl && (
                    <p className="text-xs text-rose-400">{fieldErrors.repoUrl}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Live Demo URL (Optional)
                  </label>
                  <Input
                    placeholder="https://myproject.vercel.app"
                    className="bg-white/5 border-white/15 text-white placeholder:text-slate-500"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                  />
                  {fieldErrors.liveUrl && (
                    <p className="text-xs text-rose-400">{fieldErrors.liveUrl}</p>
                  )}
                </div>

                {/* Screenshot URL */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Cover Screenshot URL (Optional)</span>
                    <span className="text-[10px] text-slate-500">Imgur / GitHub / CDN</span>
                  </label>
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    className="bg-white/5 border-white/15 text-white placeholder:text-slate-500"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                  />
                  {fieldErrors.screenshotUrl && (
                    <p className="text-xs text-rose-400">{fieldErrors.screenshotUrl}</p>
                  )}
                  {screenshotUrl && (
                    <div className="mt-2 h-24 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={screenshotUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() =>
                          setFieldErrors((prev) => ({
                            ...prev,
                            screenshotUrl: "Image failed to load from this URL",
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Project Description *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {description.length}/1200
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1200}
                    className="flex w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Describe key features, stack used, and setup instructions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs text-rose-400">{fieldErrors.description}</p>
                  )}
                </div>
              </CardContent>
              <div className="flex items-center justify-end space-x-2 p-6 pt-0 border-t border-white/10 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 font-semibold cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Project"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Edit Submission Modal ─── */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border border-white/20 text-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl text-white font-bold flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-400" /> Edit Submission
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Update project name, description, cover screenshot, or live demo URL while in PENDING status.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleEditSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Project Name *</label>
                  <Input
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="bg-white/5 border-white/15 text-white"
                  />
                  {editFieldErrors.projectName && (
                    <p className="text-xs text-rose-400">{editFieldErrors.projectName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Track Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="flex w-full rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    GitHub Repository (Fixed)
                  </label>
                  <Input
                    disabled
                    value={editingSub.repoUrl}
                    className="bg-white/5 border-white/10 text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-500">
                    Repository URL cannot be modified after initial submission.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Live Demo URL (Optional)
                  </label>
                  <Input
                    value={editLiveUrl}
                    onChange={(e) => setEditLiveUrl(e.target.value)}
                    placeholder="https://myproject.vercel.app"
                    className="bg-white/5 border-white/15 text-white"
                  />
                  {editFieldErrors.liveUrl && (
                    <p className="text-xs text-rose-400">{editFieldErrors.liveUrl}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Cover Screenshot URL (Optional)
                  </label>
                  <Input
                    value={editScreenshotUrl}
                    onChange={(e) => setEditScreenshotUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-white/5 border-white/15 text-white"
                  />
                  {editFieldErrors.screenshotUrl && (
                    <p className="text-xs text-rose-400">{editFieldErrors.screenshotUrl}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Project Description *
                  </label>
                  <textarea
                    rows={4}
                    maxLength={1200}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="flex w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  {editFieldErrors.description && (
                    <p className="text-xs text-rose-400">{editFieldErrors.description}</p>
                  )}
                </div>
              </CardContent>
              <div className="flex items-center justify-end space-x-2 p-6 pt-0 border-t border-white/10 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSub(null)}
                  className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 font-semibold cursor-pointer"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {confirmDeleteSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-slate-900 border border-rose-500/30 text-white shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" /> Remove Project Submission?
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-white">
                  "{confirmDeleteSub.projectName}"
                </span>
                ? This action will remove all reviews, comments, and likes.
              </CardDescription>
            </CardHeader>
            <div className="flex items-center justify-end gap-3 p-6 pt-2 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteSub(null)}
                className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
              >
                {deleting ? "Deleting..." : "Yes, Delete Project"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
