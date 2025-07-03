"use client";

import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAuth } from "@/contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

// Backend API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

interface NutritionAnalysis {
  name?: string;
  emoji?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<NutritionAnalysis | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { session } = useAuth();

  // Reset states when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setShowResults(false);
      setCapturedPhoto(null);
      setAnalysisResult(null);
      setIsAnalyzing(false);
      setIsCameraReady(false);

      // Small delay to ensure camera initializes properly
      const timer = setTimeout(() => {
        setIsCameraReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={["#ffffff", "#f8fafc"]} className="flex-1">
        <SafeAreaView className="flex-1 justify-center items-center">
          <View className="items-center px-8">
            <View className="bg-gray-100 rounded-full p-6 mb-6">
              <FontAwesome name="camera" size={48} color="#000" />
            </View>
            <Text className="text-2xl font-bold mb-4 text-center text-gray-900">
              Camera Access Needed
            </Text>
            <Text className="text-center mb-8 text-gray-600 leading-6">
              Kal AI needs camera access to analyze your meals and provide
              accurate nutrition information.
            </Text>
            <TouchableOpacity
              className="bg-black rounded-2xl px-8 py-4 shadow-sm"
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
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          setCapturedPhoto(photo.uri);
          analyzeFood(photo.uri);
        }
      } catch (error) {
        console.error("Camera error:", error);
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
      setCapturedPhoto(result.assets[0].uri);
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
        setAnalysisResult(analysis);
        setIsAnalyzing(false);
        setShowResults(true);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      setIsAnalyzing(false);
      setCapturedPhoto(null); // Reset photo on error
      console.error("Food analysis error:", error);
      Alert.alert(
        "Analysis Failed",
        error instanceof Error
          ? error.message
          : "Failed to analyze food. Please try again."
      );
    }
  };

  const handleAddToLog = () => {
    setShowResults(false);
    setCapturedPhoto(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    router.back();
  };

  const handleTakeAnother = () => {
    setShowResults(false);
    setCapturedPhoto(null);
    setAnalysisResult(null);
  };

  // Show loading while camera initializes
  if (!isCameraReady && !capturedPhoto) {
    return (
      <View style={styles.container}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Initializing camera...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Show captured photo when analyzing or showing results, otherwise show camera */}
      {capturedPhoto && (isAnalyzing || showResults) ? (
        <Image
          source={{ uri: capturedPhoto }}
          style={styles.camera}
          resizeMode="cover"
        />
      ) : (
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        >
          {/* Camera viewfinder frames - only show when camera is active */}
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

          {/* Instructions text - only show when camera is active */}
          <View className="absolute bottom-72 left-0 right-0 px-8 pointer-events-none">
            <Text className="text-white text-center text-sm opacity-80">
              Position your meal within the frame
            </Text>
          </View>
        </CameraView>
      )}

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
          {/* Only show camera flip button when camera is active */}
          {!capturedPhoto && (
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
          )}
          {capturedPhoto && <View className="w-10 h-10" />}
        </View>
      </SafeAreaView>

      {/* Modern Loading overlay */}
      {isAnalyzing && (
        <View className="absolute inset-0 bg-black/30 bg-opacity-80 justify-center items-center">
          <View className="bg-white rounded-3xl p-8 mx-8 items-center max-w-sm">
            <View className="mb-6">
              <ActivityIndicator size="large" color="#000" />
            </View>
            <Text className="text-xl font-bold text-center mb-3 text-black">
              Analyzing Meal
            </Text>
            <Text className="text-center text-gray-600 text-base leading-6">
              Processing nutrition information...
            </Text>
          </View>
        </View>
      )}

      {/* Bottom controls - only show when camera is active */}
      {!capturedPhoto && isCameraReady && (
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
              disabled={isAnalyzing || !isCameraReady}
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
      )}

      {/* Results Modal */}
      <Modal visible={showResults} transparent animationType="slide">
        <View className="flex-1 bg-black/30 bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-96">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-2xl font-bold text-black mb-2">
                Meal Analyzed
              </Text>
              <Text className="text-gray-600 text-center">
                Here's what we found in your photo
              </Text>
            </View>

            {/* Food Info */}
            {analysisResult && (
              <View className="mb-6">
                <View className="flex-row items-center justify-center mb-4">
                  <Text className="text-3xl mr-3">
                    {analysisResult.emoji || "🍽️"}
                  </Text>
                  <Text className="text-xl font-semibold text-black">
                    {analysisResult.name || "Unknown Food"}
                  </Text>
                </View>

                {/* Nutrition Grid */}
                <View className="bg-gray-50 rounded-2xl p-4">
                  <Text className="text-sm font-medium text-gray-600 mb-3 text-center">
                    NUTRITION BREAKDOWN
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.calories || 0)}
                      </Text>
                      <Text className="text-xs text-gray-600">Calories</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.protein || 0)}g
                      </Text>
                      <Text className="text-xs text-gray-600">Protein</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.carbs || 0)}g
                      </Text>
                      <Text className="text-xs text-gray-600">Carbs</Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-lg font-bold text-black">
                        {Math.round(analysisResult.fats || 0)}g
                      </Text>
                      <Text className="text-xs text-gray-600">Fat</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleTakeAnother}
                className="flex-1 bg-gray-100 rounded-2xl py-4 items-center"
              >
                <Text className="text-black font-semibold">Take Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddToLog}
                className="flex-1 bg-black rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-semibold">Add to Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
