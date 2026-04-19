import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DailyNutritionSummary, NutritionData } from "./useUserProfile";

type NutritionDelta = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
};

export const useMutateNutrition = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const invalidateNutrition = (date?: string) => {
    if (date) {
      queryClient.invalidateQueries({
        queryKey: ["daily-nutrition-summary", session?.user?.id, date],
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ["daily-nutrition-summary"],
      });
    }
  };

  // Applies a nutrition delta to the cached daily summary. `countDelta` adjusts
  // `foods_consumed_count` — it should be +1 when a meal is added, -1 when
  // deleted, and 0 when a meal is edited (edits change totals, not meal count).
  const applyNutritionDelta = (
    delta: NutritionDelta,
    countDelta: number,
    date?: string
  ) => {
    const queryKey = ["daily-nutrition-summary", session?.user?.id, date];

    queryClient.setQueryData(
      queryKey,
      (oldData: DailyNutritionSummary | undefined) => {
        if (!oldData) return oldData;

        const { calories = 0, protein = 0, carbs = 0, fats = 0 } = delta;

        const newConsumedToday: NutritionData = {
          calories: oldData.consumed_today.calories + calories,
          protein: oldData.consumed_today.protein + protein,
          carbs: oldData.consumed_today.carbs + carbs,
          fats: oldData.consumed_today.fats + fats,
        };

        // Mirror the backend: `remaining_to_goal` can be negative when the
        // user is over goal, and `progress_percentage` can exceed 100. See
        // backend/src/routes/user_operations.py daily_nutrition_summary.
        const newRemainingToGoal: NutritionData = {
          calories: oldData.daily_goals.calories - newConsumedToday.calories,
          protein: oldData.daily_goals.protein - newConsumedToday.protein,
          carbs: oldData.daily_goals.carbs - newConsumedToday.carbs,
          fats: oldData.daily_goals.fats - newConsumedToday.fats,
        };

        const newProgressPercentage: NutritionData = {
          calories:
            oldData.daily_goals.calories > 0
              ? (newConsumedToday.calories / oldData.daily_goals.calories) * 100
              : 0,
          protein:
            oldData.daily_goals.protein > 0
              ? (newConsumedToday.protein / oldData.daily_goals.protein) * 100
              : 0,
          carbs:
            oldData.daily_goals.carbs > 0
              ? (newConsumedToday.carbs / oldData.daily_goals.carbs) * 100
              : 0,
          fats:
            oldData.daily_goals.fats > 0
              ? (newConsumedToday.fats / oldData.daily_goals.fats) * 100
              : 0,
        };

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
          foods_consumed_count: Math.max(
            0,
            oldData.foods_consumed_count + countDelta
          ),
          goals_status: newGoalsStatus,
        };
      }
    );
  };

  // Used for edits: only changes totals, never the meal count.
  const updateOptimisticNutrition = (delta: NutritionDelta, date?: string) => {
    applyNutritionDelta(delta, 0, date);
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
    applyNutritionDelta(
      {
        calories: -mealData.calories,
        protein: -mealData.protein,
        carbs: -mealData.carbs,
        fats: -mealData.fats,
      },
      -1,
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
    applyNutritionDelta(
      {
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fats: mealData.fats,
      },
      1,
      date
    );
  };

  const invalidateAllNutrition = () => {
    queryClient.invalidateQueries({
      queryKey: ["daily-nutrition-summary"],
    });
    queryClient.invalidateQueries({
      queryKey: ["weekly-nutrition-summary"],
    });
    queryClient.invalidateQueries({
      queryKey: ["user-profile"],
    });
  };

  return {
    invalidateNutrition,
    updateOptimisticNutrition,
    removeMealFromNutrition,
    addMealToNutrition,
    invalidateAllNutrition,
  };
};
