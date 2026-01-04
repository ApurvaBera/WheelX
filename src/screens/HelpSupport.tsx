import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

const FAQS = [
  {
    q: "Why am I unable to book a bike for certain dates?",
    a: "Some bikes are already booked for those dates or the owner has marked them unavailable. Try changing the date range or selecting a different bike.",
  },
  {
    q: "I selected a date range but no bikes are showing. What should I do?",
    a: "This usually means no bikes are available for the selected period in that location. Try reducing the date range or changing the city.",
  },
  {
    q: "Why is my bike listing not visible to other users?",
    a: "Make sure all required details are filled, at least one image is uploaded, and the listing is saved successfully. Incomplete listings are not shown publicly.",
  },
  {
    q: "Can I edit or remove my bike listing after posting?",
    a: "Yes. Go to Profile → My Listings, select the listing, and choose Edit or Delete.",
  },
  {
    q: "I uploaded images but they are not showing correctly.",
    a: "Ensure the images are clear and selected fully before saving. If the issue persists, try re-uploading the images or restarting the app.",
  },
  {
    q: "Is payment handled inside the app?",
    a: "Currently, payment handling may vary by owner. Integrated in-app payments will be added in future updates.",
  },
  {
    q: "How do I contact support if something goes wrong?",
    a:
      "If you face any issues that are not resolved here, you can contact our support team.\n\n" +
      "📧 Email: support@wheelx.com\n" +
      "📞 Phone: +91 77189 39287 / 85917 32262\n\n" +
      "Monday to Friday, 10 AM – 5 PM.",
  },
];

export default function HelpSupport() {
  const navigation = useNavigation<any>();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#ffffff",
    card: isDark ? "#1F2937" : "#F9FAFB",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    icon: isDark ? "#D1D5DB" : "#6B7280",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Help & Support
        </Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>
          Solutions to common problems and questions
        </Text>

        {FAQS.map((item, index) => {
          const open = openIndex === index;
          return (
            <View
              key={index}
              style={[styles.faqCard, { backgroundColor: colors.card }]}
            >
              <TouchableOpacity
                style={styles.questionRow}
                onPress={() => setOpenIndex(open ? null : index)}
              >
                <Text style={[styles.question, { color: colors.text }]}>
                  {item.q}
                </Text>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>

              {open && (
                <Text style={[styles.answer, { color: colors.subText }]}>
                  {item.a}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 100,
    backgroundColor: "#e53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  logo: {
    width: 120,
    height: 50,
  },

  content: {
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },

  faqCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  question: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
  },

  answer: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
});
