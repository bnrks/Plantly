module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: [
    "@testing-library/jest-native/extend-expect",
    "<rootDir>/jest.setup.js",
  ],
  moduleNameMapper: {
    "^\\.\\./\\.\\./\\.\\./src/(context/.*)$": "<rootDir>/src/$1",
    "^\\.\\./\\.\\./\\.\\./src/services/firestoreService$":
      "<rootDir>/__mocks__/firestoreService.js",
    "^\\.\\./\\.\\./\\.\\./src/(services/.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|@expo|expo(modules)?|@expo/vector-icons|react-clone-referenced-element|@testing-library/react-native|firebase)",
  ],
};
