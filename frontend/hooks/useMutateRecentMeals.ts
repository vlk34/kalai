import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const useMutateRecentMeals = () => {
  const queryClient = useQueryClient();

  const invalidateRecentMeals = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["recent-meals"] });
  }, [queryClient]);

  const addOptimisticMeal = useCallback(
    (newMeal: any) => {
      queryClient.setQueryData(["recent-meals"], (oldData: any[] = []) => {
        return [newMeal, ...oldData];
      });
    },
    [queryClient]
  );

  return {
    invalidateRecentMeals,
    addOptimisticMeal,
  };
};
