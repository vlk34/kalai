import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

export interface ReviewCredits {
  plan: "free" | "pro";
  period_start: string;
  resets_at: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface AIReview {
  summary: string;
  suggestions: { severity: "high" | "medium" | "low"; message: string }[];
}

export function useAIReview() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["review-credits", session?.user?.id];
  const headers = {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  };

  const credits = useQuery<ReviewCredits>({
    queryKey,
    enabled: !!session?.access_token,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/ai/review-credits`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load review credits");
      return result.data;
    },
  });

  const review = useMutation({
    mutationFn: async (text: string) => {
      if (!session?.access_token) throw new Error("Please sign in to review a draft");
      const response = await fetch(`${API_BASE_URL}/ai/review`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, plan: credits.data?.plan }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not review the draft");
      return result.data as { review: AIReview; credits: ReviewCredits };
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: ["ai-review-credits", session?.user?.id],
    }),
  });

  return { credits, review };
}
