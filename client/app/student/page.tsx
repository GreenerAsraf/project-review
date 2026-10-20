"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, Submission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { z } from "zod";

const submissionClientSchema = z.object({
  projectName: z.string().trim().min(3, "Project name must be at least 3 characters long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters long"),
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

export default function StudentDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form inputs
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMySubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ submissions: Submission[] }>("/submissions/my");
      setSubmissions(res.submissions);
    } catch (err: unknown) {
      console.error("Failed to fetch student submissions", err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    setFieldErrors({});

    // Client-side immediate validation
    const validation = submissionClientSchema.safeParse({
      projectName,
      description,
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
          repoUrl,
          liveUrl: liveUrl.trim() || undefined,
        }),
      });

      setSuccessMessage("Your project submission was successfully created!");
      setShowModal(false);
      setProjectName("");
      setDescription("");
      setRepoUrl("");
      setLiveUrl("");
      fetchMySubmissions();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Failed to create project submission.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: Submission["status"]) => {
    const badgeMap: Record<Submission["status"], { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-yellow-100 border-yellow-200", text: "text-yellow-800", label: "Pending Review" },
      APPROVED: { bg: "bg-green-100 border-green-200", text: "text-green-800", label: "Approved" },
      REJECTED: { bg: "bg-red-100 border-red-200", text: "text-red-800", label: "Rejected" },
    };
    const current = badgeMap[status] || badgeMap.PENDING;
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${current.bg} ${current.text}`}>
        {current.label}
      </span>
    );
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading Student Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ProjectPilot</h1>
          <p className="text-xs text-gray-500">Student Portal • {user?.name} ({user?.email})</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowModal(true)}>+ Submit Project</Button>
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium flex justify-between items-center">
            <span>✅ {successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="text-xs text-green-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Project Submissions</h2>
            <p className="text-sm text-gray-500">Track and review the status of your coursework projects</p>
          </div>
          <span className="text-sm text-gray-500 font-medium">
            Total Submissions: {submissions.length}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading your submissions...</div>
        ) : submissions.length === 0 ? (
          <Card className="text-center py-16 bg-white border-dashed border-2">
            <CardContent className="space-y-4">
              <p className="text-gray-500 text-base">You haven&apos;t submitted any projects yet.</p>
              <Button onClick={() => setShowModal(true)}>Create Your First Submission</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((sub) => (
              <Card key={sub.id} className="flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">{sub.projectName}</CardTitle>
                      <CardDescription className="text-xs text-gray-500 mt-1">
                        Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-3">
                    {sub.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-blue-600 pt-2 border-t border-gray-100">
                    <a
                      href={sub.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      GitHub Repository ↗
                    </a>
                    {sub.liveUrl && (
                      <a
                        href={sub.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader>
              <CardTitle>Submit Project</CardTitle>
              <CardDescription>
                Submit your project repository and details for mentor evaluation
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {serverError && (
                  <div className="p-3 text-sm rounded bg-red-50 text-red-700 border border-red-200">
                    {serverError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Project Name *</label>
                  <Input
                    placeholder="e.g. Fullstack Task Manager"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                  {fieldErrors.projectName && (
                    <p className="text-xs text-red-600">{fieldErrors.projectName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">GitHub Repository URL *</label>
                  <Input
                    placeholder="https://github.com/username/project"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                  {fieldErrors.repoUrl && (
                    <p className="text-xs text-red-600">{fieldErrors.repoUrl}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Live Demo URL (Optional)</label>
                  <Input
                    placeholder="https://myproject.vercel.app"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                  />
                  {fieldErrors.liveUrl && (
                    <p className="text-xs text-red-600">{fieldErrors.liveUrl}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Project Description *</label>
                  <textarea
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Describe key features, stack used, and setup instructions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs text-red-600">{fieldErrors.description}</p>
                  )}
                </div>
              </CardContent>
              <div className="flex items-center justify-end space-x-2 p-6 pt-0 border-t border-gray-100">
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
