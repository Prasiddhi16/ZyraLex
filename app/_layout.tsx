import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot, useNavigationContainerRef, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../hooks/AuthProvider";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <MainNavigationApp />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function MainNavigationApp() {
  const router = useRouter();
  const rootNavigationRef = useNavigationContainerRef();

  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [ready, setReady] = useState(false);

  // Monitor when Expo Router's navigation tree is fully assembled
  useEffect(() => {
    const unsubscribe = rootNavigationRef?.addListener("state", () => {
      setIsNavigationReady(true);
    });

    // Fallback if state is already mounted out-of-the-box
    if (rootNavigationRef?.getCurrentRoute()) {
      setIsNavigationReady(true);
    }

    return unsubscribe;
  }, [rootNavigationRef]);

  useEffect(() => {
    // Prevent premature redirects before Expo Router is mounted
    if (!isNavigationReady) return;

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/signup");
          return;
        }

        const choice = await AsyncStorage.getItem("moduleChoice");

        if (!choice) {
          router.replace("/onboarding");
          return;
        }

        if (choice === "dyslexic") {
          router.replace("/dyslexic");
        } else if (choice === "sign") {
          router.replace("/sign");
        } else {
          router.replace("/onboarding");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/signup");
      } finally {
        setReady(true);
      }
    };

    checkAuth();
  }, [isNavigationReady]);

  // Keep Slot mounted at all times so navigation routes are loaded properly
  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        {/* Render Slot invisibly so the routing paths mount successfully in the background */}
        <View style={{ display: "none" }}>
          <Slot />
        </View>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Slot />;
}
