import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

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
}

export interface DailyTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
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
    tracking_difficulty: data.trackingDifficulty,
    experience_level: data.experience,
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
): Promise<UserProfile | null> => {
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
  return result.profile;
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

  return response.json();
};

const calculateTargets = async (
  profileData: OnboardingData
): Promise<DailyTargets> => {
  const backendData = mapOnboardingToBackend(profileData);

  const response = await fetch(`${API_BASE_URL}/calculate-targets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  const result = await response.json();
  return result.daily_targets;
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

// Custom hooks
export const useUserProfile = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["user-profile", session?.user?.id],
    queryFn: () => fetchUserProfile(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
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

export const useCalculateTargets = () => {
  return useMutation({
    mutationFn: calculateTargets,
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
