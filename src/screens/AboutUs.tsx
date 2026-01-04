import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function AboutUs() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#f9fafb",
    text: isDark ? "#F9FAFB" : "#111827",
    paragraph: isDark ? "#D1D5DB" : "#374151",
    cardText: isDark ? "#E5E7EB" : "#374151",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* HERO IMAGE */}
        <Image
          source={require("../../assets/hero.png")}
          style={styles.heroImage}
        />

        <Text style={[styles.title, { color: colors.text }]}>
          Buy, Sell & Rent Bikes — One Platform
        </Text>

        <Text style={[styles.paragraph, { color: colors.paragraph }]}>
          This application is a bike marketplace designed to simplify the
          process of buying, selling, and renting motorcycles. It provides a
          user-friendly interface where users can explore listings, post their
          own bikes, and make informed decisions based on price, year, location,
          and usage details.
        </Text>

        {/* PURPOSE */}
        <Image
          source={require("../../assets/purpose.png")}
          style={styles.sectionImage}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Why This App?
        </Text>
        <Text style={[styles.paragraph, { color: colors.paragraph }]}>
          Finding the right bike or reaching the right buyer is often time
          consuming and confusing. This app brings all essential bike-related
          activities into a single platform, making the process transparent,
          efficient, and accessible.
        </Text>

        {/* FEATURES */}
        <Image
          source={require("../../assets/features.png")}
          style={styles.sectionImage}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Key Features
        </Text>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={18} color="#e53935" />
          <Text style={[styles.listText, { color: colors.cardText }]}>
            Buy, Sell, and Rent bikes easily
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={18} color="#e53935" />
          <Text style={[styles.listText, { color: colors.cardText }]}>
            Upload bike details with images, price, year, and location
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={18} color="#e53935" />
          <Text style={[styles.listText, { color: colors.cardText }]}>
            View detailed listings before making a decision
          </Text>
        </View>

        {/* TRUST */}
        <Image
          source={require("../../assets/trust.png")}
          style={styles.sectionImage}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Transparency & Trust
        </Text>
        <Text style={[styles.paragraph, { color: colors.paragraph }]}>
          The app focuses on transparency by clearly displaying important
          details such as price, location, and bike condition indicators.
          Users are free to evaluate listings without hidden information or
          forced pricing.
        </Text>

        {/* HOW IT WORKS */}
        <Image
          source={require("../../assets/flow.png")}
          style={styles.sectionImage}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          How It Works
        </Text>
        <Text style={[styles.paragraph, { color: colors.paragraph }]}>
          Users can navigate through the app, choose whether they want to buy,
          sell, or rent a bike, view available listings, and manage their own
          postings through a simple and intuitive workflow.
        </Text>

        {/* PROJECT NOTE */}
        <Image
          source={require("../../assets/project.png")}
          style={styles.sectionImage}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Project Information
        </Text>
        <Text style={[styles.paragraph, { color: colors.paragraph }]}>
          This application is developed as an academic project to understand
          real-world mobile application development, user experience design,
          and marketplace system workflows using React Native.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: 100,
    backgroundColor: "#e53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },

  content: {
    padding: 16,
  },

  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },

  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },

  sectionImage: {
    width: width - 32,
    height: 180,
    borderRadius: 16,
    marginTop: 20,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  listText: {
    marginLeft: 8,
    fontSize: 15,
  },
});
