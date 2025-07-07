"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
  BackHandler,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  MaterialIcons,
  FontAwesome,
  Feather,
} from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import { useRecentMeals } from "@/hooks/useRecentMeals";
import { useMutateRecentMeals } from "@/hooks/useMutateRecentMeals";
import { useAnalyzeFood } from "@/hooks/useAnalyzeFood";
import { useMutateNutrition } from "@/hooks/useMutateNutrition";
import {
  useDailyNutritionSummary,
  formatDateForAPI,
  useUserProfileStreak,
} from "@/hooks/useUserProfile";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useStreak, useUpdateStreak } from "@/hooks/useStreak";
import { MacrosSection } from "@/components/ui/MacrosSection";

export default function DashboardScreen() {
  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateForAPI(new Date())
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    new Date().getDay()
  );
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(29); // Today is the last index (30 days - 1)

  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const navigationRouter = useRouter();

  // Plus button and modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const bgOpacityAnim = useRef(new Animated.Value(0)).current;

  // Streak functionality
  const { data: streakData, isLoading: isLoadingStreak } = useStreak();
  const updateStreakMutation = useUpdateStreak();

  // User profile streak data for day selector icons
  const { data: userProfileData } = useUserProfileStreak();

  // Congratulations modal state
  const [showCongratulationsModal, setShowCongratulationsModal] =
    useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [congratulationsShownForDay, setCongratulationsShownForDay] =
    useState<string>("");
  const congratsModalAnim = useRef(new Animated.Value(0)).current;
  const congratsBgOpacityAnim = useRef(new Animated.Value(0)).current;
  const streakModalAnim = useRef(new Animated.Value(0)).current;
  const streakBgOpacityAnim = useRef(new Animated.Value(0)).current;

  // Load congratulations tracking from storage
  useEffect(() => {
    const loadCongratulationsTracking = async () => {
      if (!session?.user?.id) return;

      try {
        const key = `congratulationsShown_${session.user.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          setCongratulationsShownForDay(stored);
        }
      } catch (error) {
        console.error("Error loading congratulations tracking:", error);
      }
    };

    loadCongratulationsTracking();
  }, [session?.user?.id]);

  // Save congratulations tracking to storage
  const saveCongratulationsTracking = async (day: string) => {
    if (!session?.user?.id) return;

    try {
      const key = `congratulationsShown_${session.user.id}`;
      await AsyncStorage.setItem(key, day);
      setCongratulationsShownForDay(day);
    } catch (error) {
      console.error("Error saving congratulations tracking:", error);
    }
  };

  const [isNavigatingToCamera, setIsNavigatingToCamera] = useState(false);
  const [isNavigatingToSettings, setIsNavigatingToSettings] = useState(false);
  const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);
  const [justReturnedFromCamera, setJustReturnedFromCamera] = useState(false);

  const { analyzeFood } = useAnalyzeFood();
  const { addOptimisticMeal, updateOptimisticMeal } = useMutateRecentMeals();
  const { addMealToNutrition } = useMutateNutrition();

  // Android back button handler - only for homepage
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        // Show confirmation dialog when user tries to exit the app from homepage
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => null,
          },
          {
            text: "Exit",
            style: "destructive",
            onPress: () => BackHandler.exitApp(),
          },
        ]);
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to make this work!"
        );
      }
    })();
  }, []);

  // Simple animation for action modal
  const showModal = () => {
    setShowActionModal(true);
    Animated.parallel([
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start(() => setShowActionModal(false));
  };
  // Congratulations modal animations
  const showCongratulationsModalWithAnimation = () => {
    setShowCongratulationsModal(true);
    Animated.parallel([
      Animated.spring(congratsModalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(congratsBgOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start();
  };

  const hideCongratulationsModal = () => {
    Animated.parallel([
      Animated.timing(congratsModalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
      Animated.timing(congratsBgOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start(() => {
      setShowCongratulationsModal(false);
    });
  };

  // Streak modal animations
  const showStreakModalWithAnimation = () => {
    setShowStreakModal(true);
    Animated.parallel([
      Animated.spring(streakModalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(streakBgOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start();
  };

  const hideStreakModal = () => {
    Animated.parallel([
      Animated.timing(streakModalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
      Animated.timing(streakBgOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start(() => setShowStreakModal(false));
  };

  const handleCameraPress = useCallback(() => {
    if (isNavigatingToCamera) return; // Prevent multiple rapid clicks
    setIsNavigatingToCamera(true);
    hideModal();
    // Add a small delay to prevent rapid navigation
    setTimeout(() => {
      try {
        navigationRouter.push({
          pathname: "/camera",
          params: { selectedDate: selectedDate },
        });
      } catch (error) {
        console.error("Navigation error in handleCameraPress:", error);
        // Reset the flag if navigation fails
        setIsNavigatingToCamera(false);
      }
      // Reset the flag after navigation
      setTimeout(() => setIsNavigatingToCamera(false), 500);
    }, 100);
  }, [isNavigatingToCamera, selectedDate, navigationRouter]);

  const handleGalleryPress = async () => {
    hideModal();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        aspect: [9, 16],
        quality: 1.0, // Use full quality since we'll process it ourselves
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;

        // Create optimistic meal entry
        const optimisticMeal = {
          id: `temp-${Date.now()}`,
          name: "Analyzing...",
          emoji: "🍽️",
          protein: 0,
          carbs: 0,
          fats: 0,
          calories: 0,
          created_at: new Date().toISOString(),
          photo_url: photoUri,
          isAnalyzing: true,
        };

        // Add to recent meals optimistically
        const today = formatDateForAPI(new Date());
        addOptimisticMeal(optimisticMeal, today);

        // Set analyzing state to trigger auto-switch
        setIsAnalyzingMeal(true);

        // Start analysis in background with optimized image
        try {
          const result = await analyzeFood(photoUri, "gallery");
          // Extract the real data from server response
          const serverData = result.data;
          const databaseRecord = serverData.database_record;
          const photoUrl = serverData.file_info?.photo_url;

          // Replace the optimistic meal with real server data
          updateOptimisticMeal(
            optimisticMeal.id,
            {
              id: databaseRecord.id, // Replace temp ID with real ID
              name: databaseRecord.name,
              emoji: databaseRecord.emoji,
              protein: databaseRecord.protein,
              carbs: databaseRecord.carbs,
              fats: databaseRecord.fats,
              calories: databaseRecord.calories,
              photo_url: photoUrl || optimisticMeal.photo_url, // Use server photo URL
              created_at: databaseRecord.created_at,
              isAnalyzing: false,
            },
            today
          );

          // Optimistically update nutrition with the real meal data
          addMealToNutrition(
            {
              calories: databaseRecord.calories,
              protein: databaseRecord.protein,
              carbs: databaseRecord.carbs,
              fats: databaseRecord.fats,
            },
            today
          );

          // Only invalidate nutrition summary, not recent meals (optimistic updates handle recent meals)
          queryClient.invalidateQueries({
            queryKey: ["daily-nutrition-summary", session?.user?.id, today],
          });
        } catch (error) {
          console.error("Analysis failed:", error);
          // Update with error state
          updateOptimisticMeal(
            optimisticMeal.id,
            {
              name: "Analysis Failed",
              emoji: "❌",
              protein: 0,
              carbs: 0,
              fats: 0,
              calories: 0,
              isAnalyzing: false,
            },
            today
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to pick an image from gallery. Please try again."
      );
    }
  };

  // Use TanStack Query hooks for recent meals and user profile
  const {
    data: recentMeals = [],
    isLoading: isLoadingMeals,
    error,
    refetch: refetchRecentMeals,
  } = useRecentMeals(selectedDate);

  const { invalidateRecentMeals } = useMutateRecentMeals();

  // Use the new daily nutrition summary hook
  const {
    data: dailyNutrition,
    isLoading: isLoadingNutrition,
    error: nutritionError,
    refetch: refetchDailyNutrition,
  } = useDailyNutritionSummary(selectedDate);

  // Manual refetch when session becomes available
  useEffect(() => {
    if (session?.access_token && selectedDate) {
      setTimeout(() => {
        refetchRecentMeals();
        refetchDailyNutrition();
      }, 100);
    }
  }, [
    session?.access_token,
    selectedDate,
    refetchRecentMeals,
    refetchDailyNutrition,
  ]);

  // Turkish day abbreviations (Sunday = 0, Monday = 1, etc.)
  const turkishDays = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];

  // Get dates for the past 30 days with today on the right
  const getMonthDates = () => {
    const today = new Date();
    // console.log("getMonthDates - Today's date:", {
    //   localDate: today.toLocaleDateString(),
    //   isoDate: today.toISOString().split("T")[0],
    //   utcDate: new Date().toUTCString(),
    //   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // });

    const dates = [];
    const dayNames = [];
    // Generate 30 days starting from 30 days ago
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateInfo = {
        date: date.getDate(),
        dayIndex: date.getDay(),
        fullDate: date,
      };
      dates.push(dateInfo);
      dayNames.push(turkishDays[date.getDay()]);

      // // Debug the last few dates (today and yesterday)
      // if (i <= 1) {
      //   console.log(
      //     `Date ${i}: ${date.toISOString().split("T")[0]} - ${turkishDays[date.getDay()]} ${date.getDate()}`
      //   );
      // }
    }
    return { dates, dayNames };
  };

  const { dates: monthDates, dayNames: monthDayNames } = getMonthDates();

  // Handle day selection
  const handleDaySelect = (dateIndex: number, dateObj: any) => {
    if (!session?.user?.id) {
      console.log("No session available, skipping day selection");
      return;
    }
    try {
      const selectedFullDate = dateObj.fullDate;
      const formattedDate = formatDateForAPI(selectedFullDate);
      // console.log("Day selection - Date being sent:", {
      //   dateIndex,
      //   dayName: monthDayNames[dateIndex],
      //   dayNumber: dateObj.date,
      //   selectedFullDate: selectedFullDate.toISOString(),
      //   formattedDate,
      //   localDate: selectedFullDate.toLocaleDateString(),
      // });
      setSelectedDate(formattedDate);
      setSelectedDayIndex(dateObj.dayIndex);
      setSelectedDateIndex(dateIndex);
    } catch (error) {
      console.error("Error selecting day:", error);
      // Don't crash the app, just log the error
    }
  };

  // Function to format time from ISO string to HH:MM format
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      return "Unknown";
    }
  };

  // Handle meal item click to navigate to edit page
  const handleMealPress = (meal: any) => {
    try {
      navigationRouter.push({
        pathname: "/(tabs)/edit-meal" as any,
        params: {
          id: meal.id,
          name: meal.name,
          photo_url: meal.photo_url,
          calories: meal.calories.toString(),
          protein: meal.protein.toString(),
          carbs: meal.carbs.toString(),
          fats: meal.fats.toString(),
          portions: meal.portion ? meal.portion.toString() : "1",
          selectedDate: selectedDate, // Pass the current selected date
        },
      });
    } catch (error) {
      console.error("Navigation error in handleMealPress:", error);
    }
  };

  // Scroll to today's date when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from camera)
  useEffect(() => {
    // Only run if we have a session and the component is properly mounted
    if (session?.user?.id && selectedDate) {
      try {
        // Only invalidate nutrition data for the current selected date
        queryClient.invalidateQueries({
          queryKey: ["daily-nutrition-summary", session.user.id, selectedDate],
        });
      } catch (error) {
        console.error("Error invalidating queries:", error);
      }
    }
  }, [queryClient, selectedDate, session?.user?.id]);

  // Auto-switch to today's date when a meal is being analyzed (only once)
  useEffect(() => {
    if (isAnalyzingMeal) {
      try {
        // Switch to today's date to show the analysis progress (only once)
        const today = formatDateForAPI(new Date());
        const todayIndex = monthDates.findIndex(
          (dateObj) => formatDateForAPI(dateObj.fullDate) === today
        );

        if (todayIndex !== -1 && selectedDate !== today) {
          setSelectedDate(today);
          setSelectedDayIndex(monthDates[todayIndex].dayIndex);
          setSelectedDateIndex(todayIndex);
        }

        // Reset the analyzing state immediately so user can navigate freely
        setIsAnalyzingMeal(false);
      } catch (error) {
        console.error("Error in analyzing meal effect:", error);
        setIsAnalyzingMeal(false);
      }
    }
  }, [isAnalyzingMeal, selectedDate, monthDates]);

  // Check for analyzing meals when returning from camera (only once)
  useEffect(() => {
    if (justReturnedFromCamera) {
      try {
        // Switch to today's date to show the analysis progress (only once)
        const today = formatDateForAPI(new Date());
        const todayIndex = monthDates.findIndex(
          (dateObj) => formatDateForAPI(dateObj.fullDate) === today
        );

        if (todayIndex !== -1) {
          setSelectedDate(today);
          setSelectedDayIndex(monthDates[todayIndex].dayIndex);
          setSelectedDateIndex(todayIndex);
        }

        // Reset the flag when the effect is cleaned up
        setJustReturnedFromCamera(false);
      } catch (error) {
        console.error("Error in justReturnedFromCamera effect:", error);
        setJustReturnedFromCamera(false);
      }
    }
  }, [justReturnedFromCamera, selectedDate, monthDates]);

  // Set flag when returning from camera
  useFocusEffect(
    useCallback(() => {
      try {
        setJustReturnedFromCamera(true);
      } catch (error) {
        console.error("Error in useFocusEffect:", error);
      }
    }, [])
  );

  // Clear state when user changes
  useEffect(() => {
    if (session?.user?.id) {
      try {
        // Reset navigation flags when user changes
        setIsNavigatingToCamera(false);
        setIsNavigatingToSettings(false);
        setIsAnalyzingMeal(false);
        setJustReturnedFromCamera(false);
        setCongratulationsShownForDay("");

        // Clear any stale query cache for the previous user
        queryClient.clear();
      } catch (error) {
        console.error("Error clearing state on user change:", error);
      }
    }
  }, [session?.user?.id, queryClient]);

  // Reset congratulations tracking when day changes
  useEffect(() => {
    const today = formatDateForAPI(new Date());
    if (congratulationsShownForDay && congratulationsShownForDay !== today) {
      // Clear the stored congratulations tracking for the new day
      if (session?.user?.id) {
        const key = `congratulationsShown_${session.user.id}`;
        AsyncStorage.removeItem(key).catch((error) => {
          console.error("Error clearing congratulations tracking:", error);
        });
      }
      setCongratulationsShownForDay("");
    }
  }, [congratulationsShownForDay, session?.user?.id]);

  // Calculate daily stats from daily nutrition summary or fallback to defaults
  const getDailyStats = () => {
    // Default values if data not loaded yet
    const defaultStats = {
      caloriesLeft: 0,
      totalCalories: 0,
      proteinLeft: 0,
      totalProtein: 0,
      carbsLeft: 0,
      totalCarbs: 0,
      fatsLeft: 0,
      totalFats: 0,
      isOverGoal: false,
      consumed: 0,
      proteinConsumed: 0,
      carbsConsumed: 0,
      fatsConsumed: 0,
      isOverProteinGoal: false,
      isOverCarbsGoal: false,
      isOverFatsGoal: false,
    };

    // If nutrition data is available, use it
    if (dailyNutrition) {
      const consumed = dailyNutrition.consumed_today.calories;
      const goal = dailyNutrition.daily_goals.calories;
      const isOverGoal = consumed > goal;

      const proteinConsumed = dailyNutrition.consumed_today.protein;
      const proteinGoal = dailyNutrition.daily_goals.protein;
      const isOverProteinGoal = proteinConsumed > proteinGoal;

      const carbsConsumed = dailyNutrition.consumed_today.carbs;
      const carbsGoal = dailyNutrition.daily_goals.carbs;
      const isOverCarbsGoal = carbsConsumed > carbsGoal;

      const fatsConsumed = dailyNutrition.consumed_today.fats;
      const fatsGoal = dailyNutrition.daily_goals.fats;
      const isOverFatsGoal = fatsConsumed > fatsGoal;

      return {
        caloriesLeft: isOverGoal
          ? consumed
          : Math.max(0, dailyNutrition.remaining_to_goal.calories),
        totalCalories: dailyNutrition.daily_goals.calories,
        proteinLeft: isOverProteinGoal
          ? proteinConsumed
          : Math.max(0, dailyNutrition.remaining_to_goal.protein),
        totalProtein: dailyNutrition.daily_goals.protein,
        carbsLeft: isOverCarbsGoal
          ? carbsConsumed
          : Math.max(0, dailyNutrition.remaining_to_goal.carbs),
        totalCarbs: dailyNutrition.daily_goals.carbs,
        fatsLeft: isOverFatsGoal
          ? fatsConsumed
          : Math.max(0, dailyNutrition.remaining_to_goal.fats),
        totalFats: dailyNutrition.daily_goals.fats,
        isOverGoal,
        consumed,
        proteinConsumed,
        carbsConsumed,
        fatsConsumed,
        isOverProteinGoal,
        isOverCarbsGoal,
        isOverFatsGoal,
      };
    }
    return defaultStats;
  };

  const dailyStats = getDailyStats();
  const caloriesConsumed = dailyStats.isOverGoal
    ? dailyStats.totalCalories
    : dailyStats.totalCalories - dailyStats.caloriesLeft;
  const progressPercentage =
    (caloriesConsumed / dailyStats.totalCalories) * 100;

  // Check if goal is reached and handle congratulations
  useEffect(() => {
    if (dailyNutrition && selectedDate) {
      try {
        const consumed = dailyNutrition.consumed_today.calories;
        const goal = dailyNutrition.daily_goals.calories;

        // Check if goal is reached (consumed >= goal)
        if (consumed >= goal && !hasReachedGoal(selectedDate)) {
          // Optimistically update streak data for immediate UI feedback
          optimisticallyUpdateStreak(selectedDate);

          // Update streak in background
          updateStreakMutation.mutate();

          // Invalidate user profile data to refresh streak history (as fallback)
          queryClient.invalidateQueries({
            queryKey: ["user-profile-streak", session?.user?.id],
          });
          queryClient.invalidateQueries({
            queryKey: ["user-profile", session?.user?.id],
          });

          // Refetch user profile data in background to ensure consistency
          setTimeout(() => {
            queryClient.refetchQueries({
              queryKey: ["user-profile-streak", session?.user?.id],
            });
            queryClient.refetchQueries({
              queryKey: ["user-profile", session?.user?.id],
            });
          }, 1000);
        }

        // Show congratulations if needed (only for today and only once)
        const today = formatDateForAPI(new Date());
        if (selectedDate === today && shouldShowCongratulations(selectedDate)) {
          saveCongratulationsTracking(today);
          showCongratulationsModalWithAnimation();
        }
      } catch (error) {
        console.error("Error in goal reached effect:", error);
      }
    }
  }, [dailyNutrition, selectedDate]);

  const openCamera = useCallback(() => {
    if (isNavigatingToCamera) return; // Prevent multiple rapid clicks
    setIsNavigatingToCamera(true);
    // Add a small delay to prevent rapid navigation
    setTimeout(() => {
      try {
        navigationRouter.push({
          pathname: "/camera",
          params: { selectedDate: selectedDate },
        });
      } catch (error) {
        console.error("Navigation error in openCamera:", error);
        // Reset the flag if navigation fails
        setIsNavigatingToCamera(false);
      }
      // Reset the flag after navigation
      setTimeout(() => setIsNavigatingToCamera(false), 500);
    }, 100);
  }, [isNavigatingToCamera, selectedDate, navigationRouter]);

  const navigateToSettings = useCallback(() => {
    if (isNavigatingToSettings) return; // Prevent multiple rapid clicks
    setIsNavigatingToSettings(true);
    // Add a small delay to prevent rapid navigation
    setTimeout(() => {
      try {
        navigationRouter.push({
          pathname: "/settings",
        });
      } catch (error) {
        console.error("Navigation error in navigateToSettings:", error);
        // Reset the flag if navigation fails
        setIsNavigatingToSettings(false);
      }
      // Reset the flag after navigation
      setTimeout(() => setIsNavigatingToSettings(false), 500);
    }, 100);
  }, [isNavigatingToSettings, navigationRouter]);

  // Function to check if a specific date has a streak achieved
  const hasStreakAchieved = (dateString: string): boolean => {
    if (
      !userProfileData?.streak_history ||
      !Array.isArray(userProfileData.streak_history)
    )
      return false;
    return userProfileData.streak_history.includes(dateString);
  };

  // Backend-based goal tracking functions
  const hasReachedGoal = (dateString: string): boolean => {
    return hasStreakAchieved(dateString);
  };

  const shouldShowCongratulations = (dateString: string): boolean => {
    const today = formatDateForAPI(new Date());
    // Only show congratulations for today and only if we haven't shown it yet for this day
    return (
      dateString === today &&
      hasReachedGoal(dateString) &&
      congratulationsShownForDay !== today
    );
  };

  // Function to optimistically update streak data
  const optimisticallyUpdateStreak = (dateString: string) => {
    if (!userProfileData) return;

    // Optimistically update the streak history
    queryClient.setQueryData(
      ["user-profile-streak", session?.user?.id],
      (oldData: any) => {
        if (!oldData) return oldData;

        const updatedStreakHistory = [
          ...(oldData.streak_history || []),
          dateString,
        ];

        return {
          ...oldData,
          streak: (oldData.streak || 0) + 1,
          streak_history: updatedStreakHistory,
        };
      }
    );

    // Also update the main user profile cache
    queryClient.setQueryData(
      ["user-profile", session?.user?.id],
      (oldData: any) => {
        if (!oldData) return oldData;

        const updatedStreakHistory = [
          ...(oldData.streak_history || []),
          dateString,
        ];

        return {
          ...oldData,
          streak: (oldData.streak || 0) + 1,
          streak_history: updatedStreakHistory,
        };
      }
    );

    // Also update the streak data cache for the top display
    queryClient.setQueryData(["streak", session?.user?.id], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        current_streak: (oldData.current_streak || 0) + 1,
      };
    });
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#e5e7eb", "#f4f4f4"]}
        locations={[0, 0.7]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center px-6 py-4">
            <View className="flex-row items-center justify-center gap-2">
              <FontAwesome5
                name="apple-alt"
                size={24}
                color="black"
                className="mb-1"
              />
              <Text className="text-xl font-bold text-gray-900">Kal AI</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={showStreakModalWithAnimation}
                className="flex-row items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm"
              >
                <FontAwesome6 name="fire" size={24} color="orange" />
                <Text className="text-lg font-bold text-orange-600">
                  {isLoadingStreak
                    ? "..."
                    : `${streakData?.current_streak || 0} days`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={navigateToSettings}
                disabled={isNavigatingToSettings}
                className={`bg-white rounded-full p-2 shadow-sm ${isNavigatingToSettings ? "opacity-50" : ""}`}
              >
                <MaterialIcons name="settings" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Days Header */}
          <View className="px-6 mb-4">
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 0, paddingRight: 0 }}
              bounces={false}
              className="rounded-xl shadow-md"
            >
              <View className="flex-row bg-white rounded-2xl ">
                {monthDates.map((dateObj, index) => {
                  const dateString = formatDateForAPI(dateObj.fullDate);
                  const goalReached = hasStreakAchieved(dateString);

                  return (
                    <View key={index} className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => handleDaySelect(index, dateObj)}
                        className={`px-3 py-3 min-w-[50px] relative ${
                          selectedDateIndex === index
                            ? "bg-black rounded-2xl mx-1 my-1"
                            : "mx-1 my-1"
                        }`}
                      >
                        <View className="items-center">
                          <Text
                            className={`text-xs font-medium ${
                              selectedDateIndex === index
                                ? "text-white"
                                : "text-gray-500"
                            }`}
                          >
                            {monthDayNames[index]}
                          </Text>
                          <Text
                            className={`text-lg font-bold ${
                              selectedDateIndex === index
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {dateObj.date}
                          </Text>
                        </View>
                        {/* Goal reached indicator */}
                        {goalReached && (
                          <View className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-sm">
                            <View className="w-full h-full items-center justify-center">
                              <FontAwesome6
                                name="fire"
                                size={8}
                                color="white"
                              />
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                      {index < monthDates.length - 1 && (
                        <View className="w-px h-8 bg-gray-200" />
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Calories Section */}
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center">
                <View>
                  {isLoadingNutrition ? (
                    <Text className="text-xl pl-2 text-gray-400">
                      Loading...
                    </Text>
                  ) : nutritionError ? (
                    <View>
                      <Text className="text-5xl font-bold text-gray-400 py-2">
                        --
                      </Text>
                      <Text className="text-sm text-gray-500 mb-1 pl-2">
                        No data available
                      </Text>
                    </View>
                  ) : (
                    <View>
                      {dailyStats.isOverGoal ? (
                        <>
                          <Text className="text-5xl font-bold text-black-600 py-2">
                            {Math.round(dailyStats.consumed)}
                          </Text>
                          <Text className="text-sm text-gray-600 mb-1">
                            Calories Eaten
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Goal: {Math.round(dailyStats.totalCalories)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-5xl font-bold text-black-600 py-2">
                            {Math.round(dailyStats.caloriesLeft)}
                          </Text>
                          <Text className="text-xs text-gray-600 mb-1">
                            Calories Left
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                </View>
                <CircularProgress
                  percentage={
                    dailyStats.totalCalories > 0 ? progressPercentage : 0
                  }
                />
              </View>
            </View>

            {/* Macros Section */}
            <MacrosSection
              dailyStats={dailyStats}
              isLoadingNutrition={isLoadingNutrition}
              nutritionError={nutritionError}
            />
            {/* <View className="flex-row gap-2 space-x-4  mb-4">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Protein Left
                </Text>
                {isLoadingNutrition ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : nutritionError ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : (
                  <Text className="text-xl font-bold text-rose-600">
                    {Math.round(dailyStats.proteinLeft)}g
                  </Text>
                )}
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalProtein)}g
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Carbs Left
                </Text>
                {isLoadingNutrition ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : nutritionError ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : (
                  <Text className="text-xl font-bold text-orange-600">
                    {Math.round(dailyStats.carbsLeft)}g
                  </Text>
                )}
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalCarbs)}g
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-600 mb-1">
                  Fats Left
                </Text>
                {isLoadingNutrition ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : nutritionError ? (
                  <Text className="text-xl font-bold text-gray-400">--</Text>
                ) : (
                  <Text className="text-xl font-bold text-sky-600">
                    {Math.round(dailyStats.fatsLeft)}g
                  </Text>
                )}
                <Text className="text-xs text-gray-400">
                  of {Math.round(dailyStats.totalFats)}g
                </Text>
              </View>
            </View> */}

            {/* Recently Section */}
            <View className="mb-20">
              <Text className="text-lg font-semibold text-gray-900 mb-4 px-2">
                Recently
              </Text>
              {isLoadingMeals ? (
                <View className="bg-white rounded-2xl p-6 shadow-sm">
                  <Text className="text-gray-500 text-center">
                    Loading your recent meals...
                  </Text>
                </View>
              ) : error ? (
                <View className="bg-white rounded-2xl p-6 shadow-sm">
                  <Text className="text-red-500 text-center mb-2">
                    Failed to load recent meals
                  </Text>
                  <TouchableOpacity
                    onPress={() => invalidateRecentMeals()}
                    className="bg-green-500 rounded-lg px-4 py-2"
                  >
                    <Text className="text-white font-medium text-center">
                      Retry
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : recentMeals.length > 0 ? (
                <View className="space-y-3 gap-3">
                  {recentMeals.map((meal) => (
                    <TouchableOpacity
                      key={meal.id}
                      onPress={() => handleMealPress(meal)}
                      disabled={meal.isAnalyzing}
                      className={`bg-white rounded-2xl px-3 py-2 shadow-sm ${
                        meal.isAnalyzing ? "opacity-60" : ""
                      }`}
                      activeOpacity={meal.isAnalyzing ? 1 : 0.7}
                    >
                      <View className="flex-row items-center">
                        <View className="relative">
                          <Image
                            source={{ uri: meal.photo_url }}
                            className="w-20 h-20 rounded-xl mr-4"
                          />
                          {/* Loading overlay for meals being analyzed */}
                          {meal.isAnalyzing && (
                            <View className="absolute inset-0 bg-black/50 rounded-xl mr-4 justify-center items-center">
                              <ActivityIndicator size="small" color="white" />
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row justify-between items-start">
                            <Text
                              className={`font-semibold text-base w-[70%] ${
                                meal.name === "Analyzing..."
                                  ? "text-gray-400"
                                  : meal.name === "Analysis Failed"
                                    ? "text-red-500"
                                    : "text-gray-900"
                              }`}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {meal.name}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              {formatTime(meal.created_at)}
                            </Text>
                          </View>
                          <Text
                            className={`text-md mb-2 ${
                              meal.name === "Analyzing..."
                                ? "text-gray-400"
                                : meal.name === "Analysis Failed"
                                  ? "text-red-500"
                                  : "text-gray-600"
                            }`}
                          >
                            {meal.name === "Analyzing..."
                              ? "Analyzing..."
                              : meal.name === "Analysis Failed"
                                ? "Analysis failed"
                                : `${Math.round(meal.calories)} calories`}
                          </Text>
                          <View className="flex-row items-center">
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-rose-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-rose-600">
                                  P
                                </Text>
                              </View>
                              <Text
                                className={`text-xs font-medium ${meal.name === "Analyzing..." ? "text-gray-400" : ""}`}
                              >
                                {meal.name === "Analyzing..."
                                  ? "--"
                                  : `${Math.round(meal.protein)}g`}
                              </Text>
                            </View>
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-orange-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-orange-600">
                                  C
                                </Text>
                              </View>
                              <Text
                                className={`text-xs font-medium ${meal.name === "Analyzing..." ? "text-gray-400" : ""}`}
                              >
                                {meal.name === "Analyzing..."
                                  ? "--"
                                  : `${Math.round(meal.carbs)}g`}
                              </Text>
                            </View>
                            <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                              <View className="bg-sky-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                                <Text className="text-xs font-medium text-sky-600">
                                  F
                                </Text>
                              </View>
                              <Text
                                className={`text-xs font-medium ${meal.name === "Analyzing..." ? "text-gray-400" : ""}`}
                              >
                                {meal.name === "Analyzing..."
                                  ? "--"
                                  : `${Math.round(meal.fats)}g`}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-2xl p-8 shadow-sm">
                  <Text className="text-gray-500 text-center mb-2">
                    You haven't uploaded any food yet
                  </Text>
                  <Text className="text-gray-400 text-center text-sm">
                    Start by taking a photo of your meal!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Floating Plus Button */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: insets.bottom + 30,
              left: "50%",
              marginLeft: -30,
              zIndex: 1000,
            }}
          >
            <TouchableOpacity
              onPress={showModal}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#000000",
                justifyContent: "center",
                alignItems: "center",
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                borderWidth: 4,
                borderColor: "white",
              }}
            >
              <Feather name="plus" size={28} color="white" />
            </TouchableOpacity>
          </Animated.View>

          {/* Action Modal */}
          <Modal
            visible={showActionModal}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={hideModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={hideModal}
              style={{ flex: 1 }}
            >
              {/* Separate background overlay */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  opacity: bgOpacityAnim,
                }}
              />
              {/* Modal content */}
              <View style={{ flex: 1, overflow: "hidden" }}>
                <Animated.View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    transform: [
                      {
                        translateY: modalAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [400, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <View className="bg-white rounded-t-3xl p-6">
                      {/* Header */}
                      <View className="items-center mb-6">
                        <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                        <Text className="text-2xl font-bold text-black mb-2">
                          Add Food
                        </Text>
                        <Text className="text-gray-600 text-center">
                          Choose how you'd like to log your meal
                        </Text>
                      </View>
                      {/* Action Buttons */}
                      <View className="space-y-0">
                        {/* Camera Button */}
                        <TouchableOpacity
                          onPress={handleCameraPress}
                          disabled={isNavigatingToCamera}
                          className={`flex-row items-center py-4 px-2 ${isNavigatingToCamera ? "opacity-50" : ""}`}
                        >
                          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                            <FontAwesome
                              name="camera"
                              size={20}
                              color="#374151"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-semibold text-black">
                              Camera
                            </Text>
                            <Text className="text-sm text-gray-600">
                              Take a photo of your meal
                            </Text>
                          </View>
                          <Feather
                            name="chevron-right"
                            size={20}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                        {/* Divider */}
                        <View className="h-px bg-gray-200 mx-2" />
                        {/* Gallery Button */}
                        <TouchableOpacity
                          onPress={handleGalleryPress}
                          className="flex-row items-center py-4 px-2"
                        >
                          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                            <MaterialIcons
                              name="photo-library"
                              size={20}
                              color="#374151"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-semibold text-black">
                              Gallery
                            </Text>
                            <Text className="text-sm text-gray-600">
                              Choose from your photos
                            </Text>
                          </View>
                          <Feather
                            name="chevron-right"
                            size={20}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Congratulations Modal */}
          <Modal
            visible={showCongratulationsModal}
            transparent={true}
            animationType="none"
            onRequestClose={hideCongratulationsModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={hideCongratulationsModal}
              style={{ flex: 1 }}
            >
              {/* Background overlay */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  opacity: congratsBgOpacityAnim,
                }}
              />
              {/* Modal content */}
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 24,
                }}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: congratsModalAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                    opacity: congratsModalAnim,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <View className="bg-white rounded-3xl p-8 items-center shadow-2xl w-full max-w-sm">
                      <View className="bg-orange-100 rounded-full p-6 mb-6">
                        <FontAwesome6 name="trophy" size={48} color="#FF8C00" />
                      </View>
                      <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                        Goal Reached!
                      </Text>
                      <Text className="text-lg text-gray-700 text-center mb-6 leading-6">
                        Congratulations! You've reached your daily calorie goal.
                        Your streak has been updated!
                      </Text>
                      <View className="flex-row gap-2 space-x-3 w-full">
                        <TouchableOpacity
                          onPress={() => {
                            hideCongratulationsModal();
                          }}
                          className={`flex-1 rounded-2xl py-3 bg-orange-500`}
                        >
                          <Text className="text-center font-semibold text-white">
                            Keep going!
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Streak Modal */}
          <Modal
            visible={showStreakModal}
            transparent={true}
            animationType="none"
            onRequestClose={hideStreakModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={hideStreakModal}
              style={{ flex: 1 }}
            >
              {/* Background overlay */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  opacity: streakBgOpacityAnim,
                }}
              />
              {/* Modal content */}
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 24,
                }}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: streakModalAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                    opacity: streakModalAnim,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <View className="bg-white rounded-3xl p-8 items-center shadow-2xl w-full max-w-sm">
                      <View className="bg-orange-100 rounded-full p-6 mb-6">
                        <FontAwesome6 name="fire" size={48} color="orange" />
                      </View>
                      <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                        🔥{" "}
                        {isLoadingStreak
                          ? "..."
                          : `${streakData?.current_streak || 0} Day Streak!`}
                      </Text>
                      <Text className="text-lg text-gray-700 text-center mb-2 leading-6">
                        You're on fire! Keep reaching your daily calorie goals
                        to maintain your streak.
                      </Text>
                      <Text className="text-sm text-gray-500 text-center mb-6">
                        Daily Goal:{" "}
                        {isLoadingStreak
                          ? "..."
                          : `${Math.round(streakData?.daily_calorie_goal || 0)} calories`}
                      </Text>
                      <View className="flex-row gap-2 space-x-3 w-full">
                        <TouchableOpacity
                          onPress={hideStreakModal}
                          className="flex-1 bg-gray-100 rounded-2xl py-3"
                        >
                          <Text className="text-center font-semibold text-gray-700">
                            Close
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            hideStreakModal();
                            try {
                              openCamera();
                            } catch (error) {
                              console.error("Navigation error:", error);
                              // Fallback: just close the modal if navigation fails
                            }
                          }}
                          disabled={isNavigatingToCamera}
                          className={`flex-1 rounded-2xl py-3 ${isNavigatingToCamera ? "bg-gray-400" : "bg-green-500"}`}
                        >
                          <Text className="text-center font-semibold text-white">
                            Log Meal Now
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
