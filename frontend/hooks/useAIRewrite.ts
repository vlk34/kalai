import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

interface RewriteCredits {
  plan: "free" | "pro";
  period_start: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export function useAIRewrite() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["rewrite-credits", session?.user?.id];
  const headers = {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  };

  const credits = useQuery<RewriteCredits>({
    queryKey,
    enabled: !!session?.access_token,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/ai/rewrite-credits`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load rewrite credits");
      return result.data;
    },
  });

  const rewrite = useMutation({
    mutationFn: async (text: string) => {
      if (!session?.access_token) throw new Error("Please sign in to rewrite text");
      const response = await fetch(`${API_BASE_URL}/ai/rewrite`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, plan: credits.data?.plan }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not rewrite text");
      return result.data as { rewritten_text: string };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { credits, rewrite };
}
