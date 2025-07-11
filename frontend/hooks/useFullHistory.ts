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
  portion: number;
}

interface FullHistoryResponse {
  success: boolean;
  message: string;
  data: {
    foods: FoodItem[];
    daily_totals: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    pagination: {
      limit: number;
      offset: number;
      count: number;
    };
  };
}

const fetchFullHistory = async (
  accessToken: string,
  limit: number = 20,
  offset: number = 0
): Promise<FullHistoryResponse["data"]> => {
  const url = new URL(`${API_BASE_URL}/full_history`);
  url.searchParams.append("limit", limit.toString());
  url.searchParams.append("offset", offset.toString());

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

  const result: FullHistoryResponse = await response.json();
  return result.data;
};

export const useFullHistory = (limit: number = 50, offset: number = 0) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["full-history", session?.user?.id, limit, offset],
    queryFn: () => fetchFullHistory(session!.access_token, limit, offset),
    enabled: !!session?.access_token && !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
