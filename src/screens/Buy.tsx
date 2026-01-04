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
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";

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



const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLACEHOLDER_ITEMS = ["Location", "Price", "Company", "Category", "Location"];
const ITEM_HEIGHT = 30;

export default function Buy() {
  const [selected, setSelected] = useState<string>("All");
  const { isDark } = useTheme();
  const [bikes, setBikes] = useState<any[]>([]);
  const [selectedBike, setSelectedBike] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Filter states
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([10000, 1000000]);
  const [searchQuery, setSearchQuery] = useState("");
  const [slideAnim] = useState(new Animated.Value(SCREEN_WIDTH));

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

  useEffect(() => {
    if (filterVisible) {
      slideAnim.setValue(SCREEN_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [filterVisible]);

  const handleCloseFilters = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setFilterVisible(false);
    });
  };

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, SCREEN_WIDTH],
    outputRange: [1, 0],
  });

  const colors = {
    bg: isDark ? "#111827" : "#ffffff",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#374151",
    border: isDark ? "#374151" : "#D1D5DB",
  };

  const fetchBikes = async () => {
    const { data, error } = await supabase
      .from("sellbikes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBikes(data);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBikes();
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

  const applyFilters = () => {
    handleCloseFilters();
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedCompanies([]);
    setSortBy("");
    setPriceRange([10000, 1000000]);
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

  const openBikeDetails = (bike: any) => {
    setSelectedBike(bike);
    setModalVisible(true);
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const handleBookTestDrive = () => {
    // You can implement booking logic here
    alert('Test drive booking request sent!');
    setModalVisible(false);
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
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
          Bikes To Buy
        </Text>
      </View>

      <FlatList
        data={filteredBikes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openBikeDetails(item)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.bikeCard,
                { backgroundColor: colors.card },
              ]}
            >
              <Image
                source={{ uri: item.images?.[0] }}
                style={styles.bikeImage}
              />

              <View style={styles.bikeInfo}>
                <Text style={[styles.bikeTitle, { color: colors.text }]}>
                  {item.company} {item.model}
                </Text>

                <Text style={[styles.bikeSub, { color: colors.subText }]}>
                  {item.year} • {item.km}
                </Text>

                <Text style={styles.bikePrice}>{item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Bike Details Modal - Small Panel Like Sell Section */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.detailsModalContainer}>
          <View style={[styles.detailsModalPanel, { backgroundColor: colors.card }]}>
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
                        style={[styles.modalBikeImage, { width: SCREEN_WIDTH }]}
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
                    style={styles.modalBikeImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Bike Details */}
            <View style={styles.modalDetailsContent}>
              <Text style={[styles.modalDetailTitle, { color: colors.text }]}>
                {selectedBike?.company} {selectedBike?.model}
              </Text>
              <Text style={[styles.modalDetailText, { color: colors.subText }]}>Year: {selectedBike?.year}</Text>
              <Text style={[styles.modalDetailText, { color: colors.subText }]}>KM Driven: {selectedBike?.km}</Text>
              <Text style={[styles.modalDetailText, { color: colors.subText }]}>Type: {selectedBike?.bike_type}</Text>
              <Text style={[styles.modalDetailText, { color: colors.subText }]}>Price: {selectedBike?.price}</Text>
              {selectedBike?.location && (
                <Text style={[styles.modalDetailText, { color: colors.subText }]}>Location: {selectedBike?.location}</Text>
              )}
              {selectedBike?.description && (
                <Text style={[styles.modalDetailText, { color: colors.subText }]}>Description: {selectedBike?.description}</Text>
              )}
            </View>

            {/* Book Test Drive Button */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.testDriveButton}
                onPress={handleBookTestDrive}
              >
                <Text style={styles.testDriveButtonText}>Book a Test Drive</Text>
              </TouchableOpacity>
            </View>
          </View>
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

      {/* Filter Sidebar Modal */}
      <Modal
        visible={filterVisible}
        animationType="none"
        transparent
        onRequestClose={handleCloseFilters}
      >
        <View style={styles.filterModalContainer}>
          <Animated.View
            style={[styles.filterOverlay, { opacity: overlayOpacity }]}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={handleCloseFilters}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.filterSidebar,
              {
                backgroundColor: colors.card,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <View style={[styles.filterHeader, { backgroundColor: '#e53935', borderBottomWidth: 0 }]}>
              <Text style={[styles.filterTitle, { color: '#ffffff' }]}>Filters</Text>
              <TouchableOpacity onPress={handleCloseFilters}>
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Companies Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Sort by Company</Text>
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
              </View>

              {/* Categories Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Categories</Text>
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
              </View>

              {/* Sort By Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Sort By</Text>
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
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Price Range</Text>
                <View style={styles.priceRangeContainer}>
                  <Text style={[styles.priceText, { color: colors.text }]}>₹{priceRange[0].toLocaleString()}</Text>
                  <Text style={[styles.priceText, { color: colors.text }]}>₹{priceRange[1].toLocaleString()}</Text>
                </View>

                <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <MultiSlider
                    values={[priceRange[0], priceRange[1]]}
                    sliderLength={SCREEN_WIDTH * 0.8 - 50}
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
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterActionButton, styles.resetButton]}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterActionButton, styles.applyButton]}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#e53935",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  logo: {
    width: 120,
    height: 50,
  },
  filterButtonWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    position: 'relative',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    left: 40, // Icon width + margin
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 0, // Removed padding since placeholder is absolute
    fontSize: 16,
    zIndex: 10,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 100,
    backgroundColor: '#e53935',
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabel: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  filterActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#6B7280',
  },
  applyButton: {
    backgroundColor: '#e53935',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  bikeCard: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },
  bikeImage: {
    width: "100%",
    height: 180,
  },
  bikeInfo: {
    padding: 12,
  },
  bikeTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  bikeSub: {
    fontSize: 13,
    marginTop: 4,
  },
  bikePrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#e53935",
  },
  detailsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalPanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalImageWrapper: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  modalBikeImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
  },
  modalDetailsContent: {
    padding: 20,
  },
  modalDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDetailText: {
    fontSize: 16,
    marginTop: 5,
  },
  modalButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  testDriveButton: {
    backgroundColor: '#e53935',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  testDriveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
  },
  imageModalCloseText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
