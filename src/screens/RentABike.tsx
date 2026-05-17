import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  StatusBar,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInUp,
  FadeOutUp,
  FadeIn,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { sendNotification } from "../utils/notifications";
import { useNotifications } from "../context/NotificationContext";

const { width } = Dimensions.get("window");

const PLACEHOLDER_ITEMS = ["Location", "Price", "Company", "Model", "Location"];
const ITEM_HEIGHT = 30;

export default function RentABike() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();
  const { showNotification } = useNotifications();

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBike, setSelectedBike] = useState<any>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [expandedSections, setExpandedSections] = useState({
    companies: true,
    price: false,
    date: false,
  });

  const slideValue = useSharedValue(width);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideValue.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slideValue.value, [0, width], [1, 0]),
  }));

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOpenFilters = () => {
    slideValue.value = width;
    setFilterVisible(true);
    slideValue.value = withSpring(0, { damping: 45, stiffness: 80 });
  };

  const handleCloseFilters = () => {
    slideValue.value = withTiming(width, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(setFilterVisible)(false);
      }
    });
  };

  const resetFilters = () => {
    setSelectedCompanies([]);
    setPriceRange([0, 5000]);
  };

  // Placeholder Animation
  const scrollY = useSharedValue(0);
  useEffect(() => {
    let isMounted = true;
    const runAnimation = (step = 0) => {
      if (!isMounted) return;
      if (step === PLACEHOLDER_ITEMS.length - 1) {
        step = 0;
        scrollY.value = 0;
      }
      setTimeout(() => {
        if (!isMounted) return;
        scrollY.value = withTiming(-(step + 1) * ITEM_HEIGHT, { duration: 500 }, () => {
          runOnJS(runAnimation)(step + 1);
        });
      }, 2000);
    };
    runAnimation();
    return () => { isMounted = false; };
  }, [scrollY]);

  const placeholderStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value }],
  }));

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const localToday = getTodayDate();

  const colors = {
    bg: isDark ? "#111827" : "#f5f5f5",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    accent: "#e53935",
    border: isDark ? "#374151" : "#E5E7EB",
    inputBg: isDark ? "#374151" : "#F9FAFB",
    success: "#10B981",
  };

  const fetchBikes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('rentbikes').select('*').eq('is_available', true);
      if (start && end) {
        query = query.lte('start_date', start).gte('end_date', end);
      }
      const { data, error } = await query;
      if (error) throw error;
      setBikes(data || []);
    } catch (err) {
      console.error("Error fetching bikes:", err);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.log("Failed to load favorites", err);
    }
  }, []);

  const toggleFavorite = async (bike: any) => {
    let newFavorites;
    const isFav = favorites.some((f: any) => f.id === bike.id);
    if (isFav) {
      newFavorites = favorites.filter((f: any) => f.id !== bike.id);
    } else {
      newFavorites = [...favorites, { ...bike, listing_type: 'rental' }];
    }
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
    } catch (err) {
      console.log("Failed to save favorites", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      fetchBikes();
    }, [loadFavorites, fetchBikes])
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (route.params?.initialBike) {
      setSelectedBike(route.params.initialBike);
      // Also fetch owner details if available
      const fetchOwner = async () => {
        const { data: profile } = await supabase.from('profiles').select('name, phone').eq('id', route.params.initialBike.owner_id).single();
        if (profile) setSelectedBike((prev: any) => ({ ...prev, owner: profile }));
      }
      fetchOwner();
      navigation.setParams({ initialBike: null });
    }
  }, [route.params?.initialBike, navigation]);

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

  const getMarkedDates = () => {
    const marked: any = {};
    if (start) marked[start] = { startingDay: true, color: colors.accent, textColor: 'white' };
    if (end) marked[end] = { endingDay: true, color: colors.accent, textColor: 'white' };
    if (start && end) {
      let curr = new Date(start);
      const last = new Date(end);
      while (curr < last) {
        curr.setDate(curr.getDate() + 1);
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        const d = `${y}-${m}-${dd}`;
        if (d !== end) marked[d] = { color: colors.accent + '44', textColor: colors.text };
      }
    }
    return marked;
  };

  const getRollingDates = (sDate: string, eDate: string) => {
    const todayObj = new Date(localToday);
    const startObj = new Date(sDate);
    const endObj = new Date(eDate);
    if (startObj < todayObj) {
      const diffTime = todayObj.getTime() - startObj.getTime();
      const adjEnd = new Date(endObj.getTime() + diffTime);
      const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      };
      return { start: localToday, end: fmt(adjEnd) };
    }
    return { start: sDate, end: eDate };
  };

  const filteredBikes = useMemo(() => {
    let result = [...bikes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.company?.toLowerCase().includes(q) ||
        b.model?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q)
      );
    }
    if (selectedCompanies.length > 0) {
      result = result.filter(b => selectedCompanies.includes(b.company));
    }
    result = result.filter(b => {
      const p = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
      return p >= priceRange[0] && p <= priceRange[1];
    });
    return result;
  }, [bikes, searchQuery, selectedCompanies, priceRange]);

  const toggleCompany = (company: string) => {
    setSelectedCompanies(prev => prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]);
  };

  const handleRequestBooking = async () => {
    if (!selectedBike || !currentUser) return;
    try {
      await showNotification({
        title: "Rental Requested",
        message: `Requested ${selectedBike.company} ${selectedBike.model}.`,
        icon: "calendar",
        color: "#3B82F6",
      });
      await sendNotification({
        userId: selectedBike.owner_id,
        title: "New Rental Request",
        message: `${currentUser.user_metadata?.full_name || 'A user'} wants to rent your bike.`,
        icon: "calendar",
        color: "#F59E0B",
        type: "booking_request",
        payload: { bikeId: selectedBike.id, buyerId: currentUser.id, bikeName: `${selectedBike.company} ${selectedBike.model}`, isRental: true }
      });
      Alert.alert("Success", "Request sent!");
      setSelectedBike(null);
    } catch (err) {
      Alert.alert("Error", "Failed to send request.");
    }
  };

  const renderBikeItem = ({ item, index }: { item: any, index: number }) => {
    const isFav = favorites.some((f: any) => f.id === item.id);
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).springify()} layout={Layout.springify()}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={async () => {
            setSelectedBike(item);
            const { data: profile } = await supabase.from('profiles').select('name, phone').eq('id', item.owner_id).single();
            if (profile) setSelectedBike((prev: any) => ({ ...prev, owner: profile }));
          }}
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <View>
            <FlatList
              data={item.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: img }) => (
                <Image source={{ uri: img }} style={{ width: width - 32, height: 180 }} resizeMode="cover" />
              )}
              keyExtractor={(_, i) => i.toString()}
            />
            {item.images?.length > 1 && (
              <View style={styles.indicatorContainer}>
                {item.images.map((_: any, i: number) => (
                  <View key={i} style={[styles.indicatorDot, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.favIcon} onPress={() => toggleFavorite(item)}>
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={24}
                color={isFav ? colors.accent : "#ffffff"}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{item.price}/day</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.company} {item.model}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color={colors.subText} />
                <Text style={[styles.cardLocation, { color: colors.subText }]}>{item.location}</Text>
              </View>
            </View>
            <View style={[styles.datePill, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="calendar-outline" size={14} color={colors.accent} />
              <Text style={[styles.datePillText, { color: colors.text }]}>
                {(() => {
                  const { start: rs, end: re } = getRollingDates(item.start_date, item.end_date);
                  return `${new Date(rs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(re).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                })()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rent A Bike</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.filterButtonWrapper}>
          <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}>
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurContainer}>
              <Ionicons name="search" size={20} color={colors.subText} style={{ marginLeft: 12, marginRight: 8 }} />
              {searchQuery.length === 0 && (
                <View pointerEvents="none" style={styles.placeholderContainer}>
                  <Text style={{ color: colors.subText, fontSize: 16 }}>Search by </Text>
                  <View style={{ height: ITEM_HEIGHT, overflow: 'hidden' }}>
                    <Animated.View style={placeholderStyle}>
                      {PLACEHOLDER_ITEMS.map((opt, i) => (
                        <Text key={i} style={{ height: ITEM_HEIGHT, lineHeight: ITEM_HEIGHT, color: colors.subText, fontSize: 16, fontWeight: '600' }}>{opt}...</Text>
                      ))}
                    </Animated.View>
                  </View>
                </View>
              )}
              <TextInput style={[styles.searchInput, { color: colors.text }]} value={searchQuery} onChangeText={setSearchQuery} />
            </BlurView>
          </View>
          <TouchableOpacity style={[styles.miniFilterButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleOpenFilters}>
            <Ionicons name="options-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <Animated.View layout={Layout.springify()} style={styles.calendarContainer}>
          <TouchableOpacity
            style={[styles.sectionHeaderDropdown, { backgroundColor: colors.card }]}
            onPress={() => toggleSection('date')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconBox, { backgroundColor: colors.accent + '15' }]}>
                <Ionicons name="calendar" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.sectionTitleDropdown, { color: colors.text }]}>{start && end ? `${start} to ${end}` : "Select Dates"}</Text>
            </View>
            <Ionicons name={expandedSections.date ? "chevron-up" : "chevron-down"} size={20} color={expandedSections.date ? colors.accent : colors.subText} />
          </TouchableOpacity>
          {expandedSections.date && (
            <Animated.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)} style={[styles.calendarBox, { backgroundColor: colors.card, marginTop: 12 }]}>
              <Calendar
                minDate={localToday}
                markingType="period"
                markedDates={getMarkedDates()}
                onDayPress={onDayPress}
                theme={{ calendarBackground: colors.card, dayTextColor: colors.text, monthTextColor: colors.text, arrowColor: colors.accent, todayTextColor: colors.accent, selectedDayBackgroundColor: colors.accent, selectedDayTextColor: '#ffffff' }}
              />
            </Animated.View>
          )}
        </Animated.View>

        <View style={styles.listContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Available Rides</Text>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>{filteredBikes.length} bikes</Text>
          </View>
          {loading ? <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} /> : (
            <FlatList
              data={filteredBikes}
              renderItem={renderBikeItem}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              contentContainerStyle={{ padding: 16, paddingTop: 0 }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.subText, marginTop: 20 }}>No bikes found.</Text>}
            />
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal visible={!!selectedBike} animationType="fade" transparent>
        {selectedBike && (
          <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
            <View style={styles.detailOverlay}>
              <Animated.View entering={FadeInUp.springify()} style={[styles.detailCard, { backgroundColor: colors.card }]}>
                <View>
                  <FlatList
                    data={selectedBike.images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item: img }) => <Image source={{ uri: img }} style={{ width: width - 40, height: 250 }} resizeMode="cover" />}
                    keyExtractor={(_, i) => i.toString()}
                  />
                  <TouchableOpacity style={styles.closeDetail} onPress={() => setSelectedBike(null)}>
                    <Ionicons name="close-circle" size={32} color={colors.accent} />
                  </TouchableOpacity>
                </View>
                <View style={styles.detailBody}>
                  <View style={styles.detailHeader}><Text style={[styles.detailTitle, { color: colors.text }]}>{selectedBike.company} {selectedBike.model}</Text><Text style={[styles.detailPrice, { color: colors.accent }]}>{selectedBike.price}</Text></View>
                  <View style={styles.detailRow}><Ionicons name="location-sharp" size={18} color={colors.subText} /><Text style={[styles.detailText, { color: colors.subText }]}>{selectedBike.location}</Text></View>
                  <View style={[styles.sellerCard, { backgroundColor: colors.inputBg, marginTop: 20 }]}><View style={styles.sellerAvatar}><Ionicons name="person" size={24} color={colors.subText} /></View><View style={{ marginLeft: 12 }}><Text style={[styles.sellerName, { color: colors.text }]}>{selectedBike.owner?.name || "Verified Host"}</Text><Text style={[styles.sellerLabel, { color: colors.subText }]}>{selectedBike.owner?.phone || "Host"}</Text></View></View>
                  {currentUser?.id !== selectedBike.owner_id && <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={handleRequestBooking}><Text style={styles.actionBtnText}>Request Booking</Text></TouchableOpacity>}
                </View>
              </Animated.View>
            </View>
          </BlurView>
        )}
      </Modal>

      {/* Filter Sidebar */}
      {filterVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, overlayStyle]}><TouchableOpacity style={{ flex: 1 }} onPress={handleCloseFilters} /></Animated.View>
          <Animated.View style={[styles.filterSidebar, { backgroundColor: colors.card }, sidebarStyle]}>
            <View style={styles.filterHeader}><Text style={[styles.filterTitle, { color: '#fff' }]}>Filters</Text><TouchableOpacity onPress={handleCloseFilters}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity></View>
            <ScrollView style={{ padding: 20 }}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Brands</Text>
              {["Hero MotoCorp", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM"].map(c => (
                <TouchableOpacity key={c} style={styles.checkboxRow} onPress={() => toggleCompany(c)}>
                  <View style={[styles.checkbox, selectedCompanies.includes(c) && styles.checkboxActive, { borderColor: colors.border }]}>{selectedCompanies.includes(c) && <Ionicons name="checkmark" size={16} color="#fff" />}</View>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.filterActions}>
              <TouchableOpacity style={[styles.filterActionButton, styles.resetButton]} onPress={resetFilters}><Text style={styles.resetButtonText}>Reset</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.filterActionButton, styles.applyButton]} onPress={handleCloseFilters}><Text style={styles.applyButtonText}>Show</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, backgroundColor: '#e53935', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  filterButtonWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  searchContainer: { flex: 1, height: 52, borderRadius: 16, overflow: 'hidden' },
  blurContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  placeholderContainer: { ...StyleSheet.absoluteFillObject, left: 44, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, fontSize: 16, paddingLeft: 4, color: '#000' },
  miniFilterButton: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  calendarContainer: { marginTop: 20 },
  sectionHeaderDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, marginHorizontal: 16, elevation: 2 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitleDropdown: { fontSize: 16, fontWeight: '700' },
  calendarBox: { marginHorizontal: 16, borderRadius: 16, overflow: "hidden", paddingBottom: 4 },
  listContainer: { flex: 1, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  card: { borderRadius: 18, marginBottom: 20, overflow: 'hidden', elevation: 4, marginHorizontal: 16 },
  cardBadge: { position: 'absolute', right: 12, top: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  cardBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cardContent: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocation: { fontSize: 13 },
  datePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  datePillText: { fontSize: 11, fontWeight: '600' },
  favIcon: { position: "absolute", top: 12, left: 12, zIndex: 15, backgroundColor: "rgba(0,0,0,0.25)", padding: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  indicatorContainer: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  detailOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  detailCard: { borderRadius: 24, overflow: 'hidden', elevation: 10 },
  detailBody: { padding: 24 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailTitle: { fontSize: 22, fontWeight: '800', flex: 1, marginRight: 10 },
  detailPrice: { fontSize: 18, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 15 },
  sellerCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  sellerName: { fontSize: 16, fontWeight: '700' },
  sellerLabel: { fontSize: 13, fontWeight: '500' },
  actionBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeDetail: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  filterSidebar: { position: 'absolute', right: 0, top: 0, width: width * 0.8, height: '100%', elevation: 10, zIndex: 1000 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 100, backgroundColor: '#e53935', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingTop: 30 },
  filterTitle: { fontSize: 24, fontWeight: '800' },
  filterSectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: '#e53935', borderColor: '#e53935' },
  checkboxLabel: { fontSize: 16, fontWeight: '500' },
  filterActions: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  filterActionButton: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resetButton: { backgroundColor: 'rgba(0,0,0,0.05)' },
  resetButtonText: { color: '#666', fontWeight: 'bold' },
  applyButton: { backgroundColor: '#e53935' },
  applyButtonText: { color: '#fff', fontWeight: 'bold' },
});
