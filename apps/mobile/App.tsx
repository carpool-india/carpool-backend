import "./global.css";
import { StyleSheet, View } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

const queryClient = new QueryClient();

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F3F6F5",
    primary: "#0F766E",
    card: "#FFFFFF",
    text: "#0F172A",
    border: "#E2E8F0",
  },
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider style={styles.root}>
        <View style={styles.root}>
          <NavigationContainer theme={appTheme}>
            <RootNavigator />
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#F3F6F5",
  },
});
