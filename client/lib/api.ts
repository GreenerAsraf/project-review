const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR";
}

export interface Submission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl?: string | null;
  description: string;
  category?: string | null;
  screenshotUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  studentId: string;
  rating?: number | null;
  feedback?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  commentsCount?: number;
  isLikedByMe?: boolean;
  student?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface ProjectComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    role: "STUDENT" | "MENTOR";
  };
}

export interface MentorStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MentorSubmissionsResponse {
  submissions: Submission[];
  pagination: PaginationMeta;
  stats: MentorStats;
}

export interface ShowcaseResponse {
  submissions: Submission[];
  pagination: PaginationMeta;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR";
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function getProfile(): Promise<UserProfile> {
  const res = await apiRequest<{ user: UserProfile }>("/users/me");
  return res.user;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const res = await apiRequest<{ user: UserProfile; message: string }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.user;
}

// ── Showcase & Social API Methods ──────────────────────────────────────────

export async function getPublicShowcase(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  filter?: "all" | "my";
  sortBy?: "newest" | "rating" | "likes" | "oldest";
}): Promise<ShowcaseResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.filter) query.set("filter", params.filter);
  if (params?.sortBy) query.set("sortBy", params.sortBy);

  const qs = query.toString();
  return apiRequest<ShowcaseResponse>(`/public/showcase${qs ? `?${qs}` : ""}`);
}

export async function getFeaturedShowcase(): Promise<{ featured: Submission[] }> {
  return apiRequest<{ featured: Submission[] }>("/public/showcase/featured");
}

export async function getSubmissionComments(
  submissionId: string
): Promise<{ comments: ProjectComment[] }> {
  return apiRequest<{ comments: ProjectComment[] }>(`/public/submissions/${submissionId}/comments`);
}

export async function toggleLike(
  submissionId: string
): Promise<{ message: string; isLiked: boolean; likesCount: number }> {
  return apiRequest<{ message: string; isLiked: boolean; likesCount: number }>(
    `/submissions/${submissionId}/like`,
    { method: "POST" }
  );
}

export async function addComment(
  submissionId: string,
  content: string
): Promise<{ message: string; comment: ProjectComment }> {
  return apiRequest<{ message: string; comment: ProjectComment }>(
    `/submissions/${submissionId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
}

export async function deleteComment(
  commentId: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function deleteSubmission(
  submissionId: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/submissions/${submissionId}`, {
    method: "DELETE",
  });
}

export async function reviewSubmission(
  submissionId: string,
  payload: {
    status: "APPROVED" | "REJECTED";
    rating?: number;
    feedback?: string;
  }
): Promise<{ message: string; submission: Submission }> {
  return apiRequest<{ message: string; submission: Submission }>(
    `/mentor/submissions/${submissionId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || "An unexpected error occurred.") as Error & {
      status: number;
      errors?: Array<{ field: string; message: string }>;
    };
    error.status = res.status;
    error.errors = data.errors;
    throw error;
  }

  return data as T;
}
