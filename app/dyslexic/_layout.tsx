import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Href, Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function CustomHeader({ handleReset }: { handleReset: () => void }) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>Z</Text>
          </View>
          <View>
            <Text style={styles.logoTitle}>Zyralex</Text>
            <Text style={styles.logoSub}>Simplified learning.</Text>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <Ionicons name="settings-outline" size={22} color="#6b7280" style={styles.hIcon} />

          {/* Dashboard icon → navigates to /dashboard */}
          <Pressable onPress={() => router.push("/dashboard" as Href)}>
            <Ionicons name="shield-outline" size={22} color="#8b5cf6" style={styles.hIcon} />
          </Pressable>

          <Pressable onPress={handleReset}>
            <Ionicons name="exit-outline" size={22} color="#3b82f6" style={styles.hIcon} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}


export default function DyslexicLayout() {
  const router = useRouter();

  const handleReset = async () => {
    await AsyncStorage.removeItem("moduleChoice");
    router.replace("/onboarding");
  };

  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader handleReset={handleReset} />,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 4,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="welcome"
        options={{
          title: "Welcome",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="module/[level1]/[lesson]"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: "Assessment",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "create" : "create-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "game-controller" : "game-controller-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d5db",
  },
  safeArea: {
    backgroundColor: "#fff",
    flex: 0,
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "navy",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoLetter: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  logoTitle: { fontSize: 23, fontWeight: "700", color: "#111" },
  logoSub: { fontSize: 12, color: "#6b7280" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  hIcon: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
});
