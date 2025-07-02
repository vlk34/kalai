"use client";

import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAuth } from "@/contexts/AuthContext";

// Backend API configuration
const API_BASE_URL = "http://192.168.1.145:5000";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { session } = useAuth();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={["#ffffff", "#f8fafc"]} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center">
          <View className="items-center px-8">
            <View className="bg-green-100 rounded-full p-6 mb-6">
              <FontAwesome name="camera" size={48} color="#10b981" />
            </View>
            <Text className="text-2xl font-bold mb-4 text-center text-gray-900">
              Camera Access Needed
            </Text>
            <Text className="text-center mb-8 text-gray-600 leading-6">
              Kal AI needs camera access to analyze your meals and provide
              accurate nutrition information.
            </Text>
            <TouchableOpacity
              className="bg-green-500 rounded-2xl px-8 py-4 shadow-sm"
              onPress={requestPermission}
            >
              <Text className="text-white font-semibold text-lg">
                Enable Camera
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          analyzeFood(photo.uri);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to capture photo. Please try again.");
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      analyzeFood(result.assets[0].uri);
    }
  };

  const uploadPhotoToAPI = async (imageUri: string) => {
    if (!session?.access_token) {
      Alert.alert("Error", "You must be logged in to analyze food.");
      return null;
    }

    try {
      const formData = new FormData();
      const uriParts = imageUri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      formData.append("photo", {
        uri: imageUri,
        type: `image/${fileType}`,
        name: `photo.${fileType}`,
      } as any);

      const response = await fetch(`${API_BASE_URL}/consumed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to analyze food"
        );
      }

      return result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const analyzeFood = async (imageUri: string) => {
    setIsAnalyzing(true);

    try {
      const result = await uploadPhotoToAPI(imageUri);

      if (result && result.data && result.data.nutritional_analysis) {
        const analysis = result.data.nutritional_analysis;

        const nutritionText = `${analysis.emoji || "🍽️"} ${analysis.name || "Unknown Food"}\n\n📊 Nutrition Breakdown:\n• Calories: ${Math.round(analysis.calories || 0)}\n• Protein: ${Math.round(analysis.protein || 0)}g\n• Carbs: ${Math.round(analysis.carbs || 0)}g\n• Fat: ${Math.round(analysis.fats || 0)}g`;

        setIsAnalyzing(false);

        Alert.alert("🍽️ Meal Analyzed!", nutritionText, [
          {
            text: "Take Another",
            style: "cancel",
          },
          {
            text: "Add to Log",
            onPress: () => {
              router.back();
              setTimeout(() => {
                Alert.alert(
                  "✅ Success!",
                  "Meal added to your daily nutrition log!"
                );
              }, 500);
            },
          },
        ]);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      setIsAnalyzing(false);
      console.error("Food analysis error:", error);

      Alert.alert(
        "Analysis Failed",
        error instanceof Error
          ? error.message
          : "Failed to analyze food. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header overlay */}
        <SafeAreaView className="absolute top-0 left-0 right-0">
          <View className="flex-row justify-between items-center p-4">
            <TouchableOpacity
              className="w-10 h-10 justify-center items-center"
              onPress={() => router.back()}
            >
              <IconSymbol name="xmark" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-lg font-semibold">Photo</Text>

            <TouchableOpacity
              className="w-10 h-10 justify-center items-center"
              onPress={toggleCameraFacing}
            >
              <IconSymbol
                name="arrow.triangle.2.circlepath.camera"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Camera viewfinder frames */}
        <View className="absolute inset-0 justify-center items-center pointer-events-none mb-20">
          <View className="relative w-80 h-80">
            {/* Top left corner */}
            <View className="absolute top-0 left-0 w-6 h-6">
              <View className="absolute top-0 left-0 w-6 h-1 bg-white rounded-full" />
              <View className="absolute top-0 left-0 w-1 h-6 bg-white rounded-full" />
            </View>

            {/* Top right corner */}
            <View className="absolute top-0 right-0 w-6 h-6">
              <View className="absolute top-0 right-0 w-6 h-1 bg-white rounded-full" />
              <View className="absolute top-0 right-0 w-1 h-6 bg-white rounded-full" />
            </View>

            {/* Bottom left corner */}
            <View className="absolute bottom-0 left-0 w-6 h-6">
              <View className="absolute bottom-0 left-0 w-6 h-1 bg-white rounded-full" />
              <View className="absolute bottom-0 left-0 w-1 h-6 bg-white rounded-full" />
            </View>

            {/* Bottom right corner */}
            <View className="absolute bottom-0 right-0 w-6 h-6">
              <View className="absolute bottom-0 right-0 w-6 h-1 bg-white rounded-full" />
              <View className="absolute bottom-0 right-0 w-1 h-6 bg-white rounded-full" />
            </View>
          </View>
        </View>

        {/* Loading overlay */}
        {isAnalyzing && (
          <View className="absolute inset-0 bg-black bg-opacity-60 justify-center items-center">
            <View className="bg-white rounded-3xl p-8 mx-6 items-center">
              <View className="bg-green-100 rounded-full p-4 mb-4">
                <Text className="text-3xl">🤖</Text>
              </View>
              <Text className="text-xl font-bold text-center mb-3 text-gray-900">
                Analyzing Your Meal
              </Text>
              <Text className="text-center text-gray-600 leading-5">
                AI is identifying ingredients and calculating precise nutrition
                values...
              </Text>
            </View>
          </View>
        )}

        {/* Bottom controls */}
        <SafeAreaView className="absolute bottom-0 left-0 right-0">
          <View className="flex-row justify-between items-center px-8 pb-8">
            {/* Gallery button */}
            <TouchableOpacity
              className="w-12 h-12 rounded-lg justify-center items-center border border-white border-opacity-30"
              onPress={pickImage}
            >
              <FontAwesome name="photo" size={24} color="white" />
            </TouchableOpacity>

            {/* Capture button */}
            <TouchableOpacity
              className="w-20 h-20 justify-center items-center"
              onPress={takePicture}
              disabled={isAnalyzing}
            >
              <View className="w-20 h-20 bg-white rounded-full justify-center items-center">
                <View className="w-16 h-16 bg-white rounded-full border-2" />
              </View>
            </TouchableOpacity>

            {/* Camera flip button */}
            <TouchableOpacity
              className="w-12 h-12 rounded-full justify-center items-center border border-white border-opacity-30"
              onPress={toggleCameraFacing}
            >
              <FontAwesome6 name="camera-rotate" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Instructions text */}
        <View className="absolute bottom-72 left-0 right-0 px-8 pointer-events-none">
          <Text className="text-white text-center text-sm opacity-80">
            Position your meal within the frame
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
});
