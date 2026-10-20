const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
}

export interface Review {
  id: string;
  feedback: string;
  score: number;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  reviewer: { id: string; name: string; email: string };
  createdAt: string;
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  liveUrl?: string | null;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  studentId: string;
  student?: { id: string; name: string; email: string };
  reviews?: Review[];
  createdAt: string;
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "An error occurred during API request");
  }

  return data as T;
}
