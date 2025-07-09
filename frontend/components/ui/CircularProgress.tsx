import type React from "react";
import { View, Text, Animated } from "react-native";
import { Flame } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useEffect, useRef, useMemo } from "react";

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
  const animatedValue = useRef(new Animated.Value(0)).current;

  const circleData = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    return { radius, circumference };
  }, [size, strokeWidth]);

  // Animate when percentage changes
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 500, // Further reduced for smoother performance
      useNativeDriver: false, // SVG requires JS thread
    }).start();
  }, [percentage]);

  // Create animated stroke dash offset
  const animatedStrokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circleData.circumference, 0],
    extrapolate: "clamp",
  });

  // Create animated percentage display
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={circleData.radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={circleData.radius}
          stroke="#f97316"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circleData.circumference}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

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
