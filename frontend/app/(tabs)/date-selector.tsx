"use client";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSelectorContext } from "@/contexts/SelectorContext";

const DateSelectorScreen = () => {
  const router = useRouter();
  const { currentDate } = useLocalSearchParams();
  const { setSelectorData } = useSelectorContext();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // 100 years back
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Parse current date or use default
  const parseDate = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
      };
    }
    return {
      year: 1990,
      month: 0,
      day: 1,
    };
  };

  const initialDate = parseDate(currentDate as string);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  const screenHeight = Dimensions.get("window").height;
  const itemHeight = 50;
  // Move center position higher up on screen (was screenHeight / 2, now screenHeight / 2.5)
  const centerOffset = screenHeight / 2.5 - itemHeight / 2;

  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to initial values
    setTimeout(() => {
      const yearIndex = years.indexOf(selectedYear);
      const monthIndex = selectedMonth;
      const dayIndex = selectedDay - 1;

      if (yearIndex !== -1) {
        yearScrollRef.current?.scrollTo({
          y: yearIndex * itemHeight,
          animated: false,
        });
      }
      monthScrollRef.current?.scrollTo({
        y: monthIndex * itemHeight,
        animated: false,
      });
      if (dayIndex >= 0) {
        dayScrollRef.current?.scrollTo({
          y: dayIndex * itemHeight,
          animated: false,
        });
      }
    }, 100);
  }, []);

  useEffect(() => {
    // Update days when year or month changes
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth]);

  const handleYearScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const year = years[index];
    if (year && year !== selectedYear) {
      setSelectedYear(year);
    }
  };

  const handleMonthScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    if (index >= 0 && index < months.length && index !== selectedMonth) {
      setSelectedMonth(index);
    }
  };

  const handleDayScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const day = days[index];
    if (day && day !== selectedDay) {
      setSelectedDay(day);
    }
  };

  const handleSave = () => {
    // Format date as YYYY-MM-DD
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    // Set the selected date in context
    setSelectorData({
      selectedDate: formattedDate,
    });
    // Navigate back
    router.back();
  };

  const getItemOpacity = (index: number, currentIndex: number) => {
    const distance = Math.abs(index - currentIndex);
    if (distance === 0) return 1; // Selected item
    if (distance === 1) return 0.7; // Adjacent items
    if (distance === 2) return 0.4; // Second adjacent items
    return 0.2; // Far items (faded)
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">
            Date of Birth
          </Text>
        </View>

        {/* Date Picker */}
        <View className="flex-1 relative">
          {/* Center Selection Indicator Lines (transparent center) */}
          <View
            className="absolute left-8 right-8 pointer-events-none z-10"
            style={{
              top: centerOffset - 1,
              height: 2,
              backgroundColor: "#E5E7EB",
            }}
          />
          <View
            className="absolute left-8 right-8 pointer-events-none z-10"
            style={{
              top: centerOffset + itemHeight - 1,
              height: 2,
              backgroundColor: "#E5E7EB",
            }}
          />

          {/* Three Column Layout */}
          <View className="flex-1 flex-row">
            {/* Month Column */}
            <View className="flex-1">
              <ScrollView
                ref={monthScrollRef}
                showsVerticalScrollIndicator={false}
                onScroll={handleMonthScroll}
                scrollEventThrottle={16}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingTop: centerOffset,
                  paddingBottom: centerOffset,
                }}
              >
                {months.map((month, index) => (
                  <View
                    key={month}
                    className="items-center justify-center"
                    style={{ height: itemHeight }}
                  >
                    <Text
                      className={`text-lg ${
                        index === selectedMonth
                          ? "font-bold text-black"
                          : "font-normal text-gray-600"
                      }`}
                      style={{
                        opacity: getItemOpacity(index, selectedMonth),
                      }}
                    >
                      {month}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Day Column */}
            <View className="flex-1">
              <ScrollView
                ref={dayScrollRef}
                showsVerticalScrollIndicator={false}
                onScroll={handleDayScroll}
                scrollEventThrottle={16}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingTop: centerOffset,
                  paddingBottom: centerOffset,
                }}
              >
                {days.map((day) => (
                  <View
                    key={day}
                    className="items-center justify-center"
                    style={{ height: itemHeight }}
                  >
                    <Text
                      className={`text-lg ${
                        day === selectedDay
                          ? "font-bold text-black"
                          : "font-normal text-gray-600"
                      }`}
                      style={{
                        opacity: getItemOpacity(day - 1, selectedDay - 1),
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Year Column */}
            <View className="flex-1">
              <ScrollView
                ref={yearScrollRef}
                showsVerticalScrollIndicator={false}
                onScroll={handleYearScroll}
                scrollEventThrottle={16}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingTop: centerOffset,
                  paddingBottom: centerOffset,
                }}
              >
                {years.map((year, index) => (
                  <View
                    key={year}
                    className="items-center justify-center"
                    style={{ height: itemHeight }}
                  >
                    <Text
                      className={`text-lg ${
                        year === selectedYear
                          ? "font-bold text-black"
                          : "font-normal text-gray-600"
                      }`}
                      style={{
                        opacity: getItemOpacity(
                          index,
                          years.indexOf(selectedYear)
                        ),
                      }}
                    >
                      {year}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View className="px-6 py-8">
          <TouchableOpacity
            onPress={handleSave}
            className="bg-black rounded-2xl py-4 flex-row items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default DateSelectorScreen;
