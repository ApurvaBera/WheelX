import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gewqzpgacuaorndtwmth.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdld3F6cGdhY3Vhb3JuZHR3bXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTE3NDQsImV4cCI6MjA4MTM4Nzc0NH0.2PIT8yP2RkaOp-K4hcWfs0HA-rGMIQUs0Kcr_E8Bu-k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage as any,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
});
