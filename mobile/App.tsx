import "./global.css";
import * as Notifications from "expo-notifications";
import { StyleSheet, View } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { navigateFromNotification, navigationRef } from "./src/navigation/navigationRef";

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
          <NavigationContainer
            ref={navigationRef}
            theme={appTheme}
            onReady={() => {
              void Notifications.getLastNotificationResponseAsync().then((response) => {
                if (response) {
                  navigateFromNotification(response.notification.request.content.data as Record<string, string>);
                }
              });
            }}
          >
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
