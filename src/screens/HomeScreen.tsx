import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, Emotion, calculateStreak } from '../store/useStore';
import { CheckCircle2, Circle, Flame, Brain, BookOpen, Activity, Dumbbell, Zap, Target } from 'lucide-react-native';

const MOTIVATIONAL_QUOTES = [
    "Cada pequeña elección suma a la persona en la que te estás convirtiendo.",
    "La disciplina es el puente entre tus metas y tus logros.",
    "Estás construyendo una versión más fuerte y brillante de ti misma.",
    "Priorízate hoy, tu 'yo' del mañana te lo agradecerá."
];

export default function HomeScreen() {
    const {
        dailyLogs, updateDailyLog, dailyPlans, generateDailyPlan, nivelDisciplina, addXP,
        nivelFitness, xpFitness,
        nivelIngles, xpIngles,
        nivelPython, xpPython,
        nivelLectura, xpLectura,
        nivelAzucar, xpAzucar
    } = useStore();
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLog = dailyLogs[todayStr] || {
        date: todayStr, sugarFree: false, emotion: null, trained: false, read: false, english: false, python: false
    };
    const todaysPlan = dailyPlans[todayStr];

    useEffect(() => {
        if (!todaysPlan) {
            generateDailyPlan(todayStr);
        }
    }, [todayStr, todaysPlan, generateDailyPlan]);

    const handleEmotionUpdate = (emotion: Emotion) => {
        updateDailyLog(todayStr, { emotion });
        // Small timeout to allow state to flush before regenerating plan
        setTimeout(() => {
            generateDailyPlan(todayStr);
        }, 0);
    };

    const sugarFreeStreak = calculateStreak(dailyLogs, 'sugarFree');
    const readingStreak = calculateStreak(dailyLogs, 'read');
    const englishStreak = calculateStreak(dailyLogs, 'english');
    const pythonStreak = calculateStreak(dailyLogs, 'python');

    const handleSugarUpdate = (consumed: boolean) => {
        const wasSugarFree = todaysLog.sugarFree === true;
        const willBeSugarFree = !consumed;

        updateDailyLog(todayStr, { sugarFree: willBeSugarFree });

        if (todaysPlan) {
            const xpAmount = todaysPlan.modo === 'intenso' ? 15 : todaysPlan.modo === 'estandar' ? 10 : 5;
            if (willBeSugarFree && !wasSugarFree) {
                addXP('Azucar', xpAmount);
            } else if (!willBeSugarFree && wasSugarFree) {
                addXP('Azucar', -xpAmount);
            }
        }

        // Timeout to allow state to flush before regenerating plan, updating UI
        setTimeout(() => {
            generateDailyPlan(todayStr);
        }, 0);
    };

    const renderLevelProgress = (level: number, xp: number) => {
        const maxXp = level * 20;
        const progress = Math.min(Math.max((xp / maxXp) * 100, 0), 100);

        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.levelText}>Lvl {level}</Text>
                    <Text style={styles.xpText}>{Math.max(0, xp)} / {maxXp} XP</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
            </View>
        );
    };

    const emotions: { emoji: string; value: Emotion }[] = [
        { emoji: '😁', value: 'great' },
        { emoji: '🙂', value: 'good' },
        { emoji: '😐', value: 'neutral' },
        { emoji: '😔', value: 'bad' },
        { emoji: '😫', value: 'terrible' }
    ];

    const Quote = MOTIVATIONAL_QUOTES[sugarFreeStreak % MOTIVATIONAL_QUOTES.length];

    const renderTaskToggle = (title: string, field: keyof typeof todaysLog, domain: 'Fitness' | 'Ingles' | 'Python' | 'Lectura', level: number, xp: number, streak?: number) => (
        <View style={styles.taskContainer}>
            <TouchableOpacity
                style={styles.taskRow}
                onPress={() => {
                    if (todaysPlan) {
                        const isCurrentlyDone = todaysLog[field];
                        const newStatus = !isCurrentlyDone;
                        updateDailyLog(todayStr, { [field]: newStatus });
                        const xpAmount = todaysPlan.modo === 'intenso' ? 15 : todaysPlan.modo === 'estandar' ? 10 : 5;
                        addXP(domain, newStatus ? xpAmount : -xpAmount);
                    }
                }}
            >
                {todaysLog[field] ? (
                    <CheckCircle2 color={theme.colors.success} size={24} />
                ) : (
                    <Circle color={theme.colors.textLight} size={24} />
                )}
                <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                    <Text style={[styles.taskText, todaysLog[field] && styles.taskTextDone]}>{title}</Text>
                </View>
                {streak !== undefined && streak > 0 && (
                    <View style={styles.miniStreak}>
                        <Text style={styles.miniStreakText}>🔥 {streak}</Text>
                    </View>
                )}
            </TouchableOpacity>
            {renderLevelProgress(level, xp)}
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Image source={require('../../assets/icon.png')} style={{ width: 45, height: 45, resizeMode: 'contain' }} />
                    <Text style={styles.date}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </View>
                <Text style={styles.quote}>"{Quote}"</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Días sin azúcar</Text>
                <View style={styles.streakContainer}>
                    <Text style={styles.streakNumber}>{sugarFreeStreak}</Text>
                    <Text style={styles.streakLabel}>🔥 racha actual</Text>
                </View>
                <Text style={styles.question}>¿Consumí dulce hoy?</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.btn, todaysLog.sugarFree === false && styles.btnActiveNo]}
                        onPress={() => handleSugarUpdate(false)}
                    >
                        <Text style={[styles.btnText, todaysLog.sugarFree === false && styles.btnTextActive]}>No, fui fuerte</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, todaysLog.sugarFree === true && styles.btnActiveYes]}
                        onPress={() => handleSugarUpdate(true)}
                    >
                        <Text style={[styles.btnText, todaysLog.sugarFree === true && styles.btnTextActive]}>Sí, consumí</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ marginTop: 16 }}>
                    {renderLevelProgress(nivelAzucar, xpAzucar)}
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>¿Cómo me siento hoy?</Text>
                <View style={styles.emotionsContainer}>
                    {emotions.map((e) => (
                        <TouchableOpacity
                            key={e.value}
                            style={[styles.emotionBtn, todaysLog.emotion === e.value && styles.emotionBtnActive]}
                            onPress={() => handleEmotionUpdate(e.value)}
                        >
                            <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.planContainer}>
                {!todaysPlan ? (
                    <Text style={styles.question}>Generando tu plan...</Text>
                ) : (
                    <>
                        <View style={styles.planHeaderContainer}>
                            <View>
                                <Text style={styles.planTitle}>Tu Plan de Hoy</Text>
                                <View style={[styles.modeBadge, (styles as any)[`modeBadge_${todaysPlan.modo}`]]}>
                                    <Zap color={(styles as any)[`modeText_${todaysPlan.modo}`]?.color || '#FFD700'} size={16} />
                                    <Text style={[styles.modeText, (styles as any)[`modeText_${todaysPlan.modo}`]]}>
                                        Modo: {todaysPlan.modo ? todaysPlan.modo.toUpperCase() : 'ESTÁNDAR'}
                                    </Text>
                                </View>
                                {todaysPlan.focusOfTheDay && (
                                    <View style={styles.focusBadge}>
                                        <Target color={theme.colors.primary} size={14} />
                                        <Text style={styles.focusText}>
                                            Enfoque: {todaysPlan.focusOfTheDay}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.disciplineContainer}>
                                <Text style={styles.disciplineLabel}>Disciplina</Text>
                                <Text style={styles.disciplineValue}>{nivelDisciplina}%</Text>
                            </View>
                        </View>

                        <View style={styles.planSection}>
                            <Text style={styles.planSectionTitle}>Meta Anti-Azúcar</Text>
                            <Text style={styles.planText}>{todaysPlan.sugarPlan}</Text>
                            <View style={{ marginTop: 8 }}>
                                {renderLevelProgress(nivelAzucar, xpAzucar)}
                            </View>
                        </View>
                        {renderTaskToggle(todaysPlan.fitnessPlan || 'Entrenar', 'trained', 'Fitness', nivelFitness, xpFitness, undefined)}
                        {renderTaskToggle(todaysPlan.readingPlan || 'Leer', 'read', 'Lectura', nivelLectura, xpLectura, readingStreak)}
                        {renderTaskToggle(todaysPlan.englishPlan || 'Inglés', 'english', 'Ingles', nivelIngles, xpIngles, englishStreak)}
                        {renderTaskToggle(todaysPlan.pythonPlan || 'Python', 'python', 'Python', nivelPython, xpPython, pythonStreak)}
                    </>
                )}
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
    header: {
        marginBottom: theme.spacing.lg,
    },
    date: {
        ...theme.typography.h2,
        color: theme.colors.text,
        textTransform: 'capitalize',
    },
    quote: {
        ...theme.typography.body,
        color: theme.colors.accent,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    streakContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing.sm,
    },
    streakNumber: {
        fontSize: 48,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    streakLabel: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
    },
    question: {
        ...theme.typography.body,
        textAlign: 'center',
        marginVertical: theme.spacing.md,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
    },
    btn: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    btnActiveNo: {
        backgroundColor: theme.colors.success,
    },
    btnActiveYes: {
        backgroundColor: theme.colors.error,
    },
    btnText: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
    },
    btnTextActive: {
        color: theme.colors.surface,
    },
    emotionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },
    emotionBtn: {
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: '#F5F5F5',
    },
    emotionBtnActive: {
        backgroundColor: theme.colors.secondary,
    },
    emotionEmoji: {
        fontSize: 24,
    },
    taskContainer: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: '#F7F7F7',
        borderRadius: theme.borderRadius.sm,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    taskText: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    taskTextDone: {
        textDecorationLine: 'line-through',
        color: theme.colors.textLight,
    },
    miniStreak: {
        backgroundColor: '#FFF0F5', // light pink background
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    miniStreakText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    planContainer: {
        backgroundColor: theme.colors.surface, // Use theme surface for consistency
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    planHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    planTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    modeBadge_minimo: {
        backgroundColor: '#E0F2F1', // Light Teal
    },
    modeBadge_estandar: {
        backgroundColor: '#FFFDE7', // Light Yellow
    },
    modeBadge_intenso: {
        backgroundColor: '#FFEBEE', // Light Red
    },
    modeText: {
        ...theme.typography.caption,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    modeText_minimo: {
        color: '#00796B', // Dark Teal
    },
    modeText_estandar: {
        color: '#FBC02D', // Dark Yellow
    },
    modeText_intenso: {
        color: '#D32F2F', // Dark Red
    },
    disciplineContainer: {
        alignItems: 'flex-end',
    },
    focusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#F0E6FF', // Light purple
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    focusText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    disciplineLabel: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
    },
    disciplineValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary, // Use primary color for discipline value
    },
    planSection: {
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: '#F5F5F5', // Lighter background for plan details
        borderRadius: theme.borderRadius.sm,
    },
    planSectionTitle: {
        ...theme.typography.caption,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    planText: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    progressContainer: {
        marginTop: 4,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    levelText: {
        ...theme.typography.caption,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    xpText: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    }
});
