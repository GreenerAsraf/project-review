"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function ReviewerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Active review modal
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(85);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED" | "UNDER_REVIEW">("APPROVED");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchAllSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ submissions: Submission[] }>("/submissions");
      setSubmissions(res.submissions);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "REVIEWER" && user.role !== "ADMIN") {
        router.push("/student");
      } else {
        fetchAllSubmissions();
      }
    }
  }, [user, authLoading, router, fetchAllSubmissions]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setReviewError("");
    setSubmitting(true);

    try {
      await apiRequest(`/reviews/${selectedSub.id}`, {
        method: "POST",
        body: JSON.stringify({
          feedback,
          score: Number(score),
          status,
        }),
      });
      setSelectedSub(null);
      setFeedback("");
      setScore(85);
      fetchAllSubmissions();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setReviewError(err.message);
      } else {
        setReviewError("Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (subStatus: Submission["status"]) => {
    const badgeColors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      UNDER_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          badgeColors[subStatus] || "bg-gray-100 text-gray-800"
        }`}
      >
        {subStatus.replace("_", " ")}
      </span>
    );
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading Reviewer Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ProjectPilot</h1>
          <p className="text-xs text-gray-500">Reviewer Portal: {user?.name}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sign Out
        </Button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Student Submissions</h2>
          <span className="text-sm text-gray-500">
            Pending / Total: {submissions.filter((s) => s.status === "PENDING").length} / {submissions.length}
          </span>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500">No student projects submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((sub) => (
              <Card key={sub.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{sub.title}</CardTitle>
                      <CardDescription className="mt-1">
                        By {sub.student?.name || "Student"} ({sub.student?.email}) •{" "}
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">{sub.description}</p>
                  <div className="flex space-x-4 text-xs font-medium text-blue-600">
                    <a
                      href={sub.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      GitHub Repo ↗
                    </a>
                    {sub.liveUrl && (
                      <a
                        href={sub.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Live Preview ↗
                      </a>
                    )}
                  </div>

                  {sub.reviews && sub.reviews.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Latest Review ({sub.reviews[0].score}/100) by {sub.reviews[0].reviewer?.name}
                      </p>
                      <p className="text-sm text-gray-600 italic">
                        &quot;{sub.reviews[0].feedback}&quot;
                      </p>
                    </div>
                  )}

                  <div className="pt-3">
                    <Button
                      variant={sub.status === "PENDING" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedSub(sub)}
                    >
                      {sub.status === "PENDING" ? "Review Submission" : "Update Review"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white">
            <CardHeader>
              <CardTitle>Review Project: {selectedSub.title}</CardTitle>
              <CardDescription>
                Submitted by {selectedSub.student?.name}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleReviewSubmit}>
              <CardContent className="space-y-4">
                {reviewError && (
                  <div className="p-3 text-sm rounded bg-red-50 text-red-700 border border-red-200">
                    {reviewError}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Decision Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "APPROVED" | "REJECTED" | "UNDER_REVIEW")
                    }
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="UNDER_REVIEW">Needs Revision / Under Review</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Score (0 - 100)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Detailed Feedback</label>
                  <textarea
                    required
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Provide constructive feedback on architecture, code quality, and styling..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="flex items-center justify-end space-x-2 p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedSub(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
