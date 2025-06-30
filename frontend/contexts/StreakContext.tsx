import React, { createContext, useContext, useState } from "react";

interface StreakContextType {
  showStreakModal: boolean;
  setShowStreakModal: (show: boolean) => void;
  streak: number;
  setStreak: (streak: number) => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streak, setStreak] = useState(12);

  return (
    <StreakContext.Provider
      value={{
        showStreakModal,
        setShowStreakModal,
        streak,
        setStreak,
      }}
    >
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error("useStreak must be used within a StreakProvider");
  }
  return context;
}
