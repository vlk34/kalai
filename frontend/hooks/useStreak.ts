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
  message: string;
  data: {
    streak: number;
    previous_streak: number;
    streak_action: string;
  };
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
      return result.data.streak;
    },
    onSuccess: (newStreak) => {
      // `useUserProfileStreak` is an alias of `useUserProfile`, so the real
      // query key is `["user-profile", userId]`. Previous versions also wrote
      // to `["user-profile-streak", userId]` and `["streak", userId]`, but no
      // query is registered under those keys so those writes were no-ops.
      queryClient.setQueryData(
        ["user-profile", session?.user?.id],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            streak: newStreak,
            profile: {
              ...oldData.profile,
              updated_at: new Date().toISOString(),
            },
          };
        }
      );
    },
    onError: () => {
      // Revert the optimistic update by refetching the real source of truth.
      queryClient.invalidateQueries({
        queryKey: ["user-profile", session?.user?.id],
      });
    },
  });
};
