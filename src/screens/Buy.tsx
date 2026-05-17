import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  Animated,
  Pressable,
  Linking
} from "react-native";
import AnimatedRE, {
  FadeInUp,
  FadeOutUp,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
  interpolate,
  SlideInDown,
  SlideOutDown
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { useEffect } from "react";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH, SCREEN_HEIGHT } from "../utils/responsive";
import { sendNotification } from "../utils/notifications";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const companies = [
  "Hero MotoCorp",
  "Honda",
  "TVS",
  "Bajaj",
  "Royal Enfield",
  "Yamaha",
  "Suzuki",
  "KTM",
];
const categories = [
  "Standard",
  "Adventure",
  "Cruiser",
  "Sport",
  "Naked",
  "Scooter",
];



const PLACEHOLDER_ITEMS = ["Location", "Price", "Company", "Category", "Location"];
const ITEM_HEIGHT = 30;

export default function Buy() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<string>("All");
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [bikes, setBikes] = useState<any[]>([]);
  const [selectedBike, setSelectedBike] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [favorites, setFavorites] = useState<any[]>([]);

  // Filter states
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([10000, 1000000]);
  const [searchQuery, setSearchQuery] = useState("");
  const slideValue = useSharedValue(SCREEN_WIDTH);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideValue.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slideValue.value, [0, SCREEN_WIDTH], [1, 0]),
  }));


  const [expandedSections, setExpandedSections] = useState({
    companies: true,
    categories: false,
    sortBy: false,
    price: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (route.params?.initialCategory) {
      setSelectedCategories([route.params.initialCategory]);
      // Clear immediately so it doesn't stick
      navigation.setParams({ initialCategory: null });
    }
    if (route.params?.initialBike) {
      openBikeDetails(route.params.initialBike);
      // Clear params to avoid re-opening on mount
      navigation.setParams({ initialBike: null });
    }
  }, [route.params?.initialCategory, route.params?.initialBike]);


  // Placeholder Animation
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    let isMounted = true;
    const runAnimation = (step = 0) => {
      if (!isMounted) return;

      // If we are at the last item (duplicate Location), reset to 0 (real Location) INSTANTLY
      // effectively completing the loop seamlessly
      if (step === PLACEHOLDER_ITEMS.length - 1) {
        step = 0;
        scrollY.setValue(0);
      }

      Animated.sequence([
        Animated.delay(2000), // Stay on the current item for 2s
        Animated.timing(scrollY, {
          toValue: -(step + 1) * ITEM_HEIGHT, // Slide to next
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(({ finished }) => {
        if (finished && isMounted) {
          runAnimation(step + 1);
        }
      });
    };

    runAnimation();
    return () => { isMounted = false; };
  }, []);

  const handleOpenFilters = () => {
    setFilterVisible(true);
    slideValue.value = withSpring(0, {
      damping: 25,
      stiffness: 120,
      mass: 1,
    });
  };

  const handleCloseFilters = () => {
    slideValue.value = withSpring(SCREEN_WIDTH, {
      damping: 30,
      stiffness: 150,
      mass: 0.8,
    }, () => {
      runOnJS(setFilterVisible)(false);
    });
  };


  const colors = {
    bg: isDark ? "#111827" : "#f8fafc",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#64748b",
    border: isDark ? "#374151" : "#e2e8f0",
    accent: "#ef4444",
    inputBg: isDark ? "#111827" : "#f1f5f9",
  };

  const detailsY = useSharedValue(SCREEN_HEIGHT); // Start off-screen
  const detailsOpacity = useSharedValue(0);

  const detailAnimationStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: detailsY.value }],
  }));

  const overlayAnimationStyle = useAnimatedStyle(() => ({
    opacity: detailsOpacity.value,
  }));

  const fetchBikes = async () => {
    const { data, error } = await supabase
      .from("sellbikes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("FETCH BIKES ERROR:", error);
    }

    if (!error && data) {
      setBikes(data);
    }
  };

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem("favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.log("Failed to load favorites", err);
    }
  };

  const toggleFavorite = async (bike: any) => {
    let newFavorites;
    if (favorites.some((f) => f.id === bike.id)) {
      newFavorites = favorites.filter((f) => f.id !== bike.id);
    } else {
      newFavorites = [...favorites, { ...bike, listing_type: 'sale' }];
    }
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
    } catch (err) {
      console.log("Failed to save favorites", err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBikes();
      loadFavorites();

      return () => {
        // Reset filters when the screen loses focus (e.g. going back to Home)
        setSelectedCategories([]);
        setSelectedCompanies([]);
        setSearchQuery("");
      };
    }, [])
  );


  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleCompany = (company: string) => {
    setSelectedCompanies(prev =>
      prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company]
    );
  };



  const filteredBikes = React.useMemo(() => {
    let result = [...bikes];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.company && b.company.toLowerCase().includes(query)) ||
        (b.model && b.model.toLowerCase().includes(query)) ||
        (b.location && b.location.toLowerCase().includes(query)) ||
        (b.bike_type && b.bike_type.toLowerCase().includes(query)) ||
        (b.price && b.price.toString().toLowerCase().includes(query))
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter(b => selectedCategories.includes(b.bike_type));
    }

    // Filter by companies
    if (selectedCompanies.length > 0) {
      result = result.filter(b => selectedCompanies.includes(b.company));
    }

    // Filter by price range
    result = result.filter(b => {
      const price = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    if (sortBy === "highToLow") {
      result.sort((a, b) => {
        const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0');
        const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
        return priceB - priceA;
      });
    } else if (sortBy === "lowToHigh") {
      result.sort((a, b) => {
        const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0');
        const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
        return priceA - priceB;
      });
    }

    return result;
  }, [bikes, selectedCategories, selectedCompanies, priceRange, sortBy, searchQuery]);

  const openBikeDetails = async (bike: any) => {
    setSelectedBike(bike);
    setModalVisible(true);
    detailsY.value = withTiming(0, { duration: 400 });
    detailsOpacity.value = withTiming(1, { duration: 300 });

    // Fetch seller info dynamically
    if (bike.owner_id) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, phone")
        .eq("id", bike.owner_id)
        .single();

      if (error) {
        console.log("Error fetching seller details:", error);
      }

      if (profile) {
        setSelectedBike((prev: any) => ({ ...prev, seller: profile }));
      }
    }
  };

  const closeBikeDetails = () => {
    // Fade out overlay quickly
    detailsOpacity.value = withTiming(0, { duration: 300 });

    // Slide down panel and close modal
    detailsY.value = withTiming(SCREEN_HEIGHT, { duration: 350 }, () => {
      runOnJS(setModalVisible)(false);
    });
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const handleBookTestDrive = async () => {
    if (!selectedBike) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Notify Buyer (Local)
      await showNotification({
        title: "Test Drive Requested",
        message: `You've requested a test drive for the ${selectedBike.company} ${selectedBike.model}. Seller will contact you shortly.`,
        icon: "calendar",
        color: "#3B82F6"
      });

      // Notify Seller
      await sendNotification({
        userId: selectedBike.owner_id,
        title: "Test Ride Request",
        message: `${user.user_metadata?.full_name || 'A buyer'} is Interested in your bike ${selectedBike.company} ${selectedBike.model}`,
        icon: "calendar",
        color: "#F59E0B",
        type: "booking_request",
        payload: {
          bikeId: selectedBike.id,
          buyerId: user.id,
          bikeName: `${selectedBike.company} ${selectedBike.model}`
        }
      });

      alert('Test drive booking request sent!');
      setModalVisible(false);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Failed to book test drive. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Image
          source={require("../../assets/logo3.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ width: 28 }} />
      </View>

      {/* Search and Filters */}
      <View style={styles.filterButtonWrapper}>
        <View style={[
          styles.searchContainer,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }
        ]}>
          <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurContainer}>
            <Ionicons name="search" size={20} color={colors.subText} style={{ marginLeft: 12, marginRight: 8 }} />

            {/* Animated Placeholder */}
            {searchQuery.length === 0 && (
              <View pointerEvents="none" style={styles.placeholderContainer}>
                <Text style={{ color: colors.subText, fontSize: 16 }}>Search Bikes by </Text>
                <View style={{ height: ITEM_HEIGHT, overflow: 'hidden', justifyContent: 'flex-start' }}>
                  <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
                    {PLACEHOLDER_ITEMS.map((opt, i) => (
                      <Text key={i} style={{ height: ITEM_HEIGHT, lineHeight: ITEM_HEIGHT, color: colors.subText, fontSize: 16, fontWeight: '600' }}>
                        {opt}...
                      </Text>
                    ))}
                  </Animated.View>
                </View>
              </View>
            )}

            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder=""
              placeholderTextColor="transparent"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleOpenFilters}
        >
          <Ionicons name="filter" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>
          Discover Rides
        </Text>
        <Text style={{ fontSize: 14, color: colors.accent, fontWeight: "700" }}>{filteredBikes.length} found</Text>
      </View>

      <AnimatedRE.FlatList
        data={filteredBikes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={Layout.springify()}
        renderItem={({ item, index }) => (
          <AnimatedRE.View
            entering={FadeInUp.delay(index * 100).duration(400).springify().damping(20)}
            style={[styles.bikeCard, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border + "33" }]}
          >
            <TouchableOpacity
              onPress={() => openBikeDetails(item)}
              activeOpacity={0.9}
            >
              <View style={styles.cardImageWrapper}>
                <Image
                  source={{ uri: item.images?.[0] }}
                  style={styles.bikeImage}
                  resizeMode="cover"
                />
                <View style={[styles.typeBadge, { position: "absolute", top: 12, left: 12 }]}>
                  <Text style={styles.typeBadgeText}>{item.bike_type}</Text>
                </View>
                {user?.id !== item.owner_id && (
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(item)}
                  >
                    <Ionicons
                      name={favorites.some((f) => f.id === item.id) ? "heart" : "heart-outline"}
                      size={22}
                      color={favorites.some((f) => f.id === item.id) ? "#ef4444" : "#ffffff"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.bikeInfo}>
                <View style={styles.infoTopRow}>
                  <Text style={[styles.bikeTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.company} {item.model}
                  </Text>
                  <Text style={styles.bikePrice}>{item.price}</Text>
                </View>

                <View style={styles.infoBottomRow}>
                  <View style={[styles.metaBadge, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.subText }]}>{item.year}</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="speedometer-outline" size={14} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.subText }]}>{item.km}</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="location-outline" size={14} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.subText }]} numberOfLines={1}>{item.location?.split(',')[0]}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </AnimatedRE.View>
        )}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100 }}>
            <Ionicons name="search-outline" size={80} color={colors.subText + "33"} />
            <Text style={{ color: colors.subText, fontSize: 18, fontWeight: "600", marginTop: 20 }}>No bikes found matching your search</Text>
          </View>
        )}
      />

      {/* Bike Details Modal - Small Panel Like Sell Section */}
      <Modal
        visible={modalVisible}
        transparent
        onRequestClose={closeBikeDetails}
      >
        <View style={styles.detailsModalContainer}>
          <AnimatedRE.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.6)" },
              overlayAnimationStyle
            ]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeBikeDetails} />
          </AnimatedRE.View>

          <AnimatedRE.View
            style={[styles.detailsModalPanel, { backgroundColor: colors.card }, detailAnimationStyle]}
          >
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Image Gallery */}
              <View style={styles.modalImageWrapper}>
                {selectedBike?.images && selectedBike.images.length > 1 ? (
                  <FlatList
                    data={selectedBike.images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `image-${index}`}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        onPress={() => openImageModal(index)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: item }}
                          style={{ width: SCREEN_WIDTH, height: 350 }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                  />
                ) : selectedBike?.images?.length === 1 ? (
                  <TouchableOpacity
                    onPress={() => openImageModal(0)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: selectedBike.images[0] }}
                      style={{ width: '100%', height: 350 }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.backBtnCircle}
                  onPress={closeBikeDetails}
                >
                  <Ionicons name="chevron-down" size={28} color="#ffffff" />
                </TouchableOpacity>

              </View>

              <View style={styles.modalDetailsContent}>
                <View style={styles.mainInfoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalDetailTitle, { color: colors.text }]}>
                      {selectedBike?.company} {selectedBike?.model}
                    </Text>
                    <Text style={styles.modalPriceText}>{selectedBike?.price}</Text>
                  </View>
                  <View style={styles.typeBadgeLarge}>
                    <Text style={styles.typeBadgeLargeTxt}>{selectedBike?.bike_type}</Text>
                  </View>
                </View>

                <View style={styles.specGrid}>
                  <View style={{ flexDirection: 'row', gap: scale(12) }}>
                    <View style={[styles.specItem, { backgroundColor: colors.inputBg }]}>
                      <Ionicons name="calendar-outline" size={24} color={colors.accent} />
                      <Text style={[styles.specVal, { color: colors.text }]}>{selectedBike?.year}</Text>
                      <Text style={styles.specLbl}>Year</Text>
                    </View>
                    <View style={[styles.specItem, { backgroundColor: colors.inputBg }]}>
                      <Ionicons name="speedometer-outline" size={24} color={colors.accent} />
                      <Text style={[styles.specVal, { color: colors.text }]}>{selectedBike?.km}</Text>
                      <Text style={styles.specLbl}>Driven</Text>
                    </View>
                  </View>
                  <View style={[styles.specItem, { backgroundColor: colors.inputBg, marginTop: verticalScale(12), width: '100%', flex: 0 }]}>
                    <Ionicons name="location-outline" size={24} color={colors.accent} />
                    <Text style={[styles.specVal, { color: colors.text }]} numberOfLines={1}>{selectedBike?.location?.split(',')[0]}</Text>
                    <Text style={styles.specLbl}>Location</Text>
                  </View>
                </View>

                <View style={styles.descriptionSection}>
                  <Text style={[styles.descTitle, { color: colors.text }]}>Description</Text>
                  <Text style={[styles.descText, { color: colors.subText }]}>
                    {selectedBike?.description || "Experience the thrill of the open road with this well-maintained beauty. Features top-tier performance, sleek aerodynamics, and reliable handling for every journey."}
                  </Text>
                </View>

                {/* Seller Section */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.descTitle, { color: colors.text }]}>Seller Details</Text>
                </View>

                <View style={[styles.sellerCard, { backgroundColor: colors.inputBg, marginBottom: 40 }]}>
                  <View style={styles.sellerAvatar}>
                    <Ionicons name="person" size={30} color={colors.subText} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.sellerName, { color: colors.text }]}>
                      {selectedBike?.seller?.name || (Array.isArray(selectedBike?.seller) ? selectedBike?.seller[0]?.name : null) || "WheelX Seller"}
                    </Text>
                    <Text style={[styles.sellerLabel, { color: colors.subText }]}>
                      {selectedBike?.seller?.phone || (Array.isArray(selectedBike?.seller) ? selectedBike?.seller[0]?.phone : null) || "Verified Seller"}
                    </Text>
                  </View>
                </View>

                {user?.id !== selectedBike?.owner_id && (
                  <TouchableOpacity
                    style={[styles.actionBtnPrimary, { marginTop: 10, marginBottom: 40 }]}
                    onPress={handleBookTestDrive}
                  >
                    <Ionicons name="calendar-outline" size={22} color="#fff" />
                    <Text style={styles.actionBtnPrimaryTxt}>Book a Test Ride</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </AnimatedRE.View>
        </View>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          <FlatList
            data={selectedBike?.images || []}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedImageIndex}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `full-image-${index}`}
            getItemLayout={(data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          />
        </View>
      </Modal>

      {/* Filter Sidebar Component */}
      {filterVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <AnimatedRE.View
            style={[styles.filterOverlay, overlayStyle]}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={handleCloseFilters}
            />
          </AnimatedRE.View>

          <AnimatedRE.View
            style={[
              styles.filterSidebar,
              sidebarStyle,
              {
                backgroundColor: colors.card,
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                borderTopLeftRadius: 28,
                borderBottomLeftRadius: 28,
                overflow: 'hidden'
              }
            ]}
          >
            <View style={[styles.filterHeader, { backgroundColor: '#e53935' }]}>
              <Text style={[styles.filterTitle, { color: '#ffffff' }]}>Filters</Text>
              <TouchableOpacity onPress={handleCloseFilters}>
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Companies Section */}
              <View style={[styles.filterSection, { borderBottomWidth: 1, borderBottomColor: colors.border + "33" }]}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('companies')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterSectionTitle, { color: colors.text, marginBottom: 0 }]}>Sort by Company</Text>
                  <Ionicons
                    name={expandedSections.companies ? "chevron-up" : "chevron-forward"}
                    size={20}
                    color={expandedSections.companies ? "#e53935" : colors.subText}
                  />
                </TouchableOpacity>

                {expandedSections.companies && (
                  <AnimatedRE.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)} style={styles.sectionContent}>
                    {companies.map((company) => (
                      <TouchableOpacity
                        key={company}
                        style={styles.checkboxRow}
                        onPress={() => toggleCompany(company)}
                      >
                        <View style={[
                          styles.checkbox,
                          { borderColor: colors.border },
                          selectedCompanies.includes(company) && styles.checkboxActive
                        ]}>
                          {selectedCompanies.includes(company) && (
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                          )}
                        </View>
                        <Text style={[styles.checkboxLabel, { color: colors.text }]}>{company}</Text>
                      </TouchableOpacity>
                    ))}
                  </AnimatedRE.View>
                )}
              </View>

              {/* Categories Section */}
              <View style={[styles.filterSection, { borderBottomWidth: 1, borderBottomColor: colors.border + "33" }]}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('categories')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterSectionTitle, { color: colors.text, marginBottom: 0 }]}>Categories</Text>
                  <Ionicons
                    name={expandedSections.categories ? "chevron-up" : "chevron-forward"}
                    size={20}
                    color={expandedSections.categories ? "#e53935" : colors.subText}
                  />
                </TouchableOpacity>

                {expandedSections.categories && (
                  <AnimatedRE.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)} style={styles.sectionContent}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={styles.checkboxRow}
                        onPress={() => toggleCategory(category)}
                      >
                        <View style={[
                          styles.checkbox,
                          { borderColor: colors.border },
                          selectedCategories.includes(category) && styles.checkboxActive
                        ]}>
                          {selectedCategories.includes(category) && (
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                          )}
                        </View>
                        <Text style={[styles.checkboxLabel, { color: colors.text }]}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </AnimatedRE.View>
                )}
              </View>

              {/* Sort By Section */}
              <View style={[styles.filterSection, { borderBottomWidth: 1, borderBottomColor: colors.border + "33" }]}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('sortBy')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterSectionTitle, { color: colors.text, marginBottom: 0 }]}>Sort By</Text>
                  <Ionicons
                    name={expandedSections.sortBy ? "chevron-up" : "chevron-forward"}
                    size={20}
                    color={expandedSections.sortBy ? "#e53935" : colors.subText}
                  />
                </TouchableOpacity>

                {expandedSections.sortBy && (
                  <AnimatedRE.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)} style={styles.sectionContent}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setSortBy(sortBy === "highToLow" ? "" : "highToLow")}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        sortBy === "highToLow" && styles.checkboxActive
                      ]}>
                        {sortBy === "highToLow" && (
                          <Ionicons name="checkmark" size={18} color="#ffffff" />
                        )}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>Highest to Lowest Price</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setSortBy(sortBy === "lowToHigh" ? "" : "lowToHigh")}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: colors.border },
                        sortBy === "lowToHigh" && styles.checkboxActive
                      ]}>
                        {sortBy === "lowToHigh" && (
                          <Ionicons name="checkmark" size={18} color="#ffffff" />
                        )}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>Lowest to Highest Price</Text>
                    </TouchableOpacity>
                  </AnimatedRE.View>
                )}
              </View>

              {/* Price Range Section */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('price')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterSectionTitle, { color: colors.text, marginBottom: 0 }]}>Price Range</Text>
                  <Ionicons
                    name={expandedSections.price ? "chevron-up" : "chevron-forward"}
                    size={20}
                    color={expandedSections.price ? "#e53935" : colors.subText}
                  />
                </TouchableOpacity>

                {expandedSections.price && (
                  <AnimatedRE.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)} style={styles.sectionContent}>
                    <View style={styles.priceRangeContainer}>
                      <Text style={[styles.priceText, { color: colors.text }]}>₹{priceRange[0].toLocaleString()}</Text>
                      <Text style={[styles.priceText, { color: colors.text }]}>₹{priceRange[1].toLocaleString()}</Text>
                    </View>

                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                      <MultiSlider
                        values={[priceRange[0], priceRange[1]]}
                        sliderLength={SCREEN_WIDTH * 0.8 - 60}
                        onValuesChange={(values) => setPriceRange([values[0], values[1]])}
                        min={10000}
                        max={1000000}
                        step={10000}
                        allowOverlap={false}
                        snapped
                        selectedStyle={{ backgroundColor: '#e53935' }}
                        unselectedStyle={{ backgroundColor: colors.border }}
                        containerStyle={{ height: 40 }}
                        trackStyle={{ height: 4 }}
                        markerStyle={{
                          backgroundColor: '#e53935',
                          height: 20,
                          width: 20,
                          borderWidth: 2,
                          borderColor: '#fff',
                          borderRadius: 10,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 2,
                          elevation: 4,
                        }}
                        pressedMarkerStyle={{ height: 24, width: 24 }}
                      />
                    </View>
                  </AnimatedRE.View>
                )}
              </View>
            </ScrollView>


          </AnimatedRE.View>
        </View>
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#e53935",
    height: verticalScale(110),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
    zIndex: 10,
  },
  logo: {
    width: scale(120),
    height: scale(50),
  },
  filterButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    gap: scale(10),
    marginTop: verticalScale(16),
  },
  searchContainer: {
    flex: 1,
    height: verticalScale(52),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(4),
    position: 'relative',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    left: scale(40), // Icon width + margin
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: rf(16),
    paddingRight: scale(12),
  },
  filterButton: {
    width: scale(52),
    height: scale(52),
    backgroundColor: '#e53935',
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: "#e53935",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
  },
  filterButtonText: {
    display: 'none',
  },
  filterModalContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterSidebar: {
    width: '80%',
    height: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: scale(-2), height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    height: verticalScale(100),
    backgroundColor: '#e53935',
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
  },
  filterTitle: {
    fontSize: rf(24),
    fontWeight: '700',
  },
  filterSection: {
    padding: moderateScale(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionContent: {
    marginTop: verticalScale(16),
  },
  filterSectionTitle: {
    fontSize: rf(18),
    fontWeight: '700',
    marginBottom: verticalScale(16),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  checkbox: {
    width: scale(24),
    height: scale(24),
    borderRadius: moderateScale(6),
    borderWidth: scale(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  checkboxActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },
  checkboxLabel: {
    fontSize: rf(16),
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  priceText: {
    fontSize: rf(16),
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: verticalScale(40),
  },
  sliderLabel: {
    fontSize: rf(14),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(4),
  },

  bikeCard: {
    marginBottom: verticalScale(20),
    borderRadius: moderateScale(24),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(10),
  },
  cardImageWrapper: {
    width: "100%",
    height: verticalScale(210),
  },
  bikeImage: {
    width: "100%",
    height: "100%",
  },
  favBtn: {
    position: "absolute",
    top: verticalScale(12),
    right: scale(12),
    backgroundColor: "rgba(0,0,0,0.3)",
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  bikeInfo: {
    padding: moderateScale(16),
  },
  infoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  bikeTitle: {
    fontSize: rf(18),
    fontWeight: "800",
    flex: 1,
  },
  bikePrice: {
    fontSize: rf(18),
    fontWeight: "900",
    color: "#ef4444",
  },
  infoBottomRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(10),
  },
  metaText: {
    fontSize: rf(12),
    fontWeight: "700",
  },
  detailsModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailsModalPanel: {
    borderTopLeftRadius: moderateScale(40),
    borderTopRightRadius: moderateScale(40),
    overflow: 'hidden',
    height: '90%',
    elevation: 20,
  },
  modalHandle: {
    width: scale(40),
    height: verticalScale(5),
    backgroundColor: "#e2e8f0",
    borderRadius: moderateScale(3),
    alignSelf: "center",
    marginTop: verticalScale(12),
    position: "absolute",
    top: 0,
    zIndex: 10,
  },
  modalImageWrapper: {
    width: '100%',
    height: verticalScale(350),
    position: 'relative',
  },
  backBtnCircle: {
    position: 'absolute',
    top: verticalScale(24),
    left: scale(24),
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetailsContent: {
    padding: moderateScale(24),
  },
  mainInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: verticalScale(24),
  },
  modalDetailTitle: {
    fontSize: rf(26),
    fontWeight: '900',
  },
  modalPriceText: {
    fontSize: rf(22),
    fontWeight: "900",
    color: "#ef4444",
    marginTop: verticalScale(4),
  },
  typeBadgeLarge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
  },
  typeBadgeLargeTxt: {
    color: "#ef4444",
    fontWeight: "800",
    fontSize: rf(13),
  },
  specGrid: {
    flexDirection: "column",
    marginTop: verticalScale(0),
    marginBottom: verticalScale(24),
  },
  specItem: {
    flex: 1,
    padding: moderateScale(18),
    borderRadius: moderateScale(24),
    alignItems: "center",
  },
  specVal: {
    fontSize: rf(16),
    fontWeight: "900",
    marginTop: verticalScale(6),
  },
  specLbl: {
    fontSize: rf(11),
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: verticalScale(2),
  },
  descriptionSection: {
    marginBottom: verticalScale(24),
  },
  descTitle: {
    fontWeight: "800",
    marginBottom: 10,
  },
  descText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "800",
  },
  sellerLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  sellerActionBtn: {
    padding: moderateScale(10),
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: scale(16),
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
  },
  actionBtnSecondary: {
    flex: 1,
    height: verticalScale(60),
    borderRadius: moderateScale(20),
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
  },
  actionBtnSecondaryTxt: {
    fontWeight: "800",
    fontSize: rf(15),
  },
  actionBtnPrimary: {
    flex: 1.5,
    height: verticalScale(60),
    borderRadius: moderateScale(20),
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    elevation: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
  },
  actionBtnPrimaryTxt: {
    color: "#fff",
    fontWeight: "900",
    fontSize: rf(16),
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: verticalScale(50),
    right: scale(20),
    zIndex: 10,
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: scale(22),
  },
  imageModalCloseText: {
    fontSize: rf(24),
    color: '#ffffff',
    fontWeight: '300',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
