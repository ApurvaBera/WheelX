import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase";
import { fetchUserNotifications, markAllAsRead, deleteNotification, deleteAllNotifications } from "../utils/notifications";
import { useAuth } from "./AuthContext";
import { navigate } from '../utils/navigationRef';
import { scale, verticalScale, moderateScale, rf, SCREEN_WIDTH } from "../utils/responsive";

interface NotificationContextType {
    notifications: any[];
    unreadCount: number;
    loadNotifications: () => Promise<void>;
    handleDeleteAll: () => Promise<void>;
    handleDismissNotification: (id: string) => Promise<void>;
    testFloating: () => void;
    showNotification: (data: { title: string; message: string; icon: string; color: string; type?: string; payload?: any }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [floatingNotif, setFloatingNotif] = useState<any | null>(null);

    // Animation for floating notification
    const slideAnim = useRef(new Animated.Value(-150)).current;

    const loadNotifications = useCallback(async () => {
        if (user) {
            const data = await fetchUserNotifications(user.id);
            setNotifications(data);
        }
    }, [user]);

    const handleDeleteAll = async () => {
        if (user) {
            await deleteAllNotifications(user.id);
            setNotifications([]);
        }
    };

    const handleDismissNotification = async (notifId: string) => {
        await deleteNotification(notifId);
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    };

    const showFloating = (notif: any) => {
        console.log("Showing floating notification:", notif);
        setFloatingNotif(notif);

        // Reset animation before playing
        slideAnim.setValue(-150);

        Animated.spring(slideAnim, {
            toValue: verticalScale(50),
            useNativeDriver: true,
            tension: 50,
            friction: 8
        }).start();

        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideFloating();
        }, 5000);
    };

    const hideFloating = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true
        }).start(() => setFloatingNotif(null));
    };

    const handleNotifPress = () => {
        console.log("Floating notification pressed");
        hideFloating();
        // Navigating to nested Home inside Tabs
        navigate("Tabs", {
            screen: "Home",
            params: { openNotifications: true }
        });
    };

    const showNotification = async (data: any) => {
        if (!user) return;

        // 1. Show immediate UI feedback
        showFloating(data);

        // 2. Persist to database
        const { sendNotification: apiSendNotif } = require("../utils/notifications");
        await apiSendNotif({
            userId: user.id,
            ...data
        });

        // 3. Refresh local list
        loadNotifications();
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        loadNotifications();

        const channel = supabase
            .channel(`public:notifications:user_id=${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Global notification received via Realtime!', payload.new);
                    // Only show floating if it's not the one we just triggered locally
                    // Or simply let it be cached - but here we usually want to avoid duplicates if possible
                    setNotifications((prev) => [payload.new, ...prev]);

                    // We check if we already have this notification ID in our recent floating to avoid double pop
                    // For now, simple logic: show it.
                    showFloating(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, loadNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const testFloating = () => {
        showFloating({
            title: "Test Connection",
            message: "This is a test floating notification from WheelX.",
            icon: "flash",
            color: "#e53935"
        });
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loadNotifications,
            handleDeleteAll,
            handleDismissNotification,
            testFloating,
            showNotification
        }}>
            {children}

            {/* Floating Notification UI */}
            {floatingNotif && (
                <Animated.View style={[styles.floatingContainer, { transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleNotifPress}
                        style={styles.notifCard}
                    >
                        <View style={[styles.iconBox, { backgroundColor: floatingNotif.color + '20' }]}>
                            <Ionicons name={floatingNotif.icon as any || "notifications"} size={22} color={floatingNotif.color || "#e53935"} />
                        </View>
                        <View style={styles.notifContent}>
                            <Text style={styles.notifTitle} numberOfLines={1}>{floatingNotif.title}</Text>
                            <Text style={styles.notifMsg} numberOfLines={1}>{floatingNotif.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hideFloating} style={styles.closeBtn}>
                            <Ionicons name="close" size={18} color="#999" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}

const styles = StyleSheet.create({
    floatingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        paddingHorizontal: scale(20),
    },
    notifCard: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: moderateScale(20),
        padding: moderateScale(12),
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    iconBox: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifContent: {
        flex: 1,
        marginLeft: scale(12),
        marginRight: scale(8),
    },
    notifTitle: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#111',
    },
    notifMsg: {
        fontSize: rf(12),
        color: '#666',
        marginTop: verticalScale(2),
    },
    closeBtn: {
        padding: moderateScale(4),
    }
});
