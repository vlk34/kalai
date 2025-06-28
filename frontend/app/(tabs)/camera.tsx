import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, Image } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { router } from "expo-router";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        className={`flex-1 justify-center items-center ${colorScheme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <View className="items-center px-6">
          <IconSymbol
            name="camera.fill"
            size={64}
            color={colorScheme === "dark" ? "white" : "black"}
          />
          <Text
            className={`text-xl font-bold mb-4 text-center ${colorScheme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            Camera Permission Required
          </Text>
          <Text
            className={`text-center mb-6 ${colorScheme === "dark" ? "text-gray-300" : "text-gray-600"}`}
          >
            We need access to your camera to help you track your meals and
            analyze calories.
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-2xl px-6 py-3"
            onPress={requestPermission}
          >
            <Text className="text-white font-semibold">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          setCapturedImage(photo.uri);
          analyzeFood(photo.uri);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
      analyzeFood(result.assets[0].uri);
    }
  };

  const analyzeFood = async (imageUri: string) => {
    setIsAnalyzing(true);

    // Simulate AI analysis - in a real app, you'd send this to your backend
    setTimeout(() => {
      setIsAnalyzing(false);
      Alert.alert(
        "Meal Analyzed! 🍽️",
        "Grilled chicken breast with vegetables\n\nEstimated: 450 calories\nProtein: 35g\nCarbs: 12g\nFat: 8g",
        [
          { text: "Retake", onPress: () => setCapturedImage(null) },
          {
            text: "Add to Log",
            onPress: () => {
              setCapturedImage(null);
              router.push("/(tabs)");
              Alert.alert("Success", "Meal added to your daily log!");
            },
          },
        ]
      );
    }, 2000);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (capturedImage) {
    return (
      <SafeAreaView
        className={`flex-1 ${colorScheme === "dark" ? "bg-gray-900" : "bg-black"}`}
      >
        <View className="flex-1">
          <Image
            source={{ uri: capturedImage }}
            className="flex-1"
            resizeMode="contain"
          />

          {isAnalyzing && (
            <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
              <View
                className={`rounded-3xl p-6 mx-4 ${colorScheme === "dark" ? "bg-gray-800" : "bg-white"}`}
              >
                <Text
                  className={`text-xl font-bold text-center mb-4 ${colorScheme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  🤖 Analyzing your meal...
                </Text>
                <Text
                  className={`text-center ${colorScheme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                >
                  AI is identifying ingredients and calculating nutrition
                </Text>
              </View>
            </View>
          )}

          {!isAnalyzing && (
            <View className="absolute bottom-10 left-0 right-0 flex-row justify-center space-x-6">
              <TouchableOpacity
                className="bg-gray-600 rounded-full p-4"
                onPress={() => setCapturedImage(null)}
              >
                <IconSymbol name="xmark" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-primary rounded-full p-4"
                onPress={() => analyzeFood(capturedImage)}
              >
                <IconSymbol name="checkmark" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        className="flex-1"
        facing={facing}
        style={{ flex: 1 }}
      />

      <View className="absolute inset-0">
        <SafeAreaView>
          <View className="flex-row justify-between items-center p-4 pt-2">
            <TouchableOpacity
              className="bg-black bg-opacity-50 rounded-full p-3"
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={24} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-lg font-semibold">Add Meal</Text>

            <TouchableOpacity
              className="bg-black bg-opacity-50 rounded-full p-3"
              onPress={toggleCameraFacing}
            >
              <IconSymbol name="camera.rotate.fill" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View className="flex-1 justify-center items-center">
          <View className="border-2 border-white border-dashed rounded-3xl w-80 h-80 justify-center items-center">
            <IconSymbol name="camera.fill" size={40} color="white" />
            <Text className="text-white text-center mt-4 px-4">
              Position your meal in the frame for best results
            </Text>
          </View>
        </View>

        <SafeAreaView className="absolute bottom-0 left-0 right-0">
          <View className="flex-row justify-center items-center pb-10 px-4">
            <View className="flex-row items-center space-x-8">
              <TouchableOpacity
                className="bg-white bg-opacity-20 rounded-full p-4"
                onPress={pickImage}
              >
                <IconSymbol name="photo.on.rectangle" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white rounded-full p-1"
                onPress={takePicture}
              >
                <View className="bg-primary rounded-full w-16 h-16 justify-center items-center">
                  <IconSymbol name="camera.fill" size={32} color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity className="bg-white bg-opacity-20 rounded-full p-4">
                <IconSymbol name="bolt.slash.fill" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
