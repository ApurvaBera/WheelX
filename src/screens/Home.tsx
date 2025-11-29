import { useEffect, useRef, useState } from 'react';
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
  ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BikeCard, { BikeItem } from '../components/BikeCard';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.round(width * 0.78);
const slideLogo = require('../../assets/logo2.png');

const slideImages: {
  id: string;
  title: string;
  image: ImageSourcePropType;
  buttonImage: ImageSourcePropType;
}[] = [
  {
    id: '1',
    title: 'Buy Bike',
    image: require('../../assets/buy.png'),
    buttonImage: require('../../assets/buybt.png'),
  },
  {
    id: '2',
    title: 'Sell Bike',
    image: require('../../assets/sell.png'),
    buttonImage: require('../../assets/sellbt.png'),
  },
  {
    id: '3',
    title: 'Rent Bike',
    image: require('../../assets/rent.png'),
    buttonImage: require('../../assets/rentbt.png'),
  },
];

const categories = ['Adventure', 'Cruiser', 'Sport', 'Electric', 'Naked', 'Scooter'];

export default function Home({ onPressDetails }: { onPressDetails?: () => void }) {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  // Sidebar animation & state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const anim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current; // -width -> 0

  useEffect(() => {
    const id = setInterval(() => {
      const next = (currentIndex + 1) % slideImages.length;
      setCurrentIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3000);
    return () => clearInterval(id);
  }, [currentIndex]);

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(anim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setSidebarOpen(false));
  };

  const menuItems: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; route?: string }[] = [
    { key: 'account', label: 'My Account', icon: 'person-circle-outline', route: 'Profile' },
    { key: 'motorcycle', label: 'My Motorcycle', icon: 'bicycle-outline', route: 'MyMotorcycle' },
    { key: 'booking', label: 'My Booking', icon: 'calendar-outline', route: 'Bookings' },
    { key: 'chats', label: 'Chats', icon: 'chatbubbles-outline', route: 'Chats' },
    { key: 'faqs', label: 'FAQs', icon: 'help-circle-outline', route: 'Faqs' },
    { key: 'reviews', label: 'Customer Reviews', icon: 'star-outline', route: 'Reviews' },
    { key: 'about', label: 'About Us', icon: 'information-circle-outline', route: 'About' },
    { key: 'contact', label: 'Contact / Support', icon: 'call-outline', route: 'ContactSupport' },
    { key: 'settings', label: 'Settings', icon: 'settings-outline', route: 'Settings' },
  ];

  const onMenuItemPress = (item: typeof menuItems[number]) => {
    closeSidebar();
    if (item.route) {
      try {
        navigation.navigate(item.route);
      } catch (e) {
        // Route may not exist yet — safe fallback
        // eslint-disable-next-line no-console
        console.log('Navigate to', item.route, 'not implemented yet');
      }
    }
  };

  const handleLogout = () => {
    closeSidebar();
    try {
      navigation.navigate('Login');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Logout pressed — implement auth logout flow here');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Hamburger icon — only show when sidebar is closed */}
        {!sidebarOpen && (
          <TouchableOpacity
            accessible
            accessibilityLabel="Open menu"
            style={styles.hamburger}
            onPress={openSidebar}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.burger}>
              <View style={[styles.burgerLine, { width: 28 }]} />
              <View style={[styles.burgerLine, { width: 22 }]} />
              <View style={[styles.burgerLine, { width: 18 }]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Main Content */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={listRef}
            data={slideImages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Image source={item.image} style={styles.slideImage} />
                <View style={styles.slideOverlay}>
                  <Image source={slideLogo} style={styles.slideLogo} resizeMode="contain" />
                </View>
              </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentIndex(idx);
            }}
          />
          <View style={styles.dots}>
            {slideImages.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.categories}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{item}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionTile, styles.actionCompact]}
              onPress={() => (onPressDetails ? onPressDetails() : navigation.navigate('BikeDetails'))}
            >
              <Image source={slideImages[0].buttonImage} style={styles.actionImage} />
              <View style={styles.cardOverlay} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionTile, styles.actionCompact]}>
              <Image source={slideImages[1].buttonImage} style={styles.actionImage} />
              <View style={styles.cardOverlay} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.actionTile, styles.actionWide]}>
            <Image source={slideImages[2].buttonImage} style={styles.actionImage} />
            <View style={styles.cardOverlay} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Text style={styles.sectionTitle}>Popular Bikes</Text>
          <FlatList
            data={popularBikes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BikeCard
                item={item}
                onPress={onPressDetails ?? (() => navigation.navigate('BikeDetails'))}
              />
            )}
            scrollEnabled={false}
          />
        </View>

        {/* Overlay & Sidebar */}
        {sidebarOpen && (
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
        )}

        <Animated.View style={[styles.sidebar, { left: anim }]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.profileName}>User</Text>
                <Text style={styles.profileEmail}>wertyiop@gmail.com</Text>
              </View>
              <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sidebarContent}>
            {menuItems.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={styles.menuItem}
                onPress={() => onMenuItemPress(m)}
              >
                <Ionicons name={m.icon} size={20} color="#374151" style={{ width: 28 }} />
                <Text style={styles.menuLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.menuDivider} />

            <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#e53935" style={{ width: 28 }} />
              <Text style={[styles.menuLabel, { color: '#e53935', fontWeight: '600' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Hamburger (moved slightly down, transparent background)
  hamburger: {
    position: 'absolute',
    top: 28, // moved slightly down from very top
    left: 12,
    zIndex: 30,
    backgroundColor: 'transparent', // transparent background
    borderRadius: 8,
    padding: 6,
    // keep a subtle shadow so white lines pop on light backgrounds
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  burger: {
    width: 32,
    height: 22,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  burgerLine: {
    height: 4, // bolder/thicker line
    backgroundColor: '#fff', // white color
    borderRadius: 2,
  },

  sliderContainer: { height: 240 },
  slide: { width, height: 240 },
  slideImage: { width: '100%', height: '100%' },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideLogo: {
    width: 200,
    height: 90,
  },
  dots: { position: 'absolute', bottom: 12, width: '100%', flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
  dotActive: { width: 20, backgroundColor: '#e53935' },
  categories: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
  categoryText: { color: '#374151' },
  actions: { padding: 16, gap: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionTile: { height: 110, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  actionCompact: { flex: 1 },
  actionWide: { width: '48%', alignSelf: 'center', marginTop: 12 },
  actionImage: { width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },

  // Sidebar styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
    zIndex: 20,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    zIndex: 25,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 16,
  },
  sidebarHeader: {
    height: 140,
    backgroundColor: '#e53935', // red header
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileEmail: { color: '#fff', fontSize: 12, marginTop: 2, opacity: 0.95 },
  closeBtn: { padding: 6 },

  sidebarContent: { paddingVertical: 12, paddingHorizontal: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 6,
  },
  menuLabel: { marginLeft: 6, fontSize: 15, color: '#111827' },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12, marginHorizontal: 8 },

  logoutBtn: {
    marginTop: 6,
  },
});

// sample data moved below to keep component file tidy
const popularBikes: BikeItem[] = [
  {
    id: '1',
    name: 'Yamaha R15 V4',
    price: 15000,
    location: 'Mumbai, India',
    image: 'https://images.unsplash.com/photo-1542367597-8849eb87c595?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Royal Enfield Classic',
    price: 18000,
    location: 'Pune, India',
    image: 'https://images.unsplash.com/photo-1620095383895-5ec2882b180b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'KTM Duke 390',
    price: 22000,
    location: 'Bengaluru, India',
    image: 'https://images.unsplash.com/photo-1613364429202-8185c64cbea8?q=80&w=1200&auto=format&fit=crop',
  },
];
