"use client";

import useSWR from "swr";
import { swrFetcher } from "./use-projects";
import {
  apiAddFeedback,
  apiResolveFeedback,
} from "@/lib/api";

export interface FeedbackItem {
  id: string;
  type: string;
  priority: string;
  timestamp: string;
  description: string;
  status: string;
  version_name: string;
  creator_name: string;
  created_at: string;
}

export function useProjectFeedback(projectId?: string | null) {
  const key = projectId ? `/api/projects/${projectId}/feedback` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    feedback: FeedbackItem[];
  }>(key, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 4000,
  });

  const feedbackList = data?.feedback || [];

  const addFeedback = async (
    newItem: {
      type: string;
      priority: string;
      timestamp: string;
      description: string;
    },
    creatorName: string = "You"
  ) => {
    if (!projectId) return;

    const tempItem: FeedbackItem = {
      id: `temp-${Date.now()}`,
      type: newItem.type,
      priority: newItem.priority,
      timestamp: newItem.timestamp,
      description: newItem.description,
      status: "open",
      version_name: "Current",
      creator_name: creatorName,
      created_at: new Date().toISOString(),
    };

    const optimisticList = [tempItem, ...feedbackList];

    try {
      await mutate(
        async () => {
          await apiAddFeedback(projectId, newItem);
          // Return new list on revalidation
          return { feedback: optimisticList };
        },
        {
          optimisticData: { feedback: optimisticList },
          rollbackOnError: true,
          revalidate: true,
        }
      );
    } catch (err) {
      console.error("Failed to add feedback:", err);
      throw err;
    }
  };

  const resolveFeedback = async (feedbackId: string) => {
    if (!projectId) return;

    const optimisticList = feedbackList.map((item) =>
      item.id === feedbackId ? { ...item, status: "resolved" } : item
    );

    try {
      await mutate(
        async () => {
          await apiResolveFeedback(feedbackId);
          return { feedback: optimisticList };
        },
        {
          optimisticData: { feedback: optimisticList },
          rollbackOnError: true,
          revalidate: true,
        }
      );
    } catch (err) {
      console.error("Failed to resolve feedback:", err);
      throw err;
    }
  };

  return {
    feedback: feedbackList,
    isLoading,
    isValidating,
    error,
    mutate,
    addFeedback,
    resolveFeedback,
  };
}
