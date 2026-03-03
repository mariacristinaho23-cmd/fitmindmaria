// @ts-nocheck
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

export const createWorkoutFull = async (date: string, name: string, duration: number | undefined, exercises?: { exerciseId: string; weight: number; reps: number; sets: number }[]) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const insertData: any = { date, name };
        if (user) insertData.user_id = user.id;
        if (duration) insertData.duration_minutes = duration;

        const { data, error } = await supabase.from('workouts').insert([insertData]).select();
        if (error || !data || data.length === 0) {
            console.error('Error inserting workout:', error);
            return { data: null, error };
        }

        const workout = data[0];

        if (exercises && exercises.length > 0) {
            const toInsert = exercises.map(e => ({ workout_id: workout.id, exercise_id: e.exerciseId, weight: e.weight, reps: e.reps, sets: e.sets }));
            const { error: err2 } = await supabase.from('workout_exercises').insert(toInsert);
            if (err2) {
                // Surface clear guidance if table not found in PostgREST schema cache
                if ((err2 as any)?.code === 'PGRST205') {
                    console.error('Supabase error: workout_exercises table not found. Run the SQL migration in /migrations/001_create_workout_exercises.sql or refresh the API schema in Supabase.', err2);
                } else {
                    console.error('Error inserting workout_exercises:', err2);
                }
                // not fatal for workout creation
            }
        }

        return { data: workout, error: null };
    } catch (err) {
        console.error('Unexpected error in createWorkoutFull:', err);
        return { data: null, error: err };
    }
}

export const updateWorkoutFull = async (remoteId: string, date: string, name: string, duration: number | undefined, exercises?: { exerciseId: string; weight: number; reps: number; sets: number }[]) => {
    try {
        const updateData: any = { date, name };
        if (duration !== undefined) updateData.duration_minutes = duration;

        const { data, error } = await supabase.from('workouts').update(updateData).eq('id', remoteId).select();
        if (error) {
            console.error('Error updating workout:', error);
            return { data: null, error };
        }

        // Replace exercises: delete existing and insert new
            if (exercises) {
            const { error: delErr } = await supabase.from('workout_exercises').delete().eq('workout_id', remoteId);
            if (delErr) {
                if ((delErr as any)?.code === 'PGRST205') {
                    console.error('Supabase error: workout_exercises table not found when attempting delete. Run the SQL migration in /migrations/001_create_workout_exercises.sql or refresh the API schema in Supabase.', delErr);
                } else {
                    console.error('Error deleting old workout_exercises:', delErr);
                }
            }

                if (exercises.length > 0) {
                const toInsert = exercises.map(e => ({ workout_id: remoteId, exercise_id: e.exerciseId, weight: e.weight, reps: e.reps, sets: e.sets }));
                const { error: insErr } = await supabase.from('workout_exercises').insert(toInsert);
                if (insErr) {
                    if ((insErr as any)?.code === 'PGRST205') {
                        console.error('Supabase error: workout_exercises table not found when inserting updates. Run the SQL migration in /migrations/001_create_workout_exercises.sql or refresh the API schema in Supabase.', insErr);
                    } else {
                        console.error('Error inserting workout_exercises:', insErr);
                    }
                }
            }
        }

        return { data: data ? data[0] : null, error: null };
    } catch (err) {
        console.error('Unexpected error in updateWorkoutFull:', err);
        return { data: null, error: err };
    }
}

export const deleteWorkoutFull = async (remoteId: string) => {
    try {
        // delete related exercises first
        const { error: delExErr } = await supabase.from('workout_exercises').delete().eq('workout_id', remoteId);
        if (delExErr) console.error('Error deleting workout_exercises on delete:', delExErr);

        const { error } = await supabase.from('workouts').delete().eq('id', remoteId);
        if (error) {
            console.error('Error deleting workout:', error);
            return { error };
        }
        return { error: null };
    } catch (err) {
        console.error('Unexpected error in deleteWorkoutFull:', err);
        return { error: err };
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
