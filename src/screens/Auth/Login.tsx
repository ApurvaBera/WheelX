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

export default function Login({ onSignup, route }: { onSignup?: () => void; route?: any }) {
  const navigation = useNavigation<any>();
  const { login, googleLogin } = useAuth();

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


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter email and password");
      return;
    }

    try {
      await login(email.trim(), password);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log("AUTH USER:", authData?.user);
      if (!authData?.user) {
        console.log("NO USER SESSION");
        return;
      }
      const { error } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        phone: phone,
      });
      console.log("UPSERT ERROR:", error);
    } catch (e: any) {
      Alert.alert("Login Failed", e.message);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      await saveUserLocation();
    } catch (error: any) {
      Alert.alert("Google Login Failed", error.message || "Unable to login");
    }
  };

  const goToSignup = () => {
    if (onSignup) onSignup();
    else navigation.navigate("Signup");
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.panelContent}>
          <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.title}>Welcome Back</Text>

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

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <View style={styles.googleButtonContent}>
              <Image source={googleLogo} style={styles.googleLogo} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Don't have an account ?</Text>
            <TouchableOpacity onPress={goToSignup}>
              <Text style={styles.loginLink}>  Sign Up</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
    paddingBottom: 80
  },
  panelContent: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    gap: 12
  },
  brandLogo: {
    width: 180,
    height: 80,
    alignSelf: "center",
    marginBottom: 4
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#000"
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(209, 213, 219, 0.5)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    color: "#1F2937"
  },
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
    borderColor: "rgba(209, 213, 219, 0.5)",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)"
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  googleButtonText: {
    color: "#1F2937",
    fontWeight: "500",
    fontSize: 16
  },
  googleLogo: { width: 20, height: 20, resizeMode: "contain" },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16
  },
  loginText: {
    color: "#000",
    fontSize: 14
  },
  loginLink: {
    color: "#e53935",
    fontSize: 14,
    fontWeight: "600"
  },
  passwordWrapper: { width: "100%", position: "relative" },
  eyeIcon: { position: "absolute", right: 15, top: 15 }
});
