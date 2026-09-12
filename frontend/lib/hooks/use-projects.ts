"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { apiFetch } from "@/lib/api-client";
import {
  apiUpdateStatus,
  type ListedProject,
  type ProjectDetails,
  type ProjectStatus,
  type FeedActivityItem,
  type FeedNetworkItem,
  type FeedProjectItem,
} from "@/lib/api";

export async function swrFetcher<T = unknown>(url: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

/**
 * Hook to retrieve and cache projects list.
 * Subsequent visits serve instantly from cache (0ms perceived delay).
 */
export function useProjects() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    projects: ListedProject[];
  }>("/api/projects", swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    projects: data?.projects || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

/**
 * Hook to retrieve and cache a single project's details.
 * Supports optimistic UI updates on status mutations.
 */
export function useProject(projectId?: string | null) {
  const key = projectId ? `/api/projects/${projectId}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<ProjectDetails>(
    key,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 4000,
    }
  );

  const updateStatus = async (newStatus: ProjectStatus) => {
    if (!projectId || !data) return;

    const previousData = data;
    const optimisticProject: ProjectDetails = {
      ...data,
      status: newStatus,
    };

    try {
      // Optimistically update project detail cache immediately
      await mutate(
        async () => {
          await apiUpdateStatus(projectId, newStatus);
          return optimisticProject;
        },
        {
          optimisticData: optimisticProject,
          rollbackOnError: true,
          revalidate: true,
        }
      );

      // Also trigger revalidation for the projects list
      globalMutate("/api/projects");
    } catch (err) {
      console.error("Failed to update status:", err);
      throw err;
    }
  };

  return {
    project: data || null,
    isLoading,
    isValidating,
    error,
    mutate,
    updateStatus,
  };
}

/**
 * Hook to retrieve and cache feed activity stream and network.
 */
export function useProjectFeed() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    activity?: FeedActivityItem[];
    network?: FeedNetworkItem[];
    projects?: FeedProjectItem[];
  }>("/api/feed", swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  return {
    activity: data?.activity || [],
    network: data?.network || [],
    projects: data?.projects || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}
