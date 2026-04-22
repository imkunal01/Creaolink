const BASE = "";

export type ProjectVisibility = "public" | "private" | "followers-only";
export type ProjectStatus = "active" | "pending" | "completed" | "approved";
export type ProjectPermission = "admin" | "editor" | "viewer";

export interface ListedProject {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  current_version_id: string | null;
  current_version_name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  visibility: ProjectVisibility;
  permission: ProjectPermission;
  owner_name: string;
  member_count: number;
  open_feedback: number;
}

export interface ProjectOwner {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  permission?: ProjectPermission;
}

export interface ProjectVersion {
  id: string;
  version_name: string;
  notes: string;
  created_at: string;
  timeline_data: unknown;
}

export interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  sync_code: string;
  visibility: ProjectVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
  owner: ProjectOwner | null;
  currentVersion: ProjectVersion | null;
  versions: ProjectVersion[];
  members: ProjectMember[];
}

export interface ActiveFreelancer {
  user_id: string;
  name: string;
  email: string;
  status: "online" | "away" | "offline";
  current_task: string;
  hours_logged: number;
  last_seen: string;
}

export interface FeedActivityItem {
  id: string;
  title: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  visibility: ProjectVisibility;
  owner_id: string;
  owner_name: string;
  collaborator_count: number;
  open_feedback: number;
}

export interface FeedProjectItem {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner_name: string;
  member_count?: number;
  collaborators?: number;
}

export interface FeedPostItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  project_id: string | null;
  project_title: string | null;
  created_at: string;
  author_id: string;
  author_name: string;
  reactions: number;
  comments: number;
}

export interface FeedNetworkItem {
  following_id: string;
  name: string;
  role: string;
  project_count: number;
  follower_count: number;
}

export interface UserListItem {
  id: string;
  name: string;
  username: string;
  role: string;
}

export interface SearchUserItem {
  id: string;
  name: string;
  username: string;
  role: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
  bio: string;
  headline: string;
  profile_visibility: "public" | "private";
}

export interface UserPortfolioProject {
  id: string;
  title: string;
  description: string;
  status: string;
  updated_at: string;
}

function headers(): HeadersInit {
  return { "Content-Type": "application/json" };
}

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...opts,
    credentials: "same-origin",
    headers: { ...headers(), ...(opts?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function apiLogin(email: string, password: string) {
  return request<{ user: { id: string; name: string; email: string; username: string; role: string } }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export function apiGetCurrentUser() {
  return request<{ user: { id: string; name: string; email: string; username: string; role: string } }>(
    "/api/auth/me"
  );
}

export function apiSignup(data: { name: string; username: string; email: string; password: string; role: string }) {
  return request<{ user: { id: string; name: string; email: string; username: string; role: string } }>(
    "/api/auth/signup",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function apiGoogleAuth(accessToken: string, role?: "client" | "freelancer") {
  return request<{ user: { id: string; name: string; email: string; username: string; role: string } }>(
    "/api/auth/google",
    { method: "POST", body: JSON.stringify({ accessToken, role }) }
  );
}

export function apiCheckSupabaseConnection() {
  return request<{
    ok: boolean;
    source: string;
    mode: "direct-db-url";
    dbHost: string;
    error?: string;
  }>("/api/health/supabase");
}

export const apiCheckDatabaseConnection = apiCheckSupabaseConnection;

export function apiCreateProject(data: {
  title: string;
  description: string;
  deadline: string;
  freelancerEmails: string[];
}) {
  return request<{ project: Record<string, unknown>; currentVersion: Record<string, unknown> }>(
    "/api/projects",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function apiListProjects() {
  return request<{ projects: ListedProject[] }>("/api/projects");
}

export function apiGetProject(id: string) {
  return request<ProjectDetails>(`/api/projects/${id}`);
}

export function apiUpdateProjectSettings(
  projectId: string,
  data: { title?: string; visibility?: ProjectVisibility }
) {
  return request<{ project: Record<string, unknown> }>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function apiDeleteProject(projectId: string) {
  return request<{ success: boolean }>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function apiUpdateStatus(projectId: string, status: ProjectStatus) {
  return request<{ project: Record<string, unknown> }>(`/api/projects/${projectId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function apiCreateVersion(projectId: string, notes?: string) {
  return request<{
    currentVersion: { id: string; version_name: string; notes: string; created_at: string };
    versions: Array<{ id: string; version_name: string; notes: string; created_at: string }>;
  }>(`/api/projects/${projectId}/version`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "" }),
  });
}

export function apiAddFeedback(
  projectId: string,
  data: { type: string; priority: string; timestamp: string; description: string }
) {
  return request<{ feedback: Record<string, unknown> }>(`/api/projects/${projectId}/feedback`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apiGetFeedback(projectId: string) {
  return request<{
    feedback: Array<{
      id: string;
      type: string;
      priority: string;
      timestamp: string;
      description: string;
      status: string;
      version_name: string;
      creator_name: string;
      created_at: string;
    }>;
  }>(`/api/projects/${projectId}/feedback`);
}

export function apiResolveFeedback(feedbackId: string) {
  return request<{ feedback: Record<string, unknown> }>(`/api/feedback/${feedbackId}/resolve`, {
    method: "PATCH",
  });
}

export function apiGetTeamMembers(projectId: string) {
  return request<{
    members: Array<{ id: string; name: string; email: string; role: string; permission: ProjectPermission }>;
  }>(`/api/projects/${projectId}/team`);
}

export function apiAddFreelancer(
  projectId: string,
  data: { identifier: string; permission: ProjectPermission }
) {
  return request<{ success: boolean }>(`/api/projects/${projectId}/team`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apiUpdateFreelancerPermission(
  projectId: string,
  data: { userId: string; permission: ProjectPermission }
) {
  return request<{ success: boolean }>(`/api/projects/${projectId}/team`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function apiRemoveFreelancer(projectId: string, data: { userId: string }) {
  return request<{ success: boolean }>(`/api/projects/${projectId}/team`, {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}

export function apiGetFreelancerPresence(projectId: string) {
  return request<{ activeFreelancers: ActiveFreelancer[] }>(`/api/projects/${projectId}/presence`);
}

export function apiUpdateFreelancerPresence(
  projectId: string,
  data: { status: "online" | "away" | "offline"; currentTask: string; hoursLogged: number }
) {
  return request<{ success: boolean }>(`/api/projects/${projectId}/presence`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function apiGetFeed() {
  return request<{
    activity: FeedActivityItem[];
    discover: FeedProjectItem[];
    featured: FeedProjectItem[];
    posts: FeedPostItem[];
    network: FeedNetworkItem[];
  }>("/api/feed");
}

export function apiGetUserFollowStatus(userId: string) {
  return request<{ isFollowing: boolean; followers: number }>(`/api/users/${userId}/follow`);
}

export function apiFollowUser(userId: string) {
  return request<{ success: boolean }>(`/api/users/${userId}/follow`, { method: "POST" });
}

export function apiUnfollowUser(userId: string) {
  return request<{ success: boolean }>(`/api/users/${userId}/follow`, { method: "DELETE" });
}

export function apiGetUserProfile(userId: string) {
  return request<{
    profile: UserProfile;
    portfolio: UserPortfolioProject[];
    followers: number;
    following: number;
    followersList: UserListItem[];
    followingList: UserListItem[];
    reputation: number;
    activityGraph: Array<{ week: number; contributions: number }>;
    skills: string[];
    isFollowing: boolean;
    isMutual: boolean;
  }>(`/api/users/${userId}/profile`);
}

export function apiSearchUsers(query: string) {
  return request<{ users: SearchUserItem[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
}

export function apiCreatePost(data: { title: string; content: string; tags: string[]; projectId?: string }) {
  return request<{ success: boolean }>("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
