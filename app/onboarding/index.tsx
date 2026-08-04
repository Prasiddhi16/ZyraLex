import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function Onboarding() {
  const router = useRouter();

  const selectModule = async (choice: "dyslexic" | "sign") => {
    await AsyncStorage.setItem("moduleChoice", choice);
    router.replace(`/${choice}`);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await AsyncStorage.removeItem("moduleChoice");
      router.replace("/signup"); 
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to sign out");
    }
  };

  return (
    <View style={styles.container}>
      {/* Sign Out Button Icon Match */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="exit-outline" size={24} color="#007AFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Choose Your Learning Module</Text>

      {/* Panda mascot */}
      <View style={styles.mascotWrapper}>
        <Text style={styles.speechBubble}>
          Hi, I’m Mimo! Pick a module to begin.
        </Text>
        <LottieView
          source={require("../../assets/panda.json")}
          autoPlay
          loop
          style={styles.mascot}
        />
      </View>

      {/* Dyslexic Learn card */}
      <TouchableOpacity
        onPress={() => selectModule("dyslexic")}
        style={styles.cardWrapper}
      >
        <LinearGradient
          colors={["#1679ea", "#70b5f9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Dyslexic Learn</Text>
              <Text style={styles.cardSubtitle}>
                Reading & vocabulary practice
              </Text>
            </View>

            <View style={styles.cardButtons}>
              <View style={styles.cardButton}>
                <FontAwesome5 name="book" size={18} color="#fff" />
                <Text style={styles.cardButtonText}>Reading</Text>
              </View>
              <View style={styles.cardButton}>
                <Ionicons name="chatbubble" size={18} color="#fff" />
                <Text style={styles.cardButtonText}>Vocabulary</Text>
              </View>
              <View style={styles.cardButton}>
                <Ionicons name="game-controller" size={18} color="#fff" />
                <Text style={styles.cardButtonText}>Games</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Sign Learn card */}
      <TouchableOpacity
        onPress={() => selectModule("sign")}
        style={styles.cardWrapper}
      >
        <LinearGradient
          colors={["#70944b", "#a0bb7f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sign Learn</Text>
              <Text style={styles.cardSubtitle}>
                ASL & sign language training
              </Text>
            </View>

            <View style={styles.cardButtons}>
              <View style={styles.cardButton}>
                <Ionicons name="hand-left" size={18} color="#fff" />
                <Text style={styles.cardButtonText}>ASL</Text>
              </View>
              <View style={styles.cardButton}>
                <Ionicons name="videocam" size={18} color="#fff" />
                <Text style={styles.cardButtonText}>Videos</Text>
              </View>
              <View style={styles.cardButton}>
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.cardButtonText}>Camera</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  
  signOutButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#f2f4f7",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  title: {
    fontSize: 30,
    marginBottom: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  mascotWrapper: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  mascot: { width: 180, height: 180 },
  speechBubble: {
    backgroundColor: "#eee3ab",
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    textAlign: "center",
    marginBottom: 5,
  },

  cardWrapper: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
  },
  cardGradient: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardContent: { flex: 1 },
  cardHeader: { marginBottom: 8 },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 5,
  },
  cardSubtitle: { color: "#fff", marginBottom: 15, fontSize: 13 },

  cardButtons: { flexDirection: "row", gap: 15 },
  cardButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardButtonText: { color: "#fff", fontSize: 13 },
});