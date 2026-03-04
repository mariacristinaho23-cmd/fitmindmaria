require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const email = process.env.EXPO_PUBLIC_USER_EMAIL;
const password = process.env.EXPO_PUBLIC_USER_PASSWORD;

if (!supabaseUrl || !supabaseKey || !email || !password) {
    console.error("Missing environment variables for testing.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log(`Intentando iniciar sesión con: ${email} / ${password}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error("❌ Falló el inicio de sesión:", error.message);
    } else {
        console.log("✅ Inicio de sesión exitoso. Usuario ID:", data.user.id);
    }
}

testLogin();
