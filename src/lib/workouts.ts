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

export async function saveExercise(exercise: any) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        let insertData: any = {
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            notes: exercise.notes || null,
            equipment: exercise.equipment || null,
            imageUri: exercise.imageUri || null,
        };

        if (user) {
            insertData.user_id = user.id;
        }

        let query;
        if (exercise.id && exercise.id.length > 20) {
            query = supabase.from('exercises').update(insertData).eq('id', exercise.id).select();
        } else {
            query = supabase.from('exercises').insert([insertData]).select();
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error saving exercise to Supabase:', error);
            return { data: null, error };
        }
        return { data: data ? data[0] : null, error: null };
    } catch (err) {
        console.error('Unexpected error saving exercise:', err);
        return { data: null, error: err };
    }
}

export async function fetchExercises() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase.from('exercises').select('*').order('name', { ascending: true });
        if (user) {
            query = query.eq('user_id', user.id);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching exercises from Supabase:', error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (err) {
        console.error('Unexpected error fetching exercises:', err);
        return { data: null, error: err };
    }
}

export async function deleteExercise(id: string) {
    try {
        if (id.length > 20) {
            const { error } = await supabase.from('exercises').delete().eq('id', id);
            if (error) {
                console.error('Error deleting exercise from Supabase:', error);
                return { error };
            }
        }
        return { error: null };
    } catch (err) {
        console.error('Unexpected error deleting exercise:', err);
        return { error: err };
    }
}
