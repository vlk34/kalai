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
    // Always include date in query key to match the actual query structure
    const queryKey = ["recent-meals", session?.user?.id, date];
    console.log("Adding optimistic meal:", { queryKey, newMeal });

    queryClient.setQueryData(queryKey, (oldData: any[] = []) => {
      const newData = [newMeal, ...oldData];
      console.log("Updated recent meals data:", newData);
      return newData;
    });
  };

  const updateOptimisticMeal = (
    mealId: string,
    updates: any,
    date?: string
  ) => {
    // Always include date in query key to match the actual query structure
    const queryKey = ["recent-meals", session?.user?.id, date];
    console.log("Updating optimistic meal:", { queryKey, mealId, updates });

    queryClient.setQueryData(queryKey, (oldData: any[] = []) => {
      const newData = oldData.map((meal) =>
        meal.id === mealId ? { ...meal, ...updates } : meal
      );
      console.log("Updated recent meals data:", newData);
      return newData;
    });
  };

  const removeOptimisticMeal = (mealId: string, date?: string) => {
    // Always include date in query key to match the actual query structure
    const queryKey = ["recent-meals", session?.user?.id, date];
    console.log("Removing optimistic meal:", { queryKey, mealId });

    queryClient.setQueryData(queryKey, (oldData: any[] = []) => {
      const newData = oldData.filter((meal) => meal.id !== mealId);
      console.log("Updated recent meals data:", newData);
      return newData;
    });
  };

  return {
    invalidateRecentMeals,
    addOptimisticMeal,
    updateOptimisticMeal,
    removeOptimisticMeal,
  };
};
