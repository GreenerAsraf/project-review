"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  apiRequest,
  reviewSubmission,
  Submission,
  MentorStats,
  PaginationMeta,
  MentorSubmissionsResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NavigationBar } from "@/components/NavigationBar";
import { StarRating } from "@/components/StarRating";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  X,
  Star,
  Award,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

export default function MentorDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<MentorStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);

  // Detail Modal state
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Review & Evaluation Modal state
  const [evalSub, setEvalSub] = useState<Submission | null>(null);
  const [evalStatus, setEvalStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [evalRating, setEvalRating] = useState<number>(5);
  const [evalFeedback, setEvalFeedback] = useState<string>("");
  const [evalSubmitting, setEvalSubmitting] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchMentorData = useCallback(
    async (
      page: number = 1,
      status: string = statusFilter,
      search: string = searchQuery,
      sort: string = sortBy
    ) => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: "10",
        });

        if (status !== "ALL") {
          queryParams.append("status", status);
        }

        if (search.trim()) {
          queryParams.append("search", search.trim());
        }

        if (sort) {
          queryParams.append("sortBy", sort);
        }

        const res = await apiRequest<MentorSubmissionsResponse>(
          `/mentor/submissions?${queryParams.toString()}`
        );

        setSubmissions(res.submissions);
        setPagination(res.pagination);
        setStats(res.stats);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to fetch mentor submissions.";
        showToast(msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchQuery, sortBy]
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "MENTOR") {
        router.push("/student");
      } else {
        fetchMentorData(1, statusFilter, searchQuery, sortBy);
      }
    }
  }, [user, authLoading, router, statusFilter, sortBy, fetchMentorData]);

  // Handle Search Submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMentorData(1, statusFilter, searchQuery, sortBy);
  };

  // Open Evaluation Modal
  const openEvaluationModal = (sub: Submission) => {
    setEvalSub(sub);
    setEvalStatus(sub.status === "REJECTED" ? "REJECTED" : "APPROVED");
    setEvalRating(sub.rating ?? 5);
    setEvalFeedback(sub.feedback ?? "");
    setEvalError(null);
  };

  // Submit Evaluation Form
  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalSub) return;

    if (evalFeedback.trim() && evalFeedback.trim().length < 5) {
      setEvalError("Feedback must be at least 5 characters long.");
      return;
    }

    try {
      setEvalSubmitting(true);
      setEvalError(null);

      const res = await reviewSubmission(evalSub.id, {
        status: evalStatus,
        rating: evalStatus === "APPROVED" ? evalRating : undefined,
        feedback: evalFeedback.trim() || undefined,
      });

      showToast(`Submission evaluated successfully as ${evalStatus}!`);

      // Update local state and close modal
      setSubmissions((prev) =>
        prev.map((s) => (s.id === evalSub.id ? res.submission : s))
      );

      if (selectedSub && selectedSub.id === evalSub.id) {
        setSelectedSub(res.submission);
      }

      setEvalSub(null);

      // Refresh mentor stats and list in background
      fetchMentorData(pagination.currentPage, statusFilter, searchQuery, sortBy);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit evaluation.";
      setEvalError(msg);
      showToast(msg, "error");
    } finally {
      setEvalSubmitting(false);
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
        label: "Pending",
      },
      APPROVED: {
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        text: "text-emerald-400",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        label: "Approved",
      },
      REJECTED: {
        bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        text: "text-rose-400",
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: "Rejected",
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

  const getRatingFeedbackSummary = (rating?: number | null) => {
    if (!rating) return null;
    const labels: Record<number, string> = {
      5: "Exceptional (5.0)",
      4: "Great Work (4.0)",
      3: "Satisfactory (3.0)",
      2: "Needs Improvement (2.0)",
      1: "Major Revisions (1.0)",
    };
    return labels[rating] || `${rating}.0 Stars`;
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400 font-medium">
          <Clock className="w-5 h-5 animate-spin text-blue-400" />
          Loading Mentor Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <NavigationBar
          variant="dark"
          subtitle={`Mentor Portal • ${user?.name || "Mentor"}`}
          rightContent={
            <Button
              size="sm"
              variant="outline"
              onClick={logout}
              className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
            >
              Sign Out
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
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mentor Evaluation Dashboard
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Evaluate student projects with 1-5 star ratings, structured feedback, and status decisions.
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/3 border border-white/10 text-white rounded-2xl shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/3 border border-white/10 text-white rounded-2xl shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/3 border border-white/10 text-white rounded-2xl shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{stats.rejected}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/3 border border-white/10 text-white rounded-2xl shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Total Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{stats.total}</div>
              </CardContent>
            </Card>
          </div>

          {/* Control Bar: Search + Filter + Sort */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/3 p-4 rounded-2xl border border-white/10 shadow-lg">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by project name or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      fetchMentorData(1, st, searchQuery, sortBy);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as "newest" | "oldest";
                    setSortBy(val);
                    fetchMentorData(1, statusFilter, searchQuery, val);
                  }}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-slate-900 text-white">
                    Newest First
                  </option>
                  <option value="oldest" className="bg-slate-900 text-white">
                    Oldest First
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Submissions Table Card */}
          <div className="bg-white/3 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            {loading ? (
              /* Shimmer Table Skeleton */
              <div className="p-8 space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-xl w-full" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <p className="text-base font-semibold text-white">No submissions found</p>
                <p className="text-xs text-slate-500">
                  Try adjusting your status filter or search query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-5">Project & Track</th>
                      <th className="py-3.5 px-5">Student</th>
                      <th className="py-3.5 px-5">Links</th>
                      <th className="py-3.5 px-5">Status & Rating</th>
                      <th className="py-3.5 px-5">Submitted</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/3 transition-colors">
                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="font-bold text-white hover:text-blue-400 text-left transition-colors flex items-center gap-1.5 group cursor-pointer"
                          >
                            <span>{sub.projectName}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {sub.category || "Full Stack"}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">
                              {sub.description}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-white">
                            {sub.student?.name || "Student"}
                          </div>
                          <div className="text-xs text-slate-500">{sub.student?.email}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col space-y-1 text-xs">
                            <a
                              href={sub.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              Repo <ExternalLink className="w-3 h-3" />
                            </a>
                            {sub.liveUrl && (
                              <a
                                href={sub.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              >
                                Live Demo <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1">
                            <div>{getStatusBadge(sub.status)}</div>
                            {sub.rating ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <StarRating value={sub.rating} readOnly size="sm" />
                                <span className="text-[11px] font-bold text-amber-400">
                                  {sub.rating}.0
                                </span>
                              </div>
                            ) : sub.status === "APPROVED" ? (
                              <span className="text-[10px] text-slate-500 italic">
                                Unrated
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-400">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Button
                            size="sm"
                            onClick={() => openEvaluationModal(sub)}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-400" />
                            {sub.status === "PENDING" ? "Review & Rate" : "Re-evaluate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage || loading}
                onClick={() =>
                  fetchMentorData(
                    pagination.currentPage - 1,
                    statusFilter,
                    searchQuery,
                    sortBy
                  )
                }
                className="border-white/10 text-white hover:bg-white/5 cursor-pointer"
              >
                ← Previous
              </Button>
              <span className="text-xs text-slate-400 font-medium">
                Page {pagination.currentPage} of {pagination.totalPages} (
                {pagination.totalRecords} records)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || loading}
                onClick={() =>
                  fetchMentorData(
                    pagination.currentPage + 1,
                    statusFilter,
                    searchQuery,
                    sortBy
                  )
                }
                className="border-white/10 text-white hover:bg-white/5 cursor-pointer"
              >
                Next →
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-slate-500 bg-slate-950">
        © 2026 ProjectPilot Assessment System • Mentor Review Dashboard
      </footer>

      {/* ─── Detail Modal ─── */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl bg-slate-900 border border-white/15 text-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedSub.category || "Full Stack"}
                  </span>
                  {selectedSub.rating && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {selectedSub.rating}.0 / 5
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-white">
                  {selectedSub.projectName}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-1">
                  Submitted by {selectedSub.student?.name} ({selectedSub.student?.email}) on{" "}
                  {new Date(selectedSub.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Current Status
                </span>
                {getStatusBadge(selectedSub.status)}
              </div>

              {/* Cover Image Preview if present */}
              {selectedSub.screenshotUrl && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Project Screenshot
                  </span>
                  <div className="rounded-xl overflow-hidden border border-white/10 max-h-48">
                    <img
                      src={selectedSub.screenshotUrl}
                      alt={selectedSub.projectName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Project Description
                </span>
                <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed bg-white/3 p-4 rounded-xl border border-white/5">
                  {selectedSub.description}
                </p>
              </div>

              {/* Mentor Feedback & Rating Box if already reviewed */}
              {(selectedSub.feedback || selectedSub.rating) && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquareQuote className="w-4 h-4" /> Mentor Evaluation
                    </span>
                    {selectedSub.rating && (
                      <div className="flex items-center gap-1.5">
                        <StarRating value={selectedSub.rating} readOnly size="sm" />
                        <span className="text-xs font-bold text-amber-400">
                          {selectedSub.rating}.0 / 5
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedSub.feedback && (
                    <p className="text-sm text-slate-200 italic leading-relaxed pt-1">
                      "{selectedSub.feedback}"
                    </p>
                  )}
                  {selectedSub.reviewedAt && (
                    <span className="text-[11px] text-slate-400 block pt-1">
                      Evaluated on {new Date(selectedSub.reviewedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Project Links
                </span>
                <div className="flex flex-col gap-2 text-xs">
                  <a
                    href={selectedSub.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-blue-400 hover:text-blue-300 flex items-center justify-between transition-colors"
                  >
                    <span>GitHub: {selectedSub.repoUrl}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {selectedSub.liveUrl && (
                    <a
                      href={selectedSub.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-cyan-400 hover:text-cyan-300 flex items-center justify-between transition-colors"
                    >
                      <span>Live Demo: {selectedSub.liveUrl}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSub(null)}
                  className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    openEvaluationModal(selectedSub);
                    setSelectedSub(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  Evaluate & Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Mentor Review & Evaluation Modal ─── */}
      {evalSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-slate-900 border border-white/20 text-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {evalSub.category || "Full Stack"}
                  </span>
                  <span className="text-xs text-slate-400">
                    by {evalSub.student?.name || "Student"}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Evaluate: {evalSub.projectName}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-1">
                  Provide qualitative evaluation and assign a 1-5 star rating for the public showcase.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setEvalSub(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleEvaluationSubmit}>
              <CardContent className="space-y-5">
                {evalError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{evalError}</span>
                  </div>
                )}

                {/* Decision Toggle: APPROVED vs REJECTED */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Review Decision *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEvalStatus("APPROVED")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                        evalStatus === "APPROVED"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20"
                          : "bg-white/3 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Approve & Showcase
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvalStatus("REJECTED")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
                        evalStatus === "REJECTED"
                          ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/20"
                          : "bg-white/3 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      Reject Project
                    </button>
                  </div>
                </div>

                {/* 1-5 Star Rating Selector */}
                {evalStatus === "APPROVED" && (
                  <div className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Star Rating (1 - 5 Stars) *
                      </label>
                      <span className="text-xs font-bold text-amber-400">
                        {getRatingFeedbackSummary(evalRating)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center py-2 bg-slate-950/60 rounded-xl border border-white/5">
                      <StarRating
                        value={evalRating}
                        onChange={(r) => setEvalRating(r)}
                        size="lg"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      Click a star to assign rating. 5 = Outstanding, 4 = Very Good, 3 = Solid.
                    </p>
                  </div>
                )}

                {/* Constructive Qualitative Feedback */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Constructive Feedback & Notes
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {evalFeedback.length}/2000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    placeholder="Provide constructive feedback: what worked well, code architecture highlights, suggestions for further improvement..."
                    maxLength={2000}
                    className="flex w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500">
                    This feedback will be visible on the student's dashboard and the public showcase.
                  </p>
                </div>
              </CardContent>

              <div className="flex items-center justify-end gap-3 p-6 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEvalSub(null)}
                  className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={evalSubmitting}
                  className={`font-semibold cursor-pointer ${
                    evalStatus === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-rose-600 hover:bg-rose-500 text-white"
                  }`}
                >
                  {evalSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </span>
                  ) : evalStatus === "APPROVED" ? (
                    "Approve with Rating & Feedback"
                  ) : (
                    "Confirm Rejection"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
