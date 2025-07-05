"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface StreakData {
  current_streak: number;
  daily_calorie_goal: number;
  last_updated: string;
  user_id: string;
}

interface StreakResponse {
  success: boolean;
  message: string;
  data: StreakData;
}

interface UpdateStreakResponse {
  success: boolean;
  streak: number;
}

export const useStreak = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["streak", session?.user?.id],
    queryFn: async (): Promise<StreakData> => {
      if (!session?.access_token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_PRODUCTION_API_URL}/get_streak`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch streak data");
      }

      const result: StreakResponse = await response.json();
      return result.data;
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateStreak = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<number> => {
      if (!session?.access_token) {
        throw new Error("No authentication token");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_PRODUCTION_API_URL}/update_streak`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update streak");
      }

      const result: UpdateStreakResponse = await response.json();
      return result.streak;
    },
    onSuccess: (newStreak) => {
      // Update the streak in the cache
      queryClient.setQueryData(
        ["streak", session?.user?.id],
        (oldData: StreakData | undefined) => {
          if (oldData) {
            return {
              ...oldData,
              current_streak: newStreak,
              last_updated: new Date().toISOString(),
            };
          }
          return oldData;
        }
      );
    },
  });
};
