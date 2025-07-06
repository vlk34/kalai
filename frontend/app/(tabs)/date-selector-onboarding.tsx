"use client";
import { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";

interface DateSelectorProps {
  currentDate?: Date;
  onDateChange: (date: Date) => void;
}

const DateSelectorOnboarding = ({
  currentDate,
  onDateChange,
}: DateSelectorProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
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
  const parseDate = (date?: Date) => {
    if (date) {
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

  const initialDate = parseDate(currentDate);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [hasScrolled, setHasScrolled] = useState(false);

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  const itemHeight = 40;
  const centerOffset = 80;

  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  // Set initial values only once on mount
  useEffect(() => {
    if (currentDate && !hasScrolled) {
      const parsed = parseDate(currentDate);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);

      setTimeout(() => {
        const yearIndex = years.indexOf(parsed.year);
        const monthIndex = parsed.month;
        const dayIndex = parsed.day - 1;

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
    } else if (!currentDate && !hasScrolled) {
      // Set default date and scroll to it
      const defaultYear = 1990;
      const defaultMonth = 0;
      const defaultDay = 1;

      setSelectedYear(defaultYear);
      setSelectedMonth(defaultMonth);
      setSelectedDay(defaultDay);

      setTimeout(() => {
        const yearIndex = years.indexOf(defaultYear);
        const monthIndex = defaultMonth;
        const dayIndex = defaultDay - 1;

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
    }
  }, [currentDate]);

  // Update days when year or month changes
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth]);

  // Update parent when date changes
  useEffect(() => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    onDateChange(newDate);
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleYearScroll = (event: any) => {
    setHasScrolled(true);
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const year = years[index];
    if (year && year !== selectedYear) {
      setSelectedYear(year);
    }
  };

  const handleMonthScroll = (event: any) => {
    setHasScrolled(true);
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    if (index >= 0 && index < months.length && index !== selectedMonth) {
      setSelectedMonth(index);
    }
  };

  const handleDayScroll = (event: any) => {
    setHasScrolled(true);
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const day = days[index];
    if (day && day !== selectedDay) {
      setSelectedDay(day);
    }
  };

  const getItemOpacity = (index: number, currentIndex: number) => {
    const distance = Math.abs(index - currentIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.7;
    if (distance === 2) return 0.4;
    return 0.2;
  };

  return (
    <View
      className="bg-white border border-gray-200 rounded-2xl"
      style={{ height: 160 }}
    >
      <View className="flex-1 relative">
        {/* Center Selection Indicator Lines */}
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
              nestedScrollEnabled={true}
            >
              {months.map((month, index) => (
                <View
                  key={month}
                  className="items-center justify-center"
                  style={{ height: itemHeight }}
                >
                  <Text
                    className={`text-sm ${
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
              nestedScrollEnabled={true}
            >
              {days.map((day, index) => (
                <View
                  key={day}
                  className="items-center justify-center"
                  style={{ height: itemHeight }}
                >
                  <Text
                    className={`text-sm ${
                      day === selectedDay
                        ? "font-bold text-black"
                        : "font-normal text-gray-600"
                    }`}
                    style={{
                      opacity: getItemOpacity(index, selectedDay - 1),
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
              nestedScrollEnabled={true}
            >
              {years.map((year, index) => (
                <View
                  key={year}
                  className="items-center justify-center"
                  style={{ height: itemHeight }}
                >
                  <Text
                    className={`text-sm ${
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

        {/* Current Selection Display
        <View className="absolute bottom-2 left-0 right-0 items-center">
          <View className="bg-black/80 rounded-xl px-4 py-2">
            <Text className="text-white font-semibold text-sm">
              {months[selectedMonth].substring(0, 3)} {selectedDay},{" "}
              {selectedYear}
            </Text>
          </View>
        </View> */}
      </View>
    </View>
  );
};

export default DateSelectorOnboarding;
