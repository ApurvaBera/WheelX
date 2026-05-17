import React, { useState, useEffect } from "react";
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
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import Animated, { FadeInUp, FadeIn, Layout, SlideInDown } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabase";
import { useNotifications } from "../context/NotificationContext";

const { width } = Dimensions.get("window");

export default function RentYourBike() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { showNotification } = useNotifications();

  const colors = {
    bg: isDark ? "#111827" : "#F3F4F6",
    card: isDark ? "#1F2937" : "#ffffff",
    text: isDark ? "#F9FAFB" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    inputBg: isDark ? "#374151" : "#F9FAFB",
    border: isDark ? "#4B5563" : "#E5E7EB",
    accent: "#e53935",
    success: "#10B981",
  };

  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rentList, setRentList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Form State
  const [images, setImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Date Range State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const localToday = getTodayDate();

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

  const models = selectedCompany ? bikeData[selectedCompany] : [];

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("rentbikes")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRentList(data);
    }
    setLoading(false);
  };

  const pickImages = async () => {
    if (images.length >= 4) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
      quality: 0.8,
    });
    if (!res.canceled) {
      setImages([...images, ...res.assets.map((a) => a.uri)].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setSelectedCompany(item.company);
    setSelectedModel(item.model);
    setPrice(item.price);
    setLocation(item.location);
    setImages(item.images);
    setStartDate(item.start_date);
    setEndDate(item.end_date);
    setDetailsOpen(false);
    setOpen(true);
  };

  const toggleAvailability = async (item: any) => {
    try {
      const newStatus = !item.is_available;
      const { error } = await supabase
        .from('rentbikes')
        .update({ is_available: newStatus })
        .eq('id', item.id);

      if (error) throw error;

      setRentList(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newStatus } : i));
      setSelectedItem({ ...item, is_available: newStatus });

      Alert.alert("Success", `Bike is now ${newStatus ? 'Available' : 'Unavailable'}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoadingLoc(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const address = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      if (address.length > 0) {
        const a = address[0];
        setLocation(`${a.district || a.city}, ${a.region}`);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingLoc(false);
    }
  };

  const onDayPress = (day: any) => {
    const date = day.dateString;
    if (startDate && !endDate) {
      if (new Date(date) < new Date(startDate)) {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    } else {
      setStartDate(date);
      setEndDate("");
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    if (startDate) marked[startDate] = { startingDay: true, color: colors.accent, textColor: 'white' };
    if (endDate) marked[endDate] = { endingDay: true, color: colors.accent, textColor: 'white' };
    if (startDate && endDate) {
      let curr = new Date(startDate);
      const last = new Date(endDate);
      while (curr < last) {
        curr.setDate(curr.getDate() + 1);
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        const d = `${y}-${m}-${dd}`;
        if (d !== endDate) marked[d] = { color: colors.accent + '33', textColor: colors.text };
      }
    }
    return marked;
  };

  const getRollingDates = (startDate: string, endDate: string) => {
    const todayObj = new Date(localToday);
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    if (startObj < todayObj) {
      const diffTime = todayObj.getTime() - startObj.getTime();
      const adjustedEnd = new Date(endObj.getTime() + diffTime);

      const format = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      };

      return { start: localToday, end: format(adjustedEnd) };
    }
    return { start: startDate, end: endDate };
  };

  const submitBike = async () => {
    if (!selectedCompany || !selectedModel || !price || !location || images.length === 0 || !startDate || !endDate) {
      Alert.alert("Missing Info", "Please ensure all fields, images, and availability dates are filled.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Should handle this case in finally if needed, but return is fine.

      const uploadedUrls = [];
      for (const img of images) {
        if (!img.startsWith("http")) {
          // Mock upload or real upload if storage bucket exists
          const ext = img.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const formData = new FormData();
          formData.append('file', { uri: img, name: fileName, type: `image/${ext}` } as any);

          const { error: upErr } = await supabase.storage.from('sellbikeimages').upload(fileName, formData);
          if (upErr) throw upErr;

          const { data: pub } = supabase.storage.from('sellbikeimages').getPublicUrl(fileName);
          uploadedUrls.push(pub.publicUrl);
        } else {
          uploadedUrls.push(img);
        }
      }

      const payload = {
        owner_id: user.id,
        company: selectedCompany,
        model: selectedModel,
        price,
        location,
        images: uploadedUrls,
        start_date: startDate,
        end_date: endDate,
        is_available: true // Listing/editing makes it available by default if it was new
      };

      if (editingId) {
        const { data, error } = await supabase
          .from('rentbikes')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        if (error) throw error;
        setRentList(rentList.map(i => i.id === editingId ? data : i));
        Alert.alert("Updated!", "Your bike listing has been updated.");
      } else {
        const { data, error } = await supabase.from('rentbikes').insert(payload).select().single();
        if (error) throw error;
        setRentList([data, ...rentList]);
        Alert.alert("Hosted!", "Your bike is now live for renting.");
      }

      resetForm();
      setOpen(false);

      await showNotification({
        title: "Rental Live",
        message: `${selectedCompany} ${selectedModel} is now listed for rent.`,
        icon: "bicycle",
        color: "#10B981"
      });

    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setImages([]);
    setPrice("");
    setLocation("");
    setSelectedCompany("");
    setSelectedModel("");
    setStartDate("");
    setEndDate("");
    setEditingId(null);
  };

  const deleteItem = async (id: string) => {
    try {
      await supabase.from('rentbikes').delete().eq('id', id);
      setRentList(rentList.filter(i => i.id !== id));
      setDetailsOpen(false);
    } catch {
      Alert.alert("Error", "Could not delete listing.");
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => { setSelectedItem(item); setDetailsOpen(true); }}
        style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? "#000" : "#ccc" }]}
      >
        <View>
          <FlatList
            data={item.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item: img }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={() => { setSelectedItem(item); setDetailsOpen(true); }}>
                <Image source={{ uri: img }} style={{ width: width - 40, height: 160 }} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />
          {item.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {item.images.map((_: any, i: number) => (
                <View key={i} style={[styles.indicatorDot, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />
              ))}
            </View>
          )}
          {!item.is_available && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="pause-circle" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Listing Paused</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{item.price}/day</Text>
        </View>

        <View style={styles.cardContent}>
          <View>
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
                const { start, end } = getRollingDates(item.start_date, item.end_date);
                return `${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
              })()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Dynamic Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rentals</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {rentList.length === 0 && !loading ? (
          <Animated.View entering={FadeIn.delay(300)} style={styles.emptyState}>
            <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="bicycle" size={40} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bikes Listed</Text>
            <Text style={[styles.emptySub, { color: colors.subText }]}>Start earning by renting out your bike today.</Text>

            <TouchableOpacity style={[styles.ctaButton, { backgroundColor: colors.accent }]} onPress={() => setOpen(true)}>
              <Text style={styles.ctaText}>List Your Bike</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Listed Bikes</Text>
              <TouchableOpacity style={styles.addMoreBtn} onPress={() => setOpen(true)}>
                <Ionicons name="add" size={18} color={colors.accent} />
                <Text style={[styles.addMoreText, { color: colors.accent }]}>Add more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={rentList}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={open} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
            <View style={[styles.modalHeader, { backgroundColor: '#e53935' }]}>
              <Text style={[styles.modalTitle, { color: '#fff' }]}>New Rental Listing</Text>
              <TouchableOpacity onPress={() => { resetForm(); setOpen(false); }} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Image Section */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                <TouchableOpacity style={[styles.addImageBox, { borderColor: colors.border }]} onPress={pickImages}>
                  <Ionicons name="camera-outline" size={32} color={colors.accent} />
                  <Text style={{ color: colors.accent, fontSize: 12, marginTop: 4 }}>Upload</Text>
                </TouchableOpacity>
                {images.map((img, i) => (
                  <View key={i} style={{ position: 'relative', marginRight: 10 }}>
                    <Image source={{ uri: img }} style={[styles.thumb, { marginRight: 0 }]} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(i)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Bike Info */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
              <View style={styles.row}>
                <View style={[styles.dropdownContainer, { backgroundColor: colors.inputBg, flex: 1, marginRight: 8 }]}>
                  <Picker selectedValue={selectedCompany} onValueChange={setSelectedCompany} style={{ color: colors.text }} dropdownIconColor={colors.text}>
                    <Picker.Item label="Brand" value="" />
                    {Object.keys(bikeData).map(k => <Picker.Item key={k} label={k} value={k} />)}
                  </Picker>
                </View>
                <View style={[styles.dropdownContainer, { backgroundColor: colors.inputBg, flex: 1, marginLeft: 8 }]}>
                  <Picker selectedValue={selectedModel} onValueChange={setSelectedModel} style={{ color: colors.text }} dropdownIconColor={colors.text} enabled={!!selectedCompany}>
                    <Picker.Item label="Model" value="" />
                    {models.map((m: string) => <Picker.Item key={m} label={m} value={m} />)}
                  </Picker>
                </View>
              </View>

              {/* Price & Location */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, flex: 0.5, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Daily Price</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="₹00"
                    placeholderTextColor={colors.subText}
                    keyboardType="numeric"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
                <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      value={location}
                      onChangeText={setLocation}
                      placeholder="City, Area"
                      placeholderTextColor={colors.subText}
                      style={[styles.input, { color: colors.text, flex: 1 }]}
                    />
                    <TouchableOpacity onPress={getCurrentLocation} disabled={loadingLoc}>
                      {loadingLoc ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name="locate" size={20} color={colors.accent} />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Availability */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Availability</Text>
              <View style={[styles.calendarWrapper, { backgroundColor: colors.inputBg }]}>
                <Calendar
                  onDayPress={onDayPress}
                  markedDates={getMarkedDates()}
                  markingType={'period'}
                  minDate={localToday}
                  theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: colors.subText,
                    selectedDayBackgroundColor: colors.accent,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.accent,
                    dayTextColor: colors.text,
                    arrowColor: colors.accent,
                    monthTextColor: colors.text,
                    indicatorColor: colors.accent,
                    textDayFontWeight: '600'
                  }}
                />
              </View>

              <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.accent, opacity: isSaving ? 0.7 : 1 }]} onPress={submitBike} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Publish Listing</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Details View Modal */}
      <Modal visible={detailsOpen} animationType="fade" transparent>
        {selectedItem && (
          <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
            <View style={styles.detailOverlay}>
              <Animated.View entering={FadeInUp.springify()} style={[styles.detailCard, { backgroundColor: colors.card }]}>
                <View>
                  <FlatList
                    data={selectedItem.images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item: img, index }) => (
                      <TouchableOpacity activeOpacity={0.9} onPress={() => openImageModal(index)}>
                        <Image source={{ uri: img }} style={{ width: width - 40, height: 250 }} resizeMode="cover" />
                      </TouchableOpacity>
                    )}
                  />
                  {selectedItem.images.length > 1 && (
                    <View style={styles.indicatorContainer}>
                      {selectedItem.images.map((_: any, i: number) => (
                        <View key={i} style={[styles.indicatorDot, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />
                      ))}
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.closeDetail} onPress={() => setDetailsOpen(false)}>
                  <Ionicons name="close-circle" size={32} color="#ef4444" />
                </TouchableOpacity>

                <View style={styles.detailBody}>
                  <View style={styles.detailHeader}>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedItem.company} {selectedItem.model}</Text>
                    <Text style={[styles.detailPrice, { color: colors.accent }]}>{selectedItem.price}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="location-sharp" size={18} color={colors.subText} />
                    <Text style={[styles.detailText, { color: colors.subText }]}>{selectedItem.location}</Text>
                  </View>

                  <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <Ionicons name="calendar-clear" size={18} color={colors.subText} />
                    <Text style={[styles.detailText, { color: colors.subText }]}>
                      {(() => {
                        const { start, end } = getRollingDates(selectedItem.start_date, selectedItem.end_date);
                        return `Available: ${start} to ${end}`;
                      })()}
                    </Text>
                  </View>

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.accent }]}
                      onPress={() => handleEdit(selectedItem)}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.accent} />
                      <Text style={[styles.actionBtnText, { color: colors.accent }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: selectedItem.is_available ? colors.success : colors.subText }]}
                      onPress={() => toggleAvailability(selectedItem)}
                    >
                      <Ionicons
                        name={selectedItem.is_available ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={selectedItem.is_available ? colors.success : colors.subText}
                      />
                      <Text style={[styles.actionBtnText, { color: selectedItem.is_available ? colors.success : colors.subText }]}>
                        {selectedItem.is_available ? "Listed" : "Unhosted"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: "#ef4444" }]}
                      onPress={() => deleteItem(selectedItem.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </View>
          </BlurView>
        )}
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
            data={selectedItem?.images || []}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedImageIndex}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `full-image-${index}`}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
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
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e53935',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#e53935',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12
  },
  contentContainer: {
    flex: 1,
    paddingTop: 10
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '700'
  },
  listContent: {
    padding: 20,
    paddingBottom: 100
  },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptySub: { fontSize: 14, textAlign: 'center', maxWidth: '70%', lineHeight: 20 },
  ctaButton: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 25, marginTop: 30 },
  ctaText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Card
  card: {
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  cardImage: { width: '100%', height: 160 },
  cardBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  cardBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cardContent: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocation: { fontSize: 13 },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  datePillText: { fontSize: 11, fontWeight: '600' },

  // FAB
  fabContainer: { position: 'absolute', bottom: 30, right: 20 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#e53935',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }
  },

  // Modal Form
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { padding: 4 },
  modalScroll: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  imageRow: { flexDirection: 'row', marginBottom: 24, paddingBottom: 4 },
  addImageBox: {
    width: 90,
    height: 90,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  thumb: { width: 90, height: 90, borderRadius: 16, marginRight: 10 },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
    zIndex: 10
  },
  row: { flexDirection: 'row', marginBottom: 20 },
  dropdownContainer: { borderRadius: 12, overflow: 'hidden' },
  inputContainer: { borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'transparent' },
  inputLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { fontSize: 16, fontWeight: '500', padding: 0 },
  calendarWrapper: { borderRadius: 16, overflow: 'hidden', padding: 4 },
  submitButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#e53935',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 }
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Detail Overlay
  detailOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  detailCard: { borderRadius: 24, overflow: 'hidden', elevation: 10 },
  detailImage: { width: '100%', height: 250 },
  closeDetail: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  detailBody: { padding: 24 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailTitle: { fontSize: 22, fontWeight: '800', flex: 1, marginRight: 10 },
  detailPrice: { fontSize: 18, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 15 },
  deleteButton: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
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
    width: width,
    height: '100%',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 8
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700'
  }
});
