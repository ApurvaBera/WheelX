import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import { supabase } from "../supabase";
import { Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useTheme } from "../context/ThemeContext";
import { useEffect } from "react";

export default function Sell() {
  const { isDark } = useTheme();

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
  const SCREEN_WIDTH = Dimensions.get("window").width;

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

  const CARD_WIDTH = SCREEN_WIDTH - 32;
  const models = selectedCompany ? bikeData[selectedCompany] : [];
  const yearOptions = selectedModel ? years : [];

  const pickImages = async () => {
    if (images.length >= 4) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

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
    setBikeType("");
    setImages([]);
    setPrice("");
    setAvgPrice("");
    setLocation("");
    setDescription("");
    setEditIndex(null);
  };

  const saveBike = async () => {
    try {
      if (images.length === 0) {
        alert("Please upload at least one image");
        return;
      }

      const uploadedImageUrls: string[] = [];

      for (const img of images) {
        if (img.startsWith("file://")) {
          const fileExt = img.split(".").pop() || "jpg";
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${fileExt}`;

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

      const removedImages = oldImages.filter(
        (oldImg) => !uploadedImageUrls.includes(oldImg)
      );


      if (editId) {
        const removedImages = oldImages.filter(
          (oldImg) => !uploadedImageUrls.includes(oldImg)
        );

        if (removedImages.length > 0) {
          await deleteImagesFromStorage(removedImages);
        }
      }


      if (editId) {
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

        setBikeList((prev) =>
          prev.map((b) =>
            b.id === editId
              ? {
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
              }
              : b
          )
        );

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
      }


      resetForm();
      setOpen(false);

    } catch (err: any) {
      alert(err.message || "Failed to save bike");
    }
    setEditId(null);
    setEditIndex(null);
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

      setDetailsOpen(false);
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
    setOpen(true);
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


  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Image source={require("../../assets/logo3.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 28 }} />
      </View>

      {bikeList.length === 0 ? (
        <View style={styles.centerArea}>
          <Text style={[styles.placeholder, { color: colors.subText }]}>Sell Your Bike</Text>
        </View>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={[styles.listHeading, { color: colors.text }]}>
              Your Listed Bikes
            </Text>

            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => setOpen(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addMoreText}>Add More Bikes</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={bikeList}
            extraData={bikeList}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const single = bikeList.length === 1;

              return (

                <View
                  style={[
                    styles.listingCard,
                    single && styles.singleCard,
                    { backgroundColor: colors.card }
                  ]}
                >

                  {item.images?.length > 1 ? (
                    <FlatList
                      data={item.images}
                      horizontal
                      pagingEnabled
                      nestedScrollEnabled
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(_, i) => i.toString()}
                      style={{ width: "100%" }}
                      renderItem={({ item: img }) => (
                        <Image
                          source={{ uri: img }}
                          style={{
                            width: CARD_WIDTH,
                            height: single ? 350 : 180,
                          }}
                        />
                      )}
                    />
                  ) : item.images?.length === 1 ? (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={single ? styles.singleImage : styles.listingImage}
                    />
                  ) : null}


                  <TouchableOpacity
                    onPress={() => {
                      setSelectedListing({ ...item, index });
                      setDetailsOpen(true);
                    }}
                  >
                    <View style={styles.listingInfo}>
                      <Text style={[styles.listTitle, { color: colors.text }]}>{item.company} {item.model}</Text>
                      <Text style={[styles.listSub, { color: colors.subText }]}>{item.year}</Text>
                      <Text style={styles.listPrice}>{item.price}</Text>
                    </View>
                  </TouchableOpacity>

                </View>
              )
            }
            }
          />
        </>
      )}


      {bikeList.length === 0 && (
        <TouchableOpacity style={styles.plusButton} onPress={() => setOpen(true)}>
          <Ionicons name="add-circle" size={60} color="#e53935" />
        </TouchableOpacity>
      )}


      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.popupPanel, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => { resetForm(); setOpen(false); }} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Motorcycle Details</Text>

              <Text style={[styles.label, { color: colors.text }]}>Select Company</Text>
              <View style={[styles.pickerWrapper, { borderColor: "#e53935", backgroundColor: colors.inputBg }]}>
                <Picker selectedValue={selectedCompany} onValueChange={(v) => {
                  setSelectedCompany(v);
                  setSelectedModel("");
                  setSelectedYear("");
                }} style={{ color: colors.text }}
                  dropdownIconColor={colors.text}>
                  <Picker.Item label="Choose Company" value="" />
                  {Object.keys(bikeData).map((c) => (
                    <Picker.Item label={c} value={c} key={c} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Select Model</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: "#e53935", }]}>
                <Picker selectedValue={selectedModel} enabled={models.length > 0} onValueChange={setSelectedModel} style={{ color: colors.text }}
                  dropdownIconColor={colors.text}>
                  <Picker.Item label="Choose Model" value="" />
                  {models.map((m: any) => (
                    <Picker.Item label={m} value={m} key={m} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text, }]}>Select Year</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: "#e53935", }]}>
                <Picker selectedValue={selectedYear} enabled={yearOptions.length > 0} onValueChange={setSelectedYear} style={{ color: colors.text }}
                  dropdownIconColor={colors.text}>
                  <Picker.Item label="Choose Year" value="" />
                  {yearOptions.map((yr) => (
                    <Picker.Item label={yr} value={yr} key={yr} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Bike Type</Text>

              <View
                style={[
                  styles.pickerWrapper,
                  { backgroundColor: colors.inputBg, borderColor: "#e53935" },
                ]}
              >
                <Picker
                  selectedValue={bikeType}
                  onValueChange={setBikeType}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item label="Choose Type" value="" />
                  {bikeTypes.map((type) => (
                    <Picker.Item label={type} value={type} key={type} />
                  ))}
                </Picker>
              </View>


              <Text style={[styles.label, { color: colors.text }]}>KM Driven</Text>
              <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: "#e53935", }]}>
                <Picker selectedValue={selectedKm} onValueChange={setSelectedKm} style={{ color: colors.text }}
                  dropdownIconColor={colors.text}>
                  <Picker.Item label="Select KM Driven" value="" />
                  {kmOptions.map((km) => (
                    <Picker.Item label={km} value={km} key={km} />
                  ))}
                </Picker>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.priceCol}>
                  <Text style={[styles.label, { color: colors.text }]}>Price</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: colors.inputBg, color: colors.text, borderColor: "#e53935" }]}
                    placeholder="Enter Price"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#666"}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={handlePriceChange}
                  />
                </View>

                <View style={styles.priceCol}>
                  <Text style={[styles.label, { color: colors.text }]}>Avg. Market Price</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: colors.inputBg, color: colors.text, borderColor: "#e53935" }]}
                    keyboardType="numeric"
                    value={avgPrice}
                    editable={false}
                  />
                  <Text style={[styles.detailsText, { fontWeight: "600", color: colors.text }]}>
                    Price Status:{" "}
                    <Text
                      style={{
                        color: getStatusColor(getPriceStatus(price, avgPrice)),
                        fontWeight: "700",
                      }}
                    >
                      {getPriceStatus(price, avgPrice)}
                    </Text>
                  </Text>


                </View>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Location</Text>

              <View style={styles.locationRow}>
                <TextInput
                  style={[
                    styles.locationInput,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: "#e53935",
                    },
                  ]}
                  placeholder="Enter location"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#666"}
                  value={location}
                  onChangeText={setLocation}
                />

                <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation}>
                  <Image
                    source={require("../../assets/loc.png")}
                    style={styles.locationIcon}
                  />
                </TouchableOpacity>

              </View>

              <Text style={[styles.label, { color: colors.text }]}>Description</Text>

              <TextInput
                style={[
                  styles.descriptionBox,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: "#e53935",
                  },
                ]}
                placeholder="Describe your bike condition, ownership, modifications, etc."
                placeholderTextColor={isDark ? "#9CA3AF" : "#666"}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
              />

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload Images</Text>

              <TouchableOpacity style={styles.uploadBtn} onPress={pickImages}>
                <Ionicons name="camera" size={35} color="#e53935" />
                <Text style={{ color: colors.text }}>Select Images</Text>
              </TouchableOpacity>

              <View style={styles.thumbnailContainer}>
                {images.map((img, index) => (
                  <View key={index} style={styles.thumbWrapper}>
                    <TouchableOpacity onPress={() => replaceImage(index)}>
                      <Image source={{ uri: img }} style={styles.thumbnail} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>


              <TouchableOpacity style={styles.doneButton} onPress={saveBike}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={detailsOpen} transparent animationType="slide">
        <View style={styles.detailsContainer}>
          <View style={[styles.detailsPanel, { backgroundColor: colors.card }]}>
            <View style={styles.imageWrapper}>
              {selectedListing?.images?.length > 1 ? (
                <FlatList
                  data={selectedListing.images}
                  horizontal
                  pagingEnabled
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setPreviewIndex(index);
                        setImagePreviewOpen(true);
                      }}
                    >
                      <Image
                        source={{ uri: item }}
                        style={[
                          styles.detailsImage,
                          { width: Dimensions.get("window").width }
                        ]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>


                  )}
                />
              ) : (
                <Image
                  source={{ uri: selectedListing?.images[0] }}
                  style={styles.detailsImage}
                />
              )}

              <TouchableOpacity
                style={styles.detailsCloseBtn}
                onPress={() => setDetailsOpen(false)}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <Modal visible={imagePreviewOpen} transparent>
                <View style={{ flex: 1, backgroundColor: "#000" }}>
                  <FlatList
                    data={selectedListing?.images}
                    horizontal
                    pagingEnabled
                    initialScrollIndex={previewIndex}
                    keyExtractor={(img) => img}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          width: Dimensions.get("window").width,
                          height: Dimensions.get("window").height,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={{ uri: item }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  />

                  <TouchableOpacity
                    onPress={() => setImagePreviewOpen(false)}
                    style={{
                      position: "absolute",
                      top: 40,
                      right: 20,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      padding: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </Modal>

            </View>


            <View style={styles.detailsContent}>
              <Text style={[styles.detailsTitle, { color: colors.text }]}>
                {selectedListing?.company} {selectedListing?.model}
              </Text>
              <Text style={[styles.detailsText, { color: colors.subText }]}>Year: {selectedListing?.year}</Text>
              <Text style={[styles.detailsText, { color: colors.subText }]}>KM Driven: {selectedListing?.km}</Text>
              <Text style={[styles.detailsText, { color: colors.subText }]}>Bike Type: {selectedListing?.bikeType || "N/A"}</Text>
              <Text style={[styles.detailsText, { color: colors.subText }]}>Price: {selectedListing?.price}</Text>
              <Text style={[styles.detailsText, { color: colors.subText }]}>Avg. Market Price: {selectedListing?.avgPrice || "N/A"}</Text>
              <Text style={[styles.detailsText, { color: colors.subText }]}>Location: {selectedListing?.location}</Text>
              <Text style={[styles.detailsText, { color: colors.subText }]}>Description: {selectedListing?.description}</Text>
            </View>

            <View style={styles.detailsButtonsRow}>
              <TouchableOpacity
                style={styles.editButtonRow}
                onPress={() => {
                  openEdit(selectedListing, selectedListing.index);
                  setDetailsOpen(false);
                }}
              >
                <Text style={styles.rowBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButtonRow}
                onPress={deleteListing}
              >
                <Text style={styles.rowBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: "#e53935",
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  logo: { width: 120, height: 50 },
  centerArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholder: { fontSize: 18, fontWeight: "500" },
  plusButton: { position: "absolute", bottom: 80, right: 20 },
  listingCard: { margin: 10, borderRadius: 12, overflow: "hidden", elevation: 3 },
  listingImage: { width: "100%", height: 180 },
  listingInfo: { padding: 10 },
  listTitle: { fontSize: 16, fontWeight: "700" },
  listSub: {},
  listPrice: { color: "#e53935", marginTop: 5, fontWeight: "700" },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  popupPanel: { height: "70%", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  closeButton: { alignSelf: "flex-end" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },
  label: { marginTop: 10, fontWeight: "600" },
  pickerWrapper: { borderWidth: 2, borderRadius: 12, marginTop: 5 },
  inputBox: { borderWidth: 2, borderRadius: 12, padding: 12, marginTop: 5 },
  uploadBtn: {
    height: 120,
    borderWidth: 2,
    borderColor: "#e53935",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  thumbnailContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  thumbnail: { width: 80, height: 80, borderRadius: 10 },
  doneButton: {
    backgroundColor: "#e53935",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  doneText: { color: "#fff", fontWeight: "700" },
  detailsContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  detailsPanel: { borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden", paddingBottom: 20 },
  imageWrapper: { width: "100%", height: 260 },
  detailsImage: { width: "100%", height: "100%" },
  detailsCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 6,
    borderRadius: 50,
  },
  detailsContent: { padding: 20 },
  detailsTitle: { fontSize: 20, fontWeight: "700" },
  detailsText: { fontSize: 16, marginTop: 5 },
  detailsButtons: { width: "100%", alignItems: "center", marginTop: 5 },
  editButton: {
    backgroundColor: "#e53935",
    paddingVertical: 12,
    borderRadius: 10,
    width: "70%",
    alignItems: "center",
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#e53935",
    paddingVertical: 12,
    borderRadius: 10,
    width: "70%",
    alignItems: "center",
  },
  locationIcon: {
    width: 25,
    height: 25,
  },

  descriptionBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    textAlignVertical: "top",
    minHeight: 120,
  },

  thumbWrapper: {
    position: "relative",
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e53935",
    borderRadius: 12,
    padding: 4,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  listHeading: {
    fontSize: 18,
    fontWeight: "700",
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addMoreText: {
    color: "#fff",
    fontWeight: "600",
  },
  detailsButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  editButtonRow: {
    flex: 1,
    backgroundColor: "#e53935",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  deleteButtonRow: {
    flex: 1,
    backgroundColor: "#e53935",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  rowBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  singleCard: {
    margin: 16,
    borderRadius: 16,
    flex: 1,
  },

  singleImage: {
    width: "100%",
    height: 350,
  },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, },
  locationInput: { flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, },
  locationBtn: { width: 52, height: 52, backgroundColor: "#e53935", borderRadius: 12, justifyContent: "center", alignItems: "center", },
  priceRow: { flexDirection: "row", gap: 12 },
  priceCol: { flex: 1 },
});
