import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/scripts/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  // Check onboarding status for current user
  const checkOnboardingStatus = async (userId: string) => {
    try {
      const key = `onboarding_completed_${userId}`;
      const completed = await AsyncStorage.getItem(key);
      setHasCompletedOnboarding(completed === "true");
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setHasCompletedOnboarding(false);
    }
  };

  // Set onboarding completion status for current user
  const setOnboardingCompleted = async (completed: boolean) => {
    if (!session?.user?.id) return;

    try {
      const key = `onboarding_completed_${session.user.id}`;
      await AsyncStorage.setItem(key, completed.toString());
      setHasCompletedOnboarding(completed);
    } catch (error) {
      console.error("Error setting onboarding status:", error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        checkOnboardingStatus(session.user.id);
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
      if (session?.user?.id) {
        await checkOnboardingStatus(session.user.id);
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
