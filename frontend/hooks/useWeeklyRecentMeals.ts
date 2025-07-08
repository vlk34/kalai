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
  photo_url: string | null;
  portion: number;
  isAnalyzing?: boolean;
}

interface WeeklyMealsResponse {
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

const fetchWeeklyRecentMeals = async (
  accessToken: string
): Promise<WeeklyMealsResponse> => {
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
  return response.json();
};

export const useWeeklyRecentMeals = () => {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["weekly-recent-meals", session?.user?.id],
    queryFn: () => fetchWeeklyRecentMeals(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
