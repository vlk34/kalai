import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

interface NutritionDay {
  consumed_today: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  remaining_to_goal: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  progress_percentage: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  foods_consumed_count: number;
  goals_status: {
    calories_exceeded: boolean;
    protein_exceeded: boolean;
    carbs_exceeded: boolean;
    fats_exceeded: boolean;
  };
}

interface WeeklyNutritionData {
  weekly_nutrition: {
    [date: string]: NutritionDay;
  };
  daily_goals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  user_id: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
}

const fetchWeeklyNutritionSummary = async (
  accessToken: string
): Promise<WeeklyNutritionData> => {
  const response = await fetch(
    `${API_BASE_URL}/weekly_daily_nutrition_summary`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`
    );
  }

  const result = await response.json();
  return result.data;
};

export const useWeeklyNutritionSummary = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["weekly-nutrition-summary", session?.user?.id],
    queryFn: () => fetchWeeklyNutritionSummary(session!.access_token),
    enabled: !!session?.access_token && !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
