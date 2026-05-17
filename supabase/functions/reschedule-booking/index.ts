import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
    try {
        const {
            oldBookingId,
            newDate,
            newTime,
            bikeName,
            address,
            sellerName,
            sellerId,
            sellerPhone,
            buyerId,
            buyerName,
            buyerPhone,
            oldDate,
            oldPayload
        } = await req.json();

        if (oldBookingId) {
            await supabase.from('notifications').delete().eq('id', oldBookingId);
        }

        if (buyerId) {
            await supabase.from('notifications')
                .delete()
                .eq('user_id', buyerId)
                .eq('type', 'booking_reminder')
                .contains('payload', { bikeName, date: oldDate, sellerId });
        }

        const isRental = !!oldPayload?.isRental;
        const typeLabel = isRental ? "Rental" : "Test Ride";
        const timeStr = newTime ? ` at ${newTime}` : "";

        if (buyerId) {
            await supabase.from('notifications').insert({
                user_id: buyerId,
                title: `${typeLabel} Rescheduled`,
                message: `Seller has rescheduled ${bikeName} ${typeLabel.toLowerCase()} to ${newDate}${timeStr}.`,
                icon: "calendar",
                color: "#F59E0B",
                type: "booking_reminder",
                payload: { ...oldPayload, date: newDate, time: newTime || oldPayload?.time, role: "buyer", sellerName, sellerPhone, sellerId, bikeName, address }
            });
        }

        if (sellerId) {
            await supabase.from('notifications').insert({
                user_id: sellerId,
                title: "Booking Rescheduled",
                message: `You rescheduled ${bikeName} ${typeLabel.toLowerCase()} with ${buyerName} to ${newDate}${timeStr}.`,
                icon: "calendar",
                color: "#6366f1",
                type: "booking_reminder",
                payload: { ...oldPayload, date: newDate, time: newTime || oldPayload?.time, role: "seller", buyerName, buyerPhone, buyerId, bikeName, address }
            });
        }

        if (buyerPhone) {
            let cleanPhone = buyerPhone.trim();
            if (cleanPhone.startsWith('whatsapp:')) cleanPhone = cleanPhone.replace('whatsapp:', '');
            const hasPlus = cleanPhone.startsWith('+');
            cleanPhone = cleanPhone.replace(/\D/g, '');
            if (hasPlus) cleanPhone = '+' + cleanPhone;

            if (!cleanPhone.startsWith('+')) {
                if (cleanPhone.length === 10) cleanPhone = `+91${cleanPhone}`;
                else cleanPhone = `+${cleanPhone}`;
            }

            const formattedTo = `whatsapp:${cleanPhone}`;
            const formattedFrom = TWILIO_PHONE_NUMBER.startsWith('whatsapp:')
                ? TWILIO_PHONE_NUMBER
                : `whatsapp:${TWILIO_PHONE_NUMBER}`;

            const messageBody = `🎉 *Reschedule Update*\n\nYour ${typeLabel.toLowerCase()} for *${bikeName}* has been rescheduled by ${sellerName}.\n\n🗓 *New Date:* ${newDate}${timeStr}\n📍 *Location:* ${address}\n\nSee you there! 🚀`;

            console.log(`[reschedule-booking] Attempting: ${formattedFrom} -> ${formattedTo}`);

            const params = new URLSearchParams();
            params.append("To", formattedTo);
            params.append("From", formattedFrom);
            params.append("Body", messageBody);

            const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
            const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${auth}`,
                },
                body: params,
            });

            if (!twilioRes.ok) {
                const err = await twilioRes.json();
                console.error("[reschedule-booking] Twilio Error:", err);
            } else {
                console.log("[reschedule-booking] Message sent successfully");
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[reschedule-booking] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
