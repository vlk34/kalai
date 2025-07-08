import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

// Types for the user profile data
export interface UserProfile {
  id: string;
  user_id: string;
  gender: string;
  activity_level: string;
  tracking_difficulty: string;
  experience_level: string;
  height_unit: string;
  height_value: number;
  height_inches?: number;
  weight_unit: string;
  weight_value: number;
  date_of_birth: string;
  main_goal: string;
  dietary_preference: string;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fats_g: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  streak?: number;
  streak_history?: string[];
}

export interface UserProfileResponse {
  message: string;
  user_id: string;
  profile: UserProfile;
  daily_targets: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  };
  streak?: number;
  streak_history?: string[];
}

export interface DailyTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

// Types for daily nutrition summary
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyNutritionSummary {
  date: string;
  consumed_today: NutritionData;
  daily_goals: NutritionData;
  remaining_to_goal: NutritionData;
  progress_percentage: NutritionData;
  foods_consumed_count: number;
  goals_status: {
    calories_exceeded: boolean;
    protein_exceeded: boolean;
    carbs_exceeded: boolean;
    fats_exceeded: boolean;
  };
}

export interface OnboardingData {
  gender: string;
  activityLevel: string;
  trackingDifficulty: string;
  experience: string;
  unit: "metric" | "imperial";
  height: number;
  weight: number;
  dateOfBirth: Date;
  goal: string;
  diet: string;
}

// Helper function to map onboarding data to backend format
const mapOnboardingToBackend = (data: OnboardingData) => {
  // Map frontend field names to backend field names
  const activityLevelMap: Record<string, string> = {
    low: "sedentary",
    moderate: "lightly_active",
    high: "very_active",
  };

  const goalMap: Record<string, string> = {
    lose: "lose_weight",
    maintain: "maintain_weight",
    gain: "gain_weight",
    muscle: "build_muscle",
  };

  const dietMap: Record<string, string> = {
    none: "no_restrictions",
    vegetarian: "vegetarian",
    vegan: "vegan",
    keto: "keto",
  };

  const trackingDifficultyMap: Record<string, string> = {
    yes: "challenging",
    sometimes: "manageable",
    no: "easy",
  };

  const experienceMap: Record<string, string> = {
    beginner: "beginner",
    intermediate: "some_experience",
    expert: "very_experienced",
  };

  // Fix imperial height calculation
  let heightValue = data.height;
  let heightInches = undefined;

  if (data.unit === "imperial") {
    // data.height in imperial is total inches from the onboarding form
    heightValue = Math.floor(data.height / 12); // feet
    heightInches = data.height % 12; // remaining inches
  }

  return {
    gender: data.gender,
    activity_level: activityLevelMap[data.activityLevel] || data.activityLevel,
    tracking_difficulty:
      trackingDifficultyMap[data.trackingDifficulty] || data.trackingDifficulty,
    experience_level: experienceMap[data.experience] || data.experience,
    height_unit: data.unit,
    height_value: heightValue,
    height_inches: heightInches,
    weight_unit: data.unit,
    weight_value: data.weight,
    date_of_birth: data.dateOfBirth.toISOString().split("T")[0], // YYYY-MM-DD format
    main_goal: goalMap[data.goal] || data.goal,
    dietary_preference: dietMap[data.diet] || data.diet,
  };
};

// API functions
const fetchUserProfile = async (
  accessToken: string
): Promise<UserProfileResponse | null> => {
  const response = await fetch(`${API_BASE_URL}/user_profiles`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return null; // No profile found
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  const result = await response.json();
  console.log("User profile response:", result);
  return result;
};

const createUserProfile = async (
  accessToken: string,
  profileData: OnboardingData
) => {
  const backendData = mapOnboardingToBackend(profileData);

  // Debug logging
  console.log("Original onboarding data:", profileData);
  console.log("Mapped backend data:", backendData);

  const response = await fetch(`${API_BASE_URL}/user_profiles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Profile creation failed:", errorText);
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  const result = await response.json();
  return {
    profile: result.profile,
    daily_targets: result.daily_targets,
  };
};

const recalculateTargets = async (accessToken: string) => {
  const response = await fetch(`${API_BASE_URL}/recalculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  return response.json();
};

// API function for daily nutrition summary
export const fetchDailyNutritionSummary = async (
  accessToken: string,
  date?: string
): Promise<DailyNutritionSummary> => {
  const params = new URLSearchParams();
  if (date) {
    params.append("date", date);
  }

  const url = `${API_BASE_URL}/daily_nutrition_summary${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  const result = await response.json();
  return result.data;
};

// Custom hooks
export const useUserProfile = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["user-profile", session?.user?.id],
    queryFn: () => fetchUserProfile(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 10 * 60 * 1000, // 10 minutes (user profile doesn't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on mount if data exists
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook that returns just the profile data for backward compatibility
export const useUserProfileData = () => {
  const { data: userProfileResponse, isLoading, error } = useUserProfile();

  return {
    data: userProfileResponse?.profile || null,
    isLoading,
    error,
  };
};

// Hook specifically for getting streak data from user profile - now uses the same query
export const useUserProfileStreak = () => {
  return useUserProfile();
};

export const useCreateProfile = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData: OnboardingData) =>
      createUserProfile(session!.access_token, profileData),
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};

export const useRecalculateTargets = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recalculateTargets(session!.access_token),
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};

// Hook for daily nutrition summary
export const useDailyNutritionSummary = (date?: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["daily-nutrition-summary", session?.user?.id, date],
    queryFn: () => fetchDailyNutritionSummary(session!.access_token, date),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on mount if data exists
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Helper function to format date for API (YYYY-MM-DD)
export const formatDateForAPI = (date: Date): string => {
  // Use local date formatting to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to get date for specific day of week
export const getDateForDayOfWeek = (dayOffset: number): string => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate the difference to get to the target day
  // dayOffset: 0 = Sunday, 1 = Monday, etc.
  const diff = dayOffset - currentDay;

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);

  return formatDateForAPI(targetDate);
};
