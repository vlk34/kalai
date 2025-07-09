import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  created_at: string;
  photo_url: string;
  isAnalyzing?: boolean;
  portion: number;
}

interface RecentMealsResponse {
  success: boolean;
  message: string;
  data: {
    date: string;
    foods: FoodItem[];
    total_count: number;
    user_id: string;
  };
}

const fetchRecentMeals = async (
  accessToken: string,
  date?: string
): Promise<FoodItem[]> => {
  const url = new URL(`${API_BASE_URL}/recently_eaten`);
  if (date) {
    url.searchParams.append("date", date);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  const result: RecentMealsResponse = await response.json();
  // console.log("Recent meals result:", result);

  // Return the foods array from the correct path
  return result.data.foods || [];
};

export const useRecentMeals = (date?: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["recent-meals", session?.user?.id, date],
    queryFn: () => fetchRecentMeals(session!.access_token, date),
    enabled: !!session?.access_token && !!session?.user?.id && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: true, // Allow refetch on mount to handle session becoming ready
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
