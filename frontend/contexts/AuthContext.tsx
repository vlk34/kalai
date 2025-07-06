import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/scripts/supabase";
import { router } from "expo-router";

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean | null;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  hasCompletedOnboarding: null,
  setOnboardingCompleted: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);

  // Check onboarding status by fetching user profile from backend
  const checkOnboardingStatus = async (accessToken: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_PRODUCTION_API_URL}/user_profiles`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Check the onboarding_completed field from the profile
        const isOnboardingCompleted =
          data.profile?.onboarding_completed === true;
        setHasCompletedOnboarding(isOnboardingCompleted);
      } else if (response.status === 404) {
        // No profile found, user hasn't completed onboarding
        setHasCompletedOnboarding(false);
      } else {
        // Other error, assume not completed
        console.error("Error checking onboarding status:", response.status);
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setHasCompletedOnboarding(false);
    }
  };

  // Set onboarding completion status (now just updates local state since backend handles persistence)
  const setOnboardingCompleted = async (completed: boolean) => {
    setHasCompletedOnboarding(completed);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.access_token) {
        checkOnboardingStatus(session.access_token);
      } else {
        setHasCompletedOnboarding(null);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.access_token) {
        await checkOnboardingStatus(session.access_token);
      } else {
        setHasCompletedOnboarding(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle navigation when session changes
  useEffect(() => {
    if (!isLoading && !session) {
      // User signed out, navigate to welcome
      router.replace("/welcome");
    }
  }, [session, isLoading]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear onboarding status on sign out
      setHasCompletedOnboarding(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        hasCompletedOnboarding,
        setOnboardingCompleted,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
