import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

export default function RentYourBike() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const colors = {
    bg: isDark ? "#111827" : "#ffffff",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#555",
    inputBg: isDark ? "#374151" : "#f2f2f2",
    border: "#e53935",
    accent: "#e53935",
  };

  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [rentList, setRentList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
  const now = new Date().getFullYear();
  for (let y = 2015; y <= now; y++) years.push(y.toString());

  const models = selectedCompany ? bikeData[selectedCompany] : [];
  const yearOptions = selectedModel ? years : [];

  const pickImages = async () => {
    if (images.length >= 4) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
      quality: 1,
    });

    if (!res.canceled) {
      setImages([...images, ...res.assets.map((a) => a.uri)].slice(0, 4));
    }
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
    setPrice(only === "" ? "" : "₹" + only);
  };

  const submitBike = () => {
    if (!selectedCompany || !selectedModel || !selectedYear || !price || !location || images.length === 0) return;

    setRentList([
      {
        id: Date.now().toString(),
        company: selectedCompany,
        model: selectedModel,
        year: selectedYear,
        price,
        location,
        images,
      },
      ...rentList,
    ]);

    setOpen(false);
    setImages([]);
    setPrice("");
    setLocation("");
    setSelectedCompany("");
    setSelectedModel("");
    setSelectedYear("");
  };

  const deleteItem = (id: string) => {
    setRentList(rentList.filter((i) => i.id !== id));
    setDetailsOpen(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rent Your Bike</Text>
      </View>

      {rentList.length === 0 ? (
        <View style={styles.placeholderView}>
          <Text style={[styles.placeholder, { color: colors.subText }]}>Rent Your Bike</Text>
        </View>
      ) : (
        <FlatList
          data={rentList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedItem(item); setDetailsOpen(true); }}>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.company} {item.model}</Text>
                <Text style={[styles.cardSub, { color: colors.subText }]}>{item.year}</Text>
                <Text style={styles.cardPrice}>{item.price}</Text>
                <Text style={[styles.cardLoc, { color: colors.subText }]}>{item.location}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.plusButton} onPress={() => setOpen(true)}>
        <Ionicons name="add-circle" size={60} color={colors.accent} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalPanel, { backgroundColor: colors.card }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={30} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Rent Your Bike</Text>

              <Text style={[styles.label, { color: colors.text }]}>Select Company</Text>
              <View style={[styles.pickerBox, { backgroundColor: colors.inputBg }]}>
                <Picker selectedValue={selectedCompany} onValueChange={(v) => { setSelectedCompany(v); setSelectedModel(""); setSelectedYear(""); }} style={{ color: colors.text }}>
                  <Picker.Item label="Choose Company" value="" />
                  {Object.keys(bikeData).map((c) => <Picker.Item label={c} value={c} key={c} />)}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Select Model</Text>
              <View style={[styles.pickerBox, { backgroundColor: colors.inputBg }]}>
                <Picker selectedValue={selectedModel} enabled={models.length > 0} onValueChange={setSelectedModel} style={{ color: colors.text }}>
                  <Picker.Item label="Choose Model" value="" />
                  {models.map((m: string) => <Picker.Item label={m} value={m} key={m} />)}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Select Year</Text>
              <View style={[styles.pickerBox, { backgroundColor: colors.inputBg }]}>
                <Picker selectedValue={selectedYear} enabled={yearOptions.length > 0} onValueChange={setSelectedYear} style={{ color: colors.text }}>
                  <Picker.Item label="Choose Year" value="" />
                  {yearOptions.map((y) => <Picker.Item label={y} value={y} key={y} />)}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Price</Text>
              <TextInput
                style={[styles.inputBox, { backgroundColor: colors.inputBg, color: colors.text, borderColor: "#e53935" }]}
                placeholder="Enter Price"
                placeholderTextColor={isDark ? "#9CA3AF" : "#666"}
                keyboardType="numeric"
                value={price}
                onChangeText={handlePriceChange}
              />
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

              <TouchableOpacity style={styles.uploadBtn} onPress={pickImages}>
                <Ionicons name="camera" size={40} color={colors.accent} />
                <Text style={{ color: colors.text }}>Select Images</Text>
              </TouchableOpacity>

              <View style={styles.thumbRow}>
                {images.map((img, i) => <Image key={i} source={{ uri: img }} style={styles.thumb} />)}
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={submitBike}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={detailsOpen} transparent animationType="slide">
        <View style={styles.detailsPage}>
          <TouchableOpacity onPress={() => setDetailsOpen(false)} style={styles.closeX}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {selectedItem && (
            <ScrollView>
              <Image source={{ uri: selectedItem.images[0] }} style={styles.detailsImage} />
              <View style={[styles.detailsContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.detailsTitle, { color: colors.text }]}>{selectedItem.company} {selectedItem.model}</Text>
                <Text style={[styles.detailsInfo, { color: colors.subText }]}>Year: {selectedItem.year}</Text>
                <Text style={[styles.detailsInfo, { color: colors.subText }]}>Price: {selectedItem.price}</Text>
                <Text style={[styles.detailsInfo, { color: colors.subText }]}>Location: {selectedItem.location}</Text>

                <View style={styles.detailsButtons}>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteItem(selectedItem.id)}>
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: "#e53935",
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  placeholderView: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholder: { fontSize: 20 },
  plusButton: { position: "absolute", bottom: 80, right: 20 },
  card: { marginVertical: 10, borderRadius: 12, overflow: "hidden" },
  cardImage: { width: "100%", height: 200 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginTop: 8, marginLeft: 10 },
  cardSub: { marginLeft: 10 },
  cardPrice: { marginLeft: 10, fontWeight: "700", color: "#e53935" },
  cardLoc: { marginLeft: 10 },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalPanel: { height: "75%", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  closeModalBtn: { alignSelf: "flex-end", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginVertical: 10 },
  label: { marginBottom: 4 },
  pickerBox: { borderWidth: 2, borderColor: "#e53935", borderRadius: 12, marginBottom: 20 },
  inputBox: { borderWidth: 2, borderColor: "#e53935", borderRadius: 10, padding: 12, marginBottom: 20 },
  uploadBtn: { height: 120, borderWidth: 2, borderColor: "#e53935", borderStyle: "dashed", borderRadius: 12, justifyContent: "center", alignItems: "center", marginVertical: 10 },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  thumb: { width: 80, height: 80, borderRadius: 10 },
  doneButton: { backgroundColor: "#e53935", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginBottom: 30 },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  detailsPage: { flex: 1, backgroundColor: "#000" },
  closeX: { position: "absolute", top: 40, right: 20, zIndex: 10 },
  detailsImage: { width: "100%", height: 350 },
  detailsContent: { marginTop: -30, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  detailsTitle: { fontSize: 24, fontWeight: "700", marginBottom: 10 },
  detailsInfo: { fontSize: 16, marginBottom: 5 },
  detailsButtons: { marginTop: 20, alignItems: "center" },
  deleteButton: { width: "70%", backgroundColor: "#e53935", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  locationIcon: {
    width: 25,
    height: 25,
  },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, },
  locationInput: { flex: 1, borderWidth: 2, borderRadius: 10, padding: 12, },
  locationBtn: { width: 52, height: 52, backgroundColor: "#e53935", borderRadius: 10, justifyContent: "center", alignItems: "center", },
});
