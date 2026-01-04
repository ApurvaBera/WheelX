import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

export default function Fav() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#6B7280",
    subText: isDark ? "#9CA3AF" : "#9CA3AF",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={{ width: 26 }} />
      </View>

      <View style={styles.centerArea}>
        <Text style={[styles.placeholder, { color: colors.text }]}>
          No Favourites yet
        </Text>
        <Text style={[styles.subText, { color: colors.subText }]}>
          Bikes you wishlist will appear here
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 100,
    backgroundColor: "#e53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  logo: {
    width: 120,
    height: 50,
  },

  centerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholder: {
    fontSize: 18,
    fontWeight: "600",
  },

  subText: {
    fontSize: 14,
    marginTop: 6,
  },
});
