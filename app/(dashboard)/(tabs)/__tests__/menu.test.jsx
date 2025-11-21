import React from "react";
import { render } from "@testing-library/react-native";
import MenuScreen from "../menu";

const mockReplace = jest.fn();

jest.mock("expo-router", () => {
  return {
    useRouter: () => ({
      replace: mockReplace,
    }),
  };
});

describe("MenuScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("acilis yaparken home tab'ine yonlendirir", () => {
    render(<MenuScreen />);
    expect(mockReplace).toHaveBeenCalledWith("/(dashboard)/(tabs)/home");
  });
});
