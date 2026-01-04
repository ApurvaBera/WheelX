import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Alert
} from "react-native";
import * as Location from "expo-location";
import { supabase } from "../../supabase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const backgroundImage = require("../../../assets/bg.png");
const googleLogo = require("../../../assets/google.png");
const brandLogo = require("../../../assets/logo.png");

export default function Signup({ onLogin }: { onLogin: () => void }) {
  const navigation = useNavigation<any>();
  const { signup: signupAuth, googleLogin } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const saveUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      await supabase.from("profiles").upsert({
        id: userData.user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        updated_at: new Date(),
      });
    } catch (err) {
      console.log("Location save failed", err);
    }
  };


  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert("Missing Fields", "Please fill all fields");
      return;
    }

    try {
      await signupAuth(email, password, name);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          phone: phone,
        });

        if (error) {
          console.log("PROFILE UPSERT ERROR:", error);
        }
      }
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await googleLogin();
      await saveUserLocation();
    } catch (error: any) {
      Alert.alert("Google Signup Failed", error.message || "Unable to signup");
    }
  };

  const goToLogin = () => {
    onLogin ? onLogin() : navigation.navigate("Login");
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.panelContent}>
          <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.title}>Create An Account</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone Number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
            <Text style={styles.primaryText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup}>
            <View style={styles.googleButtonContent}>
              <Image source={googleLogo} style={styles.googleLogo} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginLink}>  Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
    paddingBottom: 80
  },
  panelContent: { width: "100%", maxWidth: 400, padding: 24, gap: 12 },
  brandLogo: { width: 180, height: 80, alignSelf: "center" },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", color: "#000", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(209,213,219,0.5)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    color: "#1F2937",
    width: "100%"
  },
  passwordWrapper: { width: "100%", position: "relative" },
  eyeIcon: { position: "absolute", right: 15, top: 15 },
  primaryButton: {
    backgroundColor: "#e53935",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8
  },
  primaryText: { color: "#fff", fontWeight: "600" },
  googleButton: {
    borderWidth: 1,
    borderColor: "rgba(209,213,219,0.5)",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.85)"
  },
  googleButtonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  googleButtonText: { color: "#1F2937", fontWeight: "500", fontSize: 16 },
  googleLogo: { width: 20, height: 20 },
  loginContainer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  loginText: { color: "#000", fontSize: 14 },
  loginLink: { color: "#e53935", fontSize: 14, fontWeight: "600" }
});
