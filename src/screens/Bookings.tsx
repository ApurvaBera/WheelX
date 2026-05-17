import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Image,
    Linking,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Platform,
    StatusBar,
    ScrollView,
} from "react-native";
import Animated, {
    FadeInUp,
    Layout,
    FadeIn,
    ZoomIn,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchUserNotifications, deleteNotification, sendNotification } from "../utils/notifications";
import { scale, verticalScale, moderateScale, rf } from "../utils/responsive";

export default function Bookings() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();

    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const colors = {
        bg: isDark ? "#111827" : "#F9FAFB",
        card: isDark ? "#1F2937" : "#ffffff",
        text: isDark ? "#F9FAFB" : "#111827",
        subText: isDark ? "#9CA3AF" : "#6B7280",
        border: isDark ? "#374151" : "#E5E7EB",
        accent: "#e53935",
    };

    const loadBookings = async () => {
        if (!user) return;
        setLoading(true);
        const data = await fetchUserNotifications(user.id);

        // Filter for booking reminders only
        const bookingReminders = data.filter((n: any) => n.type === 'booking_reminder');
        setBookings(bookingReminders);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadBookings();
        }, [user])
    );

    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("10:00 AM");
    const [rescheduleItem, setRescheduleItem] = useState<any>(null);

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
        "05:00 PM", "06:00 PM", "07:00 PM"
    ];

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleReschedule = (item: any) => {
        setRescheduleItem(item);
        setRescheduleDate(item.payload?.date || getTodayDate());
        setRescheduleTime(item.payload?.time || "10:00 AM");
        setShowRescheduleModal(true);
    };

    const confirmReschedule = async () => {
        if (!rescheduleDate) {
            Alert.alert("Error", "Please select a new date.");
            return;
        }

        try {
            const item = rescheduleItem;
            const { bikeName, buyerId, address, buyerName, buyerPhone, date: oldDate } = item.payload || {};

            const { data: myProfile } = await supabase
                .from("profiles")
                .select("name, phone")
                .eq("id", user?.id)
                .single();

            const myName = myProfile?.name || user?.name || "Seller";
            const myPhone = myProfile?.phone;

            const { data, error } = await supabase.functions.invoke('reschedule-booking', {
                body: {
                    oldBookingId: item.id,
                    newDate: rescheduleDate,
                    newTime: rescheduleTime,
                    bikeName,
                    address,
                    sellerName: myName,
                    sellerId: user?.id,
                    sellerPhone: myPhone,
                    buyerId,
                    buyerName,
                    buyerPhone,
                    oldDate,
                    oldPayload: item.payload
                }
            });

            if (error) throw error;

            setBookings(prev => prev.filter(b => b.id !== item.id));
            setTimeout(() => loadBookings(), 1000);

            setShowRescheduleModal(false);
            setRescheduleItem(null);
            Alert.alert("Success", "Booking rescheduled and buyer notified.");

        } catch (err) {
            console.error("Reschedule Error:", err);
            Alert.alert("Error", "Failed to reschedule. Please try again.");
        }
    };

    const handleDeleteBooking = (item: any) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking? This action cannot be undone.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { role, bikeName, sellerId, buyerId, date, buyerPhone, sellerPhone, isRental } = item.payload || {};
                            const myName = user?.name || (role === 'buyer' ? "Buyer" : "Seller");

                            const { data, error } = await supabase.functions.invoke('cancel-booking', {
                                body: {
                                    bookingId: item.id,
                                    role,
                                    bikeName,
                                    date,
                                    sellerId,
                                    buyerId,
                                    buyerPhone,
                                    sellerPhone,
                                    cancelledByName: myName,
                                    isRental: !!isRental
                                }
                            });

                            if (error) throw error;

                            setBookings(prev => prev.filter(b => b.id !== item.id));
                            Alert.alert("Success", "Booking canceled and other party notified.");

                        } catch (err) {
                            console.error("Error cancelling booking:", err);
                            Alert.alert("Error", "Failed to cancel booking. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const { role, date, address, bikeName, buyerName, sellerName, buyerPhone, sellerPhone, isRental } = item.payload || {};
        const isBuyer = role === 'buyer';

        return (
            <Animated.View
                entering={FadeInUp.delay(bookings.indexOf(item) * 100).springify().damping(15)}
                layout={Layout.springify()}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: isBuyer ? "#22c55e15" : "#6366f115" }]}>
                        <Ionicons
                            name={isBuyer ? (isRental ? "key" : "bicycle") : (isRental ? "business" : "people")}
                            size={28}
                            color={isBuyer ? "#22c55e" : "#6366f1"}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.statusBadge, { color: isBuyer ? "#22c55e" : "#6366f1" }]}>
                            {isRental
                                ? (isBuyer ? "UPCOMING BIKE RENTAL" : "SCHEDULED RENTAL")
                                : (isBuyer ? "UPCOMING TEST RIDE" : "SCHEDULED APPOINTMENT")}
                        </Text>
                        <Text style={[styles.bikeName, { color: colors.text }]}>{bikeName}</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.detailsContainer}>
                    <View style={styles.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="calendar" size={18} color={colors.accent} />
                            </View>
                            <Text style={[styles.detailText, { color: colors.text }]}>{date}</Text>
                        </View>
                        {item.payload?.time && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="time-outline" size={18} color={colors.accent} />
                                </View>
                                <Text style={[styles.detailText, { color: colors.text }]}>{item.payload.time}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="location" size={18} color={colors.accent} />
                        </View>
                        <Text style={[styles.detailText, { color: colors.text }]} numberOfLines={1}>{address || "No address provided"}</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="person" size={18} color={colors.accent} />
                        </View>
                        <Text style={[styles.detailText, { color: colors.text }]}>
                            {isBuyer
                                ? `${isRental ? 'Host' : 'Seller'}: ${sellerName}`
                                : `${isRental ? 'Customer' : 'Buyer'}: ${buyerName}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteBooking(item)}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                        <Text style={styles.deleteBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {!isBuyer && (
                            <TouchableOpacity
                                style={styles.rescheduleBtn}
                                onPress={() => handleReschedule(item)}
                            >
                                <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
                                <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.callBtn}
                            onPress={() => Linking.openURL(`tel:${isBuyer ? sellerPhone : buyerPhone}`)}
                        >
                            <Ionicons name="call" size={18} color="#fff" />
                            <Text style={styles.callBtnText}>Call</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={bookings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBookings} tintColor={colors.accent} />}
                ListEmptyComponent={
                    !loading ? (
                        <Animated.View
                            entering={FadeIn.delay(300)}
                            style={styles.emptyContainer}
                        >
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="calendar-clear-outline" size={rf(45)} color={colors.accent} />
                            </View>
                            <Text style={[styles.emptyHeader, { color: colors.text }]}>No Bookings Yet</Text>
                            <Text style={[styles.emptyText, { color: colors.subText }]}>When you schedule rides or rentals, they'll appear here for easy tracking.</Text>
                        </Animated.View>
                    ) : null
                }
            />

            <Modal visible={showRescheduleModal} transparent animationType="fade" onRequestClose={() => setShowRescheduleModal(false)}>
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
                    <KeyboardAvoidingView
                        style={styles.calendarModalContainer}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={1}
                            onPress={() => setShowRescheduleModal(false)}
                        />
                        <Animated.View
                            entering={ZoomIn.duration(300)}
                            style={[styles.calendarContent, { backgroundColor: colors.card }]}
                        >
                            <View style={styles.calendarHeader}>
                                <Text style={[styles.calendarTitle, { color: colors.text }]}>
                                    {rescheduleItem?.payload?.isRental ? "Reschedule Rental" : "Reschedule Test Ride"}
                                </Text>
                                <TouchableOpacity onPress={() => setShowRescheduleModal(false)} style={styles.closeModalBtn}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <Calendar
                                minDate={getTodayDate()}
                                onDayPress={(day: any) => setRescheduleDate(day.dateString)}
                                markedDates={{
                                    [rescheduleDate]: { selected: true, selectedColor: '#e53935', selectedTextColor: '#fff' }
                                }}
                                theme={{
                                    backgroundColor: colors.card,
                                    calendarBackground: colors.card,
                                    textSectionTitleColor: colors.subText,
                                    dayTextColor: colors.text,
                                    todayTextColor: '#e53935',
                                    selectedDayBackgroundColor: '#e53935',
                                    selectedDayTextColor: '#ffffff',
                                    monthTextColor: colors.text,
                                    indicatorColor: '#e53935',
                                    arrowColor: '#e53935',
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: 'bold',
                                }}
                            />

                            {/* Time Slot Selection */}
                            <View style={{ marginTop: 20 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: colors.text }}>Select New Time</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
                                    {timeSlots.map((time) => (
                                        <TouchableOpacity
                                            key={time}
                                            onPress={() => setRescheduleTime(time)}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 8,
                                                borderRadius: 20,
                                                backgroundColor: rescheduleTime === time ? '#e53935' : colors.bg,
                                                borderWidth: 1,
                                                borderColor: rescheduleTime === time ? '#e53935' : colors.border
                                            }}
                                        >
                                            <Text style={{
                                                color: rescheduleTime === time ? '#fff' : colors.text,
                                                fontSize: 12,
                                                fontWeight: '600'
                                            }}>{time}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <TouchableOpacity
                                style={[styles.confirmBtn, { opacity: rescheduleDate ? 1 : 0.6 }]}
                                onPress={confirmReschedule}
                                disabled={!rescheduleDate}
                            >
                                <Text style={styles.confirmBtnText}>Confirm New Date</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: verticalScale(110),
        backgroundColor: "#e53935",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: verticalScale(45),
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: rf(24),
        fontWeight: "900",
        color: "#fff",
        letterSpacing: 0.5,
    },
    listContent: {
        padding: 20,
        gap: 20,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 30,
        borderWidth: 1,
        padding: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 6,
        textTransform: 'uppercase'
    },
    bikeName: {
        fontSize: 22,
        fontWeight: '900',
    },
    divider: {
        height: 1,
        marginVertical: 20,
        opacity: 0.15,
    },
    detailsContainer: {
        gap: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e5393510',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailText: {
        fontSize: 15,
        flex: 1,
        fontWeight: '600',
    },
    actionRow: {
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    callBtn: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    callBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    deleteBtn: {
        backgroundColor: '#EF444410',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    deleteBtnText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '800',
    },
    rescheduleBtn: {
        backgroundColor: '#F59E0B10',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    rescheduleBtnText: {
        color: '#F59E0B',
        fontSize: 14,
        fontWeight: '800',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 120,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#e5393510',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyHeader: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.7,
    },
    calendarModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarContent: {
        width: '100%',
        borderRadius: 35,
        padding: 24,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    calendarTitle: {
        fontSize: 22,
        fontWeight: '900',
    },
    closeModalBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#00000005',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtn: {
        backgroundColor: '#e53935',
        paddingVertical: 18,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 24,
        elevation: 8,
        shadowColor: '#e53935',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
});
