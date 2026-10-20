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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NavigationBar } from "@/components/NavigationBar";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMentorData = useCallback(
    async (page: number = 1, status: string = statusFilter) => {
      try {
        setLoading(true);
        setActionError(null);

        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: "10",
        });

        if (status !== "ALL") {
          queryParams.append("status", status);
        }

        const res = await apiRequest<MentorSubmissionsResponse>(
          `/mentor/submissions?${queryParams.toString()}`
        );

        setSubmissions(res.submissions);
        setPagination(res.pagination);
        setStats(res.stats);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setActionError(err.message);
        } else {
          setActionError("Failed to fetch mentor submissions.");
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "MENTOR") {
        router.push("/student");
      } else {
        fetchMentorData(1, statusFilter);
      }
    }
  }, [user, authLoading, router, statusFilter, fetchMentorData]);

  const handleUpdateStatus = async (
    submissionId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      setActionLoadingId(submissionId);
      setActionError(null);

      await apiRequest(`/mentor/submissions/${submissionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      // Refetch page data to maintain synchronization
      fetchMentorData(pagination.currentPage, statusFilter);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Failed to update submission status.");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: Submission["status"]) => {
    const badgeColors: Record<Submission["status"], { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-yellow-100 border-yellow-300", text: "text-yellow-800", label: "Pending" },
      APPROVED: { bg: "bg-green-100 border-green-300", text: "text-green-800", label: "Approved" },
      REJECTED: { bg: "bg-red-100 border-red-300", text: "text-red-800", label: "Rejected" },
    };
    const current = badgeColors[status] || badgeColors.PENDING;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text}`}>
        {current.label}
      </span>
    );
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading Mentor Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header with Logo, Home, Back, and Reload */}
      <NavigationBar
        variant="light"
        subtitle={`Mentor Portal • ${user?.name || "Mentor"}`}
        rightContent={
          <Button size="sm" variant="outline" onClick={logout}>
            Sign Out
          </Button>
        }
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submissions Management</h2>
          <p className="text-sm text-gray-500">Review, evaluate, and approve student coursework projects</p>
        </div>

        {/* Global Action Error Alert */}
        {actionError && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex justify-between items-center">
            <span>⚠️ {actionError}</span>
            <button onClick={() => setActionError(null)} className="text-xs text-red-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Approved Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Rejected Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Server-Side Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <div className="flex space-x-1">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    statusFilter === st
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} results)
          </span>
        </div>

        {/* Submissions Table View */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-500">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No submissions found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Links</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{sub.projectName}</div>
                        <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                          {sub.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{sub.student?.name || "Student"}</div>
                        <div className="text-xs text-gray-500">{sub.student?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1 text-xs text-blue-600">
                          <a
                            href={sub.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            Repo ↗
                          </a>
                          {sub.liveUrl && (
                            <a
                              href={sub.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              Live ↗
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(sub.status)}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {actionLoadingId === sub.id ? (
                          <span className="text-xs text-gray-400">Updating...</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(sub.id, "APPROVED")}
                              disabled={sub.status === "APPROVED"}
                              className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
                                sub.status === "APPROVED"
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                  : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                              }`}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(sub.id, "REJECTED")}
                              disabled={sub.status === "REJECTED"}
                              className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
                                sub.status === "REJECTED"
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                  : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
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

          {/* Server-Side Pagination Bar */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => fetchMentorData(pagination.currentPage - 1, statusFilter)}
            >
              ← Previous
            </Button>
            <span className="text-xs text-gray-600 font-medium">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => fetchMentorData(pagination.currentPage + 1, statusFilter)}
            >
              Next →
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
