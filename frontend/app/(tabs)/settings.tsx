"use client";

import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function SettingsScreen() {
  // Sample user data from onboarding
  const [userInfo, setUserInfo] = useState({
    age: 28,
    height: 175, // cm
    currentWeight: 75.5, // kg
  });

  const handleEditValue = (
    field: string,
    currentValue: number,
    unit: string
  ) => {
    Alert.prompt(
      `Edit ${field}`,
      `Enter your ${field.toLowerCase()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (value) => {
            if (value && !isNaN(Number(value))) {
              setUserInfo((prev) => ({
                ...prev,
                [field.toLowerCase().replace(" ", "")]: Number(value),
              }));
            }
          },
        },
      ],
      "plain-text",
      currentValue.toString()
    );
  };

  const SettingRow = ({
    title,
    value,
    unit = "",
    onPress,
    showArrow = true,
    isEditable = false,
  }: {
    title: string;
    value?: string | number;
    unit?: string;
    onPress?: () => void;
    showArrow?: boolean;
    isEditable?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-6 border-b border-gray-100"
      disabled={!onPress}
    >
      <Text className="text-gray-900 font-medium text-base">{title}</Text>
      <View className="flex-row items-center">
        {value && (
          <Text className="text-gray-600 mr-2">
            {value} {unit}
          </Text>
        )}
        {showArrow && (
          <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-lg font-semibold text-gray-900 px-6 pt-8 pb-4">
      {title}
    </Text>
  );

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 py-6 border-b border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">Settings</Text>
          </View>

          {/* Basic Information */}
          <View className="mt-6">
            <SettingRow
              title="Age"
              value={userInfo.age}
              unit="years"
              onPress={() => handleEditValue("age", userInfo.age, "years")}
              isEditable
            />
            <SettingRow
              title="Height"
              value={userInfo.height}
              unit="cm"
              onPress={() => handleEditValue("height", userInfo.height, "cm")}
              isEditable
            />
            <SettingRow
              title="Current Weight"
              value={userInfo.currentWeight}
              unit="kg"
              onPress={() =>
                handleEditValue("currentWeight", userInfo.currentWeight, "kg")
              }
              isEditable
            />
          </View>

          {/* Customizations */}
          <SectionHeader title="Customizations" />
          <View className="bg-white">
            <SettingRow
              title="Personal Details"
              onPress={() =>
                Alert.alert(
                  "Personal Details",
                  "Edit your personal information"
                )
              }
            />
            <SettingRow
              title="Adjust Goals"
              onPress={() =>
                Alert.alert(
                  "Adjust Goals",
                  "Modify your fitness and nutrition goals"
                )
              }
            />
          </View>

          {/* Preferences */}
          <SectionHeader title="Preferences" />
          <View className="bg-white">
            <SettingRow
              title="Notifications"
              onPress={() =>
                Alert.alert(
                  "Notifications",
                  "Manage your notification preferences"
                )
              }
            />
            <SettingRow
              title="Units"
              value="Metric"
              onPress={() =>
                Alert.alert("Units", "Switch between Metric and Imperial units")
              }
            />
            <SettingRow
              title="Language"
              value="English"
              onPress={() => Alert.alert("Language", "Change app language")}
            />
            <SettingRow
              title="Reminders"
              onPress={() =>
                Alert.alert(
                  "Reminders",
                  "Set meal and weight tracking reminders"
                )
              }
            />
            {/* <SettingRow
              title="Data Sync"
              onPress={() =>
                Alert.alert("Data Sync", "Manage data synchronization settings")
              }
            /> */}
          </View>

          {/* Health Integration */}
          <SectionHeader title="Health Integration" />
          <View className="bg-white">
            <SettingRow
              title="Apple Health"
              onPress={() =>
                Alert.alert("Apple Health", "Connect with Apple Health app")
              }
            />
            <SettingRow
              title="Google Fit"
              onPress={() =>
                Alert.alert("Google Fit", "Connect with Google Fit")
              }
            />
            <SettingRow
              title="Export Data"
              onPress={() =>
                Alert.alert("Export Data", "Export your nutrition data")
              }
            />
          </View>

          {/* Account */}
          <SectionHeader title="Account" />
          <View className="bg-white">
            <SettingRow
              title="Delete Account"
              onPress={() =>
                Alert.alert(
                  "Delete Account",
                  "Are you sure you want to delete your account? This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive" },
                  ]
                )
              }
            />
          </View>

          {/* Legal */}
          <SectionHeader title="Legal" />
          <View className="bg-white">
            <SettingRow
              title="Terms and Conditions"
              onPress={() =>
                Alert.alert(
                  "Terms and Conditions",
                  "View our terms and conditions"
                )
              }
            />
            <SettingRow
              title="Privacy Policy"
              onPress={() =>
                Alert.alert("Privacy Policy", "View our privacy policy")
              }
            />
            <SettingRow
              title="Support"
              value="help@kalai.com"
              onPress={() =>
                Alert.alert(
                  "Support",
                  "Contact our support team at help@kalai.com"
                )
              }
            />
            <SettingRow
              title="Rate Kal AI"
              onPress={() =>
                Alert.alert("Rate Kal AI", "Rate us on the App Store")
              }
            />
            <SettingRow
              title="Share Feedback"
              onPress={() =>
                Alert.alert(
                  "Share Feedback",
                  "Send us your feedback and suggestions"
                )
              }
            />
          </View>

          {/* App Info */}
          <SectionHeader title="About" />
          <View className="bg-white">
            <SettingRow title="App Version" value="1.0.0" showArrow={false} />
            <SettingRow title="Build Number" value="2024.1" showArrow={false} />
          </View>

          {/* Bottom Spacing */}
          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
