import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SignGames() {
  return (
    <LinearGradient
      colors={["#e6feed", "#d2f9d9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Fun Learning Games</Text>

        <View style={styles.grid}>
      
          <Link href="/game/match" asChild>
            <TouchableOpacity style={styles.baseButton}>
              <LinearGradient colors={["#7dbef7", "#74e7ef"]} style={styles.cardRow}>
                <Image source={require("../../assets/mimo1.png")} style={styles.icon} resizeMode="contain" />
                <Text style={styles.buttonText}>Match the Following</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          {/* 🃏 Memory */}
          <Link href="/game/memory" asChild>
            <TouchableOpacity style={styles.baseButton}>
              <LinearGradient colors={["#fadc7a", "#fda085"]} style={styles.cardRowReverse}>
                <Text style={styles.buttonText}>Memory Cards</Text>
                <Image source={require("../../assets/mimo5.png")} style={styles.icon} resizeMode="contain" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>

         
          <Link href="/game/puzzle" asChild>
            <TouchableOpacity style={styles.baseButton}>
              <LinearGradient colors={["#adf2c6", "#8fd3f4"]} style={styles.cardRow}>
                <Image source={require("../../assets/mimo3.png")} style={styles.icon} resizeMode="contain" />
                <Text style={styles.buttonText}>Puzzle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          {/* ✍️ Spelling */}
          <Link href="/game/crossword" asChild>
            <TouchableOpacity style={styles.baseButton}>
              <LinearGradient colors={["#ff9a9e", "#fad0c4"]} style={styles.cardRowReverse}>
                <Text style={styles.buttonText}>Crossword</Text>
                <Image source={require("../../assets/mimo4.png")} style={styles.icon} resizeMode="contain" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          <Link href="/game/unscramble" asChild>
            <TouchableOpacity style={styles.baseButton}>
              <LinearGradient colors={["#a18cd1", "#fbc2eb"]} style={styles.cardRow}>
                <Image source={require("../../assets/mimo2.png")} style={styles.icon} resizeMode="contain" />
                <Text style={styles.buttonText}>Unscramble  Words</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          {/* 📚 Sentence */}
          <Link href="/game/sentence" asChild>
            <TouchableOpacity style={styles.baseButton}>
              <LinearGradient colors={["#ffecd2", "#fcb69f"]} style={styles.cardRowReverse}>
                <Text style={styles.buttonText}>Sentence Builder</Text>
                <Image source={require("../../assets/mimo6.png")} style={styles.icon} resizeMode="contain" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#264994",
  },
  grid: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  baseButton: {
    width: "100%",
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding:8,
    borderRadius: 12,
    height: 140,
  },
  cardRowReverse: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    height: 140,
  },
  icon: {
    width: 150,
    height: 150,
    marginLeft:0,
    marginRight:2,
  
  },
  buttonText: {
    marginLeft:10,
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
    fontSize: 20,
    flexShrink: 1,
  },
});
