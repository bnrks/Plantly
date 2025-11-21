// Genel jest kurulumu ve mocklar
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const MockIcon = (props) => React.createElement("Icon", props);
  return { Ionicons: MockIcon };
});
