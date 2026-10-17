import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAICredits } from "@/hooks/useAICredits";

export function AICreditsCard() {
  const [description, setDescription] = useState("");
  const { credits, analysis } = useAICredits();

  return (
    <View className="mx-6 my-4 rounded-2xl bg-gray-50 p-5">
      <Text className="text-lg font-semibold text-gray-900">AI credits</Text>
      {credits.isLoading ? (
        <ActivityIndicator className="my-3" />
      ) : credits.error ? (
        <TouchableOpacity onPress={() => credits.refetch()}>
          <Text className="my-3 text-blue-600">Could not load credits. Tap to retry.</Text>
        </TouchableOpacity>
      ) : credits.data ? (
        <>
          <Text className="mt-2 text-gray-600">
            {credits.data.plan === "pro"
              ? "Pro · Unlimited AI actions"
              : `${credits.data.remaining} of ${credits.data.limit} AI actions remaining`}
          </Text>
          <Text className="mt-1 text-xs text-gray-500">
            Free includes 10 actions per calendar month. Pro includes unlimited actions.
            Photo scans, AI edits and meal descriptions share your allowance.
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe a meal, e.g. two eggs and toast"
            accessibilityLabel="Meal description"
            multiline
            className="mt-4 rounded-xl border border-gray-200 bg-white p-3"
          />
          <TouchableOpacity
            disabled={!description.trim() || analysis.isPending}
            onPress={() => analysis.mutate(description)}
            className="mt-3 rounded-xl bg-black p-3"
          >
            <Text className="text-center font-semibold text-white">
              {analysis.isPending ? "Analyzing..." : "Estimate nutrition"}
            </Text>
          </TouchableOpacity>
          {analysis.error && (
            <Text className="mt-3 text-red-600">{analysis.error.message}</Text>
          )}
          {analysis.data && (
            <Text className="mt-3 text-gray-900">
              {analysis.data.nutritional_analysis.name}: {analysis.data.nutritional_analysis.calories} cal
            </Text>
          )}
        </>
      ) : null}
    </View>
  );
}
