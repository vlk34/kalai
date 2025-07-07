import { useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { createImageFormData, ProcessedImage } from "@/utils/imageProcessor";

interface NutritionAnalysis {
  name?: string;
  emoji?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface ServerResponse {
  success: boolean;
  message: string;
  data: {
    file_info: {
      original_filename: string;
      unique_filename: string;
      file_size: number;
      file_type: string;
      user_id: string;
      uploaded_at: string;
      storage_path: string;
      photo_url: string;
    };
    nutritional_analysis: NutritionAnalysis;
    database_record: {
      id: string;
      name: string;
      emoji: string;
      protein: number;
      carbs: number;
      fats: number;
      calories: number;
      created_at: string;
      photo_path: string;
    };
  };
}

interface AnalyzeFoodResult {
  isAnalyzing: boolean;
  analysisResult: NutritionAnalysis | null;
  analyzeFood: (
    imageUri: string,
    source?: "camera" | "gallery"
  ) => Promise<ServerResponse>;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

export function useAnalyzeFood(): AnalyzeFoodResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<NutritionAnalysis | null>(null);
  const { session } = useAuth();

  const uploadPhotoToAPI = async (
    imageUri: string,
    source: "camera" | "gallery" = "camera"
  ) => {
    if (!session?.access_token) {
      Alert.alert("Error", "You must be logged in to analyze food.");
      return null;
    }

    try {
      // Process image on frontend for optimal upload performance
      const { formData, processedImage } = await createImageFormData(imageUri, {
        format: "webp",
        quality: source === "camera" ? 0.4 : 0.5, // Slightly more compression for camera images
        maxWidth: source === "camera" ? 1280 : 1600,
        maxHeight: source === "camera" ? 1280 : 1600,
      });

      console.log(
        `Image processed: ${Math.round(processedImage.size / 1024)}KB (${processedImage.width}x${processedImage.height})`
      );

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

  const analyzeFood = async (
    imageUri: string,
    source: "camera" | "gallery" = "camera"
  ): Promise<ServerResponse> => {
    setIsAnalyzing(true);
    try {
      const result = await uploadPhotoToAPI(imageUri, source);
      if (result && result.data && result.data.nutritional_analysis) {
        const analysis = result.data.nutritional_analysis;
        setAnalysisResult(analysis);
        return result;
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Food analysis error:", error);
      Alert.alert(
        "Analysis Failed",
        error instanceof Error
          ? error.message
          : "Failed to analyze food. Please try again."
      );
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzeFood,
  };
}
