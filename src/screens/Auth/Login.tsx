import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from "react-native";
import { BlurView } from "expo-blur";
import AnimatedRE, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import * as Location from "expo-location";
import { supabase } from "../../supabase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH, SCREEN_HEIGHT } from "../../utils/responsive";
import { PASSWORD_RULES, validatePassword } from "../../utils/validation";
import { checkAndSendWelcome } from "../../utils/notifications";

const width = SCREEN_WIDTH;
const height = SCREEN_HEIGHT;

const backgroundImage = require("../../../assets/bg.png");
const googleLogo = require("../../../assets/google.png");
const brandLogo = require("../../../assets/logo2.png");

export default function Login({ onSignup, route }: { onSignup?: () => void; route?: any }) {
  const navigation = useNavigation<any>();
  const { login, googleLogin, resetPassword } = useAuth();

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

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter email and password");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert("Weak Password", "Please ensure your password meets all the listed requirements.");
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
      if (authData.user) {
        await checkAndSendWelcome(authData.user.id);
      }
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

  const handleForgotPassword = async () => {
    if (!email) {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          "Reset Password",
          "Please enter your email address to receive a reset link.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Reset",
              onPress: async (enteredEmail?: string) => {
                if (enteredEmail) await triggerReset(enteredEmail);
              }
            }
          ],
          "plain-text"
        );
      } else {
        // Fallback for Android or simply ask user to fill the field
        Alert.alert("Email Required", "Please enter your email in the email field first.");
      }
      return;
    }

    await triggerReset(email.trim());
  };

  const triggerReset = async (emailToReset: string) => {
    try {
      await resetPassword(emailToReset);
      Alert.alert("Success", "Password reset email sent! Check your inbox.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not send reset email.");
    }
  };

  const goToSignup = () => {
    if (onSignup) onSignup();
    else navigation.navigate("Signup");
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
      <View style={styles.darkOverlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerSection}>
              <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" />
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeTitle}>Welcome Back</Text>
                <Text style={styles.welcomeSubtitle}>Sign in to continue your journey</Text>
              </View>
            </View>

            <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="light" style={styles.glassCard}>
              <View style={styles.formContainer}>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Enter phone number"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter email"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconContainer}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                {password.length > 0 && (
                  <AnimatedRE.View
                    entering={FadeInUp.duration(300)}
                    exiting={FadeOutUp.duration(200)}
                    layout={Layout.springify()}
                    style={styles.passwordRulesContainer}
                  >
                    {PASSWORD_RULES.map((rule) => {
                      const isPassed = rule.test(password);
                      const isSubRule = ['lowercase', 'uppercase', 'numbers', 'special'].includes(rule.id);

                      return (
                        <View key={rule.id} style={[styles.ruleRow, isSubRule && { marginLeft: scale(20) }]}>
                          <Ionicons
                            name={isPassed ? "checkmark-circle" : "ellipse-outline"}
                            size={rf(14)}
                            color={isPassed ? "#10B981" : "#9CA3AF"}
                          />
                          <Text style={[
                            styles.ruleText,
                            { color: isPassed ? "#10B981" : "#6B7280" }
                          ]}>
                            {rule.label} {isPassed ? ": Pass." : ""}
                          </Text>
                        </View>
                      );
                    })}
                  </AnimatedRE.View>
                )}

                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassContainer}>
                  <Text style={styles.forgotPassText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.8}>
                  <Text style={styles.primaryText}>Log In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} activeOpacity={0.7}>
                  <Image source={googleLogo} style={styles.googleLogo} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={goToSignup}>
                    <Text style={styles.signupLink}> Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  headerSection: {
    alignItems: "center",
    paddingTop: height * 0.1,
    marginBottom: 30,
  },
  brandLogo: {
    width: scale(200),
    height: scale(90),
    marginBottom: verticalScale(10),
  },
  welcomeTextContainer: {
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: rf(28),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: rf(16),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: verticalScale(4),
  },
  glassCard: {
    width: "100%",
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(32),
    paddingBottom: height > 800 ? verticalScale(80) : verticalScale(60),
    overflow: "hidden",
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputGroup: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontSize: rf(14),
    fontWeight: "600",
    color: "#374151",
    marginBottom: verticalScale(6),
    marginLeft: scale(4),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(12),
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputIcon: {
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    color: "#1F2937",
    fontSize: rf(16),
    height: "100%",
  },
  eyeIconContainer: {
    padding: 8,
  },
  forgotPassContainer: {
    alignSelf: "flex-end",
    marginBottom: verticalScale(20),
  },
  forgotPassText: {
    color: "#e53935",
    fontSize: rf(14),
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#e53935",
    height: verticalScale(56),
    borderRadius: moderateScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e53935",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 4,
  },
  primaryText: {
    color: "#fff",
    fontSize: rf(18),
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: scale(12),
    color: "#9CA3AF",
    fontSize: rf(12),
    fontWeight: "700",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    height: verticalScale(54),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: scale(10),
  },
  googleButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: rf(16),
  },
  googleLogo: {
    width: scale(22),
    height: scale(22),
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(24),
  },
  signupText: {
    color: "#6B7280",
    fontSize: rf(15),
  },
  signupLink: {
    color: "#e53935",
    fontSize: rf(15),
    fontWeight: "700",
  },
  passwordRulesContainer: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(12),
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(20),
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(6),
    gap: scale(8),
  },
  ruleText: {
    fontSize: rf(12),
    fontWeight: "500",
  },
});
