import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import * as Location from "expo-location";
import { supabase } from "../supabase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.round(width * 0.78);

const slideLogo = require("../../assets/logo2.png");

const slideImages = [
  { id: "1", image: require("../../assets/buy.png"), buttonImage: require("../../assets/buybt.png"), route: "Buy" },
  { id: "2", image: require("../../assets/sell.png"), buttonImage: require("../../assets/sellbt.png"), route: "Sell" },
  { id: "3", image: require("../../assets/rent.png"), buttonImage: require("../../assets/rentbt.png"), route: "Rent" },
];

const menuItems = [
  { key: "account", label: "Account", icon: "person-circle-outline", route: "Profile" },
  { key: "motorcycle", label: "Motorcycle", icon: "bicycle-outline", route: "MyMotorcycle" },
  { key: "booking", label: "Booking", icon: "calendar-outline", route: "Bookings" },
  { key: "chats", label: "Chats", icon: "chatbubbles-outline", route: "Chats" },
  { key: "faqs", label: "FAQs", icon: "help-circle-outline", route: "Faqs" },
  { key: "about", label: "About Us", icon: "information-circle-outline", route: "AboutUs" },
  { key: "contact", label: "Contact Us / Chat With Us", icon: "call-outline", route: "ContactSupport" },
];

export default function Home() {
  const saveUserLocation = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await supabase.from("profiles").upsert({
        id: userData.user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        updated_at: new Date(),
      });
    } catch (err) {
      console.log("Auto location save failed", err);
    }
  };

  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#F9FAFB",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#374151",
    border: isDark ? "#374151" : "#E5E7EB",
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const anim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    const id = setInterval(() => {
      const next = (currentIndex + 1) % slideImages.length;
      setCurrentIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3000);

    return () => clearInterval(id);
  }, [currentIndex]);

  useEffect(() => {
    saveUserLocation();
  }, []);


  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(anim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setSidebarOpen(false));
  };

  const handleLogout = () => {
    closeSidebar();
    logout();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>

        {!sidebarOpen && (
          <TouchableOpacity style={styles.hamburger} onPress={openSidebar}>
            <View style={styles.burger}>
              <View style={[styles.burgerLine, { width: 28 }]} />
              <View style={[styles.burgerLine, { width: 22 }]} />
              <View style={[styles.burgerLine, { width: 18 }]} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.sliderContainer}>
          <FlatList
            ref={listRef}
            data={slideImages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Image source={item.image} style={styles.slideImage} />
                <View style={styles.slideOverlay}>
                  <Image source={slideLogo} style={styles.slideLogo} resizeMode="contain" />
                </View>
              </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />

          <View style={styles.dots}>
            {slideImages.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={[styles.roundedSection, { backgroundColor: colors.card }]}>
          <View style={styles.actionsRow}>
            {slideImages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionTile}
                onPress={() => navigation.navigate(item.route)}
              >
                <Image source={item.buttonImage} style={styles.actionImage} />
                <View style={styles.cardOverlay} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {sidebarOpen && (
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
        )}

        <Animated.View style={[styles.sidebar, { left: anim, backgroundColor: colors.card }]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.profileName}>
                  Hello {user?.name || "User"}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email || ""}
                </Text>

              </View>
              <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sidebarContent}>
            {menuItems.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={styles.menuItem}
                onPress={() => navigation.navigate(m.route)}
              >
                <Ionicons name={m.icon as any} size={20} color={colors.subText} style={{ width: 28 }} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#e53935" style={{ width: 28 }} />
              <Text style={{ color: "#e53935", fontSize: 15, fontWeight: "600" }}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },

  hamburger: { position: "absolute", top: 28, left: 12, zIndex: 30, padding: 6 },
  burger: { width: 32, height: 22, justifyContent: "space-between" },
  burgerLine: { height: 3, backgroundColor: "#fff", borderRadius: 2 },

  sliderContainer: { height: 240 },
  slide: { width, height: 240 },
  slideImage: { width: "100%", height: "100%" },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center"
  },
  slideLogo: { width: 200, height: 90 },

  dots: { position: "absolute", bottom: 12, width: "100%", flexDirection: "row", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)", marginHorizontal: 4 },
  dotActive: { width: 20, backgroundColor: "#e53935" },

  roundedSection: { borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24, paddingTop: 24 },
  actionsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 24 },
  actionTile: { flex: 1, height: 110, borderRadius: 16, overflow: "hidden" },
  actionImage: { width: "100%", height: "100%" },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.12)" },

  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.32)", zIndex: 20 },

  sidebar: { position: "absolute", top: 0, bottom: 0, width: SIDEBAR_WIDTH, zIndex: 25 },
  sidebarHeader: { height: 140, backgroundColor: "#e53935", paddingHorizontal: 16, justifyContent: "flex-end", paddingBottom: 14 },

  profileRow: { flexDirection: "row", alignItems: "center" },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  profileName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  profileEmail: { color: "#fff", fontSize: 13 },
  closeBtn: { padding: 6, position: "absolute", right: 16, top: 20 },

  sidebarContent: { paddingVertical: 12, paddingHorizontal: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginHorizontal: 8, marginBottom: 6 },
  menuLabel: { marginLeft: 6, fontSize: 15 },
  menuDivider: { height: 1, marginVertical: 12 },
});
