import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import WelcomeScreen from "../app/welcome";
import { router } from "expo-router";

describe("WelcomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to auth selection when Get Started is pressed", () => {
    const { getByText } = render(<WelcomeScreen />);
    fireEvent.press(getByText("welcome.getStarted"));
    expect(router.push).toHaveBeenCalledWith("/auth-selection");
  });
});

