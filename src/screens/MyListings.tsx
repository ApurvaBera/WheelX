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
import { supabase } from "../supabase";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH } from "../utils/responsive";

const width = SCREEN_WIDTH;

export default function MyListings() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#ffffff",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#555",
    border: isDark ? "#374151" : "#e53935",
    inputBg: isDark ? "#111827" : "#f2f2f2",
  };

  const [listings, setListings] = useState<any[]>([]);

  const fetchListings = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const [sellResult, rentResult] = await Promise.all([
        supabase
          .from("sellbikes")
          .select("*")
          .eq("owner_id", userData.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("rentbikes")
          .select("*")
          .eq("owner_id", userData.user.id)
          .order("created_at", { ascending: false })
      ]);

      const sellBikes = sellResult.data?.map(b => ({ ...b, listing_type: 'sale' })) || [];
      const rentBikes = rentResult.data?.map(b => ({ ...b, listing_type: 'rental' })) || [];

      const combined = [...sellBikes, ...rentBikes].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setListings(combined);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchListings();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Image source={require("../../assets/logo3.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 26 }} />
      </View>

      {listings.length === 0 ? (
        <View style={styles.centerArea}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="list-outline" size={80} color={colors.subText + "44"} />
          </View>
          <Text style={[styles.placeholder, { color: colors.text }]}>No listings yet</Text>
          <Text style={[styles.subText, { color: colors.subText }]}>Bikes you list for sale or rental will appear here.</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={styles.listNowBtn}
              onPress={() => navigation.navigate("Tabs", { screen: "Sell" })}
            >
              <Text style={styles.listNowText}>Sell Bike</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.listNowBtn, { backgroundColor: '#1F2937' }]}
              onPress={() => navigation.navigate("RentYourBike")}
            >
              <Text style={styles.listNowText}>Rent Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.listHeader}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>My Listed Bikes</Text>
            <Text style={[styles.countBadge, { color: colors.subText }]}>{listings.length} active</Text>
          </View>

          <FlatList
            data={listings}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const uPrice = Number(item.price?.replace(/[^0-9]/g, ""));
              const mPrice = item.listing_type === 'sale' ? Number(item.avg_price?.replace(/[^0-9]/g, "")) : uPrice;
              const isSale = item.listing_type === 'sale';

              const dealType = isSale
                ? (uPrice <= mPrice * 0.9 ? "Good Deal" : uPrice <= mPrice * 1.1 ? "Fair" : "Premium")
                : "Active";
              const dealColor = isSale
                ? (dealType === "Good Deal" ? "#16a34a" : dealType === "Fair" ? "#eab308" : "#e53935")
                : "#3B82F6";

              return (
                <TouchableOpacity
                  activeOpacity={0.95}
                  style={[styles.enhancedCard, { backgroundColor: colors.card }]}
                  onPress={() => {
                    if (isSale) {
                      navigation.navigate("Tabs", { screen: "Sell", params: { initialBike: item } });
                    } else {
                      navigation.navigate("RentYourBike");
                    }
                  }}
                >
                  <View style={styles.cardImagePart}>
                    <Image source={{ uri: item.images?.[0] }} style={styles.enhancedImage} resizeMode="cover" />
                    <View style={styles.imageOverlayTop}>
                      <View style={[styles.dealBadge, { backgroundColor: dealColor }]}>
                        <Text style={styles.dealText}>{isSale ? dealType : "FOR RENT"}</Text>
                      </View>
                    </View>
                    <View style={styles.imageOverlayBottom}>
                      <View style={styles.priceTag}>
                        <Text style={styles.priceTagText}>{item.price}{!isSale && <Text style={{ fontSize: 12 }}>/day</Text>}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardInfoPart}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.enhancedTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.company} {item.model}
                      </Text>
                      <View style={[styles.yearBadge, { backgroundColor: colors.inputBg }]}>
                        <Text style={[styles.yearText, { color: colors.subText }]}>
                          {isSale ? item.year : "Rental"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      {isSale ? (
                        <>
                          <View style={styles.metaItem}>
                            <Ionicons name="speedometer-outline" size={14} color={colors.subText} />
                            <Text style={[styles.metaText, { color: colors.subText }]}>{item.km} km</Text>
                          </View>
                        </>
                      ) : (
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar-outline" size={14} color={colors.subText} />
                          <Text style={[styles.metaText, { color: colors.subText }]}>Flexible Dates</Text>
                        </View>
                      )}
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color={colors.subText} />
                        <Text style={[styles.metaText, { color: colors.subText }]} numberOfLines={1}>{item.location.split(',')[0]}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: verticalScale(110), backgroundColor: "#e53935", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(16), paddingTop: verticalScale(20), borderBottomLeftRadius: moderateScale(32), borderBottomRightRadius: moderateScale(32) },
  logo: { width: scale(110), height: scale(45) },
  backBtn: { padding: moderateScale(4) },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(20), paddingTop: verticalScale(16), paddingBottom: verticalScale(8) },
  sectionHeading: { fontSize: rf(24), fontWeight: "900" },
  countBadge: { fontSize: rf(14), fontWeight: '600', opacity: 0.6 },
  centerArea: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: scale(40) },
  emptyIconContainer: { width: scale(120), height: scale(120), borderRadius: scale(60), backgroundColor: '#e5393511', alignItems: 'center', justifyContent: 'center', marginBottom: verticalScale(20) },
  placeholder: { fontSize: rf(20), fontWeight: "800", marginBottom: verticalScale(8) },
  subText: { fontSize: rf(15), textAlign: 'center', opacity: 0.7, lineHeight: verticalScale(22), marginBottom: verticalScale(24) },
  listNowBtn: { backgroundColor: '#e53935', paddingHorizontal: scale(24), paddingVertical: verticalScale(14), borderRadius: moderateScale(14), elevation: 5, shadowColor: '#e53935', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.3, shadowRadius: moderateScale(8) },
  listNowText: { color: '#fff', fontSize: rf(16), fontWeight: '800' },
  enhancedCard: { marginHorizontal: scale(16), marginVertical: verticalScale(10), borderRadius: moderateScale(24), overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: verticalScale(4) }, shadowOpacity: 0.1, shadowRadius: moderateScale(10) },
  cardImagePart: { width: '100%', height: verticalScale(200), position: 'relative' },
  enhancedImage: { width: '100%', height: '100%' },
  imageOverlayTop: { position: 'absolute', top: verticalScale(12), left: scale(12), right: scale(12), flexDirection: 'row', justifyContent: 'space-between' },
  imageOverlayBottom: { position: 'absolute', bottom: verticalScale(12), left: scale(12) },
  dealBadge: { paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: moderateScale(10) },
  dealText: { color: '#fff', fontSize: rf(12), fontWeight: '800' },
  priceTag: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: moderateScale(10) },
  priceTagText: { color: '#fff', fontSize: rf(16), fontWeight: '900' },
  cardInfoPart: { padding: moderateScale(16) },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(12) },
  enhancedTitle: { fontSize: rf(18), fontWeight: '800', flex: 1, marginRight: scale(10) },
  yearBadge: { paddingHorizontal: scale(10), paddingVertical: verticalScale(4), borderRadius: moderateScale(8) },
  yearText: { fontSize: rf(12), fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: scale(16) },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
  metaText: { fontSize: rf(13), fontWeight: '600' },
});
