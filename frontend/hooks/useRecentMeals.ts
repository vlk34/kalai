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
}

interface RecentMealsResponse {
  foods: FoodItem[];
}

const fetchRecentMeals = async (accessToken: string): Promise<FoodItem[]> => {
  const response = await fetch(`${API_BASE_URL}/recently_eaten`, {
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
  return result.foods || [];
};

export const useRecentMeals = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["recent-meals", session?.user?.id],
    queryFn: () => fetchRecentMeals(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
