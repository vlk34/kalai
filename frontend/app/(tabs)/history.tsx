import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFullHistory } from "@/hooks/useFullHistory";

const ITEMS_PER_PAGE = 10;

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

interface SectionData {
  title: string;
  data: FoodItem[];
}

export default function HistoryScreen() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data: historyData,
    isLoading,
    error,
  } = useFullHistory(ITEMS_PER_PAGE, offset);

  // Update all foods when new data comes in
  React.useEffect(() => {
    if (historyData?.foods) {
      setHasLoadedOnce(true);

      if (offset === 0) {
        // First load - replace all foods
        setAllFoods(historyData.foods);
      } else {
        // Subsequent loads - append to existing foods with deduplication
        setAllFoods((prev) => {
          const existingIds = new Set(prev.map((food) => food.id));
          const newFoods = historyData.foods.filter(
            (food) => !existingIds.has(food.id)
          );

          // Only clear loading state if we actually got new foods
          if (newFoods.length > 0) {
            setIsLoadingMore(false);
          }

          return [...prev, ...newFoods];
        });
      }

      // Check if we have more data to load
      setHasMore(historyData.foods.length === ITEMS_PER_PAGE);

      // If we're loading more but got no new items, clear loading state
      if (offset > 0 && historyData.foods.length < ITEMS_PER_PAGE) {
        setIsLoadingMore(false);
      }
    }
  }, [historyData, offset]);

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

  // Function to format date from ISO string to readable format
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch (error) {
      return "Unknown";
    }
  };

  // Group meals by date using useMemo for performance
  const sectionData = useMemo(() => {
    const grouped = allFoods.reduce(
      (acc, meal) => {
        const date = new Date(meal.created_at).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(meal);
        return acc;
      },
      {} as Record<string, FoodItem[]>
    );

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, meals]) => ({
        title: formatDate(meals[0].created_at),
        data: meals,
      }));
  }, [allFoods]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setOffset((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [isLoading, hasMore, isLoadingMore]);

  const handleRetry = useCallback(() => {
    setOffset(0);
    setAllFoods([]);
    setHasMore(true);
    setHasLoadedOnce(false);
    setIsLoadingMore(false);
  }, []);

  const renderMealItem = useCallback(
    ({ item: meal }: { item: FoodItem }) => (
      <View className="bg-white rounded-2xl px-3 py-2 shadow-sm mb-3">
        <View className="flex-row items-center">
          <Image
            source={{ uri: meal.photo_url }}
            className="w-20 h-20 rounded-xl mr-4"
            resizeMode="cover"
            // Performance optimizations for images
            fadeDuration={200}
          />
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text
                className="font-semibold text-base w-[70%] text-gray-900"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {meal.name}
              </Text>
              <Text className="text-sm text-gray-500">
                {formatTime(meal.created_at)}
              </Text>
            </View>
            <Text className="text-md mb-2 text-gray-600">
              {Math.round(meal.calories)} calories
            </Text>
            <View className="flex-row items-center">
              <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                <View className="bg-rose-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                  <Text className="text-xs font-medium text-rose-600">P</Text>
                </View>
                <Text className="text-xs font-medium">
                  {Math.round(meal.protein)}g
                </Text>
              </View>
              <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                <View className="bg-orange-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                  <Text className="text-xs font-medium text-orange-600">C</Text>
                </View>
                <Text className="text-xs font-medium">
                  {Math.round(meal.carbs)}g
                </Text>
              </View>
              <View className="rounded-full flex-row items-center gap-1 pr-2 py-1 mr-2">
                <View className="bg-sky-100 rounded-full flex-row items-center gap-1 px-2 py-1">
                  <Text className="text-xs font-medium text-sky-600">F</Text>
                </View>
                <Text className="text-xs font-medium">
                  {Math.round(meal.fats)}g
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <Text className="text-lg font-semibold text-gray-900 mb-3 px-2">
        {section.title}
      </Text>
    ),
    []
  );

  const renderFooter = useCallback(() => {
    // Don't show footer until we have data to prevent flashing at top
    if (allFoods.length === 0) {
      return <View className="mb-20" />;
    }

    if (!hasMore) {
      return (
        <View className="mt-6 mb-4">
          <Text className="text-gray-500 text-center text-sm">
            You've reached the end of your food history
          </Text>
        </View>
      );
    }

    if (hasMore) {
      return (
        <View className="mt-6 mb-20">
          <TouchableOpacity
            onPress={handleLoadMore}
            disabled={isLoadingMore}
            className={`bg-white rounded-2xl py-4 shadow-sm ${
              isLoadingMore ? "opacity-50" : ""
            }`}
          >
            {isLoadingMore ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#000" />
                <Text className="text-gray-600 font-medium ml-2">
                  Loading more...
                </Text>
              </View>
            ) : (
              <Text className="text-black font-semibold text-center">
                Load More
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return <View className="mb-20" />;
  }, [hasMore, isLoadingMore, allFoods.length, handleLoadMore]);

  if (
    (isLoading && offset === 0) ||
    (!hasLoadedOnce && allFoods.length === 0)
  ) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={["#e5e7eb", "#f4f4f4"]}
          locations={[0, 0.7]}
          className="flex-1"
        >
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center px-6 py-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-3 p-2 -ml-2"
              >
                <MaterialIcons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900">
                Food History
              </Text>
            </View>
            <View className="flex-1 px-6">
              <View className="bg-white rounded-2xl p-8 shadow-sm">
                <ActivityIndicator size="large" color="#000" />
                <Text className="text-gray-500 text-center mt-4">
                  Loading your food history...
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={["#e5e7eb", "#f4f4f4"]}
          locations={[0, 0.7]}
          className="flex-1"
        >
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center px-6 py-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-3 p-2 -ml-2"
              >
                <MaterialIcons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900">
                Food History
              </Text>
            </View>
            <View className="flex-1 px-6">
              <View className="bg-white rounded-2xl p-6 shadow-sm">
                <Text className="text-red-500 text-center mb-2">
                  Failed to load food history
                </Text>
                <Text className="text-gray-500 text-center mb-4">
                  Please try again later
                </Text>
                <TouchableOpacity
                  onPress={handleRetry}
                  className="bg-black rounded-2xl py-3"
                >
                  <Text className="text-white font-semibold text-center">
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (allFoods.length === 0 && hasLoadedOnce && !error) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={["#e5e7eb", "#f4f4f4"]}
          locations={[0, 0.7]}
          className="flex-1"
        >
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center px-6 py-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-3 p-2 -ml-2"
              >
                <MaterialIcons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900">
                Food History
              </Text>
            </View>
            <View className="flex-1 px-6">
              <View className="bg-white rounded-2xl p-8 shadow-sm">
                <Text className="text-gray-500 text-center mb-2">
                  No food history available
                </Text>
                <Text className="text-gray-400 text-center text-sm">
                  Start by taking a photo of your meal!
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#e5e7eb", "#f4f4f4"]}
        locations={[0, 0.7]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center px-6 py-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
            >
              <MaterialIcons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">
              Food History
            </Text>
          </View>

          {/* Content with SectionList */}
          <SectionList
            sections={sectionData}
            renderItem={renderMealItem}
            renderSectionHeader={renderSectionHeader}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            // Performance optimizations
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            updateCellsBatchingPeriod={100}
            getItemLayout={undefined} // Let SectionList handle this
            stickySectionHeadersEnabled={false}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
