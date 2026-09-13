import React, { Component, type ReactNode } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

function StartupFailure() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.brand}>RideShare India</Text>
        <Text style={styles.title}>Unable to start the app</Text>
        <Text style={styles.body}>Please close and reopen RideShare. If this continues, install the latest build and share your app version with support.</Text>
      </View>
    </SafeAreaView>
  );
}

class StartupBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: Error) {
    console.error("[RideShare startup] render failed", error);
  }
  override render() { return this.state.failed ? <StartupFailure /> : this.props.children; }
}

// Register a root before evaluating screens and service clients. An import-time
// JS failure otherwise terminates a release build without any visible feedback.
export function Bootstrap() {
  const [AppComponent] = React.useState<React.ComponentType | null>(() => {
    try {
      return require("../App").App;
    } catch (error) {
      console.error("[RideShare startup] initialization failed", error);
      return null;
    }
  });
  return <StartupBoundary>{AppComponent ? <AppComponent /> : <StartupFailure />}</StartupBoundary>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F6F5", justifyContent: "center" },
  card: { padding: 28, gap: 18 },
  brand: { color: "#0F766E", fontSize: 18, fontWeight: "700" },
  title: { color: "#0F172A", fontSize: 28, fontWeight: "700" },
  body: { color: "#475569", fontSize: 16, lineHeight: 25 },
});
