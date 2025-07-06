"use client";

import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

interface GoalTrackingData {
  [date: string]: {
    goalReached: boolean;
    congratulationsShown: boolean;
  };
}

export const useGoalTracking = () => {
  const [goalTrackingData, setGoalTrackingData] = useState<GoalTrackingData>(
    {}
  );
  const { session } = useAuth();

  // Load goal tracking data from storage
  useEffect(() => {
    const loadGoalTrackingData = async () => {
      if (!session?.user?.id) return;

      try {
        const key = `goalTrackingData_${session.user.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          setGoalTrackingData(JSON.parse(stored));
        } else {
          // Clear any existing data when switching users
          setGoalTrackingData({});
        }
      } catch (error) {
        console.error("Error loading goal tracking data:", error);
      }
    };

    loadGoalTrackingData();
  }, [session?.user?.id]);

  // Save goal tracking data to storage
  const saveGoalTrackingData = async (data: GoalTrackingData) => {
    if (!session?.user?.id) return;

    try {
      const key = `goalTrackingData_${session.user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      setGoalTrackingData(data);
    } catch (error) {
      console.error("Error saving goal tracking data:", error);
    }
  };

  const markGoalReached = async (date: string) => {
    if (!session?.user?.id) return;

    const newData = {
      ...goalTrackingData,
      [date]: {
        goalReached: true,
        congratulationsShown: false,
      },
    };
    await saveGoalTrackingData(newData);
  };

  const markCongratulationsShown = async (date: string) => {
    if (!session?.user?.id) return;

    const newData = {
      ...goalTrackingData,
      [date]: {
        ...goalTrackingData[date],
        congratulationsShown: true,
      },
    };
    await saveGoalTrackingData(newData);
  };

  const hasReachedGoal = (date: string): boolean => {
    try {
      return goalTrackingData[date]?.goalReached || false;
    } catch (error) {
      console.error("Error in hasReachedGoal:", error);
      return false;
    }
  };

  const shouldShowCongratulations = (date: string): boolean => {
    try {
      const dayData = goalTrackingData[date];
      return dayData?.goalReached && !dayData?.congratulationsShown;
    } catch (error) {
      console.error("Error in shouldShowCongratulations:", error);
      return false;
    }
  };

  return {
    markGoalReached,
    markCongratulationsShown,
    hasReachedGoal,
    shouldShowCongratulations,
  };
};
