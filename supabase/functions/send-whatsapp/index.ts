import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER")!;

serve(async (req: Request) => {
    try {
        const { to, bikeName, date, time, address, sellerName, isRental } = await req.json();

        if (!to || !bikeName || !date || !address || !sellerName) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // --- Robust Phone Number Sanitization ---
        let cleanTo = to.trim();
        if (cleanTo.startsWith('whatsapp:')) {
            cleanTo = cleanTo.replace('whatsapp:', '');
        }
        const hasPlus = cleanTo.startsWith('+');
        cleanTo = cleanTo.replace(/\D/g, '');
        if (hasPlus) cleanTo = '+' + cleanTo;

        if (!cleanTo.startsWith('+')) {
            if (cleanTo.length === 10) cleanTo = `+91${cleanTo}`;
            else cleanTo = `+${cleanTo}`;
        }

        const formattedTo = `whatsapp:${cleanTo}`;
        const formattedFrom = TWILIO_PHONE_NUMBER.startsWith('whatsapp:')
            ? TWILIO_PHONE_NUMBER
            : `whatsapp:${TWILIO_PHONE_NUMBER}`;

        console.log(`[send-whatsapp] Attempting: ${formattedFrom} -> ${formattedTo}`);

        const typeLabel = isRental ? "bike rental" : "test ride";
        const timeStr = time ? ` at ${time}` : "";
        const messageBody = `🎉 Good news from WheelX!\nYour ${typeLabel} for ${bikeName} is confirmed by ${sellerName}.\n📅 Date: ${date}${timeStr}\n📍 Location: ${address}\nGet ready to enjoy the ride! 🚀`;

        const params = new URLSearchParams();
        params.append("To", formattedTo);
        params.append("From", formattedFrom);
        params.append("Body", messageBody);

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

        const response = await fetch(twilioUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${auth}`,
            },
            body: params,
        });

        const result = await response.json();
        if (!response.ok) {
            console.error("[send-whatsapp] Twilio Error:", result);
            return new Response(JSON.stringify({ error: "Twilio delivery failed", details: result }), { status: 500 });
        }

        console.log(`[send-whatsapp] Success! SID: ${result.sid}`);
        return new Response(JSON.stringify({ success: true, sid: result.sid }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[send-whatsapp] Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
