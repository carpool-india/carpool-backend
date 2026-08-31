module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@rideshare/types$": "<rootDir>/../../shared/types/index.ts",
  },
};
