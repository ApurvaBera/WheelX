import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH } from "../utils/responsive";

const width = SCREEN_WIDTH;

export default function Profile() {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#F9FAFB",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#374151" : "#F3F4F6",
  };

  interface MenuItem {
    label: string;
    icon: string;
    route?: string;
    color: string;
    type?: string;
  }

  interface MenuSection {
    title: string;
    items: MenuItem[];
  }

  const menuSections: MenuSection[] = [
    {
      title: "Account Settings",
      items: [
        { label: "Edit Profile", icon: "create-outline", route: "EditProfile", color: "#e53935" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { label: "Dark Theme", icon: "moon-outline", type: "switch", color: "#e53935" },
      ]
    },
    {
      title: "Support",
      items: [
        { label: "Help & Support", icon: "help-circle-outline", route: "HelpSupport", color: "#e53935" },
        { label: "About WheelX", icon: "information-circle-outline", route: "AboutUs", color: "#e53935" },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.profileInfoArea}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color="#fff" />
              </View>
            </View>
            <View style={styles.profileTexts}>
              <Text style={[styles.name, { color: colors.text }]}>
                {user?.name || "WheelX User"}
              </Text>
              <View style={styles.emailBadge}>
                <Text style={[styles.email, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                  {user?.email || "user@wheelx.com"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>{section.title}</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
              {section.items.map((item, iIdx) => (
                <View key={iIdx}>
                  {item.type === "switch" ? (
                    <View style={styles.menuRow}>
                      <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
                          <Ionicons name={item.icon as any} size={20} color={item.color} />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>{item.label}</Text>
                      </View>
                      <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: "#d1d5db", true: "#e5393555" }}
                        thumbColor={isDark ? "#e53935" : "#f4f4f5"}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.menuRow}
                      onPress={() => item.route && navigation.navigate(item.route)}
                    >
                      <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
                          <Ionicons name={item.icon as any} size={20} color={item.color} />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>{item.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.subText + "88"} />
                    </TouchableOpacity>
                  )}
                  {iIdx < section.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconBox}>
            <Ionicons name="power" size={18} color="#fff" />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subText }]}>Locked with Encryption • WheelX v2.0.4</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: verticalScale(110),
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: verticalScale(20),
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
  },
  logo: { width: scale(120), height: scale(60) },
  content: { padding: moderateScale(20), paddingBottom: verticalScale(40) },
  profileCard: {
    borderRadius: moderateScale(24),
    padding: moderateScale(24),
    marginBottom: verticalScale(24),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(10),
  },
  profileInfoArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(229, 57, 53, 0.2)",
  },
  editAvatarIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#e53935",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileTexts: {
    marginLeft: scale(20),
    flex: 1,
  },
  name: { fontSize: rf(24), fontWeight: "800" },
  emailBadge: {
    marginTop: verticalScale(4),
    alignSelf: "flex-start",
  },
  email: { fontSize: rf(13), fontWeight: "500" },

  sectionContainer: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: rf(13),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: verticalScale(12),
    marginLeft: scale(4),
    opacity: 0.8,
  },
  menuCard: {
    borderRadius: moderateScale(20),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(5),
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: scale(38),
    height: scale(38),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(16),
  },
  rowText: {
    fontSize: rf(16),
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    opacity: 0.5,
  },
  logoutBtn: {
    marginTop: verticalScale(10),
    backgroundColor: "#e53935",
    height: verticalScale(56),
    borderRadius: moderateScale(18),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#e53935",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
  },
  logoutIconBox: {
    marginRight: scale(12),
  },
  logoutText: { color: "#fff", fontSize: rf(18), fontWeight: "800" },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.5,
  },
});
