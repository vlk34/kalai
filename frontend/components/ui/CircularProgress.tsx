import type React from "react";
import { View, Text } from "react-native";
import { Flame } from "lucide-react-native";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 80,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Grey background circle */}
      <View
        className="absolute rounded-full bg-gray-100"
        style={{
          width: size,
          height: size,
        }}
      />

      {/* Background progress track */}
      <View
        className="absolute rounded-full border-gray-200"
        style={{
          width: size,
          height: size,
          borderWidth: strokeWidth,
          borderRadius: size / 2,
        }}
      />

      {/* Progress indicator */}
      <View
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          borderWidth: strokeWidth,
          borderColor: "transparent",
          borderTopColor: "#f97316", // orange-500
          borderRadius: size / 2,
          transform: [
            { rotate: "-90deg" },
            { rotate: `${(percentage / 100) * 360 - 90}deg` },
          ],
        }}
      />

      {/* Center content with flame icon */}
      <View className="absolute items-center justify-center">
        <View className="bg-gray-50 rounded-full p-2 mb-1">
          <Flame size={16} color="#f97316" fill="#f97316" />
        </View>
        <Text className="text-xs font-bold text-gray-700">
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
};
