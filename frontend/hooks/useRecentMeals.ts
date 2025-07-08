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
    count: number;
  };
}

interface WeeklyRecentMealsResponse {
  success: boolean;
  message: string;
  data: {
    weekly_foods: {
      [date: string]: {
        foods: FoodItem[];
        count: number;
        daily_totals: {
          calories: number;
          protein: number;
          carbs: number;
          fats: number;
        };
      };
    };
    user_id: string;
    date_range: {
      start_date: string;
      end_date: string;
    };
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
  console.log("Recent meals result:", result);
  return result.data.foods || [];
};

const fetchWeeklyRecentMeals = async (
  accessToken: string
): Promise<WeeklyRecentMealsResponse["data"]["weekly_foods"]> => {
  const url = new URL(`${API_BASE_URL}/weekly_recently_eaten`);
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

  const result: WeeklyRecentMealsResponse = await response.json();
  return result.data.weekly_foods || {};
};

export const useRecentMeals = (date?: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["recent-meals", session?.user?.id, date],
    queryFn: () => fetchRecentMeals(session!.access_token, date),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
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

export const useWeeklyRecentMeals = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["weekly-recent-meals", session?.user?.id],
    queryFn: () => fetchWeeklyRecentMeals(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
