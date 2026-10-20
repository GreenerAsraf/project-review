"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ submissions: Submission[] }>("/submissions");
      setSubmissions(res.submissions);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchSubmissions();
      }
    }
  }, [user, authLoading, router, fetchSubmissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await apiRequest("/submissions", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          repoUrl,
          liveUrl: liveUrl || undefined,
        }),
      });
      setShowModal(false);
      setTitle("");
      setDescription("");
      setRepoUrl("");
      setLiveUrl("");
      fetchSubmissions();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to submit project");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: Submission["status"]) => {
    const badgeColors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      UNDER_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          badgeColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading Student Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ProjectPilot</h1>
          <p className="text-xs text-gray-500">Student Portal: {user?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowModal(true)}>+ New Submission</Button>
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">My Submissions</h2>
          <span className="text-sm text-gray-500">
            Total Projects: {submissions.length}
          </span>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading your submissions...</p>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">You have not submitted any projects yet.</p>
              <Button onClick={() => setShowModal(true)}>Submit Your First Project</Button>
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
                        Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-3">{sub.description}</p>
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
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                        Reviewer Feedback ({sub.reviews[0].score}/100)
                      </p>
                      <p className="text-sm text-gray-600 italic">
                        &quot;{sub.reviews[0].feedback}&quot;
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white">
            <CardHeader>
              <CardTitle>Submit Project</CardTitle>
              <CardDescription>
                Provide details for reviewer evaluation
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {formError && (
                  <div className="p-3 text-sm rounded bg-red-50 text-red-700 border border-red-200">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Project Title</label>
                  <Input
                    required
                    placeholder="e.g. E-Commerce Backend API"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    rows={3}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Brief overview of features, stack, and setup..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">GitHub Repository URL</label>
                  <Input
                    type="url"
                    required
                    placeholder="https://github.com/username/project"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Live URL (Optional)</label>
                  <Input
                    type="url"
                    placeholder="https://myproject.vercel.app"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="flex items-center justify-end space-x-2 p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Project"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
