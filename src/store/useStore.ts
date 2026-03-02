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
}

export interface WeightLog {
    date: string;
    weight: number;
}

export interface StudyLog {
    id: string;
    date: string;
    type: 'reading' | 'english' | 'python';
    timeMinutes: number;
    // Reading
    pagesRead?: number;
    // English
    practiceType?: 'listening' | 'speaking' | 'reading' | 'writing';
    newWords?: string;
    // Python
    topic?: string;
    exerciseCompleted?: boolean;
}

export interface DailyPlan {
    date: string;
    modo: EngineMode;
    sugarPlan: string;
    fitnessPlan: string;
    englishPlan: string;
    pythonPlan: string;
    readingPlan: string;
    focusOfTheDay?: string;
}

export interface DailyLog {
    date: string; // YYYY-MM-DD
    sugarFree: boolean;
    emotion: Emotion | null;
    trained: boolean;
    read: boolean;
    english: boolean;
    python: boolean;
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
    readingMonthlyGoal: number;
    englishStreak: number;
    pythonStreak: number;
    nivelDisciplina: number;
    // Progression V3
    nivelFitness: number;
    nivelIngles: number;
    nivelPython: number;
    nivelLectura: number;
    nivelAzucar: number;
    xpFitness: number;
    xpIngles: number;
    xpPython: number;
    xpLectura: number;
    xpAzucar: number;
    lastLevelDropFitness: string | null;
    lastLevelDropIngles: string | null;
    lastLevelDropPython: string | null;
    lastLevelDropLectura: string | null;
    lastLevelDropAzucar: string | null;
    // Actions
    updateDailyLog: (date: string, updates: Partial<DailyLog>) => void;
    generateDailyPlan: (date: string) => void;
    addXP: (domain: 'Fitness' | 'Ingles' | 'Python' | 'Lectura' | 'Azucar', amount: number) => void;
    addCraving: (craving: Omit<Craving, 'id'>) => void;
    addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    addRoutine: (routine: Omit<Routine, 'id'>) => void;
    addWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => void;
    addExerciseToLibrary: (item: Omit<ExerciseLibraryItem, 'id'>) => void;
    addWeightLog: (log: WeightLog) => void;
    addStudyLog: (log: Omit<StudyLog, 'id'>) => void;
    setReadingGoal: (goal: number) => void;
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
            sugarFreeStreak: 0, // Kept for backwards compatibility with existing storage, unused
            dailyLogs: {},
            dailyPlans: {},
            cravings: [],
            journalEntries: [],
            routines: [],
            workoutHistory: [],
            exerciseLibrary: [],
            weightLogs: [],
            studyLogs: [],
            readingMonthlyGoal: 500,
            englishStreak: 0, // Unused
            pythonStreak: 0, // Unused
            nivelDisciplina: 0,
            nivelFitness: 1,
            nivelIngles: 1,
            nivelPython: 1,
            nivelLectura: 1,
            nivelAzucar: 1,
            xpFitness: 0,
            xpIngles: 0,
            xpPython: 0,
            xpLectura: 0,
            xpAzucar: 0,
            lastLevelDropFitness: null,
            lastLevelDropIngles: null,
            lastLevelDropPython: null,
            lastLevelDropLectura: null,
            lastLevelDropAzucar: null,

            updateDailyLog: (date, updates) =>
                set((state) => {
                    const currentLog = state.dailyLogs[date] || {
                        date,
                        sugarFree: false,
                        emotion: null,
                        trained: false,
                        read: false,
                        english: false,
                        python: false,
                    };
                    return {
                        dailyLogs: {
                            ...state.dailyLogs,
                            [date]: { ...currentLog, ...updates },
                        },
                    };
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
                const pythonStreak = calculateStreak(logs, 'python');
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
                    if (yesterdayLog.python) cumplimientoAyer++;
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
                    rachaPython: pythonStreak,
                    rachaLectura: readingStreak,
                    cumplimientoAyer,
                    historialConsumoAzucar,
                    nivelFitness: state.nivelFitness || 1,
                    nivelIngles: state.nivelIngles || 1,
                    nivelPython: state.nivelPython || 1,
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
                    pythonPlan: adaptativeOutput.pythonPlan,
                    readingPlan: adaptativeOutput.readingPlan,
                    focusOfTheDay: adaptativeOutput.focusOfTheDay
                };

                return {
                    nivelDisciplina: adaptativeOutput.nivelDisciplina,
                    dailyPlans: {
                        ...state.dailyPlans,
                        [date]: plan
                    }
                };
            }),

            addXP: (domain, amount) => set((state) => {
                const xpKey = `xp${domain}` as keyof AppState;
                const levelKey = `nivel${domain}` as keyof AppState;
                const dropKey = `lastLevelDrop${domain}` as keyof AppState;

                const currentXP = (state[xpKey] as number) || 0;
                const currentLevel = (state[levelKey] as number) || 1;

                let newXP = currentXP + amount;
                let newLevel = currentLevel;
                let dropUpdate = {};

                // Level Up Logic
                if (newXP >= currentLevel * 20 && currentLevel < 10 && amount > 0) {
                    newLevel = currentLevel + 1;
                    newXP = 0; // Reset XP on level up
                }

                // Penalty Logic Let XP drop below 0 to denote level loss
                if (newXP < 0 && amount < 0) {
                    if (currentLevel > 1) {
                        const lastDropDate = state[dropKey] as string | null;
                        const todayStr = getTodayDateStr();

                        let canDrop = true;
                        if (lastDropDate) {
                            const daysSinceDrop = (new Date(todayStr).getTime() - new Date(lastDropDate).getTime()) / (1000 * 3600 * 24);
                            if (daysSinceDrop < 7) {
                                canDrop = false; // Already dropped within 7 days
                            }
                        }

                        if (canDrop) {
                            newLevel = currentLevel - 1;
                            newXP = 0; // Cap at 0 after dropping
                            dropUpdate = { [dropKey]: todayStr };
                        } else {
                            newXP = 0; // Cannot drop, just hit floor 0
                        }
                    } else {
                        newXP = 0; // Level 1 floor
                    }
                }

                // If adding XP would exceed max level, cap it
                if (newLevel === 10 && newXP > 0) {
                    newXP = 0; // Mastered
                }

                return {
                    [xpKey]: newXP,
                    [levelKey]: newLevel,
                    ...dropUpdate
                } as Partial<AppState>;
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
            addExerciseToLibrary: (item) => set((state) => ({
                exerciseLibrary: [{ ...item, id: Date.now().toString() }, ...(state.exerciseLibrary || [])]
            })),
            addWeightLog: (log) => set((state) => {
                const filtered = (state.weightLogs || []).filter(w => w.date !== log.date);
                return { weightLogs: [log, ...filtered].sort((a, b) => b.date.localeCompare(a.date)) };
            }),
            addStudyLog: (log) => set((state) => ({
                studyLogs: [{ ...log, id: Date.now().toString() }, ...(state.studyLogs || [])]
            })),
            setReadingGoal: (goal) => set({ readingMonthlyGoal: goal }),
        }),
        {
            name: 'habit-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
