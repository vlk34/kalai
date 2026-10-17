import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAIRewrite } from "@/hooks/useAIRewrite";

export function AIRewriteCard() {
  const [text, setText] = useState("");
  const { credits, rewrite } = useAIRewrite();

  return (
    <View className="mx-6 my-4 rounded-2xl bg-gray-50 p-5">
      <Text className="text-lg font-semibold text-gray-900">AI rewrites</Text>
      <Text className="mt-2 text-gray-600">
        Polish a draft while keeping your meaning and voice.
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
              ? "Pro · Unlimited rewrites"
              : `${credits.data.remaining} of ${credits.data.limit} rewrites left this month`}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            maxLength={2000}
            multiline
            placeholder="Enter a draft to improve"
            accessibilityLabel="Text to rewrite"
            className="mt-4 rounded-xl border border-gray-200 bg-white p-3"
          />
          <TouchableOpacity
            disabled={!text.trim() || rewrite.isPending}
            onPress={() => rewrite.mutate(text)}
            className="mt-3 rounded-xl bg-black p-3"
          >
            <Text className="text-center font-semibold text-white">
              {rewrite.isPending ? "Rewriting..." : "Rewrite with AI"}
            </Text>
          </TouchableOpacity>
          {rewrite.error && (
            <Text className="mt-3 text-red-600">{rewrite.error.message}</Text>
          )}
          {rewrite.data && (
            <Text selectable className="mt-3 text-gray-900">
              {rewrite.data.rewritten_text}
            </Text>
          )}
        </>
      ) : null}
    </View>
  );
}
