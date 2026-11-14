"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  apiRequest,
  Submission,
  MentorStats,
  PaginationMeta,
  MentorSubmissionsResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NavigationBar } from "@/components/NavigationBar";
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
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Selected submission for detail modal
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

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

  const handleUpdateStatus = async (
    submissionId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      setActionLoadingId(submissionId);

      await apiRequest(`/mentor/submissions/${submissionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      showToast(`Submission successfully marked as ${newStatus}!`);

      // Refetch page data to maintain synchronization
      fetchMentorData(pagination.currentPage, statusFilter, searchQuery, sortBy);
      if (selectedSub && selectedSub.id === submissionId) {
        setSelectedSub({ ...selectedSub, status: newStatus });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update submission status.";
      showToast(msg, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: Submission["status"]) => {
    const badgeColors: Record<Submission["status"], { bg: string; text: string; icon: React.ReactNode; label: string }> = {
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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}>
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
            <Button size="sm" variant="outline" onClick={logout} className="border-white/20 text-white hover:bg-white/10 cursor-pointer">
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
              <button onClick={() => setToast(null)} className="ml-2 text-xs opacity-70 hover:opacity-100">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Submissions Management</h2>
            <p className="text-sm text-slate-400 mt-1">Review, filter, and evaluate student project submissions.</p>
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
                  <option value="newest" className="bg-slate-900 text-white">Newest First</option>
                  <option value="oldest" className="bg-slate-900 text-white">Oldest First</option>
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
                <p className="text-xs text-slate-500">Try adjusting your status filter or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-5">Project</th>
                      <th className="py-3.5 px-5">Student</th>
                      <th className="py-3.5 px-5">Links</th>
                      <th className="py-3.5 px-5">Status</th>
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
                            className="font-bold text-white hover:text-blue-400 text-left transition-colors flex items-center gap-1.5 group"
                          >
                            <span>{sub.projectName}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                          </button>
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                            {sub.description}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-white">{sub.student?.name || "Student"}</div>
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
                        <td className="py-3.5 px-5">{getStatusBadge(sub.status)}</td>
                        <td className="py-3.5 px-5 text-xs text-slate-400">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2">
                          {actionLoadingId === sub.id ? (
                            <span className="text-xs text-slate-500 animate-pulse">Updating...</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(sub.id, "APPROVED")}
                                disabled={sub.status === "APPROVED"}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                  sub.status === "APPROVED"
                                    ? "bg-white/5 text-slate-600 border-white/5 cursor-not-allowed"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(sub.id, "REJECTED")}
                                disabled={sub.status === "REJECTED"}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                  sub.status === "REJECTED"
                                    ? "bg-white/5 text-slate-600 border-white/5 cursor-not-allowed"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                }`}
                              >
                                Reject
                              </button>
                            </>
                          )}
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
                onClick={() => fetchMentorData(pagination.currentPage - 1, statusFilter, searchQuery, sortBy)}
                className="border-white/10 text-white hover:bg-white/5"
              >
                ← Previous
              </Button>
              <span className="text-xs text-slate-400 font-medium">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} records)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => fetchMentorData(pagination.currentPage + 1, statusFilter, searchQuery, sortBy)}
                className="border-white/10 text-white hover:bg-white/5"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xl bg-slate-900 border border-white/15 text-white shadow-2xl rounded-2xl">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">{selectedSub.projectName}</CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-1">
                  Submitted by {selectedSub.student?.name} ({selectedSub.student?.email}) on{" "}
                  {new Date(selectedSub.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
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

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Project Description
                </span>
                <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed bg-white/3 p-4 rounded-xl border border-white/5">
                  {selectedSub.description}
                </p>
              </div>

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

              {/* Quick Actions in Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSub(null)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedSub.id, "REJECTED")}
                  disabled={selectedSub.status === "REJECTED"}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedSub.id, "APPROVED")}
                  disabled={selectedSub.status === "APPROVED"}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
