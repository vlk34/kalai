"use client";

import { View } from "react-native";

// This screen should not be reached in normal flow
// All navigation logic is handled in _layout.tsx
export default function IndexScreen() {
  return <View className="flex-1 bg-white" />;
}
