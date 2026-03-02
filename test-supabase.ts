import { supabase } from './src/lib/supabase';

async function testSupabase() {
    console.log("Testing Supabase connection...");
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user:", user?.id || "No user");

    const testExercise = {
        name: "Test Exercise",
        muscleGroup: "CHEST",
        notes: "Test notes",
        user_id: user?.id
    };

    console.log("Inserting test exercise...", testExercise);
    const { data: insertData, error: insertError } = await supabase
        .from('exercises')
        .insert([testExercise])
        .select();

    console.log("Insert result:", { insertData, insertError });

    console.log("Fetching all exercises...");
    const { data: fetchAllData, error: fetchAllError } = await supabase
        .from('exercises')
        .select('*');

    console.log("Fetch all result:", { fetchAllData, fetchAllError });
}

testSupabase().catch(console.error);
