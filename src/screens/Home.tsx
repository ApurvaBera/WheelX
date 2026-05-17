import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  SafeAreaView,
  Linking,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { Calendar } from "react-native-calendars";
import { BlurView } from "expo-blur";
import AnimatedRE, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  interpolate,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import * as Location from "expo-location";
import { supabase } from "../supabase";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { useNotifications } from "../context/NotificationContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH, SCREEN_HEIGHT } from "../utils/responsive";
import { fetchUserNotifications, markAllAsRead, deleteNotification, deleteAllNotifications, sendNotification } from "../utils/notifications";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const width = SCREEN_WIDTH;
const SLIDE_WIDTH = width - scale(40);
const SIDEBAR_WIDTH = Math.round(width * 0.78);

const logoLight = require("../../assets/logo.png");
const logoDark = require("../../assets/logo2.png");
const logo3 = require("../../assets/logo3.png");
const slideLogo = require("../../assets/logo2.png"); // Always use light logo for dark slider overlay

const slideImages = [
  { id: "1", image: require("../../assets/buy.png"), buttonImage: require("../../assets/buybt.png"), route: "Buy" },
  { id: "2", image: require("../../assets/sell.png"), buttonImage: require("../../assets/sellbt.png"), route: "Sell" },
  { id: "3", image: require("../../assets/rent.png"), buttonImage: require("../../assets/rentbt.png"), route: "Rent" },
];

const menuItems = [
  { key: "account", label: "Account", icon: "person-circle-outline", route: "Profile" },
  { key: "mylistings", label: "My Listings", icon: "list-outline", route: "MyListings" },
  { key: "favorites", label: "Favorites", icon: "heart-outline", route: "Fav" },
  { key: "booking", label: "Booking", icon: "calendar-outline", route: "Bookings" },
  { key: "faqs", label: "FAQs", icon: "help-circle-outline", route: "HelpSupport" },
  { key: "about", label: "About Us", icon: "information-circle-outline", route: "AboutUs" },
  { key: "contact", label: "Contact Us / Chat With Us", icon: "call-outline", route: "ContactSupport" },
];
const categories = [
  { id: "1", label: "Sport", icon: "flash-outline", color: "#6366f1" },
  { id: "2", label: "Cruiser", icon: "bicycle-outline", color: "#f59e0b" },
  { id: "3", label: "Adventure", icon: "map-outline", color: "#10b981" },
  { id: "4", label: "Scooter", icon: "leaf-outline", color: "#ec4899" },
  { id: "5", label: "Standard", icon: "navigate-circle-outline", color: "#0ea5e9" },
  { id: "6", label: "Naked", icon: "color-filter-outline", color: "#8b5cf6" },
];

export default function Home() {
  const saveUserLocation = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await supabase.from("profiles").upsert({
        id: userData.user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        updated_at: new Date(),
      });
    } catch (err) {
      console.log("Auto location save failed", err);
    }
  };

  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    loadNotifications,
    handleDeleteAll,
    handleDismissNotification,
    testFloating
  } = useNotifications();

  const colors = {
    bg: isDark ? "#111827" : "#F9FAFB",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#374151",
    border: isDark ? "#374151" : "#E5E7EB",
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentBikes, setRecentBikes] = useState<any[]>([]);
  const [recentRentals, setRecentRentals] = useState<any[]>([]);
  const slideValue = useSharedValue(-SIDEBAR_WIDTH);
  const notifValue = useSharedValue(-SCREEN_HEIGHT);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Notification Shake Animation
  const shakeValue = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shakeValue.value}deg` }],
  }));

  useEffect(() => {
    if (unreadCount > 0) {
      shakeValue.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        -1, // Infinite repeat
        true // Reverse ignored for sequence usually but keeps it smooth
      );
    } else {
      shakeValue.value = withTiming(0);
    }
  }, [unreadCount]);

  // Approval Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingToApprove, setBookingToApprove] = useState<any>(null);
  const [testRideAddress, setTestRideAddress] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  // Helper function to get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [minCalendarDate, setMinCalendarDate] = useState(getTodayDate());

  useFocusEffect(
    useCallback(() => {
      fetchRecentBikes();
      fetchRecentRentals();
      loadNotifications();
    }, [])
  );

  useEffect(() => {
    if (route.params?.openNotifications) {
      openNotifications();
      // Clear the parameter so it doesn't reopen unexpectedly
      navigation.setParams({ openNotifications: null });
    }
  }, [route.params?.openNotifications]);

  const fetchRecentBikes = async () => {
    const { data, error } = await supabase
      .from("sellbikes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && data) {
      setRecentBikes(data);
    }
  };

  const fetchRecentRentals = async () => {
    const { data, error } = await supabase
      .from("rentbikes")
      .select("*")
      .eq('is_available', true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && data) {
      setRecentRentals(data);
    }
  };

  const sidebarStyle = useAnimatedStyle(() => ({
    left: slideValue.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(slideValue.value, [-SIDEBAR_WIDTH, 0], [0, 1]),
  }));

  const notifStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: notifValue.value }],
  }));

  const notifOverlayStyle = useAnimatedStyle(() => ({
    backgroundColor: 'rgba(0,0,0,0.5)',
    opacity: interpolate(notifValue.value, [-SCREEN_HEIGHT, 0], [0, 1]),
    flex: 1,
  }));



  useEffect(() => {
    const id = setInterval(() => {
      const next = (currentIndex + 1) % slideImages.length;
      setCurrentIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, 4000);

    return () => clearInterval(id);
  }, [currentIndex]);

  useEffect(() => {
    saveUserLocation();
  }, []);

  const openSidebar = () => {
    setSidebarOpen(true);
    slideValue.value = withSpring(0, {
      damping: 25,
      stiffness: 120,
      mass: 1,
    });
  };

  const closeSidebar = () => {
    slideValue.value = withSpring(-SIDEBAR_WIDTH, {
      damping: 30,
      stiffness: 150,
      mass: 0.8,
    }, () => {
      runOnJS(setSidebarOpen)(false);
    });
  };

  const handleLogout = () => {
    closeSidebar();
    logout();
  };

  const handleMenuPress = (item: any) => {
    if (item.key === "contact") {
      setShowContactInfo(!showContactInfo);
    } else {
      closeSidebar();
      navigation.navigate(item.route);
    }
  };

  const openNotifications = () => {
    loadNotifications(); // Refresh on open to catch any live updates
    setShowNotifications(true);
    notifValue.value = withTiming(0, { duration: 300 });
  };

  const closeNotifications = () => {
    notifValue.value = withTiming(-SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(setShowNotifications)(false);
    });
  };

  const onDismissNotif = async (notifId: string) => {
    await handleDismissNotification(notifId);
  };
  /* New handler for booking actions */
  const handleBookingAction = async (item: any, status: 'approved' | 'rejected') => {
    if (status === 'rejected') {
      try {
        const buyerId = item.payload?.buyerId;
        const bikeId = item.payload?.bikeId;

        if (buyerId) {
          // 1. Fetch bike name for better context
          let bikeName = "the bike";
          if (bikeId) {
            const { data: bike } = await supabase
              .from("sellbikes")
              .select("company, model")
              .eq("id", bikeId)
              .single();
            if (bike) {
              bikeName = `${bike.company} ${bike.model}`;
            }
          }

          // 2. Notify the buyer
          await sendNotification({
            userId: buyerId,
            title: "Test Ride Rejected",
            message: `Your test ride request for ${bikeName} has been rejected by the seller.`,
            icon: "close-circle",
            color: "#EF4444",
          });
        }

        // 3. Remove the request notification from the seller's list
        await handleDismissNotification(item.id);

      } catch (err) {
        console.error("Error handling rejection:", err);
        alert("Action failed. Please try again.");
      }
    } else {
      // Approve Flow: Open Calendar
      setBookingToApprove(item);
      setSelectedDate(""); // Reset date
      setTestRideAddress(""); // Reset address
      setMinCalendarDate(getTodayDate()); // Update to current date in local timezone
      setShowCalendar(true);
    }
  };

  const confirmApproval = async () => {
    if (!user) return; // Guard clause for typescript
    if (!selectedDate) {
      alert("Please select a date for the test ride.");
      return;
    }

    if (!testRideAddress.trim()) {
      alert("Please enter the address for the test ride.");
      return;
    }

    if (isApproving) return;
    setIsApproving(true);

    try {
      const item = bookingToApprove;
      const { buyerId, bikeId, isRental } = item.payload || {};

      if (buyerId) {
        // 1. Fetch bike name
        let bikeName = item.payload?.bikeName || "the bike";
        if (bikeName === "the bike" && bikeId) {
          const { data: bike } = await supabase
            .from(isRental ? "rentals" : "sellbikes")
            .select("company, model")
            .eq("id", bikeId)
            .single();
          if (bike) {
            bikeName = `${bike.company} ${bike.model}`;
          }
        }




        // 2a. Fetch Seller Profile (Myself) to share phone with buyer
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("phone, name")
          .eq("id", user?.id)
          .single();

        // 2b. Fetch Buyer Phone & Send WhatsApp
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("phone, name")
          .eq("id", buyerId)
          .single();

        console.log("DEBUG: Fetched Buyer Profile:", buyerProfile);

        if (buyerProfile?.phone) {
          // ... (WhatsApp invocation code remains same, just ensuring variables are available)
          console.log("DEBUG: Invoking send-whatsapp with:", {
            to: buyerProfile.phone,
            bikeName,
            date: selectedDate,
            address: testRideAddress.trim(),
            sellerName: user?.name || "WheelX Seller"
          });

          const { data, error: fnError } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              to: buyerProfile.phone,
              bikeName,
              date: selectedDate,
              time: selectedTime,
              address: testRideAddress.trim(),
              sellerName: user?.name || "WheelX Seller",
              isRental: !!isRental
            }
          });

          if (fnError) {
            console.error("DEBUG: Twilio Function Failed:", fnError);
            alert("WhatsApp failed. Ensure recipient has joined Twilio Sandbox: " + (fnError.message || "Unknown error"));
          } else {
            console.log("DEBUG: Twilio Function Response:", data);
            alert("Twilio Success! SID: " + data?.sid);
          }
        } else {
          console.warn("DEBUG: No phone number found for buyer ID:", buyerId);
          alert("This buyer has no phone number, so no WhatsApp was sent.");
        }

        // 3. Notify the buyer (In-App Reminder)
        await sendNotification({
          userId: buyerId,
          title: isRental ? "Bike Rental Approved!" : "Test Ride Approved!",
          message: isRental
            ? `Your rental for ${bikeName} is approved for ${selectedDate} at ${selectedTime}.`
            : `Your test drive for ${bikeName} is approved for ${selectedDate} at ${selectedTime}.`,
          icon: "calendar",
          color: "#25D366", // Green
          type: "booking_reminder",
          payload: {
            role: "buyer",
            date: selectedDate,
            time: selectedTime,
            address: testRideAddress,
            bikeName,
            sellerName: user?.name || "Seller",
            sellerPhone: sellerProfile?.phone,
            sellerId: user.id,
            isRental,
          },
        });

        // 4. Notify the Seller (In-App Reminder for themselves)
        // Only if I'm NOT the buyer (to avoid duplicate bookings for self-testing)
        if (user?.id && user.id !== buyerId) {
          await sendNotification({
            userId: user.id, // Myself
            title: isRental ? "Bike Rental Scheduled" : "Test Ride Scheduled",
            message: isRental
              ? `Reminder: Rental for ${bikeName} with ${buyerProfile?.name || "Customer"} on ${selectedDate} at ${selectedTime}.`
              : `Reminder: Test ride for ${bikeName} with ${buyerProfile?.name || "Buyer"} on ${selectedDate} at ${selectedTime}.`,
            icon: "calendar",
            color: "#6366f1", // Indigo
            type: "booking_reminder",
            payload: {
              role: "seller",
              date: selectedDate,
              time: selectedTime,
              address: testRideAddress,
              bikeName,
              buyerName: buyerProfile?.name || "Buyer",
              buyerPhone: buyerProfile?.phone,
              buyerId: buyerId,
              isRental,
            },
          });
        }
      }

      // 3. Remove the request notification
      await handleDismissNotification(item.id);

      setShowCalendar(false);
      setBookingToApprove(null);
      setSelectedDate("");
      setSelectedTime("10:00 AM");
      setTestRideAddress("");
      alert("Booking approved and buyer notified!");

    } catch (err) {
      console.error("Error confirming approval:", err);
      alert("Approval failed. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return "";
    const now = new Date();
    const then = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header - Synced with Buy Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={openSidebar}>
            <Ionicons name="menu-outline" size={28} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={logo3}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity style={styles.headerBtn} onPress={openNotifications}>
            <AnimatedRE.View style={shakeStyle}>
              <Ionicons name="notifications-outline" size={26} color="#ffffff" />
            </AnimatedRE.View>
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />


        <View style={styles.sliderContainer}>
          <FlatList
            ref={listRef}
            data={slideImages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Image
                  source={item.image}
                  style={styles.slideImage}
                  resizeMode="cover"
                />
                <View style={styles.slideOverlay}>
                  <Image source={slideLogo} style={styles.slideLogo} resizeMode="contain" />
                  <TouchableOpacity
                    style={styles.exploreBtn}
                    onPress={() => navigation.navigate(item.route)}
                  >
                    <Text style={styles.exploreBtnText}>Explore Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            horizontal
            pagingEnabled={false} // Use snapping for non-full-screen items
            snapToInterval={SLIDE_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: SLIDE_WIDTH,
              offset: SLIDE_WIDTH * index,
              index,
            })}
          />

          <View style={styles.dots}>
            {slideImages.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Quick Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("Buy", { initialCategory: cat.label })}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + "15" }]}>
                <Ionicons name={cat.icon as any} size={22} color={cat.color} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Service Tiles */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
        </View>

        <View style={styles.serviceRow}>
          {slideImages.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.serviceCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Image
                source={item.buttonImage}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Arrivals */}
        {recentBikes.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Arrivals</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Buy")}>
                <Text style={{ color: "#e53935", fontWeight: "600" }}>See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={recentBikes}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.recentCard, { backgroundColor: colors.card }]}
                  onPress={() => navigation.navigate("Buy", { initialBike: item })}
                >
                  <Image source={{ uri: item.images?.[0] }} style={styles.recentImage} />
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>{item.company} {item.model}</Text>
                    <View style={styles.recentBottom}>
                      <Text style={styles.recentPrice}>{item.price}</Text>
                      <View style={[styles.recentBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.recentBadgeText, { color: colors.subText }]}>{item.year}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* Top Rentals */}
        {recentRentals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Rentals</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Rent")}>
                <Text style={{ color: "#e53935", fontWeight: "600" }}>See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={recentRentals}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.recentCard, { backgroundColor: colors.card }]}
                  onPress={() => navigation.navigate("RentABike", { initialBike: item })}
                >
                  <Image source={{ uri: item.images?.[0] }} style={styles.recentImage} />
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>{item.company} {item.model}</Text>
                    <View style={styles.recentBottom}>
                      <Text style={styles.recentPrice}>{item.price} <Text style={{ fontSize: 10, fontWeight: 'normal', color: colors.subText }}>/day</Text></Text>
                      <View style={[styles.recentBadge, { backgroundColor: '#e5393522' }]}>
                        <Ionicons name="flash" size={12} color="#e53935" />
                        <Text style={[styles.recentBadgeText, { color: "#e53935", marginLeft: 2 }]}>Fast</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* Spacing for Bottom Tab if exists */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <AnimatedRE.View style={[styles.overlay, overlayStyle]} />
        </TouchableWithoutFeedback>
      )}

      <AnimatedRE.View style={[styles.sidebar, sidebarStyle, { backgroundColor: colors.card, borderTopRightRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" }]}>
        <View style={styles.sidebarHeader}>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={styles.profileGreeting}>Welcome,</Text>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name || "WheelX User"}
              </Text>
              <View style={styles.emailBadge}>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email || "user@wheelx.com"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.sidebarContent}>
            {/* Premium Membership Section */}
            <TouchableOpacity
              style={[styles.premiumCard, { backgroundColor: isDark ? "#2d3748" : "#1f2937", borderColor: isDark ? "rgba(255, 215, 0, 0.4)" : "rgba(255, 215, 0, 0.3)" }]}
              activeOpacity={0.9}
              onPress={() => {
                closeSidebar();
                navigation.navigate("PremiumMembership");
              }}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumTextSection}>
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                  <Text style={styles.premiumTitle}>Upgrade to Pro</Text>
                  <Text style={styles.premiumSubtitle}>Get exclusive access to premium bikes and features.</Text>
                </View>
                <View style={styles.premiumIconContainer}>
                  <MaterialCommunityIcons name="crown" size={48} color="rgba(255,215,0,0.25)" />
                </View>
              </View>
              <View style={styles.premiumBtn}>
                <Text style={styles.premiumBtnText}>Explore Plans</Text>
                <Ionicons name="sparkles" size={14} color="#e53935" />
              </View>
            </TouchableOpacity>

            {menuItems.map((m) => (
              <View key={m.key}>
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.bg + "44" }]}
                  activeOpacity={0.7}
                  onPress={() => handleMenuPress(m)}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: "#e5393515" }]}>
                    <Ionicons name={m.icon as any} size={20} color="#e53935" />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{m.label}</Text>
                  {m.key === "contact" ? (
                    <Ionicons
                      name={showContactInfo ? "chevron-up" : "chevron-forward"}
                      size={18}
                      color={colors.subText}
                      style={{ marginLeft: "auto" }}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.subText + "88"} style={{ marginLeft: "auto" }} />
                  )}
                </TouchableOpacity>
                {m.key === "contact" && showContactInfo && (
                  <AnimatedRE.View
                    entering={FadeInUp.duration(300)}
                    exiting={FadeOutUp.duration(200)}
                    style={[styles.contactDropdown, { backgroundColor: isDark ? "#11182755" : "#f9f9f9" }]}
                  >
                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL("mailto:support@wheelx.com")}>
                      <Ionicons name="mail-outline" size={16} color={colors.subText} />
                      <Text style={[styles.contactText, { color: colors.text }]}> support@wheelx.com</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL("tel:+917718939287")}>
                      <Ionicons name="call-outline" size={16} color={colors.subText} />
                      <Text style={[styles.contactText, { color: colors.text }]}> +91 77189 39287</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL("tel:+918591732262")}>
                      <Ionicons name="call-outline" size={16} color={colors.subText} />
                      <Text style={[styles.contactText, { color: colors.text }]}> +91 85917 32262</Text>
                    </TouchableOpacity>

                    <View style={styles.hoursRow}>
                      <Ionicons name="time-outline" size={14} color={colors.subText} />
                      <Text style={[styles.hoursText, { color: colors.subText }]}> Mon-Fri, 10 AM – 5 PM</Text>
                    </View>
                  </AnimatedRE.View>
                )}
              </View>
            ))}

            <View style={[styles.menuDivider, { backgroundColor: colors.border + "44" }]} />

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <View style={styles.logoutIconBox}>
                <Ionicons name="power" size={18} color="#fff" />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.menuFooter}>
              <Image source={isDark ? logoDark : logoLight} style={styles.footerLogo} resizeMode="contain" />
              <TouchableOpacity onPress={testFloating}>
                <Text style={[styles.versionText, { color: colors.subText }]}>Version 2.0.4</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </AnimatedRE.View>

      <Modal visible={showNotifications} transparent animationType="none">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={closeNotifications}>
            <AnimatedRE.View style={notifOverlayStyle}>
              <AnimatedRE.View style={[styles.notifPanel, notifStyle, { backgroundColor: colors.card }]}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: colors.text }]}>Notifications</Text>
                  <TouchableOpacity onPress={closeNotifications} style={styles.notifClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <Swipeable
                        key={item.id}
                        renderLeftActions={() => (
                          <View style={styles.dismissAction}>
                            <Ionicons name="trash-outline" size={24} color="#fff" />
                          </View>
                        )}
                        onSwipeableLeftOpen={() => handleDismissNotification(item.id)}
                      >
                        <TouchableOpacity style={[styles.notifItem, { backgroundColor: colors.card, borderBottomColor: colors.border + '22' }]}>
                          <View style={[styles.notifIconBox, { backgroundColor: item.color + '15' }]}>
                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                          </View>
                          <View style={styles.notifContent}>
                            <View style={styles.notifTopRow}>
                              <Text style={[styles.notifItemTitle, { color: colors.text }]}>{item.title}</Text>
                              <Text style={styles.notifTime}>{getRelativeTime(item.created_at)}</Text>
                            </View>
                            <Text style={[styles.notifMsg, { color: colors.subText }]}>{item.message}</Text>

                            {/* Action Buttons for Booking Requests */}
                            {item.type === 'booking_request' && (
                              <View style={{ flexDirection: 'row', gap: scale(10), marginTop: verticalScale(10) }}>
                                <TouchableOpacity
                                  style={[styles.actionBtnSmall, { backgroundColor: '#ef4444' }]}
                                  onPress={() => handleBookingAction(item, 'rejected')}
                                >
                                  <Text style={styles.actionBtnTextSmall}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.actionBtnSmall, { backgroundColor: '#22c55e' }]}
                                  onPress={() => handleBookingAction(item, 'approved')}
                                >
                                  <Text style={styles.actionBtnTextSmall}>Approve</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      </Swipeable>
                    ))
                  ) : (
                    <View style={styles.emptyNotifContainer}>
                      <Ionicons name="notifications-off-outline" size={rf(50)} color={colors.subText + '44'} />
                      <Text style={[styles.emptyNotifText, { color: colors.subText }]}>No new notifications</Text>
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity style={styles.markReadBtn} onPress={handleDeleteAll}>
                  <Text style={styles.markReadText}>Clear all notifications</Text>
                </TouchableOpacity>
              </AnimatedRE.View>
            </AnimatedRE.View>
          </TouchableWithoutFeedback>
        </GestureHandlerRootView>
      </Modal>

      {/* Calendar Approval Modal */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <KeyboardAvoidingView
          style={styles.calendarModalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
            <View style={styles.calendarOverlay} />
          </TouchableWithoutFeedback>

          <View style={[styles.calendarContent, { backgroundColor: colors.card }]}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Calendar
              minDate={minCalendarDate}
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#e53935' }
              }}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.subText,
                dayTextColor: colors.text,
                todayTextColor: '#e53935',
                selectedDayTextColor: '#ffffff',
                monthTextColor: colors.text,
                indicatorColor: '#e53935',
                arrowColor: '#e53935',
                textDisabledColor: colors.subText + '44', // Dim disabled dates
              }}
            />

            {/* Time Slot Selection */}
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.addressLabel, { color: colors.text }]}>Select Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: selectedTime === time ? '#e53935' : colors.bg,
                      borderWidth: 1,
                      borderColor: selectedTime === time ? '#e53935' : colors.border
                    }}
                  >
                    <Text style={{
                      color: selectedTime === time ? '#fff' : colors.text,
                      fontSize: 12,
                      fontWeight: '600'
                    }}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Address Input Field */}
            <View style={styles.addressContainer}>
              <Text style={[styles.addressLabel, { color: colors.text }]}>Test Ride Location</Text>
              <TextInput
                style={[styles.addressInput, {
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Enter address for test ride"
                placeholderTextColor={colors.subText}
                value={testRideAddress}
                onChangeText={setTestRideAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { opacity: (selectedDate && testRideAddress.trim() && !isApproving) ? 1 : 0.5 }]}
              onPress={confirmApproval}
              disabled={!selectedDate || !testRideAddress.trim() || isApproving}
            >
              <Text style={styles.confirmBtnText}>{isApproving ? "Approving..." : "Confirm Approval"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  calendarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  calendarContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#e53935',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addressContainer: {
    marginTop: 20,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  addressInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  // ... existing styles continued below
  safe: { flex: 1 },
  container: { flex: 1 },

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
  },
  headerBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: scale(130),
    height: scale(60),
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGreeting: {
    fontSize: rf(13),
    fontWeight: "600",
  },
  headerName: {
    fontSize: rf(18),
    fontWeight: "800",
  },
  avatarSmall: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#FFEB3B',
    borderWidth: 1.5,
    borderColor: '#e53935'
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  searchFilter: {
    backgroundColor: "#e53935",
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  sliderContainer: {
    marginHorizontal: scale(20),
    height: verticalScale(190),
    borderRadius: moderateScale(24),
    overflow: "hidden",
    marginBottom: verticalScale(30),
  },
  slide: { width: width - scale(40), height: verticalScale(190) },
  slideImage: { width: "100%", height: "100%" },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: moderateScale(20),
  },
  slideLogo: { width: scale(140), height: scale(60), marginBottom: verticalScale(10) },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    gap: scale(6),
  },
  exploreBtnText: {
    color: "#fff",
    fontSize: rf(13),
    fontWeight: "700",
  },

  dots: { position: "absolute", bottom: verticalScale(12), width: "100%", flexDirection: "row", justifyContent: "center" },
  dot: { width: scale(6), height: scale(6), borderRadius: scale(3), backgroundColor: "rgba(255,255,255,0.4)", marginHorizontal: scale(3) },
  dotActive: { width: scale(16), backgroundColor: "#e53935" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "800",
  },

  serviceRow: {
    flexDirection: "row",
    gap: scale(12),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(30),
  },
  serviceCard: {
    flex: 1,
    height: verticalScale(100),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(10),
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },

  recentCard: {
    width: scale(200),
    borderRadius: moderateScale(20),
    marginRight: scale(16),
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(12),
  },
  recentImage: {
    width: "100%",
    height: verticalScale(120),
  },
  recentInfo: {
    padding: moderateScale(12),
  },
  recentName: {
    fontSize: rf(15),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  recentBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentPrice: {
    fontSize: rf(14),
    fontWeight: "800",
    color: "#ef4444",
  },
  recentBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  recentBadgeText: {
    fontSize: rf(10),
    fontWeight: "700",
  },

  categoryCard: {
    padding: moderateScale(12),
    borderRadius: moderateScale(20),
    alignItems: "center",
    marginRight: scale(12),
    width: scale(90),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(5),
  },
  categoryIconWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(8),
  },
  categoryLabel: {
    fontSize: rf(12),
    fontWeight: "700",
  },

  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.32)", zIndex: 20, bottom: -1000 },

  sidebar: { position: "absolute", top: 0, bottom: 0, left: -SIDEBAR_WIDTH, width: SIDEBAR_WIDTH, zIndex: 25, elevation: 16, shadowColor: "#000", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 10 },
  sidebarHeader: {
    height: verticalScale(220),
    backgroundColor: "#e53935",
    paddingHorizontal: scale(24),
    justifyContent: "flex-end",
    paddingBottom: verticalScale(28),
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
  },
  closeBtn: { position: "absolute", top: verticalScale(44), right: scale(16), zIndex: 10, padding: moderateScale(8) },

  profileSection: { marginBottom: 0 },
  profileAvatar: { width: scale(64), height: scale(64), borderRadius: scale(32), backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  profileGreeting: { color: "rgba(255,255,255,0.8)", fontSize: rf(13), fontWeight: "600" },
  profileName: { color: "#fff", fontSize: rf(22), fontWeight: "800", marginTop: verticalScale(2) },
  emailBadge: { backgroundColor: "rgba(0,0,0,0.1)", alignSelf: "flex-start", paddingHorizontal: scale(10), paddingVertical: verticalScale(4), borderRadius: moderateScale(12), marginTop: verticalScale(6) },
  profileEmail: { color: "rgba(255,255,255,0.9)", fontSize: rf(11), fontWeight: "500" },

  sidebarScroll: { flex: 1 },
  sidebarContent: { paddingVertical: verticalScale(20), paddingHorizontal: scale(12) },

  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: verticalScale(14), paddingHorizontal: scale(16), borderRadius: moderateScale(16), marginBottom: verticalScale(10) },
  menuIconBox: { width: scale(40), height: scale(40), borderRadius: moderateScale(12), alignItems: "center", justifyContent: "center", marginRight: scale(14) },
  menuLabel: { fontSize: rf(15), fontWeight: "600" },

  premiumCard: {
    borderRadius: moderateScale(22),
    padding: moderateScale(18),
    marginBottom: verticalScale(20),
    overflow: "hidden",
    borderWidth: 1.5,
    elevation: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  premiumContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  premiumTextSection: {
    flex: 1,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(8),
    alignSelf: "flex-start",
    marginBottom: verticalScale(8),
    gap: scale(4),
  },
  premiumBadgeText: {
    color: "#FFD700",
    fontSize: rf(10),
    fontWeight: "900",
    letterSpacing: 1,
  },
  premiumTitle: {
    color: "#fff",
    fontSize: rf(17),
    fontWeight: "800",
    marginBottom: verticalScale(4),
  },
  premiumSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: rf(11),
    fontWeight: "500",
    lineHeight: verticalScale(15),
  },
  premiumIconContainer: {
    marginLeft: scale(10),
    opacity: 0.5,
  },
  premiumBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(16),
    gap: scale(6),
  },
  premiumBtnText: {
    color: "#e53935",
    fontSize: rf(13),
    fontWeight: "700",
  },

  menuDivider: { height: 1, marginVertical: verticalScale(16), marginHorizontal: scale(20) },

  contactDropdown: { marginTop: verticalScale(-6), marginBottom: verticalScale(10), marginHorizontal: scale(8), padding: moderateScale(16), borderRadius: moderateScale(16) },
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: verticalScale(10) },
  contactText: { fontSize: rf(13), fontWeight: "500" },
  hoursRow: { flexDirection: "row", alignItems: "center", marginTop: verticalScale(4), opacity: 0.8 },
  hoursText: { fontSize: rf(12), fontStyle: "italic" },

  logoutBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#e53935", paddingVertical: verticalScale(14), paddingHorizontal: scale(20), borderRadius: moderateScale(16), marginHorizontal: scale(8), marginTop: verticalScale(10) },
  logoutIconBox: { marginRight: scale(12) },
  logoutText: { color: "#fff", fontSize: rf(16), fontWeight: "700" },

  menuFooter: { alignItems: "center", marginTop: verticalScale(40), paddingBottom: verticalScale(80) },
  footerLogo: { width: scale(80), height: scale(30), opacity: 0.3 },
  versionText: { fontSize: rf(10), fontWeight: "600", marginTop: verticalScale(4), opacity: 0.4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  notifPanel: {
    width: '100%',
    maxHeight: verticalScale(500),
    borderBottomLeftRadius: moderateScale(30),
    borderBottomRightRadius: moderateScale(30),
    paddingTop: verticalScale(50),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  notifTitle: {
    fontSize: rf(22),
    fontWeight: '900',
  },
  notifClose: {
    padding: scale(4),
  },
  notifItem: {
    flexDirection: 'row',
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
  },
  notifIconBox: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(15),
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  notifItemTitle: {
    fontSize: rf(15),
    fontWeight: '700',
  },
  notifTime: {
    fontSize: rf(11),
    color: '#9CA3AF',
  },
  notifMsg: {
    fontSize: rf(13),
    lineHeight: verticalScale(18),
  },
  markReadBtn: {
    marginTop: verticalScale(15),
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    backgroundColor: '#e5393510',
    borderRadius: moderateScale(12),
  },
  markReadText: {
    color: '#e53935',
    fontWeight: '700',
    fontSize: rf(14),
  },
  emptyNotifContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyNotifText: {
    marginTop: verticalScale(12),
    fontSize: rf(15),
    fontWeight: '600',
    opacity: 0.6,
  },
  dismissAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(80),
    marginVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    marginLeft: scale(10),
  },
  actionBtnSmall: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(8),
  },
  actionBtnTextSmall: {
    color: '#fff',
    fontSize: rf(12),
    fontWeight: '700',
  },
});
