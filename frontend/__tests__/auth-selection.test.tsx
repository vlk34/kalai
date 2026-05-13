import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AuthSelectionScreen from "../app/auth-selection";
import { router } from "expo-router";

describe("AuthSelectionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to email signup when the email button is pressed", () => {
    const { getByText } = render(<AuthSelectionScreen />);
    fireEvent.press(getByText("auth.signUpWithEmail"));
    expect(router.push).toHaveBeenCalledWith("/(auth)/signup");
  });
});

