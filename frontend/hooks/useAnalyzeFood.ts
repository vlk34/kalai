import { useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

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
  analyzeFood: (imageUri: string) => Promise<ServerResponse>;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_PRODUCTION_API_URL;

export function useAnalyzeFood(): AnalyzeFoodResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<NutritionAnalysis | null>(null);
  const { session } = useAuth();

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

  const analyzeFood = async (imageUri: string): Promise<ServerResponse> => {
    setIsAnalyzing(true);
    try {
      const result = await uploadPhotoToAPI(imageUri);
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
