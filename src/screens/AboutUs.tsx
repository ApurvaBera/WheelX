import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout,
  ZoomIn
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURES = [
  { title: "Buy & Sell", desc: "List your bike or find your next ride in minutes.", icon: "cart-outline", color: "#e53935" },
  { title: "Rent Easy", desc: "Flexible rental options for every journey.", icon: "key-outline", color: "#3b82f6" },
  { title: "Verified Listings", desc: "Trusted marketplace with clear pricing.", icon: "shield-checkmark-outline", color: "#10b981" },
  { title: "Live Tracking", desc: "Stay updated with real-time location tags.", icon: "location-outline", color: "#f59e0b" },
];

export default function AboutUs() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#F9FAFB",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#374151" : "#E5E7EB",
    accent: "#e53935",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Story</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <Animated.View entering={ZoomIn.duration(600)} style={styles.heroSection}>
          <Image
            source={require("../../assets/hero.png")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTag}>WHEELX v2.0</Text>
            <Text style={styles.heroTitle}>Revolutionizing the Ride</Text>
          </View>
        </Animated.View>

        {/* MISSION SECTION */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Our Mission</Text>
          <Text style={[styles.paragraph, { color: colors.subText }]}>
            At WheelX, we're building the most transparent and efficient bike marketplace in the world.
            Whether you're selling a classic, buying your first ride, or renting for a weekend adventure,
            we provide the tools to make it happen flawlessly.
          </Text>
        </Animated.View>

        {/* FEATURE GRID */}
        <View style={styles.gridContainer}>
          {FEATURES.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(300 + index * 100).duration(500)}
              style={[styles.featureCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.subText }]}>{item.desc}</Text>
            </Animated.View>
          ))}
        </View>

        {/* WHY US SECTION */}
        <Animated.View
          entering={FadeInRight.delay(700).duration(600)}
          style={[styles.whyUsCard, { backgroundColor: colors.accent }]}
        >
          <View style={styles.whyUsContent}>
            <Text style={styles.whyUsTitle}>Why WheelX?</Text>
            <Text style={styles.whyUsText}>
              Built by riders, for riders. We understand the adrenaline and the value of a perfect machine.
              Our platform ensures every transaction is backed by transparency and trust.
            </Text>
          </View>
          <Ionicons name="speedometer-outline" size={100} color="rgba(255,255,255,0.15)" style={styles.bgIcon} />
        </Animated.View>

        {/* PROJECT INFO */}
        <Animated.View entering={FadeInDown.delay(900).duration(500)} style={styles.projectNote}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.noteTitle, { color: colors.text }]}>Project Information</Text>
          <Text style={[styles.noteText, { color: colors.subText }]}>
            WheelX is a state-of-the-art academic project focused on exploring modern mobile application
            development, high-performance animations, and intuitive marketplace workflows using
            React Native and Supabase.
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subText }]}>© 2026 WheelX Technologies</Text>
        </View>
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  heroSection: {
    height: 220,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 32,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    padding: 24,
  },
  heroTag: { color: "#e53935", fontSize: 13, fontWeight: "900", letterSpacing: 2, marginBottom: 4 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900", lineHeight: 34 },
  section: { marginBottom: 32, paddingHorizontal: 4 },
  sectionHeading: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  paragraph: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 20,
    borderRadius: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  featureDesc: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  whyUsCard: {
    borderRadius: 28,
    padding: 28,
    marginBottom: 40,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#e53935",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  whyUsContent: { flex: 1, zIndex: 1 },
  whyUsTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 12 },
  whyUsText: { color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: "600", lineHeight: 22 },
  bgIcon: { position: "absolute", bottom: -10, right: -10 },
  projectNote: { paddingHorizontal: 4 },
  divider: { height: 1, marginBottom: 24, opacity: 0.3 },
  noteTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  noteText: { fontSize: 14, lineHeight: 22, fontWeight: "500" },
  footer: { marginTop: 40, alignItems: "center", opacity: 0.5 },
  footerText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
});
