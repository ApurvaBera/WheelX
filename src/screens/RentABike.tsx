import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

export default function RentABike() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const colors = {
    bg: isDark ? "#111827" : "#f5f5f5",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    accent: "#e53935",
  };

  const onDayPress = (day: any) => {
    const date = day.dateString;

    if (start === date && !end) {
      setStart(null);
      setEnd(null);
      return;
    }

    if (!start || (start && end)) {
      setStart(date);
      setEnd(null);
      return;
    }

    if (!end) {
      if (new Date(date) < new Date(start)) {
        setEnd(start);
        setStart(date);
      } else {
        setEnd(date);
      }
    }
  };

  const markedDates: any = {};

  if (start && !end) {
    markedDates[start] = {
      customStyles: {
        container: {
          height: 32,
          backgroundColor: colors.accent,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        },
        text: {
          color: "#fff",
          fontWeight: "700",
        },
      },
    };
  }

  if (start && end) {
    let cur = new Date(start);
    const last = new Date(end);

    while (cur <= last) {
      const d = cur.toISOString().split("T")[0];
      const dayOfWeek = cur.getDay();
      const isStartOfWeek = dayOfWeek === 0;
      const isEndOfWeek = dayOfWeek === 6;

      if (d === start) {
        markedDates[d] = {
          customStyles: {
            container: {
              height: 32,
              backgroundColor: colors.accent,
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
              borderTopRightRadius: isEndOfWeek ? 16 : 0,
              borderBottomRightRadius: isEndOfWeek ? 16 : 0,
              alignItems: "center",
              justifyContent: "center",
              width: isEndOfWeek ? "100%" : "110%",
              marginRight: isEndOfWeek ? 0 : "-5%",
            },
            text: {
              color: "#fff",
              fontWeight: "700",
            },
          },
        };
      } else if (d === end) {
        markedDates[d] = {
          customStyles: {
            container: {
              height: 32,
              backgroundColor: colors.accent,
              borderTopLeftRadius: isStartOfWeek ? 16 : 0,
              borderBottomLeftRadius: isStartOfWeek ? 16 : 0,
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              width: isStartOfWeek ? "100%" : "110%",
              marginLeft: isStartOfWeek ? 0 : "-5%",
            },
            text: {
              color: "#fff",
              fontWeight: "700",
            },
          },
        };
      } else {
        markedDates[d] = {
          customStyles: {
            container: {
              backgroundColor: colors.accent,
              height: 32,
              borderTopLeftRadius: isStartOfWeek ? 16 : 0,
              borderBottomLeftRadius: isStartOfWeek ? 16 : 0,
              borderTopRightRadius: isEndOfWeek ? 16 : 0,
              borderBottomRightRadius: isEndOfWeek ? 16 : 0,
              justifyContent: "center",
              alignItems: "center",
              width: isStartOfWeek || isEndOfWeek ? "100%" : "120%",
              marginLeft: isStartOfWeek ? 0 : "-10%",
            },
            text: {
              color: "#fff",
              fontWeight: "600",
            },
          },
        };
      }

      cur.setDate(cur.getDate() + 1);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rent</Text>
      </View>

      <View style={[styles.calendarBox, { backgroundColor: colors.card }]}>
        <Calendar
          minDate={today}
          markingType="custom"
          markedDates={markedDates}
          onDayPress={onDayPress}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            arrowColor: colors.accent,
            todayTextColor: colors.accent,
            textDisabledColor: "#6B7280",
          }}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Available Bikes
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#e53935",
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  calendarBox: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 22,
    fontWeight: "800",
  },
});
