import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH } from "../utils/responsive";

const width = SCREEN_WIDTH;

export default function Fav() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const [favorites, setFavorites] = useState<any[]>([]);

  const colors = {
    bg: isDark ? "#111827" : "#ffffff",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#555",
    accent: "#e53935",
    inputBg: isDark ? "#1F2937" : "#f3f4f6",
  };

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem("favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.log("Failed to load favorites", err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const removeFavorite = async (id: string, e: any) => {
    e.stopPropagation();
    const newFavorites = favorites.filter((item) => item.id !== id);
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
    } catch (err) {
      console.log("Failed to update favorites", err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Wishlist
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{favorites.length}</Text>
          </View>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.centerArea}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-outline" size={80} color={colors.accent + "44"} />
            </View>
            <Text style={[styles.placeholder, { color: colors.text }]}>
              Empty Wishlist
            </Text>
            <Text style={[styles.emptySub, { color: colors.subText }]}>
              Bikes you like will appear here for quick access
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate("Tabs", { screen: "Buy" })}
            >
              <Text style={styles.exploreBtnText}>Explore Bikes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.95}
                style={[styles.favCard, { backgroundColor: colors.card }]}
                onPress={() => {
                  if (item.listing_type === 'rental') {
                    navigation.navigate("RentABike", { initialBike: item });
                  } else {
                    navigation.navigate("Tabs", {
                      screen: "Buy",
                      params: { initialBike: item }
                    });
                  }
                }}
              >
                <View style={styles.imagePart}>
                  <Image
                    source={{ uri: item.images?.[0] }}
                    style={styles.bikeImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={(e) => removeFavorite(item.id, e)}
                  >
                    <Ionicons name="heart" size={22} color={colors.accent} />
                  </TouchableOpacity>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>{item.price}{item.listing_type === 'rental' && <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>/day</Text>}</Text>
                  </View>
                </View>

                <View style={styles.infoPart}>
                  <View style={styles.mainTitleRow}>
                    <Text style={[styles.bikeName, { color: colors.text }]} numberOfLines={1}>
                      {item.company} {item.model}
                    </Text>
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearText}>{item.listing_type === 'rental' ? 'Rental' : item.year}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="speedometer-outline" size={14} color={colors.subText} />
                      <Text style={[styles.metaText, { color: colors.subText }]}>{item.km}</Text>
                    </View>
                    <View style={[styles.metaItem, { marginLeft: 16 }]}>
                      <Ionicons name="location-outline" size={14} color={colors.subText} />
                      <Text style={[styles.metaText, { color: colors.subText }]} numberOfLines={1}>
                        {item.location?.split(',')[0]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewPanelBtn}>
                    <Text style={styles.viewPanelText}>View Details & Book Ride</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: verticalScale(110),
    backgroundColor: "#e53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
  },
  logo: { width: scale(110), height: scale(45) },
  backBtn: { padding: moderateScale(4) },
  body: { flex: 1, paddingHorizontal: scale(16) },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(20), marginBottom: verticalScale(16) },
  sectionHeading: { fontSize: rf(26), fontWeight: "900" },
  countBadge: {
    backgroundColor: "#e5393522",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
    marginLeft: scale(12)
  },
  countText: { color: "#e53935", fontWeight: "800", fontSize: rf(14) },

  centerArea: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: verticalScale(-60) },
  emptyIconCircle: { width: scale(140), height: scale(140), borderRadius: scale(70), backgroundColor: "#e5393508", alignItems: 'center', justifyContent: 'center', marginBottom: verticalScale(24) },
  placeholder: { fontSize: rf(22), fontWeight: "800", marginBottom: verticalScale(8) },
  emptySub: { fontSize: rf(15), textAlign: 'center', paddingHorizontal: scale(40), lineHeight: verticalScale(22), opacity: 0.7 },
  exploreBtn: { backgroundColor: "#e53935", paddingHorizontal: scale(32), paddingVertical: verticalScale(14), borderRadius: moderateScale(16), marginTop: verticalScale(24), elevation: 4 },
  exploreBtnText: { color: "#fff", fontSize: rf(16), fontWeight: "800" },

  favCard: {
    borderRadius: moderateScale(24),
    marginBottom: verticalScale(20),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(10)
  },
  imagePart: { width: "100%", height: verticalScale(190), position: 'relative' },
  bikeImage: { width: "100%", height: "100%" },
  removeIcon: {
    position: "absolute",
    top: verticalScale(12),
    right: scale(12),
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: moderateScale(8),
    borderRadius: moderateScale(14),
    elevation: 4
  },
  priceTag: {
    position: "absolute",
    bottom: verticalScale(12),
    left: scale(12),
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12)
  },
  priceText: { color: "#fff", fontWeight: "900", fontSize: rf(16) },

  infoPart: { padding: moderateScale(16) },
  mainTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(8) },
  bikeName: { fontSize: rf(19), fontWeight: "800", flex: 1 },
  yearBadge: { backgroundColor: "#f3f4f6", paddingHorizontal: scale(10), paddingVertical: verticalScale(4), borderRadius: moderateScale(8) },
  yearText: { fontSize: rf(12), fontWeight: "700", color: "#6b7280" },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(16) },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
  metaText: { fontSize: rf(13), fontWeight: "600" },

  viewPanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(14),
    backgroundColor: "#e5393508"
  },
  viewPanelText: { color: "#e53935", fontWeight: "800", marginRight: scale(6), fontSize: rf(14) },
});
