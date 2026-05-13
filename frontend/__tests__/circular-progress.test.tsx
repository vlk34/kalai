import React from "react";
import { render } from "@testing-library/react-native";
import { CircularProgress } from "../components/ui/CircularProgress";

describe("CircularProgress", () => {
  it("renders the rounded percentage when not loading", () => {
    const { getByText } = render(<CircularProgress percentage={33.3} />);
    expect(getByText("33%")).toBeTruthy();
  });

  it("renders placeholder when loading", () => {
    const { getByText } = render(<CircularProgress percentage={33.3} isLoading />);
    expect(getByText("--")).toBeTruthy();
  });
});

