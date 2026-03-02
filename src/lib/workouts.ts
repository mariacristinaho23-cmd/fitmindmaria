import { supabase } from './supabase';

export const createWorkout = async (date: string, name: string, duration?: number) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const insertData: any = { date, name };
        if (user) {
            insertData.user_id = user.id;
        }
        if (duration) {
            insertData.duration_minutes = duration;
        }

        const { data, error } = await supabase
            .from('workouts')
            .insert([insertData])
            .select();

        if (error) {
            console.error('Error in createWorkout:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('Unexpected error in createWorkout:', err);
        return { data: null, error: err };
    }
}

export async function getWorkouts(userId: string) {
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error in getWorkouts:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('Unexpected error in getWorkouts:', err);
        return { data: null, error: err };
    }
}
