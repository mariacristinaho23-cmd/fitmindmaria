require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabaseUrl or supabaseKey");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Supabase connection...");
    // Intentar crear un usuario falso para ver si tira error o pasa la validación.
    const { data, error } = await supabase.auth.signUp({
        email: 'test-fake-email-12345@gmail.com',
        password: 'password123'
    });

    if (error) {
        console.error("Supabase Error:", error.message);
    } else {
        console.log("Supabase Success:", data);
    }
}

test();
