import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAIReview } from "@/hooks/useAIReview";

export function AIReviewCard() {
  const [text, setText] = useState("");
  const { credits, review } = useAIReview();

  return (
    <View className="mx-6 my-4 rounded-2xl bg-gray-50 p-5">
      <Text className="text-lg font-semibold text-gray-900">AI reviews</Text>
      <Text className="mt-2 text-gray-600">
        Get feedback on clarity, consistency and errors before sharing a draft.
      </Text>
      {credits.isLoading ? (
        <ActivityIndicator className="my-3" />
      ) : credits.error ? (
        <TouchableOpacity onPress={() => credits.refetch()}>
          <Text className="my-3 text-blue-600">Could not load credits. Tap to retry.</Text>
        </TouchableOpacity>
      ) : credits.data ? (
        <>
          <Text className="mt-2 text-sm text-gray-500">
            {credits.data.plan === "pro"
              ? "Pro · Unlimited AI reviews"
              : `${credits.data.remaining} of ${credits.data.limit} reviews left this month`}
          </Text>
          <Text className="mt-1 text-xs text-gray-500">
            Credits reset {new Date(credits.data.resets_at).toLocaleDateString()}.
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            maxLength={2000}
            multiline
            placeholder="Enter a draft to review"
            accessibilityLabel="Draft to review"
            className="mt-4 rounded-xl border border-gray-200 bg-white p-3"
          />
          <TouchableOpacity
            disabled={!text.trim() || review.isPending}
            onPress={() => review.mutate(text)}
            className="mt-3 rounded-xl bg-black p-3"
          >
            <Text className="text-center font-semibold text-white">
              {review.isPending ? "Reviewing..." : "Review with AI"}
            </Text>
          </TouchableOpacity>
          {review.error && (
            <Text className="mt-3 text-red-600">{review.error.message}</Text>
          )}
          {review.data && (
            <View className="mt-4">
              <Text selectable className="font-semibold text-gray-900">
                {review.data.review.summary}
              </Text>
              {review.data.review.suggestions.map((suggestion, index) => (
                <Text selectable key={index} className="mt-2 text-gray-700">
                  {suggestion.severity}: {suggestion.message}
                </Text>
              ))}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}
