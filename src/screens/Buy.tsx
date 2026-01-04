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
  Pressable,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";

const categories = [
  "All",
  "Standard",
  "Adventure",
  "Cruiser",
  "Sport",
  "Naked",
  "Scooter",
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Buy() {
  const [selected, setSelected] = useState<string>("All");
  const { isDark } = useTheme();
  const [bikes, setBikes] = useState<any[]>([]);
  const [selectedBike, setSelectedBike] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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


  const filteredBikes =
    !selected || selected === "All"
      ? bikes
      : bikes.filter((b) => b.bike_type === selected);

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

      <View style={styles.categoriesWrapper}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Categories
        </Text>

        <FlatList
          data={categories}
          horizontal
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => {
            const active = selected === item;
            return (
              <TouchableOpacity onPress={() => setSelected(item)}>
                <View
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active
                        ? "#e53935"
                        : colors.card,
                      borderColor: active
                        ? "#e53935"
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: active ? "#ffffff" : colors.subText,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
  categoriesWrapper: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 16,
    marginBottom: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
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
