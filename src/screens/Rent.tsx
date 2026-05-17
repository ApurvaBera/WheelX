import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

import { Ionicons } from "@expo/vector-icons";

export default function Rent() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#f3f4f6", // Light gray for light mode
    text: isDark ? "#F9FAFB" : "#111827",
    card: isDark ? "#1F2937" : "#ffffff",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.centerWrapper}>

        <TouchableOpacity
          style={styles.block}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("RentABike")}
        >
          <ImageBackground
            source={require("../../assets/rab.png")}
            style={styles.image}
            imageStyle={[styles.imageBackgroundStyle, { opacity: 0.8 }]}
          >
            <View style={styles.textOverlay}>
              <Text style={styles.mainTitle}>Rent a Bike</Text>
              <Text style={styles.subTitle}>
                Find and rent motorcycles near you
              </Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.block}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("RentYourBike")}
        >
          <ImageBackground
            source={require("../../assets/ryb.png")}
            style={styles.image}
            imageStyle={[styles.imageBackgroundStyle, { opacity: 0.8 }]}
          >
            <View style={styles.textOverlay}>
              <Text style={styles.mainTitle}>Rent Out Your Bike</Text>
              <Text style={styles.subTitle}>
                List your motorcycle for rental
              </Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    backgroundColor: "#e53935",
    height: 100, // Slightly reduced for a more compact feel
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 100,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },

  logo: {
    width: 130,
    height: 60,
  },

  centerWrapper: { flex: 1 },

  block: {
    flex: 1, // Use flex to share space perfectly
    width: "100%",
    overflow: "hidden",
    backgroundColor: '#000' // Fallback
  },

  image: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', // Darken if image missing
  },
  imageBackgroundStyle: {
    resizeMode: "cover", // Fills the space to 'connect' the two images
  },

  textOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // Better readability
    padding: 20,
    borderRadius: 16,
    width: '90%'
  },

  mainTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },

  subTitle: {
    color: "#f3f4f6",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
});
