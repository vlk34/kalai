"use client";
import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUserProfile,
  useRecalculateTargets,
  useUserProfileData,
} from "@/hooks/useUserProfile";
import { useRouter } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const SettingsScreen = () => {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const { data: userProfile, isLoading: isLoadingProfile } =
    useUserProfileData();
  const recalculateTargetsMutation = useRecalculateTargets();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isNavigatingToEditProfile, setIsNavigatingToEditProfile] =
    useState(false);

  // Use fetched data directly
  const displayUserProfile = userProfile;

  // Formatting functions
  const formatGender = (gender?: string) => {
    if (!gender || typeof gender !== "string") return "Not set";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const formatActivityLevel = (level?: string) => {
    if (!level || typeof level !== "string") return "Not set";
    return level
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatGoal = (goal?: string) => {
    if (!goal || typeof goal !== "string") return "Not set";
    const formattedGoal = goal
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    // Special case formatting for specific goals
    switch (formattedGoal.toLowerCase()) {
      case "lose weight":
        return "Weight Loss";
      case "gain weight":
        return "Weight Gain";
      case "maintain weight":
        return "Weight Maintenance";
      default:
        return formattedGoal;
    }
  };

  // Sample user data from onboarding (fallback)
  const [userInfo, setUserInfo] = useState({
    age: 28,
    height: 175, // cm
    currentWeight: 75.5, // kg
  });

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            await GoogleSignin.signOut();
            // Navigation will be handled automatically by AuthContext
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const handleRecalculateTargets = async () => {
    Alert.alert(
      "Recalculate Daily Targets",
      "This will update your daily nutrition targets based on your current profile. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Recalculate",
          onPress: async () => {
            try {
              await recalculateTargetsMutation.mutateAsync();
              Alert.alert(
                "Success",
                "Your daily targets have been recalculated!"
              );
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to recalculate targets. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = async (updatedProfile: any) => {
    try {
      // First update the profile in the database
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_PRODUCTION_API_URL}/user_profiles`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedProfile),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Then recalculate the targets
      await recalculateTargetsMutation.mutateAsync();
      setIsEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const navigateToEditProfile = useCallback(() => {
    if (isNavigatingToEditProfile) return; // Prevent multiple rapid clicks

    setIsNavigatingToEditProfile(true);

    // Add a small delay to prevent rapid navigation
    setTimeout(() => {
      router.push("/edit-profile");
      // Reset the flag after navigation
      setTimeout(() => setIsNavigatingToEditProfile(false), 500);
    }, 100);
  }, [isNavigatingToEditProfile]);

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
  }) => {
    // Ensure value is always a valid string or number
    const displayValue =
      value !== undefined && value !== null ? String(value) : "";

    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between py-4 px-6 border-b border-gray-100"
        disabled={!onPress}
      >
        <Text className="text-gray-900 font-medium text-base">{title}</Text>
        <View className="flex-row items-center">
          {displayValue && (
            <Text className="text-gray-600 mr-2">
              {displayValue} {unit}
            </Text>
          )}
          {showArrow && (
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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

          {/* Profile Information */}
          <SectionHeader title="Profile Information" />
          <View className="bg-white">
            {isLoadingProfile ? (
              <View className="px-6 py-4">
                <Text className="text-gray-500">Loading profile...</Text>
              </View>
            ) : displayUserProfile ? (
              <>
                <SettingRow
                  title="Gender"
                  value={formatGender(displayUserProfile.gender)}
                  showArrow={false}
                />
                <SettingRow
                  title="Date of Birth"
                  value={
                    displayUserProfile.date_of_birth
                      ? new Date(
                          displayUserProfile.date_of_birth
                        ).toLocaleDateString()
                      : "Not set"
                  }
                  showArrow={false}
                />
                <SettingRow
                  title="Height"
                  value={displayUserProfile.height_value || 0}
                  unit={
                    displayUserProfile.height_unit === "metric" ? "cm" : "ft"
                  }
                  showArrow={false}
                />
                <SettingRow
                  title="Weight"
                  value={displayUserProfile.weight_value || 0}
                  unit={
                    displayUserProfile.weight_unit === "metric" ? "kg" : "lbs"
                  }
                  showArrow={false}
                />
                <SettingRow
                  title="Goal"
                  value={formatGoal(displayUserProfile.main_goal)}
                  showArrow={false}
                />
                <SettingRow
                  title="Activity Level"
                  value={formatActivityLevel(displayUserProfile.activity_level)}
                  showArrow={false}
                />
                <TouchableOpacity
                  onPress={navigateToEditProfile}
                  className="flex-row items-center justify-between py-4 px-6 border-b border-gray-300 bg-gray-50"
                >
                  <Text className="text-blue-600 font-medium text-base">
                    Edit Profile Information
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color="#2563EB" />
                </TouchableOpacity>
              </>
            ) : (
              <View className="px-6 py-4">
                <Text className="text-gray-500">No profile found</Text>
              </View>
            )}
          </View>

          {/* Daily Targets */}
          {displayUserProfile && (
            <>
              <SectionHeader title="Daily Targets" />
              <View className="bg-white">
                <SettingRow
                  title="Calories"
                  value={displayUserProfile.daily_calories || 0}
                  unit="cal"
                  showArrow={false}
                />
                <SettingRow
                  title="Protein"
                  value={Math.round(displayUserProfile.daily_protein_g || 0)}
                  unit="g"
                  showArrow={false}
                />
                <SettingRow
                  title="Carbs"
                  value={Math.round(displayUserProfile.daily_carbs_g || 0)}
                  unit="g"
                  showArrow={false}
                />
                <SettingRow
                  title="Fats"
                  value={Math.round(displayUserProfile.daily_fats_g || 0)}
                  unit="g"
                  showArrow={false}
                />
              </View>
            </>
          )}

          {/* Streak Information */}
          {displayUserProfile?.streak !== undefined && (
            <>
              <SectionHeader title="Streak Information" />
              <View className="bg-white">
                <SettingRow
                  title="Current Streak"
                  value={displayUserProfile?.streak || 0}
                  unit="days"
                  showArrow={false}
                />
                <SettingRow
                  title="Daily Goal"
                  value={displayUserProfile?.daily_calories || 0}
                  unit="calories"
                  showArrow={false}
                />
                {displayUserProfile?.streak_history &&
                  Array.isArray(displayUserProfile.streak_history) &&
                  displayUserProfile.streak_history.length > 0 && (
                    <SettingRow
                      title="Streak History"
                      value={`${displayUserProfile.streak_history.length} days achieved`}
                      showArrow={false}
                    />
                  )}
              </View>
            </>
          )}

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
              title="Reminders"
              onPress={() =>
                Alert.alert(
                  "Reminders",
                  "Set meal and weight tracking reminders"
                )
              }
            />
          </View>

          {/* Health Integration
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
          </View> */}

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
            <TouchableOpacity
              onPress={handleSignOut}
              className="flex-row items-center justify-between py-4 px-6 border-b border-gray-100"
            >
              <Text className="text-red-500 font-medium text-base">
                Sign Out
              </Text>
              <IconSymbol name="chevron.right" size={16} color="#EF4444" />
            </TouchableOpacity>
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
};

export default SettingsScreen;
