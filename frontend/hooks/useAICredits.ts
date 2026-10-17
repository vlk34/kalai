import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

export interface AICredits {
  plan: "free" | "pro";
  period_start: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export function useAICredits() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["ai-credits", session?.user?.id];
  const headers = {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  };

  const credits = useQuery<AICredits>({
    queryKey,
    enabled: !!session?.access_token,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/ai/credits`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load AI credits");
      return result.data;
    },
  });

  const analysis = useMutation({
    mutationFn: async (description: string) => {
      if (!session?.access_token) throw new Error("Please sign in to analyze a meal");
      const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({ description, plan: credits.data?.plan }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not analyze meal");
      return result.data as {
        nutritional_analysis: { name?: string; calories?: number };
      };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { credits, analysis };
}
