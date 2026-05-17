import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function EditProfile() {
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setName(user.user_metadata?.full_name || "");
        setEmail(user.email || "");

        // Fetch phone from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single();

        if (profile) setPhone(profile.phone || "");
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Update auth name
      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      if (metaError) throw metaError;

      // Update email if changed
      if (email.toLowerCase().trim() !== user.email?.toLowerCase().trim()) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone, name: name, updated_at: new Date() })
        .eq("id", user.id);
      if (profileError) throw profileError;

      await supabase.auth.refreshSession();
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { borderColor: colors.accent + "33" }]}>
            <Ionicons name="person" size={56} color="#fff" />
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subText }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#111827" : "#F3F4F6" }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.accent + "15" }]}>
                <Ionicons name="person-outline" size={20} color={colors.accent} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.subText}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subText }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#111827" : "#F3F4F6" }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.accent + "15" }]}>
                <Ionicons name="mail-outline" size={20} color={colors.accent} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor={colors.subText}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subText }]}>Phone Number</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#111827" : "#F3F4F6" }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.accent + "15" }]}>
                <Ionicons name="call-outline" size={20} color={colors.accent} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.subText}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.actionArea}>
          <TouchableOpacity
            style={[styles.saveBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: colors.subText }]}>Discard Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 120,
    backgroundColor: "#e53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  content: { padding: 24, paddingBottom: 40 },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 10,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: (SCREEN_WIDTH - 48) / 2 - 40,
    backgroundColor: "#e53935",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F9FAFB",
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 60,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    height: "100%",
  },
  actionArea: {
    gap: 12,
  },
  saveBtn: {
    backgroundColor: "#e53935",
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#e53935",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  cancelBtn: {
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  cancelBtnText: { fontSize: 16, fontWeight: "700" },
});
