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
  status: "PENDING" | "APPROVED" | "REJECTED";
  studentId: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    email: string;
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

export interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
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
