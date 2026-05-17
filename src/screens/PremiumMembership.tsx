import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    StatusBar,
    ImageBackground,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import Animated, {
    FadeInDown,
    FadeInRight,
    FadeInUp
} from "react-native-reanimated";
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH, SCREEN_HEIGHT } from "../utils/responsive";
import { useTheme } from "../context/ThemeContext";

const plans = [
    {
        type: "Buyer",
        title: "Pro Buyer",
        price: "3,999",
        color: "#6366f1",
        lightColor: "rgba(99, 102, 241, 0.1)",
        icon: "cart-outline",
        tagline: "Drive away with peace of mind",
        features: [
            "RTO registration slot arrangement",
            "Faster Name transfer process",
            "Motorcycle Health Certificate",
            "Curated Insurance options",
            "Priority customer support",
        ],
    },
    {
        type: "Seller",
        title: "Elite Seller",
        price: "5,999",
        color: "#e53935",
        lightColor: "rgba(229, 57, 53, 0.1)",
        icon: "cash-outline",
        tagline: "Sell fast, sell at the best price",
        features: [
            "Boosted listing visibility",
            "Complimentary doorstep pick-up",
            "Professional photo session",
            "Verified Seller badge",
            "Instant buyer notifications",
        ],
        isPopular: true,
    },
    {
        type: "Rental",
        title: "Rental Hero",
        price: "40% Commission",
        color: "#10b981",
        lightColor: "rgba(16, 185, 129, 0.1)",
        icon: "bicycle-outline",
        tagline: "Scale your rental business",
        features: [
            "Automatic listing relisting",
            "Bulk bike management",
            "Secure payment escrow",
        ],
        isCustom: true,
    },
];

export default function PremiumMembership() {
    const navigation = useNavigation();
    const { isDark } = useTheme();

    const colors = {
        bg: isDark ? "#111827" : "#F9FAFB",
        card: isDark ? "#1F2937" : "#ffffff",
        text: isDark ? "#F9FAFB" : "#111827",
        subText: isDark ? "#9CA3AF" : "#374151",
        accent: "#e53935",
        border: isDark ? "#374151" : "#E5E7EB",
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Premium Membership</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.hero}>
                    <View style={styles.crownContainer}>
                        <MaterialCommunityIcons name="crown" size={rf(40)} color="#fbbf24" />
                    </View>
                    <Text style={[styles.heroHeading, { color: colors.text }]}>Choose Your Edge</Text>
                    <Text style={[styles.heroSub, { color: colors.subText }]}>
                        Unlock the full potential of WheelX with our specialized premium plans.
                    </Text>
                </Animated.View>

                {plans.map((plan, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInDown.delay(400 + index * 200).duration(800)}
                        style={[
                            styles.planCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: plan.color,
                                borderWidth: 2
                            },
                        ]}
                    >
                        {plan.isPopular && (
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                            </View>
                        )}

                        <View style={styles.planContent}>
                            <View style={styles.planHeader}>
                                <View style={[styles.iconBox, { backgroundColor: plan.lightColor }]}>
                                    <Ionicons name={plan.icon as any} size={28} color={plan.color} />
                                </View>
                                <View style={styles.planTitles}>
                                    <Text style={[styles.planType, { color: colors.subText }]}>{plan.type}</Text>
                                    <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
                                </View>
                                <View style={styles.priceContainer}>
                                    <Text style={[styles.price, { color: plan.color }]}>
                                        {plan.isCustom ? "" : "₹"}{plan.price}
                                    </Text>
                                    {!plan.isCustom && <Text style={[styles.perYear, { color: colors.subText }]}>/year</Text>}
                                </View>
                            </View>

                            <Text style={[styles.tagline, { color: colors.subText }]}>{plan.tagline}</Text>

                            <View style={styles.divider} />

                            {plan.features.map((feature, fIndex) => (
                                <View key={fIndex} style={styles.featureRow}>
                                    <View style={[styles.checkCircle, { backgroundColor: plan.color + "20" }]}>
                                        <Ionicons name="checkmark" size={12} color={plan.color} />
                                    </View>
                                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                                </View>
                            ))}

                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.ctaButton, { backgroundColor: plan.color }]}
                            >
                                <Text style={styles.ctaText}>Get Started</Text>
                                <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
                            </TouchableOpacity>

                            {plan.isCustom && (
                                <View style={styles.rentalNotice}>
                                    <Ionicons name="information-circle-outline" size={14} color={colors.subText} />
                                    <Text style={[styles.rentalNoticeText, { color: colors.subText }]}>
                                        40% commission applied on every successful booking.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                ))}

                <View style={styles.footerSpacing} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
    },
    header: { paddingTop: 50, backgroundColor: '#e53935', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 8 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    scrollContent: {
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(30),
    },
    hero: {
        alignItems: "center",
        marginBottom: verticalScale(40),
    },
    crownContainer: {
        width: scale(80),
        height: scale(80),
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: verticalScale(16),
    },
    heroHeading: {
        fontSize: rf(28),
        fontWeight: "900",
        marginBottom: verticalScale(8),
    },
    heroSub: {
        fontSize: rf(14),
        textAlign: "center",
        paddingHorizontal: scale(30),
        lineHeight: verticalScale(22),
    },
    planCard: {
        borderRadius: moderateScale(32),
        marginBottom: verticalScale(24),
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        overflow: "hidden",
    },
    popularBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#e53935",
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(6),
        borderBottomLeftRadius: 16,
        zIndex: 10,
    },
    popularBadgeText: {
        color: "#fff",
        fontSize: rf(10),
        fontWeight: "900",
        letterSpacing: 1,
    },
    planContent: {
        padding: scale(24),
    },
    planHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: verticalScale(12),
    },
    iconBox: {
        width: scale(56),
        height: scale(56),
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginRight: scale(16),
    },
    planTitles: {
        flex: 1,
    },
    planType: {
        fontSize: rf(12),
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    planTitle: {
        fontSize: rf(22),
        fontWeight: "800",
    },
    priceContainer: {
        alignItems: "flex-end",
    },
    price: {
        fontSize: rf(18),
        fontWeight: "900",
    },
    perYear: {
        fontSize: rf(10),
        fontWeight: "600",
    },
    tagline: {
        fontSize: rf(13),
        fontStyle: "italic",
        marginBottom: verticalScale(20),
        opacity: 0.8,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(0,0,0,0.05)",
        width: "100%",
        marginBottom: verticalScale(20),
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: verticalScale(14),
    },
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        marginRight: scale(14),
    },
    featureText: {
        fontSize: rf(14),
        fontWeight: "600",
    },
    ctaButton: {
        height: verticalScale(54),
        borderRadius: 18,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: verticalScale(10),
        gap: scale(10),
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    ctaText: {
        color: "#fff",
        fontSize: rf(16),
        fontWeight: "800",
    },
    rentalNotice: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: verticalScale(16),
        gap: scale(6),
    },
    rentalNoticeText: {
        fontSize: rf(11),
        fontWeight: "500",
    },
    footerSpacing: {
        height: verticalScale(40),
    },
});
