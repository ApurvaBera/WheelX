import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import Animated, {
  FadeInUp,
  FadeOutUp,
  Layout,
  FadeInDown,
  FadeOutDown
} from "react-native-reanimated";

const FAQS = [
  {
    q: "Why am I unable to book a bike for certain dates?",
    a: "Some bikes are already booked for those dates or the owner has marked them unavailable. Try changing the date range or selecting a different bike.",
    icon: "calendar-outline"
  },
  {
    q: "I selected a date range but no bikes are showing. What should I do?",
    a: "This usually means no bikes are available for the selected period in that location. Try reducing the date range or changing the city.",
    icon: "search-outline"
  },
  {
    q: "Why is my bike listing not visible to other users?",
    a: "Make sure all required details are filled, at least one image is uploaded, and the listing is saved successfully. Incomplete listings are not shown publicly.",
    icon: "eye-off-outline"
  },
  {
    q: "Can I edit or remove my bike listing after posting?",
    a: "Yes. Go to Profile → My Listings, select the listing, and choose Edit or Delete.",
    icon: "create-outline"
  },
  {
    q: "I uploaded images but they are not showing correctly?",
    a: "Ensure the images are clear and selected fully before saving. If the issue persists, try re-uploading the images or restarting the app.",
    icon: "image-outline"
  },
  {
    q: "Is payment handled inside the app?",
    a: "Currently, payment handling may vary by owner. Integrated in-app payments will be added in future updates.",
    icon: "card-outline"
  },
  {
    q: "How do I contact support if something goes wrong?",
    a: "You can reach us directly via the buttons above or email us at support@wheelx.com. We're available Mon-Fri, 10 AM – 5 PM.",
    icon: "headset-outline"
  },
];

export default function HelpSupport() {
  const navigation = useNavigation<any>();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#F9FAFB",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#374151" : "#E5E7EB",
    accent: "#e53935",
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleContact = (type: 'email' | 'call') => {
    if (type === 'email') Linking.openURL("mailto:support@wheelx.com");
    else Linking.openURL("tel:+917718939287");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Image source={require("../../assets/logo3.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Text style={[styles.title, { color: colors.text }]}>How can we help?</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>
            Find answers to common questions or reach out to our team.
          </Text>
        </View>

        <View style={styles.contactCardsRow}>
          <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.card }]} onPress={() => handleContact('call')}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent + "15" }]}>
              <Ionicons name="call" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.contactLabel, { color: colors.text }]}>Call Us</Text>
            <Text style={[styles.contactSub, { color: colors.subText }]}>Mon-Fri, 10-5</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.card }]} onPress={() => handleContact('email')}>
            <View style={[styles.iconCircle, { backgroundColor: "#3b82f615" }]}>
              <Ionicons name="mail" size={22} color="#3b82f6" />
            </View>
            <Text style={[styles.contactLabel, { color: colors.text }]}>Email Us</Text>
            <Text style={[styles.contactSub, { color: colors.subText }]}>24/7 Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.faqSection}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Common Questions</Text>
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <Animated.View
                key={index}
                layout={Layout.springify()}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: open ? colors.accent + "33" : "transparent",
                    borderWidth: 1
                  }
                ]}
              >
                <TouchableOpacity style={styles.questionRow} onPress={() => toggleFAQ(index)} activeOpacity={0.7}>
                  <View style={styles.qLeft}>
                    <View style={[styles.qIconBox, { backgroundColor: colors.bg }]}>
                      <Ionicons name={item.icon as any} size={18} color={colors.subText} />
                    </View>
                    <Text style={[styles.question, { color: colors.text }]}>{item.q}</Text>
                  </View>
                  <Ionicons name={open ? "chevron-up" : "chevron-forward"} size={20} color={open ? colors.accent : colors.subText} />
                </TouchableOpacity>

                {open && (
                  <Animated.View
                    entering={FadeInUp.duration(300)}
                    exiting={FadeOutUp.duration(200)}
                    style={styles.answerArea}
                  >
                    <View style={[styles.answerDivider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.answer, { color: colors.subText }]}>{item.a}</Text>
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subText }]}>Locked with Encryption • WheelX Support v2.0</Text>
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  backBtn: { padding: 8 },
  logo: { width: 120, height: 50 },
  content: { padding: 20, paddingBottom: 40 },
  topSection: { marginBottom: 24, paddingHorizontal: 4 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, fontWeight: "500" },
  contactCardsRow: { flexDirection: "row", gap: 16, marginBottom: 32 },
  contactCard: { flex: 1, borderRadius: 24, padding: 20, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  contactLabel: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  contactSub: { fontSize: 12, fontWeight: "600" },
  faqSection: { marginTop: 8 },
  sectionHeading: { fontSize: 18, fontWeight: "800", marginBottom: 16, marginLeft: 4 },
  faqCard: { borderRadius: 20, marginBottom: 12, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  questionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18 },
  qLeft: { flex: 1, flexDirection: "row", alignItems: "center", paddingRight: 10 },
  qIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  question: { fontSize: 15, fontWeight: "700", flex: 1, lineHeight: 20 },
  answerArea: { paddingHorizontal: 18, paddingBottom: 20 },
  answerDivider: { height: 1, marginBottom: 15, opacity: 0.3 },
  answer: { fontSize: 14, lineHeight: 22, fontWeight: "500" },
  footer: { marginTop: 32, alignItems: "center", opacity: 0.6 },
  footerText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});
