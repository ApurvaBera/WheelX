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
            bookingId,
            role,
            bikeName,
            date,
            sellerId,
            buyerId,
            buyerPhone,
            sellerPhone,
            cancelledByName,
            isRental
        } = await req.json();

        const otherPartyId = role === 'buyer' ? sellerId : buyerId;
        const otherPartyPhone = role === 'buyer' ? sellerPhone : buyerPhone;
        const otherPartyRole = role === 'buyer' ? 'seller' : 'buyer';

        if (bookingId) {
            await supabase.from('notifications').delete().eq('id', bookingId);
        }

        if (otherPartyId) {
            await supabase.from('notifications')
                .delete()
                .eq('user_id', otherPartyId)
                .eq('type', 'booking_reminder')
                .contains('payload', { bikeName, date, role: otherPartyRole });

            await supabase.from('notifications').insert({
                user_id: otherPartyId,
                title: "Booking Canceled",
                message: `${cancelledByName} has canceled the booking for ${bikeName}.`,
                icon: "close-circle",
                color: "#EF4444",
                type: "general",
                payload: { bikeName, date, isRental: !!isRental }
            });
        }

        if (otherPartyPhone) {
            let cleanPhone = otherPartyPhone.trim();
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

            const typeLabel = isRental ? "rental" : "test ride";
            const messageBody = `🚫 *Booking Cancelled*\n\nThe ${typeLabel} for *${bikeName}* scheduled on ${date} has been cancelled by ${cancelledByName}.`;

            console.log(`[cancel-booking] Attempting: ${formattedFrom} -> ${formattedTo}`);

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
                console.error("[cancel-booking] Twilio Error:", err);
            } else {
                console.log("[cancel-booking] Message sent successfully");
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[cancel-booking] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
