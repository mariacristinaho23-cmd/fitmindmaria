// Zustand: Es una librería muy simple y potente para manejar el "estado global".
// El "Estado Global" es toda la memoria que la app necesita recordar entre diferentes pantallas.
// Ej: los días de racha, el historial, el nivel, los créditos, etc.
// @ts-nocheck
import { create } from 'zustand';
// persist: Nos permite guardar esta memoria en el dispositivo para que no se borre al cerrar la app.
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { generateDailyPlan as generateAdaptivePlan, UserState, EngineMode } from '../dailyEngine';

// TypeScript: Tipos e Interfaces
// Las "interfaces" son como moldes o contratos. Le dicen a la computadora exactamente qué forma 
// debe tener un objeto para que nos avise si nos equivocamos al escribir algo.
export type Emotion = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface Craving {
    id: string;
    date: string;
    time: string;
    intensity: number; // 1-5
    trigger: string;
}

export interface JournalEntry {
    id: string;
    date: string;
    felt: string;
    thought: string;
    action: string;
}

export interface GratitudeEntry {
    id: string;
    date: string;
    item1: string;
    item2: string;
    item3: string;
}

export interface Exercise {
    id: string;
    name: string;
    weight: number;
    reps: number;
    sets: number;
}

export interface Routine {
    id: string;
    name: string;
    exerciseIds: string[];
}

export interface ExerciseLibraryItem {
    id: string;
    name: string;
    muscleGroup: string;
    imageUri: string | null;
}

export interface WorkoutSession {
    id: string;
    date: string;
    routineName: string;
    durationMinutes: number;
    exercises?: {
        exerciseId: string;
        weight: number;
        reps: number;
        sets: number;
    }[];
    remoteId?: string;
}

export interface WeightLog {
    date: string;
    weight: number;
}

export interface StudyLog {
    id: string;
    date: string;
    type: 'reading' | 'english' | 'focus';
    timeMinutes: number;
    // Reading
    pagesRead?: number;
    // English
    practiceType?: 'listening' | 'speaking' | 'reading' | 'writing';
    newWords?: string;
    // (python removed)
}


export interface DailyPlan {
    date: string;
    modo: EngineMode;
    sugarPlan: string;
    fitnessPlan: string;
    englishPlan: string;
    readingPlan: string;
}

export interface CustomReward {
    id: string;
    title: string;
    cost: number;
}

export interface Redemption {
    id: string;
    date: string; // ISO
    title: string;
    cost: number;
}



export interface DailyLog {
    date: string; // YYYY-MM-DD
    sugarFree: boolean;
    emotion: Emotion | null;
    trained: boolean;
    read: boolean;
    english: boolean;
    creditsGranted?: number;
}

interface AppState {
    sugarFreeStreak: number;
    dailyLogs: Record<string, DailyLog>;
    dailyPlans: Record<string, DailyPlan>;
    cravings: Craving[];
    journalEntries: JournalEntry[];
    gratitudeEntries: GratitudeEntry[];
    routines: Routine[];
    workoutHistory: WorkoutSession[];
    exerciseLibrary: ExerciseLibraryItem[];
    weightLogs: WeightLog[];
    studyLogs: StudyLog[];
    customRewards: CustomReward[];
    redemptionHistory: Redemption[];
    hiddenExercises: string[];
    customMuscleGroups: string[];

    readingMonthlyGoal: number;
    monthlyTrainingGoal: number;
    englishStreak: number;
    // Replace XP/Level system with credits
    creditosDisponibles: number;
    // Aura will be computed at runtime from dailyLogs
    nivelFitness: number;
    nivelIngles: number;
    nivelLectura: number;
    nivelAzucar: number;
    currentDate: string;
    // Actions
    checkAndResetDay: () => void;
    forceResetDay: () => void;
    updateDailyLog: (date: string, updates: Partial<DailyLog>) => void;
    generateDailyPlan: (date: string) => void;
    // XP removed; credits system replaces it
    addCraving: (craving: Omit<Craving, 'id'>) => void;
    addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    addGratitudeEntry: (entry: Omit<GratitudeEntry, 'id'>) => void;
    addRoutine: (routine: Omit<Routine, 'id'>) => void;
    updateRoutine: (id: string, updates: Partial<Routine>) => void;
    removeRoutine: (id: string) => void;
    addWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => void;
    updateWorkoutSession: (session: WorkoutSession) => void;
    removeWorkoutSession: (id: string) => void;
    setExerciseLibrary: (library: ExerciseLibraryItem[]) => void;
    addExerciseToLibrary: (item: Omit<ExerciseLibraryItem, 'id'>) => void;
    updateExerciseInLibrary: (id: string, updates: Partial<ExerciseLibraryItem>) => void;
    removeExerciseFromLibrary: (id: string) => void;
    hideExercise: (id: string) => void;
    addWeightLog: (log: WeightLog) => void;
    addStudyLog: (log: Omit<StudyLog, 'id'>) => void;
    setReadingGoal: (goal: number) => void;
    setMonthlyTrainingGoal: (goal: number) => void;
    addCredits: (amount: number) => void;

    canjearRecompensa: (cost: number) => boolean;
    addCustomReward: (r: Omit<CustomReward, 'id'>) => void;
    removeCustomReward: (id: string) => void;
    updateCustomReward: (id: string, updates: Partial<CustomReward>) => void;
    redeemReward: (reward: { title: string; cost: number }) => boolean;

    addCustomMuscleGroup: (name: string) => void;
    removeCustomMuscleGroup: (name: string) => void;

    pullStateFromCloud: () => Promise<void>;
    pushStateToCloud: () => Promise<void>;
}

export const getLocalDateStr = (d?: Date) => {
    const date = d || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayDateStr = () => getLocalDateStr();

export const calculateStreak = (dailyLogs: Record<string, DailyLog>, key: keyof DailyLog): number => {
    let streak = 0;
    const d = new Date();
    const todayStr = getLocalDateStr(d);

    let isTodayLogged = !!dailyLogs[todayStr]?.[key];
    if (isTodayLogged) {
        streak++;
    }

    d.setDate(d.getDate() - 1);
    const yesterdayStr = getLocalDateStr(d);
    let isYesterdayLogged = !!dailyLogs[yesterdayStr]?.[key];

    // If neither today nor yesterday is logged, streak is broken
    if (!isTodayLogged && !isYesterdayLogged) {
        return 0;
    }

    // Now count backwards from yesterday (inclusive)
    while (true) {
        const dateStr = getLocalDateStr(d);
        if (dailyLogs[dateStr]?.[key]) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};

// HOOK PRINCIPAL: useStore
// Este es el corazón de nuestra memoria. Al usar `export const useStore = create<AppState>()`,
// creamos un gancho (hook) que cualquier pantalla puede usar para leer o modificar la memoria.
export const useStore = create<AppState>()(
    // Envolvemos todo en persist() para que la memoria se grabe físicamente en el celular.
    persist(
        (set, get) => ({
            sugarFreeStreak: 0,
            dailyLogs: {},
            dailyPlans: {},
            cravings: [],
            journalEntries: [],
            gratitudeEntries: [],
            routines: [],
            workoutHistory: [],
            exerciseLibrary: [],
            weightLogs: [],
            studyLogs: [],
            customRewards: [],
            redemptionHistory: [],
            hiddenExercises: [],
            customMuscleGroups: [],
            readingMonthlyGoal: 500,
            monthlyTrainingGoal: 20,
            englishStreak: 0,

            // Keep nivel* for plan generator (not used for XP)
            nivelFitness: 1,
            nivelIngles: 1,
            nivelLectura: 1,
            nivelAzucar: 1,
            creditosDisponibles: 0,
            currentDate: getTodayDateStr(),

            // ACCIONES (Funciones que cambian la memoria)
            // Cuando queremos cambiar el estado global, usamos la función `set()`.
            checkAndResetDay: () => {
                const now = getTodayDateStr();
                const storedDate = get().currentDate;
                if (now !== storedDate) {
                    set({ currentDate: now });
                    get().generateDailyPlan(now);
                }
            },

            forceResetDay: () => {
                const now = getLocalDateStr();
                set((state) => {
                    const nextLogs = { ...state.dailyLogs };
                    delete nextLogs[now];
                    return { dailyLogs: nextLogs, currentDate: now };
                });
                get().generateDailyPlan(now);
            },

            updateDailyLog: (date, updates) =>
                set((state) => {
                    const currentLog = state.dailyLogs[date] || {
                        date,
                        sugarFree: false,
                        emotion: null,
                        trained: false,
                        read: false,
                        english: false,
                        creditsGranted: 0,
                    };

                    const newLog = { ...currentLog, ...updates } as DailyLog;

                    // Calculate credits to grant based on newly completed tasks
                    let granted = 0;
                    const base: Record<string, number> = { trained: 150, read: 50, english: 50, sugarFree: 120 };

                    const plan = state.dailyPlans[date];
                    const modo: any = plan?.modo || 'estandar';
                    const multipliers: Record<string, number> = { minimo: 0.5, estandar: 1, intenso: 1.5 };
                    const mult = multipliers[modo] || 1;

                    if (!currentLog.trained && newLog.trained) granted += Math.round(base.trained * mult);
                    if (!currentLog.read && newLog.read) {
                        // If there are explicit reading study logs (pages), we already award per-page credits elsewhere,
                        // so avoid granting the lump-sum base read bonus to prevent double-counting.
                        const totalPages = (state.studyLogs || []).filter(s => s.date === date && s.type === 'reading')
                            .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
                        if (totalPages <= 0) {
                            granted += Math.round(base.read * mult);
                        }
                    }
                    if (!currentLog.english && newLog.english) granted += Math.round(base.english * mult);
                    if (!currentLog.sugarFree && newLog.sugarFree) granted += Math.round(base.sugarFree * mult);

                    const updatedCreditsGranted = (currentLog.creditsGranted || 0) + granted;

                    const nextState: Partial<AppState> = {
                        dailyLogs: {
                            ...state.dailyLogs,
                            [date]: { ...newLog, creditsGranted: updatedCreditsGranted },
                        },
                    };

                    if (granted > 0) {
                        nextState.creditosDisponibles = (state.creditosDisponibles || 0) + granted;
                        console.log(`Se han añadido ${granted} créditos por completar tareas de ${date}`);
                    }

                    return nextState as AppState;
                }),

            generateDailyPlan: (date) => set((state) => {
                const logs = state.dailyLogs;
                const emotion = logs[date]?.emotion;

                const d = new Date(date);
                d.setDate(d.getDate() - 1);
                const yesterdayStr = getLocalDateStr(d);
                const yesterdayLog = logs[yesterdayStr];

                const sugarStreak = calculateStreak(logs, 'sugarFree');
                const fitnessStreak = calculateStreak(logs, 'trained');
                const englishStreak = calculateStreak(logs, 'english');
                const readingStreak = calculateStreak(logs, 'read');

                // Map emotion to energy: 'terrible'=1, 'bad'=2, 'neutral'=3, 'good'=4, 'great'=5. Default 3
                let energiaHoy = 3;
                if (emotion === 'terrible') energiaHoy = 1;
                if (emotion === 'bad') energiaHoy = 2;
                if (emotion === 'good') energiaHoy = 4;
                if (emotion === 'great') energiaHoy = 5;

                // Calculate yesterday fulfillment count
                let cumplimientoAyer = 0;
                if (yesterdayLog) {
                    if (yesterdayLog.sugarFree) cumplimientoAyer++;
                    if (yesterdayLog.trained) cumplimientoAyer++;
                    if (yesterdayLog.english) cumplimientoAyer++;
                    if (yesterdayLog.read) cumplimientoAyer++;
                }

                // History of last 3 days sugar (index 0 = yesterday, 1 = day before yesterday...)
                const historialConsumoAzucar: boolean[] = [];
                const tempDate = new Date(date);
                for (let i = 0; i < 3; i++) {
                    tempDate.setDate(tempDate.getDate() - 1);
                    const ds = getLocalDateStr(tempDate);
                    historialConsumoAzucar.push(logs[ds]?.sugarFree === false);
                }

                const userState: UserState = {
                    energiaHoy,
                    rachaAzucar: sugarStreak,
                    rachaFitness: fitnessStreak,
                    rachaIngles: englishStreak,
                    // python removed from userState
                    rachaLectura: readingStreak,
                    cumplimientoAyer,
                    historialConsumoAzucar,
                    nivelFitness: state.nivelFitness || 1,
                    nivelIngles: state.nivelIngles || 1,
                    // nivelPython removed
                    nivelLectura: state.nivelLectura || 1,
                    nivelAzucar: state.nivelAzucar || 1,
                };

                const adaptativeOutput = generateAdaptivePlan(userState);

                const plan: DailyPlan = {
                    date,
                    modo: adaptativeOutput.modo,
                    sugarPlan: adaptativeOutput.sugarPlan,
                    fitnessPlan: adaptativeOutput.fitnessPlan,
                    englishPlan: adaptativeOutput.englishPlan,
                    readingPlan: adaptativeOutput.readingPlan,
                };

                return {
                    dailyPlans: {
                        ...state.dailyPlans,
                        [date]: plan
                    }
                };
            }),

            addCraving: (craving) => set((state) => ({
                cravings: [{ ...craving, id: Date.now().toString() }, ...(state.cravings || [])]
            })),
            addJournalEntry: (entry) => set((state) => ({
                journalEntries: [{ ...entry, id: Date.now().toString() }, ...(state.journalEntries || [])]
            })),
            addGratitudeEntry: (entry) => set((state) => ({
                gratitudeEntries: [{ ...entry, id: Date.now().toString() }, ...(state.gratitudeEntries || [])]
            })),
            addRoutine: (routine) => set((state) => ({
                routines: [{ ...routine, id: Date.now().toString() }, ...(state.routines || [])]
            })),
            updateRoutine: (id, updates) => set((state) => ({
                routines: (state.routines || []).map(r => r.id === id ? { ...r, ...updates } : r)
            })),
            removeRoutine: (id) => set((state) => ({
                routines: (state.routines || []).filter(r => r.id !== id)
            })),
            addWorkoutSession: (session) => set((state) => ({
                workoutHistory: [{ ...session, id: Date.now().toString() }, ...(state.workoutHistory || [])]
            })),
            updateWorkoutSession: (session: WorkoutSession) => set((state) => ({
                workoutHistory: (state.workoutHistory || []).map(w => w.id === session.id ? session : w)
            })),
            removeWorkoutSession: (id: string) => set((state) => ({
                workoutHistory: (state.workoutHistory || []).filter(w => w.id !== id)
            })),
            setExerciseLibrary: (library) => set({ exerciseLibrary: library }),
            addExerciseToLibrary: (item) => set((state) => ({
                exerciseLibrary: [...(state.exerciseLibrary || []), { ...item, id: Date.now().toString() }]
            })),

            updateExerciseInLibrary: (id, updates) => set((state) => ({
                exerciseLibrary: (state.exerciseLibrary || []).map(ex =>
                    ex.id === id ? { ...ex, ...updates } : ex
                )
            })),

            removeExerciseFromLibrary: (id) => set((state) => ({
                exerciseLibrary: (state.exerciseLibrary || []).filter(ex => ex.id !== id)
            })),
            hideExercise: (id) => set((state) => ({
                hiddenExercises: Array.from(new Set([...(state.hiddenExercises || []), id]))
            })),
            addWeightLog: (log) => set((state) => {
                const filtered = (state.weightLogs || []).filter(w => w.date !== log.date);
                return { weightLogs: [log, ...filtered].sort((a, b) => b.date.localeCompare(a.date)) };
            }),
            addStudyLog: (log) => {
                set((state) => ({
                    studyLogs: [{ ...log, id: Date.now().toString() }, ...(state.studyLogs || [])]
                }));

                try {
                    const date = log.date;
                    // If this is a reading log with pages, award 10 credits per page immediately
                    if (log.type === 'reading' && (log.pagesRead || 0) > 0) {
                        const amount = (log.pagesRead || 0) * 10;
                        // use get() to avoid closure over stale addCredits
                        try { get().addCredits(amount); } catch (e) { }
                    }

                    const all = (get().studyLogs || []).filter(s => s.date === date && s.type === 'reading');
                    const totalPages = all.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
                    // Determine today's reading target (max 20 pages)
                    const planText = get().dailyPlans?.[date]?.readingPlan || '';
                    const m = String(planText).match(/(\d+)/);
                    let target = m ? Math.min(20, parseInt(m[1], 10)) : null;
                    if (!target) {
                        const day = new Date(date).getDate();
                        target = Math.min(20, 5 + (day % 16));
                    }
                    if (target && totalPages >= target) {
                        // mark read as completed to grant any remaining credits via updateDailyLog
                        get().updateDailyLog(date, { read: true });
                    }
                } catch (e) { }
            },
            addCustomReward: (r) => set((state) => ({
                customRewards: [{ ...r, id: Date.now().toString() }, ...(state.customRewards || [])]
            })),
            removeCustomReward: (id) => set((state) => ({
                customRewards: (state.customRewards || []).filter(c => c.id !== id)
            })),
            updateCustomReward: (id, updates) => set((state) => ({
                customRewards: (state.customRewards || []).map(c => c.id === id ? { ...c, ...updates } : c)
            })),
            addCustomMuscleGroup: (name) => set((state) => ({
                customMuscleGroups: Array.from(new Set([...(state.customMuscleGroups || []), name.trim()]))
            })),
            removeCustomMuscleGroup: (name) => set((state) => ({
                customMuscleGroups: (state.customMuscleGroups || []).filter(g => g !== name)
            })),
            redeemReward: (reward) => {
                const current = get().creditosDisponibles || 0;
                if (current >= reward.cost) {
                    // deduct
                    set({ creditosDisponibles: current - reward.cost });
                    const now = new Date().toISOString();
                    set((state) => ({
                        redemptionHistory: [{ id: Date.now().toString(), date: now, title: reward.title, cost: reward.cost }, ...(state.redemptionHistory || [])]
                    }));
                    return true;
                }
                return false;
            },
            addCredits: (amount) => set((state) => {
                const nextCredits = (state.creditosDisponibles || 0) + amount;
                return { creditosDisponibles: nextCredits } as Partial<AppState>;
            }),
            setReadingGoal: (goal) => set({ readingMonthlyGoal: goal }),
            setMonthlyTrainingGoal: (goal) => set({ monthlyTrainingGoal: goal }),

            canjearRecompensa: (cost) => {
                const current = get().creditosDisponibles || 0;
                if (current >= cost) {
                    set({ creditosDisponibles: current - cost });
                    get().pushStateToCloud();
                    return true;
                }
                return false;
            },
            pullStateFromCloud: async () => {
                try {
                    const { data, error } = await supabase
                        .from('app_state')
                        .select('state_json')
                        .eq('id', 1)
                        .single();

                    if (data && data.state_json) {
                        set(data.state_json as any);
                    }
                } catch (e) {
                    console.error('Error pulling state', e);
                }
            },
            pushStateToCloud: async () => {
                try {
                    const state = get();
                    const stateToSave = Object.fromEntries(
                        Object.entries(state as any).filter(([key, value]) => typeof value !== 'function')
                    );

                    await supabase
                        .from('app_state')
                        .upsert({
                            id: 1,
                            state_json: stateToSave,
                            updated_at: new Date().toISOString()
                        });
                } catch (e) {
                    console.error('Error pushing state', e);
                }
            },
        }),
        {
            name: 'habit-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
