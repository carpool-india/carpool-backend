module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@rideshare/types$": "<rootDir>/../../shared/types/index.ts",
    "^@rideshare/utils$": "<rootDir>/../../shared/utils/index.ts",
  },
};
