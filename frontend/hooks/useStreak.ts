"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfileStreak } from "./useUserProfile";

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
  const { data: userProfileData, isLoading, error } = useUserProfileStreak();

  // Transform user profile data to match the expected streak format
  const streakData: StreakData | undefined = userProfileData
    ? {
        current_streak: userProfileData.streak || 0,
        daily_calorie_goal: userProfileData.daily_targets?.calories || 0,
        last_updated:
          userProfileData.profile?.updated_at ||
          userProfileData.profile?.created_at ||
          new Date().toISOString(),
        user_id: userProfileData.user_id,
      }
    : undefined;

  return {
    data: streakData,
    isLoading,
    error,
  };
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
      // Update the user profile cache with new streak data
      queryClient.setQueryData(
        ["user-profile-streak", session?.user?.id],
        (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              streak: newStreak,
              profile: {
                ...oldData.profile,
                updated_at: new Date().toISOString(),
              },
            };
          }
          return oldData;
        }
      );

      // Also update the main user profile cache
      queryClient.setQueryData(
        ["user-profile", session?.user?.id],
        (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              streak: newStreak,
              profile: {
                ...oldData.profile,
                updated_at: new Date().toISOString(),
              },
            };
          }
          return oldData;
        }
      );

      // Also update the streak data cache for the top display
      queryClient.setQueryData(
        ["streak", session?.user?.id],
        (oldData: any) => {
          if (oldData) {
            return {
              ...oldData,
              current_streak: newStreak,
            };
          }
          return oldData;
        }
      );
    },
    onError: () => {
      // If the API call fails, invalidate queries to revert optimistic updates
      queryClient.invalidateQueries({
        queryKey: ["user-profile-streak", session?.user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-profile", session?.user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["streak", session?.user?.id],
      });
    },
  });
};
