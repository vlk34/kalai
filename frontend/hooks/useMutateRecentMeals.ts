import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export const useMutateRecentMeals = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const invalidateRecentMeals = (date?: string) => {
    if (date) {
      // Invalidate specific date
      queryClient.invalidateQueries({
        queryKey: ["recent-meals", session?.user?.id, date],
      });
    } else {
      // Invalidate all recent meals queries
      queryClient.invalidateQueries({
        queryKey: ["recent-meals"],
      });
    }
  };

  const addOptimisticMeal = (newMeal: any, date?: string) => {
    const queryKey = date
      ? ["recent-meals", session?.user?.id, date]
      : ["recent-meals", session?.user?.id];

    queryClient.setQueryData(queryKey, (oldData: any[] = []) => {
      return [newMeal, ...oldData];
    });
  };

  const updateOptimisticMeal = (
    mealId: string,
    updates: any,
    date?: string
  ) => {
    const queryKey = date
      ? ["recent-meals", session?.user?.id, date]
      : ["recent-meals", session?.user?.id];

    queryClient.setQueryData(queryKey, (oldData: any[] = []) => {
      return oldData.map((meal) =>
        meal.id === mealId ? { ...meal, ...updates } : meal
      );
    });
  };

  const removeOptimisticMeal = (mealId: string, date?: string) => {
    const queryKey = date
      ? ["recent-meals", session?.user?.id, date]
      : ["recent-meals", session?.user?.id];

    queryClient.setQueryData(queryKey, (oldData: any[] = []) => {
      return oldData.filter((meal) => meal.id !== mealId);
    });
  };

  return {
    invalidateRecentMeals,
    addOptimisticMeal,
    updateOptimisticMeal,
    removeOptimisticMeal,
  };
};
