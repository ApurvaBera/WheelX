import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";

export default function EditProfile() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#F9FAFB",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#374151" : "#E5E7EB",
    inputBg: isDark ? "#111827" : "#ffffff",
  };

  const [name, setName] = useState("User Name");
  const [email, setEmail] = useState("user@example.com");
  const [phone, setPhone] = useState("+91 9876543210");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) =>
    /^[+]?[0-9]{10,15}$/.test(phone.replace(/\s/g, ""));

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    const { error: nameError } = await supabase.auth.updateUser({
      data: {
        full_name: name
      }
    });

    if (nameError) {
      Alert.alert("Error", nameError.message);
      return;
    }

    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email
      });

      if (emailError) {
        Alert.alert("Error", emailError.message);
        return;
      }
    }

    const { error: phoneError } = await supabase
      .from("profiles")
      .update({
        phone
      })
      .eq("id", user.id);

    if (phoneError) {
      Alert.alert("Error", phoneError.message);
      return;
    }

    await supabase.auth.refreshSession();

    Alert.alert(
      "Success",
      email !== user.email
        ? "Profile updated. Please verify your new email."
        : "Profile updated successfully",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#fff" />
          </View>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.subText }]}>Full Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.subText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.subText}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.subText }]}>Email</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.subText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.subText}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.subText }]}>Phone Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={20} color={colors.subText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                onChangeText={setPhone}
                placeholder="Enter phone"
                placeholderTextColor={colors.subText}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelBtnText, { color: colors.subText }]}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  content: { padding: 16 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: 20 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16 },
  saveBtn: {
    marginTop: 32,
    backgroundColor: "#e53935",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 16, fontWeight: "600" },
});
