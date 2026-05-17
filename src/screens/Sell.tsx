import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import AnimatedRE, {
  FadeInUp,
  FadeOutDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Layout,
  runOnJS,
  interpolate,
  SlideInDown,
  SlideOutDown
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { useRoute, useNavigation } from "@react-navigation/native";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH, SCREEN_HEIGHT } from "../utils/responsive";
import { useNotifications } from "../context/NotificationContext";

const width = SCREEN_WIDTH;
const height = SCREEN_HEIGHT;
const CARD_WIDTH = width - scale(32);


export default function Sell() {
  const { isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { showNotification } = useNotifications();

  const colors = {
    bg: isDark ? "#111827" : "#ffffff",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#555",
    border: isDark ? "#374151" : "#e53935",
    inputBg: isDark ? "#111827" : "#f2f2f2",
  };

  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bikeList, setBikeList] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [location, setLocation] = useState("");
  const [isLocLoading, setIsLocLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedKm, setSelectedKm] = useState("");
  const [description, setDescription] = useState("");
  const [bikeType, setBikeType] = useState("");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [oldImages, setOldImages] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  // Animation Values - Removed unused shared values

  const toggleModal = (show: boolean) => {
    setOpen(show);
  };

  const toggleDetails = (show: boolean) => {
    setDetailsOpen(show);
  };

  const bikeData: any = {
    "Hero MotoCorp": ["Splendor Plus", "HF Deluxe", "Passion Pro", "Glamour", "Super Splendor", "Xpulse 200", "Xtreme 160R"],
    Honda: ["Shine", "Unicorn", "SP125", "Hornet 2.0", "Dio", "Activa 6G"],
    TVS: ["Apache RTR 160", "Apache RTR 180", "Apache RR310", "Jupiter", "Ntorq"],
    Bajaj: ["Pulsar 150", "Pulsar 180", "Pulsar NS200", "Pulsar RS200", "Platina", "CT100"],
    "Royal Enfield": ["Classic 350", "Bullet 350", "Meteor 350", "Himalayan", "Interceptor 650", "Continental GT 650"],
    Yamaha: ["FZ", "FZS", "R15 V3/V4", "MT-15", "Fascino", "RayZR"],
    Suzuki: ["Access 125", "Gixxer 155", "Gixxer SF", "Burgman Street"],
    KTM: ["Duke 125", "Duke 200", "Duke 250", "Duke 390", "RC200", "RC390"],
    "TVS BMW": ["G310R", "G310GS"],
    Mahindra: ["Mojo", "Centuro"],
  };

  const years: string[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = 2015; y <= currentYear; y++) years.push(y.toString());

  const kmOptions = [
    "1,000 - 10,000",
    "10,000 - 20,000",
    "20,000 - 30,000",
    "30,000 - 40,000",
    "40,000 - 50,000",
    "50,000+",
  ];

  const bikeTypes = [
    "Standard",
    "Adventure",
    "Cruiser",
    "Sport",
    "Naked",
    "Scooter",
  ];

  const models = selectedCompany ? bikeData[selectedCompany] : [];
  const yearOptions = selectedModel ? years : [];

  const pickImages = async () => {
    if (images.length >= 4) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 4 - images.length,
    });
    if (!result.canceled) {
      const selected = result.assets.map((a: any) => a.uri);
      setImages([...images, ...selected].slice(0, 4));
    }
  };

  const replaceImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled) {
      const updated = [...images];
      updated[index] = result.assets[0].uri;
      setImages(updated);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };


  const getCurrentLocation = async () => {
    setIsLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLocLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      if (address.length > 0) {
        const a = address[0];
        const place =
          a.district ||
          a.name ||
          a.city;

        setLocation(`${place}, ${a.region}`);
      }
    } catch (error) {
      console.log('Error fetching location', error);
    } finally {
      setIsLocLoading(false);
    }
  };



  const handlePriceChange = (text: string) => {
    const only = text.replace(/[^0-9]/g, "");
    setPrice(only ? "₹" + only : "");
  };

  const resetForm = () => {
    setSelectedCompany("");
    setSelectedModel("");
    setSelectedYear("");
    setSelectedKm("");
    setBikeType("");
    setImages([]);
    setPrice("");
    setAvgPrice("");
    setLocation("");
    setDescription("");
    setEditIndex(null);
    setEditId(null);
  };

  const saveBike = async () => {
    try {
      if (images.length === 0) {
        alert("Please upload at least one image");
        return;
      }

      setIsSaving(true);

      const uploadedImageUrls: string[] = [];

      for (const img of images) {
        if (img.startsWith("file://")) {
          const fileExt = img.split(".").pop() || "jpg";
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

          const formData = new FormData();
          formData.append("file", {
            uri: img,
            name: fileName,
            type: `image/${fileExt}`,
          } as any);

          const { error } = await supabase.storage
            .from("sellbikeimages")
            .upload(fileName, formData);

          if (error) throw error;

          const { data } = supabase.storage
            .from("sellbikeimages")
            .getPublicUrl(fileName);

          uploadedImageUrls.push(data.publicUrl);
        } else {
          uploadedImageUrls.push(img);
        }
      }

      if (editId) {
        const removedImages = oldImages.filter(img => !uploadedImageUrls.includes(img));
        if (removedImages.length > 0) {
          await deleteImagesFromStorage(removedImages).catch(e => console.error("Storage cleanup failed:", e));
        }

        const { error } = await supabase
          .from("sellbikes")
          .update({
            company: selectedCompany,
            model: selectedModel,
            year: selectedYear,
            km: selectedKm,
            bike_type: bikeType,
            price,
            avg_price: avgPrice,
            location,
            description,
            images: uploadedImageUrls
          })
          .eq("id", editId);

        if (error) throw error;

        setBikeList(prev => prev.map(b => b.id === editId ? {
          ...b,
          company: selectedCompany,
          model: selectedModel,
          year: selectedYear,
          km: selectedKm,
          bikeType,
          price,
          avgPrice,
          location,
          description,
          images: uploadedImageUrls,
        } : b));
      } else {
        const { data: userData } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from("sellbikes")
          .insert([
            {
              owner_id: userData.user?.id,
              company: selectedCompany,
              model: selectedModel,
              year: selectedYear,
              km: selectedKm,
              bike_type: bikeType,
              price,
              avg_price: avgPrice,
              location,
              description,
              images: uploadedImageUrls
            }
          ])
          .select()
          .single();


        if (error) throw error;

        setBikeList((prev) => [
          {
            ...data,
            bikeType: data.bike_type,
            avgPrice: data.avg_price
          },
          ...prev
        ]);

        if (userData.user) {
          await showNotification({
            title: "Bike Listed!",
            message: `Your ${selectedCompany} ${selectedModel} is now live and visible to buyers.`,
            icon: "checkmark-circle",
            color: "#10B981"
          });
        }
      }


      resetForm();
      toggleModal(false);

    } catch (err: any) {
      alert(err.message || "Failed to save bike");
    } finally {
      setIsSaving(false);
      setEditId(null);
      setEditIndex(null);
    }
  };

  const deleteImagesFromStorage = async (imageUrls: string[]) => {
    const filePaths = imageUrls.map((url) => {
      const parts = url.split("/sellbikeimages/");
      return parts[1];
    });

    console.log("Deleting files:", filePaths);

    const { error } = await supabase.storage
      .from("sellbikeimages")
      .remove(filePaths);

    console.log("Delete error:", error);

    if (error) throw error;
  };



  const deleteListing = async () => {
    try {
      if (!selectedListing) return;

      await deleteImagesFromStorage(selectedListing.images);

      const { error } = await supabase
        .from("sellbikes")
        .delete()
        .eq("id", selectedListing.id);

      if (error) throw error;

      setBikeList((prev) =>
        prev.filter((b) => b.id !== selectedListing.id)
      );

      toggleDetails(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete bike");
    }
  };


  const formatPrice = (text: string, setter: any) => {
    const only = text.replace(/[^0-9]/g, "");
    setter(only ? "₹" + only : "");
  };

  const openEdit = (item: any, index: number) => {
    setEditIndex(index);
    setEditId(item.id);
    setSelectedCompany(item.company);
    setSelectedModel(item.model);
    setSelectedYear(item.year);
    setSelectedKm(item.km);
    setBikeType(item.bikeType || "");
    setPrice(item.price);
    setAvgPrice(item.avgPrice || "");
    setLocation(item.location);
    setDescription(item.description || "");
    setOldImages(item.images);
    setImages(item.images);
    toggleModal(true);
  };

  const calculateAvgPrice = (
    type: string,
    year: string,
    km: string
  ) => {
    if (!type || !year || !km) return "";

    const basePrices: any = {
      Standard: 150000,
      Scooter: 120000,
      Sport: 200000,
      Cruiser: 300000,
      Adventure: 400000,
      Naked: 250000,
    };

    let price = basePrices[type] || 70000;

    const currentYear = new Date().getFullYear();
    const age = currentYear - Number(year);
    price -= price * (age * 0.05);

    if (km.includes("10,000")) price -= price * 0.05;
    else if (km.includes("20,000")) price -= price * 0.1;
    else if (km.includes("30,000")) price -= price * 0.15;
    else if (km.includes("40,000")) price -= price * 0.2;
    else if (km.includes("50,000")) price -= price * 0.25;
    price *= getCompanyMultiplier(selectedCompany);

    return "₹" + Math.max(Math.round(price), 15000);
  };

  const getCompanyMultiplier = (company: string) => {
    if (company === "Royal Enfield") return 1.1;
    if (company === "KTM") return 1.15;
    if (company === "Yamaha") return 1.05;
    if (company === "Honda") return 1.05;
    return 1;
  };

  const getPriceStatus = (userPrice: string, marketPrice: string) => {
    if (!userPrice || !marketPrice) return "";

    const u = Number(userPrice.replace(/[^0-9]/g, ""));
    const m = Number(marketPrice.replace(/[^0-9]/g, ""));

    if (u <= m * 0.9) return "Good Deal";
    if (u <= m * 1.1) return "Fair Price";
    return "Overpriced";
  };

  const getStatusColor = (status: string) => {
    if (status === "Good Deal") return "#16a34a";
    if (status === "Fair Price") return "#eab308";
    if (status === "Overpriced") return "#dc2626";
    return "#6b7280";
  };


  useEffect(() => {
    const value = calculateAvgPrice(
      bikeType,
      selectedYear,
      selectedKm
    );
    setAvgPrice(value);
  }, [bikeType, selectedYear, selectedKm, selectedCompany]);

  useEffect(() => {
    const fetchBikes = async () => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("sellbikes")
        .select("*")
        .eq("owner_id", userData.user?.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBikeList(
          data.map((item: any) => ({
            ...item,
            bikeType: item.bike_type,
            avgPrice: item.avg_price,
          }))
        );

      }
    };

    fetchBikes();
  }, []);

  useEffect(() => {
    const params = route.params as any;
    if (params?.initialBike) {
      const bike = params.initialBike;
      setSelectedListing(bike);
      toggleDetails(true);
      // Clear params so it doesn't open again on re-focus
      navigation.setParams({ initialBike: undefined } as any);
    }
  }, [route.params, bikeList]);


  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Image source={require("../../assets/logo3.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 28 }} />
      </View>

      {bikeList.length === 0 ? (
        <View style={styles.centerArea}>
          <Ionicons name="bicycle-outline" size={80} color={colors.subText + "44"} />
          <Text style={[styles.placeholder, { color: colors.subText, marginTop: 12 }]}>Ready to sell your ride?</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: "#e53935", marginTop: 24 }]}
            onPress={() => {
              resetForm();
              toggleModal(true);
            }}
          >
            <Text style={styles.addBtnText}>List Your Bike Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={[styles.listHeading, { color: colors.text }]}>
              Your Listed Bikes
            </Text>

            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => {
                resetForm();
                toggleModal(true);
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addMoreText}>Add New</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={bikeList}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedRE.View
                entering={FadeInUp.delay(index * 100)}
                style={[styles.listingCard, { backgroundColor: colors.card }]}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedListing({ ...item, index });
                    toggleDetails(true);
                  }}
                >
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.listingImage}
                  />
                  <View style={styles.listingInfo}>
                    <View style={styles.infoTop}>
                      <Text style={[styles.listTitle, { color: colors.text }]}>{item.company} {item.model}</Text>
                      <Text style={styles.listPrice}>{item.price}</Text>
                    </View>
                    <View style={styles.infoBottom}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="calendar-outline" size={12} color={colors.subText} />
                        <Text style={[styles.metaText, { color: colors.subText }]}>{item.year}</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Ionicons name="speedometer-outline" size={12} color={colors.subText} />
                        <Text style={[styles.metaText, { color: colors.subText }]}>{item.km}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedRE.View>
            )}
          />
        </>
      )}


      {/* Modern Modal Overlay */}
      {(open || detailsOpen) && (
        <AnimatedRE.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={[StyleSheet.absoluteFill, styles.overlay]}
          pointerEvents={(open || detailsOpen) ? "auto" : "none"}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              if (open) toggleModal(false);
              if (detailsOpen) toggleDetails(false);
            }}
          />
        </AnimatedRE.View>
      )}

      {/* Animated Sell Form Panel */}
      {open && (
        <AnimatedRE.View
          entering={SlideInDown.duration(400)}
          exiting={SlideOutDown.duration(300)}
          style={[styles.popupPanel, { backgroundColor: colors.card }]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editId ? "Edit Listing" : "Sell Your Bike"}
            </Text>
            <TouchableOpacity onPress={() => toggleModal(false)} style={styles.closeBtnCircle}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.formSection}>
              <View style={styles.sectionBadge}>
                <Ionicons name="information-circle" size={16} color="#e53935" />
                <Text style={styles.badgeText}>Bike Details</Text>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Company</Text>
              <View style={[styles.pickerWrapper, { borderColor: colors.border + "44", backgroundColor: colors.inputBg }]}>
                <Picker selectedValue={selectedCompany} onValueChange={(v) => {
                  setSelectedCompany(v);
                  setSelectedModel("");
                  setSelectedYear("");
                }} style={{ color: colors.text }}
                  dropdownIconColor={colors.text}>
                  <Picker.Item label="Select Brand" value="" />
                  {Object.keys(bikeData).map((c) => (
                    <Picker.Item label={c} value={c} key={c} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Model</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border + "44" }]}>
                <Picker selectedValue={selectedModel} enabled={models.length > 0} onValueChange={setSelectedModel} style={{ color: colors.text }}
                  dropdownIconColor={colors.text}>
                  <Picker.Item label="Select Model" value="" />
                  {models.map((m: any) => (
                    <Picker.Item label={m} value={m} key={m} />
                  ))}
                </Picker>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                  <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border + "44" }]}>
                    <Picker selectedValue={selectedYear} enabled={yearOptions.length > 0} onValueChange={setSelectedYear} style={{ color: colors.text }}
                      dropdownIconColor={colors.text}>
                      <Picker.Item label="Year" value="" />
                      {yearOptions.map((yr) => (
                        <Picker.Item label={yr} value={yr} key={yr} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Type</Text>
                  <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border + "44" }]}>
                    <Picker selectedValue={bikeType} onValueChange={setBikeType} style={{ color: colors.text }} dropdownIconColor={colors.text}>
                      <Picker.Item label="Type" value="" />
                      {bikeTypes.map((type) => (
                        <Picker.Item label={type} value={type} key={type} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>KM Driven</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border + "44" }]}>
                <Picker selectedValue={selectedKm} onValueChange={setSelectedKm} style={{ color: colors.text }}
                  dropdownIconColor={colors.text}>
                  <Picker.Item label="Select Range" value="" />
                  {kmOptions.map((km) => (
                    <Picker.Item label={km} value={km} key={km} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionBadge}>
                <Ionicons name="pricetag" size={16} color="#e53935" />
                <Text style={styles.badgeText}>Pricing & Location</Text>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.priceCol}>
                  <Text style={[styles.label, { color: colors.text }]}>Your Price</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border + "44" }]}
                    placeholder="e.g. ₹85,000"
                    placeholderTextColor={colors.subText}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={handlePriceChange}
                  />
                </View>
                <View style={styles.priceCol}>
                  <Text style={[styles.label, { color: colors.text }]}>Market Price</Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border + "22", opacity: 0.7 }]}>
                    <Text style={{ color: colors.text }}>{avgPrice || "Calculating..."}</Text>
                  </View>
                </View>
              </View>

              {avgPrice && price && (
                <AnimatedRE.View entering={FadeInUp} style={[styles.statusBanner, { backgroundColor: getStatusColor(getPriceStatus(price, avgPrice)) + "22" }]}>
                  <Ionicons name="speedometer" size={18} color={getStatusColor(getPriceStatus(price, avgPrice))} />
                  <Text style={[styles.statusText, { color: getStatusColor(getPriceStatus(price, avgPrice)) }]}>
                    This is a <Text style={{ fontWeight: "800" }}>{getPriceStatus(price, avgPrice)}</Text>
                  </Text>
                </AnimatedRE.View>
              )}

              <Text style={[styles.label, { color: colors.text }]}>Location</Text>
              <View style={styles.locationContainer}>
                <TextInput
                  style={[styles.locationInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border + "44" }]}
                  placeholder="Where is the bike?"
                  placeholderTextColor={colors.subText}
                  value={location}
                  onChangeText={setLocation}
                />
                <TouchableOpacity style={styles.locBtnSmall} onPress={getCurrentLocation} disabled={isLocLoading}>
                  {isLocLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="location" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionBadge}>
                <Ionicons name="images" size={16} color="#e53935" />
                <Text style={styles.badgeText}>Photos & Story</Text>
              </View>

              <TouchableOpacity style={[styles.modernUpload, { backgroundColor: colors.inputBg }]} onPress={pickImages}>
                <Ionicons name="cloud-upload-outline" size={32} color="#e53935" />
                <Text style={[styles.uploadHint, { color: colors.subText }]}>Tap to upload up to 4 photos</Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <View style={styles.imgStrip}>
                  {images.map((img, index) => (
                    <View key={index} style={styles.imgWrapper}>
                      <Image source={{ uri: img }} style={styles.imgPreview} />
                      <TouchableOpacity style={styles.imgClose} onPress={() => removeImage(index)}>
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.descInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border + "44" }]}
                placeholder="Ownership details, last service, health, Any Customization, etc."
                placeholderTextColor={colors.subText}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={[styles.submitBtn, { opacity: isSaving ? 0.7 : 1 }]} onPress={saveBike} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{editId ? "Update Listing" : "Post Advertisement"}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </AnimatedRE.View>
      )}

      {/* Animated Details Panel */}
      {detailsOpen && (
        <AnimatedRE.View
          entering={SlideInDown.duration(400)}
          exiting={SlideOutDown.duration(300)}
          style={[styles.popupPanel, { backgroundColor: colors.card, height: "85%" }]}
        >
          <View style={styles.modalHandle} />
          <TouchableOpacity onPress={() => toggleDetails(false)} style={styles.detailsBackBtn}>
            <Ionicons name="chevron-down" size={32} color={colors.text} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailsImageCard}>
              {selectedListing?.images?.length > 1 ? (
                <FlatList
                  data={selectedListing.images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => { setPreviewIndex(index); setImagePreviewOpen(true); }}>
                      <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH - 48, height: 280, borderRadius: 24 }} />
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Image source={{ uri: selectedListing?.images[0] }} style={styles.detailsHero} />
              )}
            </View>

            <View style={styles.detailsBody}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mainTitle, { color: colors.text }]}>{selectedListing?.company} {selectedListing?.model}</Text>
                  <Text style={styles.mainPrice}>{selectedListing?.price}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeTxt}>{selectedListing?.bikeType}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={{ flexDirection: 'row', gap: scale(12) }}>
                  <View style={[styles.infoItem, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="calendar-outline" size={20} color="#e53935" />
                    <Text style={[styles.infoVal, { color: colors.text }]}>{selectedListing?.year}</Text>
                    <Text style={styles.infoLbl}>Year</Text>
                  </View>
                  <View style={[styles.infoItem, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="speedometer-outline" size={20} color="#e53935" />
                    <Text style={[styles.infoVal, { color: colors.text }]}>{selectedListing?.km}</Text>
                    <Text style={styles.infoLbl}>Driven</Text>
                  </View>
                </View>
                <View style={[styles.infoItem, { backgroundColor: colors.inputBg, marginTop: verticalScale(12), width: '100%', flex: 0 }]}>
                  <Ionicons name="location-outline" size={20} color="#e53935" />
                  <Text style={[styles.infoVal, { color: colors.text }]} numberOfLines={1}>{selectedListing?.location.split(',')[0]}</Text>
                  <Text style={styles.infoLbl}>City</Text>
                </View>
              </View>

              <View style={[styles.descBlock, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.descTitle, { color: colors.text }]}>Owner's Note</Text>
                <Text style={[styles.descPara, { color: colors.subText }]}>{selectedListing?.description || "No description provided."}</Text>
              </View>

              <View style={styles.detailsActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: "#e53935", borderWidth: 1.5 }]}
                  onPress={() => {
                    openEdit(selectedListing, selectedListing.index);
                    toggleDetails(false);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#e53935" />
                  <Text style={[styles.actionBtnTxt, { color: "#e53935" }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#e53935" }]} onPress={deleteListing}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={[styles.actionBtnTxt, { color: "#fff" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </AnimatedRE.View>
      )}

      <Modal visible={imagePreviewOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <FlatList
            data={selectedListing?.images}
            horizontal
            pagingEnabled
            initialScrollIndex={previewIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(img) => img}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: "center", alignItems: "center" }}>
                <Image source={{ uri: item }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
              </View>
            )}
          />
          <TouchableOpacity onPress={() => setImagePreviewOpen(false)} style={styles.previewClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: "#e53935",
    height: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 8,
  },
  logo: { width: 120, height: 50, marginTop: 15 },
  centerArea: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  placeholder: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  addBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  listHeading: { fontSize: 22, fontWeight: "900" },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  addMoreText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  listingCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 4,
  },
  listingImage: { width: "100%", height: 200 },
  listingInfo: { padding: 20 },
  infoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  listTitle: { fontSize: 18, fontWeight: "800", flex: 1 },
  listPrice: { fontSize: 18, fontWeight: "900", color: "#e53935" },
  infoBottom: { flexDirection: "row", gap: 16 },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, fontWeight: "600" },
  overlay: { backgroundColor: "rgba(0,0,0,0.4)", zIndex: 100 },
  popupPanel: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: "90%",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    zIndex: 101,
    elevation: 25,
  },
  modalHandle: {
    width: 40, height: 5,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(28),
  },
  modalTitle: { fontSize: rf(26), fontWeight: "900" },
  closeBtnCircle: {
    width: scale(44), height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
  },
  formSection: { marginBottom: verticalScale(30) },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(14),
    alignSelf: "flex-start",
    marginBottom: verticalScale(20),
    gap: scale(8),
  },
  badgeText: { color: "#e53935", fontSize: rf(14), fontWeight: "800" },
  label: { fontSize: rf(15), fontWeight: "700", marginBottom: verticalScale(8), marginLeft: scale(4) },
  pickerWrapper: { borderRadius: moderateScale(18), marginBottom: verticalScale(18), borderWidth: 1.5, overflow: "hidden" },
  priceRow: { flexDirection: "row", gap: scale(12), marginBottom: verticalScale(18) },
  priceCol: { flex: 1 },
  inputBox: { height: verticalScale(56), borderRadius: moderateScale(18), paddingHorizontal: scale(16), marginBottom: verticalScale(18), borderWidth: 1.5, justifyContent: "center" },
  formRow: { flexDirection: "row", gap: scale(12) },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(16),
    borderRadius: moderateScale(18),
    marginBottom: verticalScale(20),
    gap: scale(10),
  },
  statusText: { fontSize: rf(15), fontWeight: "600" },
  locationContainer: { flexDirection: "row", gap: scale(10) },
  locationInput: { flex: 1, height: verticalScale(56), borderRadius: moderateScale(18), paddingHorizontal: scale(16), borderWidth: 1.5 },
  locBtnSmall: { width: scale(56), height: scale(56), backgroundColor: "#e53935", borderRadius: moderateScale(18), justifyContent: "center", alignItems: "center" },
  modernUpload: {
    height: verticalScale(120),
    borderRadius: moderateScale(24),
    borderWidth: 2.5,
    borderColor: "#e5393522",
    borderStyle: "dashed",
    justifyContent: "center", alignItems: "center",
    marginBottom: verticalScale(20),
  },
  uploadHint: { fontSize: rf(14), marginTop: verticalScale(10), fontWeight: "600" },
  imgStrip: { flexDirection: "row", gap: scale(12), marginBottom: verticalScale(20) },
  imgWrapper: { position: "relative" },
  imgPreview: { width: scale(85), height: scale(85), borderRadius: moderateScale(18) },
  imgClose: {
    position: "absolute", top: verticalScale(-8), right: scale(-8),
    backgroundColor: "#e53935",
    width: scale(24), height: scale(24),
    borderRadius: scale(12),
    justifyContent: "center", alignItems: "center",
  },
  descInput: { borderRadius: moderateScale(24), padding: moderateScale(20), borderWidth: 1.5, textAlignVertical: "top", minHeight: verticalScale(120) },
  submitBtn: {
    backgroundColor: "#e53935",
    height: verticalScale(64),
    borderRadius: moderateScale(20),
    justifyContent: "center", alignItems: "center",
    marginTop: verticalScale(20),
    marginBottom: verticalScale(100),
    elevation: 8,
  },
  submitBtnText: { color: "#fff", fontSize: rf(18), fontWeight: "900" },
  detailsBackBtn: { position: "absolute", right: scale(24), top: verticalScale(12), zIndex: 10 },
  detailsImageCard: { marginTop: verticalScale(12), paddingHorizontal: 0, justifyContent: "center", alignItems: "center" },
  detailsHero: { width: width - scale(48), height: verticalScale(280), borderRadius: moderateScale(28) },
  detailsBody: { padding: moderateScale(24) },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: verticalScale(28) },
  mainTitle: { fontSize: rf(28), fontWeight: "900" },
  mainPrice: { fontSize: rf(24), fontWeight: "900", color: "#e53935", marginTop: verticalScale(4) },
  typeBadge: { backgroundColor: "#fee2e2", paddingHorizontal: scale(16), paddingVertical: verticalScale(8), borderRadius: moderateScale(14) },
  typeBadgeTxt: { color: "#e53935", fontWeight: "800", fontSize: rf(14) },
  infoGrid: {
    flexDirection: "column",
    marginBottom: verticalScale(28)
  },
  infoItem: { flex: 1, padding: moderateScale(18), borderRadius: moderateScale(24), alignItems: "center", justifyContent: "center", elevation: 1 },
  infoVal: { fontSize: rf(16), fontWeight: "900", marginTop: verticalScale(8), textAlign: "center" },
  infoLbl: { fontSize: rf(12), color: "#888", fontWeight: "700", marginTop: verticalScale(4) },
  descBlock: { padding: moderateScale(24), borderRadius: moderateScale(28), marginBottom: verticalScale(28) },
  descTitle: { fontSize: rf(18), fontWeight: "900", marginBottom: verticalScale(10) },
  descPara: { fontSize: rf(15), lineHeight: verticalScale(24) },
  detailsActions: { flexDirection: "row", gap: scale(16), marginBottom: verticalScale(120) },
  actionBtn: { flex: 1, height: verticalScale(56), borderRadius: moderateScale(18), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(10) },
  actionBtnTxt: { fontWeight: "800", fontSize: rf(16) },
  previewClose: { position: "absolute", top: verticalScale(50), right: scale(24), backgroundColor: "rgba(0,0,0,0.6)", padding: moderateScale(12), borderRadius: moderateScale(30) },
});

