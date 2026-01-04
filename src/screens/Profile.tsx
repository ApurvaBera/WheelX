import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileBox, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={42} color="#fff" />
          </View>

          <Text style={[styles.name, { color: colors.text }]}>
            {user?.name || "User"}
          </Text>
          <Text style={[styles.email, { color: colors.subText }]}>
            {user?.email || ""}
          </Text>

        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="create-outline" size={22} color="#e53935" />
              <Text style={[styles.rowText, { color: colors.text }]}>
                Edit Profile
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate("MyListings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="list-outline" size={22} color="#e53935" />
              <Text style={[styles.rowText, { color: colors.text }]}>
                My Listings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate("Fav")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="heart-outline" size={22} color="#e53935" />
              <Text style={[styles.rowText, { color: colors.text }]}>
                Favorites
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>

          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={22} color="#e53935" />
              <Text style={[styles.rowText, { color: colors.text }]}>
                Dark Theme
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#d1d5db", true: "#374151" }}
              thumbColor={isDark ? "#e53935" : "#f4f4f5"}
            />
          </View>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate("HelpSupport")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#e53935" />
              <Text style={[styles.rowText, { color: colors.text }]}>
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  logo: { width: 120, height: 50 },
  content: { padding: 16 },
  profileBox: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 16, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { fontSize: 16, fontWeight: "500" },
  logoutBtn: {
    marginTop: 32,
    backgroundColor: "#e53935",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
