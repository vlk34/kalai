import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { Auth } from "../components/auth/Auth";
import { router } from "expo-router";
import { supabase } from "@/scripts/supabase";

describe("Auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signs in with email/password and navigates to tabs on success", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<Auth mode="signin" />);
    fireEvent.changeText(getByPlaceholderText("auth.emailPlaceholder"), "a@b.c");
    fireEvent.changeText(getByPlaceholderText("auth.passwordPlaceholder"), "pw");
    fireEvent.press(getByText("auth.signIn"));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "a@b.c",
        password: "pw",
      });
      expect(router.replace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("shows an alert on sign-in error", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: { message: "bad" },
    });

    const { getByPlaceholderText, getByText } = render(<Auth mode="signin" />);
    fireEvent.changeText(getByPlaceholderText("auth.emailPlaceholder"), "a@b.c");
    fireEvent.changeText(getByPlaceholderText("auth.passwordPlaceholder"), "pw");
    fireEvent.press(getByText("auth.signIn"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "bad");
    });
  });
});

