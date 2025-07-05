"use client"

import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface GoalTrackingData {
  [date: string]: {
    goalReached: boolean
    congratulationsShown: boolean
  }
}

export const useGoalTracking = () => {
  const [goalTrackingData, setGoalTrackingData] = useState<GoalTrackingData>({})

  // Load goal tracking data from storage
  useEffect(() => {
    const loadGoalTrackingData = async () => {
      try {
        const stored = await AsyncStorage.getItem("goalTrackingData")
        if (stored) {
          setGoalTrackingData(JSON.parse(stored))
        }
      } catch (error) {
        console.error("Error loading goal tracking data:", error)
      }
    }

    loadGoalTrackingData()
  }, [])

  // Save goal tracking data to storage
  const saveGoalTrackingData = async (data: GoalTrackingData) => {
    try {
      await AsyncStorage.setItem("goalTrackingData", JSON.stringify(data))
      setGoalTrackingData(data)
    } catch (error) {
      console.error("Error saving goal tracking data:", error)
    }
  }

  const markGoalReached = async (date: string) => {
    const newData = {
      ...goalTrackingData,
      [date]: {
        goalReached: true,
        congratulationsShown: false,
      },
    }
    await saveGoalTrackingData(newData)
  }

  const markCongratulationsShown = async (date: string) => {
    const newData = {
      ...goalTrackingData,
      [date]: {
        ...goalTrackingData[date],
        congratulationsShown: true,
      },
    }
    await saveGoalTrackingData(newData)
  }

  const hasReachedGoal = (date: string): boolean => {
    return goalTrackingData[date]?.goalReached || false
  }

  const shouldShowCongratulations = (date: string): boolean => {
    const dayData = goalTrackingData[date]
    return dayData?.goalReached && !dayData?.congratulationsShown
  }

  return {
    markGoalReached,
    markCongratulationsShown,
    hasReachedGoal,
    shouldShowCongratulations,
  }
}
