"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getPublicShowcase,
  toggleLike,
  deleteSubmission,
  Submission,
  PaginationMeta,
} from "@/lib/api";
import { NavigationBar } from "@/components/NavigationBar";
import { ShowcaseCard } from "@/components/ShowcaseCard";
import { ProjectDetailModal } from "@/components/ProjectDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  Sparkles,
  ArrowUpDown,
  Plus,
  Check,
  AlertCircle,
  Trash2,
  Layers,
} from "lucide-react";

const CATEGORIES = [
  "ALL",
  "Full Stack",
  "Frontend",
  "API & Backend",
  "Mobile",
  "UI/UX",
] as const;

function ShowcaseContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [pagination, setPagination] = useState<PaginationMeta>({
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [category, setCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rating" | "newest" | "likes" | "oldest">("rating");

  // Selected submission for detail modal
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Delete modal state
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchProjects = useCallback(
    async (
      page = 1,
      cat = category,
      tab = activeTab,
      search = searchQuery,
      sort = sortBy,
      isLoadMore = false
    ) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await getPublicShowcase({
          page,
          pageSize: 12,
          category: cat !== "ALL" ? cat : undefined,
          filter: tab === "my" ? "my" : "all",
          search: search.trim() || undefined,
          sortBy: sort,
        });

        if (isLoadMore) {
          setSubmissions((prev) => [...prev, ...res.submissions]);
        } else {
          setSubmissions(res.submissions);
        }

        setPagination(res.pagination);

        // Check if there was a ?project=ID param in the URL on initial load
        const projectParam = searchParams?.get("project");
        if (projectParam && !selectedSub) {
          const match = res.submissions.find((s) => s.id === projectParam);
          if (match) {
            setSelectedSub(match);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load showcase projects:", err);
        showToast("Failed to load projects. Please try again.", "error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, activeTab, searchQuery, sortBy, searchParams, selectedSub]
  );

  useEffect(() => {
    fetchProjects(1, category, activeTab, searchQuery, sortBy, false);
  }, [category, activeTab, sortBy]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(1, category, activeTab, searchQuery, sortBy, false);
  };

  // Handle Like Toggle
  const handleLikeToggle = async (id: string) => {
    if (!user) {
      showToast("Please sign in to like projects and participate in peer discussions.", "error");
      return;
    }

    // Optimistic UI update
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          const newLiked = !sub.isLikedByMe;
          const currentLikes = sub.likesCount ?? 0;
          return {
            ...sub,
            isLikedByMe: newLiked,
            likesCount: newLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
          };
        }
        return sub;
      })
    );

    if (selectedSub && selectedSub.id === id) {
      const newLiked = !selectedSub.isLikedByMe;
      const currentLikes = selectedSub.likesCount ?? 0;
      setSelectedSub({
        ...selectedSub,
        isLikedByMe: newLiked,
        likesCount: newLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
      });
    }

    try {
      const res = await toggleLike(id);
      // Synchronize with server response
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id
            ? { ...sub, isLikedByMe: res.isLiked, likesCount: res.likesCount }
            : sub
        )
      );
      if (selectedSub && selectedSub.id === id) {
        setSelectedSub((prev) =>
          prev ? { ...prev, isLikedByMe: res.isLiked, likesCount: res.likesCount } : null
        );
      }
    } catch (err: unknown) {
      console.error("Like toggle error:", err);
      showToast("Failed to update like status.", "error");
      // Revert on error
      fetchProjects(pagination.currentPage, category, activeTab, searchQuery, sortBy, false);
    }
  };

  // Handle Modal Open with URL query param sync
  const openProjectModal = (sub: Submission) => {
    setSelectedSub(sub);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("project", sub.id);
      window.history.pushState(null, "", url.toString());
    }
  };

  // Handle Modal Close with URL query param cleanup
  const closeProjectModal = () => {
    setSelectedSub(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("project");
      window.history.pushState(null, "", url.toString());
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!confirmDeleteSub) return;
    try {
      setDeleting(true);
      await deleteSubmission(confirmDeleteSub.id);
      showToast("Your project was removed successfully.");
      setConfirmDeleteSub(null);
      if (selectedSub?.id === confirmDeleteSub.id) {
        closeProjectModal();
      }
      fetchProjects(1, category, activeTab, searchQuery, sortBy, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete project.";
      showToast(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <NavigationBar
          variant="dark"
          subtitle="Student Project Showcase"
          rightContent={
            <div className="flex items-center gap-2">
              {user ? (
                <Button
                  size="sm"
                  onClick={() => router.push(user.role === "MENTOR" ? "/mentor" : "/student")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer text-xs sm:text-sm shadow-lg shadow-blue-600/30"
                >
                  Dashboard
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer text-xs sm:text-sm shadow-lg shadow-blue-600/30"
                >
                  Sign In
                </Button>
              )}
            </div>
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

        {/* Hero Section */}
        <header className="relative border-b border-white/10 bg-radial from-blue-950/30 via-slate-950 to-slate-950 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              PROJECTPILOT EXHIBITION
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl leading-tight">
              Explore Exceptional Student Projects &amp; Portfolios
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Discover real-world applications, live prototypes, and case studies engineered by
              talented students and rigorously evaluated by mentors.
            </p>

            {user?.role === "STUDENT" && (
              <div className="pt-2">
                <Button
                  onClick={() => router.push("/student")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-xl shadow-blue-600/20 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Submit Your Project
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Main Gallery Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Controls Bar: Tabs, Search, Categories, Sort */}
          <div className="flex flex-col gap-5 bg-white/3 p-5 rounded-2xl border border-white/10 shadow-xl">
            {/* Top row: Tab Switcher (if logged in) + Search + Sort */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Audience Tabs: All Projects vs My Submissions */}
              {user ? (
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 self-start">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "all"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All Projects
                  </button>
                  <button
                    onClick={() => setActiveTab("my")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "my"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    My Submissions
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Public Exhibition Gallery</span>
                </div>
              )}

              {/* Search Box */}
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search projects by title, tech stack, or student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl text-xs sm:text-sm"
                />
              </form>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2 rounded-xl border border-white/10 text-xs self-start lg:self-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "rating" | "newest" | "likes" | "oldest")
                  }
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="rating" className="bg-slate-900 text-white">
                    Highest Rated
                  </option>
                  <option value="likes" className="bg-slate-900 text-white">
                    Most Liked
                  </option>
                  <option value="newest" className="bg-slate-900 text-white">
                    Newest First
                  </option>
                  <option value="oldest" className="bg-slate-900 text-white">
                    Oldest First
                  </option>
                </select>
              </div>
            </div>

            {/* Bottom row: Track Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 mr-1 shrink-0">Track:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    category === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                  }`}
                >
                  {cat === "ALL" ? "All Tracks" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 bg-white/5 rounded-2xl animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-24 text-center rounded-2xl bg-white/2 border border-dashed border-white/10 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">No showcase projects found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeTab === "my"
                  ? "You don't have any approved projects in this view yet. When a mentor approves your submission, it will appear here."
                  : "No projects match the selected search or category filter. Try clearing filters or searching for something else."}
              </p>
              {activeTab === "my" && (
                <Button
                  onClick={() => router.push("/student")}
                  className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold mt-2 cursor-pointer"
                >
                  Go to Student Portal
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub, idx) => (
                  <ShowcaseCard
                    key={sub.id}
                    submission={sub}
                    index={idx}
                    currentUserId={user?.id}
                    onViewDetails={openProjectModal}
                    onLikeToggle={handleLikeToggle}
                    onDeleteRequest={setConfirmDeleteSub}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {pagination.hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() =>
                      fetchProjects(
                        pagination.currentPage + 1,
                        category,
                        activeTab,
                        searchQuery,
                        sortBy,
                        true
                      )
                    }
                    disabled={loadingMore}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/15 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {loadingMore ? "Loading more projects..." : "Load More Projects"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-slate-950">
        <p>© 2026 ProjectPilot • Public Student Exhibition &amp; Social Portfolio</p>
      </footer>

      {/* ─── Detail Modal ─── */}
      <ProjectDetailModal
        submission={selectedSub}
        currentUser={user}
        onClose={closeProjectModal}
        onLikeToggle={handleLikeToggle}
        onDeleteRequest={setConfirmDeleteSub}
      />

      {/* ─── Delete Confirmation Modal ─── */}
      {confirmDeleteSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-slate-900 border border-rose-500/30 text-white shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" /> Remove Project from Showcase?
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-white">
                  "{confirmDeleteSub.projectName}"
                </span>
                ? This will permanently remove the project, its likes, and discussion comments.
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

export default function ShowcasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="text-xs text-slate-400">Loading Showcase Gallery...</div>
        </div>
      }
    >
      <ShowcaseContent />
    </Suspense>
  );
}
