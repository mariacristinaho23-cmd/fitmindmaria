import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateDailyPlan as generateAdaptivePlan, UserState, EngineMode } from '../dailyEngine';

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
    exercises: Exercise[];
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

export interface BossEvent {
    id: string;
    date: string;
    result: 'defeated' | 'alive';
    change: number;
    prevHp: number;
    finalHp: number;
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
    routines: Routine[];
    workoutHistory: WorkoutSession[];
    exerciseLibrary: ExerciseLibraryItem[];
    weightLogs: WeightLog[];
    studyLogs: StudyLog[];
    customRewards: CustomReward[];
    redemptionHistory: Redemption[];
    dailyBosses: Record<string, number>;
    bossEvents: BossEvent[];
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
    // Actions
    updateDailyLog: (date: string, updates: Partial<DailyLog>) => void;
    generateDailyPlan: (date: string) => void;
    // XP removed; credits system replaces it
    addCraving: (craving: Omit<Craving, 'id'>) => void;
    addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    addRoutine: (routine: Omit<Routine, 'id'>) => void;
    addWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => void;
    updateWorkoutSession: (session: WorkoutSession) => void;
    removeWorkoutSession: (id: string) => void;
    setExerciseLibrary: (library: ExerciseLibraryItem[]) => void;
    addExerciseToLibrary: (item: Omit<ExerciseLibraryItem, 'id'>) => void;
    updateExerciseInLibrary: (id: string, updates: Partial<ExerciseLibraryItem>) => void;
    removeExerciseFromLibrary: (id: string) => void;
    addWeightLog: (log: WeightLog) => void;
    addStudyLog: (log: Omit<StudyLog, 'id'>) => void;
    setReadingGoal: (goal: number) => void;
    setMonthlyTrainingGoal: (goal: number) => void;
    addCredits: (amount: number) => void;
    finalizeDay: (date?: string) => { defeated: boolean; hpRemaining: number; creditDelta: number };
    canjearRecompensa: (cost: number) => boolean;
    addCustomReward: (r: Omit<CustomReward, 'id'>) => void;
    removeCustomReward: (id: string) => void;
    redeemReward: (reward: { title: string; cost: number }) => boolean;
}

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

export const calculateStreak = (dailyLogs: Record<string, DailyLog>, key: keyof DailyLog): number => {
    let streak = 0;
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];

    let isTodayLogged = !!dailyLogs[todayStr]?.[key];
    if (isTodayLogged) {
        streak++;
    }

    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];
    let isYesterdayLogged = !!dailyLogs[yesterdayStr]?.[key];

    // If neither today nor yesterday is logged, streak is broken
    if (!isTodayLogged && !isYesterdayLogged) {
        return 0;
    }

    // Now count backwards from yesterday (inclusive)
    while (true) {
        const dateStr = d.toISOString().split('T')[0];
        if (dailyLogs[dateStr]?.[key]) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            sugarFreeStreak: 0,
            dailyLogs: {},
            dailyPlans: {},
            cravings: [],
            journalEntries: [],
            routines: [],
            workoutHistory: [],
            exerciseLibrary: [],
            weightLogs: [],
            studyLogs: [],
            customRewards: [],
            redemptionHistory: [],
            readingMonthlyGoal: 500,
            monthlyTrainingGoal: 20,
            englishStreak: 0,
            
            // Keep nivel* for plan generator (not used for XP)
            nivelFitness: 1,
            nivelIngles: 1,
            nivelLectura: 1,
            nivelAzucar: 1,
            creditosDisponibles: 0,

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
                    const base: Record<string, number> = { trained: 150, read: 50, english: 50, sugarFree: 20 };

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
                const yesterdayStr = d.toISOString().split('T')[0];
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
                    const ds = tempDate.toISOString().split('T')[0];
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
            addRoutine: (routine) => set((state) => ({
                routines: [{ ...routine, id: Date.now().toString() }, ...(state.routines || [])]
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
                        try { get().addCredits(amount); } catch (e) {}
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
            // Finalize day mechanics and boss system
            dailyBosses: {},
            bossEvents: [],
            addCredits: (amount) => set((state) => {
                const today = getTodayDateStr();
                const prevCredits = state.creditosDisponibles || 0;
                const nextCredits = prevCredits + amount;

                // apply damage to today's boss (1 credit = 1 HP)
                const prevHp = (state.dailyBosses && state.dailyBosses[today]) ?? 1000;
                const finalHp = Math.max(0, prevHp - amount);

                const nextState: Partial<AppState> = {
                    creditosDisponibles: nextCredits,
                    dailyBosses: { ...(state.dailyBosses || {}), [today]: finalHp }
                };

                // if boss just died, record event (finalization still gives bonus)
                if (prevHp > 0 && finalHp === 0) {
                    const ev: BossEvent = { id: Date.now().toString(), date: today, result: 'defeated', change: 0, prevHp, finalHp };
                    nextState.bossEvents = [ev, ...(state.bossEvents || [])];
                }

                return nextState as AppState;
            }),
            finalizeDay: (date) => {
                const d = date || getTodayDateStr();
                // determine today's plan and tasks
                const plan = get().dailyPlans?.[d] || null;
                const tasks = ['trained', 'read', 'english'];
                let total = 0, done = 0;
                if (plan) {
                    if (plan.fitnessPlan) total++;
                    if (plan.readingPlan) total++;
                    if (plan.englishPlan) total++;
                }
                const todayLog = get().dailyLogs?.[d];
                if (!todayLog) {
                    // nothing done
                    total = Math.max(1, total);
                } else {
                    if (todayLog.trained) done++;
                    if (todayLog.read) done++;
                    if (todayLog.english) done++;
                }

                if (total === 0) total = 1;
                const auraPercent = Math.round((done / total) * 100);

                if (auraPercent === 100) {
                    // reward 100 credits
                    const current = get().creditosDisponibles || 0;
                    const bonus = 100;
                    set({ creditosDisponibles: current + bonus });
                    const ev: BossEvent = { id: Date.now().toString(), date: d, result: 'defeated', change: bonus, prevHp: 0, finalHp: 0 };
                    set((state) => ({ bossEvents: [ev, ...(state.bossEvents || [])] }));
                    return { defeated: true, hpRemaining: auraPercent, creditDelta: bonus };
                } else {
                    // penalty -300 credits
                    const current = get().creditosDisponibles || 0;
                    const loss = Math.min(300, current);
                    set({ creditosDisponibles: current - loss });
                    const ev: BossEvent = { id: Date.now().toString(), date: d, result: 'alive', change: -loss, prevHp: auraPercent, finalHp: auraPercent };
                    set((state) => ({ bossEvents: [ev, ...(state.bossEvents || [])] }));
                    return { defeated: false, hpRemaining: auraPercent, creditDelta: -loss };
                }
            },
            setReadingGoal: (goal) => set({ readingMonthlyGoal: goal }),
            setMonthlyTrainingGoal: (goal) => set({ monthlyTrainingGoal: goal }),
            
            canjearRecompensa: (cost) => {
                const current = get().creditosDisponibles || 0;
                if (current >= cost) {
                    set({ creditosDisponibles: current - cost });
                    return true;
                }
                return false;
            },
        }),
        {
            name: 'habit-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
