import { supabase } from "../supabase";

export type NotificationType = "welcome" | "listing" | "appointment" | "message" | "price_drop";

interface NotificationData {
    userId: string;
    title: string;
    message: string;
    icon: string;
    color: string;
    type?: string;
    payload?: any;
}

export const sendNotification = async (data: NotificationData) => {
    try {
        const { error } = await supabase.from("notifications").insert([
            {
                user_id: data.userId,
                title: data.title,
                message: data.message,
                icon: data.icon,
                color: data.color,
                read: false,
                type: data.type || 'info', // Default to 'info'
                payload: data.payload || {},
            },
        ]);
        if (error) throw error;
    } catch (err) {
        console.error("Failed to send notification:", err);
    }
};

export const fetchUserNotifications = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Failed to fetch notifications:", err);
        return [];
    }
};

export const markAllAsRead = async (userId: string) => {
    try {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", userId);

        if (error) throw error;
    } catch (err) {
        console.error("Failed to mark notifications as read:", err);
    }
};

export const checkAndSendWelcome = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("title", "Welcome to WheelX")
            .limit(1);

        if (error) throw error;

        if (data.length === 0) {
            await sendNotification({
                userId,
                title: "Welcome to WheelX",
                message: "Thanks for joining. Start exploring your dream bikes!",
                icon: "heart",
                color: "#EF4444",
            });
        }
    } catch (err) {
        console.error("Welcome notification check failed:", err);
    }
};

export const deleteNotification = async (notifId: string) => {
    try {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", notifId);

        if (error) throw error;
    } catch (err) {
        console.error("Failed to delete notification:", err);
    }
};

export const deleteAllNotifications = async (userId: string) => {
    try {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("user_id", userId);

        if (error) throw error;
    } catch (err) {
        console.error("Failed to delete all notifications:", err);
    }
};
