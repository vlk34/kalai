import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DailyNutritionSummary, NutritionData } from "./useUserProfile";

export const useMutateNutrition = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const invalidateNutrition = (date?: string) => {
    if (date) {
      // Invalidate specific date
      queryClient.invalidateQueries({
        queryKey: ["daily-nutrition-summary", session?.user?.id, date],
      });
    } else {
      // Invalidate all nutrition queries
      queryClient.invalidateQueries({
        queryKey: ["daily-nutrition-summary"],
      });
    }
  };

  const updateOptimisticNutrition = (
    updates: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fats?: number;
    },
    date?: string
  ) => {
    const queryKey = date
      ? ["daily-nutrition-summary", session?.user?.id, date]
      : ["daily-nutrition-summary", session?.user?.id];

    queryClient.setQueryData(
      queryKey,
      (oldData: DailyNutritionSummary | undefined) => {
        if (!oldData) return oldData;

        const { calories = 0, protein = 0, carbs = 0, fats = 0 } = updates;

        // Calculate new consumed values
        const newConsumedToday: NutritionData = {
          calories: Math.max(0, oldData.consumed_today.calories + calories),
          protein: Math.max(0, oldData.consumed_today.protein + protein),
          carbs: Math.max(0, oldData.consumed_today.carbs + carbs),
          fats: Math.max(0, oldData.consumed_today.fats + fats),
        };

        // Calculate new remaining values
        const newRemainingToGoal: NutritionData = {
          calories: Math.max(
            0,
            oldData.daily_goals.calories - newConsumedToday.calories
          ),
          protein: Math.max(
            0,
            oldData.daily_goals.protein - newConsumedToday.protein
          ),
          carbs: Math.max(
            0,
            oldData.daily_goals.carbs - newConsumedToday.carbs
          ),
          fats: Math.max(0, oldData.daily_goals.fats - newConsumedToday.fats),
        };

        // Calculate new progress percentages
        const newProgressPercentage: NutritionData = {
          calories:
            oldData.daily_goals.calories > 0
              ? Math.min(
                  100,
                  (newConsumedToday.calories / oldData.daily_goals.calories) *
                    100
                )
              : 0,
          protein:
            oldData.daily_goals.protein > 0
              ? Math.min(
                  100,
                  (newConsumedToday.protein / oldData.daily_goals.protein) * 100
                )
              : 0,
          carbs:
            oldData.daily_goals.carbs > 0
              ? Math.min(
                  100,
                  (newConsumedToday.carbs / oldData.daily_goals.carbs) * 100
                )
              : 0,
          fats:
            oldData.daily_goals.fats > 0
              ? Math.min(
                  100,
                  (newConsumedToday.fats / oldData.daily_goals.fats) * 100
                )
              : 0,
        };

        // Update foods consumed count
        const newFoodsConsumedCount =
          calories !== 0
            ? oldData.foods_consumed_count + (calories > 0 ? 1 : -1)
            : oldData.foods_consumed_count;

        // Update goals status
        const newGoalsStatus = {
          calories_exceeded:
            newConsumedToday.calories > oldData.daily_goals.calories,
          protein_exceeded:
            newConsumedToday.protein > oldData.daily_goals.protein,
          carbs_exceeded: newConsumedToday.carbs > oldData.daily_goals.carbs,
          fats_exceeded: newConsumedToday.fats > oldData.daily_goals.fats,
        };

        return {
          ...oldData,
          consumed_today: newConsumedToday,
          remaining_to_goal: newRemainingToGoal,
          progress_percentage: newProgressPercentage,
          foods_consumed_count: Math.max(0, newFoodsConsumedCount),
          goals_status: newGoalsStatus,
        };
      }
    );
  };

  const removeMealFromNutrition = (
    mealData: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    },
    date?: string
  ) => {
    // Remove meal by subtracting its values (negative values)
    updateOptimisticNutrition(
      {
        calories: -mealData.calories,
        protein: -mealData.protein,
        carbs: -mealData.carbs,
        fats: -mealData.fats,
      },
      date
    );
  };

  const addMealToNutrition = (
    mealData: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    },
    date?: string
  ) => {
    // Add meal by adding its values (positive values)
    updateOptimisticNutrition(
      {
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fats: mealData.fats,
      },
      date
    );
  };

  return {
    invalidateNutrition,
    updateOptimisticNutrition,
    removeMealFromNutrition,
    addMealToNutrition,
  };
};
