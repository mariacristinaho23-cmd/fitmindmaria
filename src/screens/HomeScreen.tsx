import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Animated, Easing, TextInput } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, Emotion, calculateStreak } from '../store/useStore';
import { CheckCircle2, Circle, Flame, Brain, BookOpen, Activity, Dumbbell, Target } from 'lucide-react-native';
import { createWorkout } from '../lib/workouts';

const MOTIVATIONAL_QUOTES = [
    "Cada pequeña elección suma a la persona en la que te estás convirtiendo.",
    "La disciplina es el puente entre tus metas y tus logros.",
    "Estás construyendo una versión más fuerte y brillante de ti misma.",
    "Priorízate hoy, tu 'yo' del mañana te lo agradecerá."
];

export default function HomeScreen() {
    const {
        dailyLogs, updateDailyLog, dailyPlans, generateDailyPlan,
        nivelFitness,
        nivelIngles,
        nivelLectura,
        nivelAzucar,
        studyLogs,
        finalizeDay,
        dailyBosses,
        addStudyLog,
        creditosDisponibles,
    } = useStore();
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLog = dailyLogs[todayStr] || {
        date: todayStr, sugarFree: false, emotion: null, trained: false, read: false, english: false
    };
    const todaysPlan = dailyPlans[todayStr];

    const [barWidth, setBarWidth] = useState(0);
    const animValue = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // compute boss percent
    const computePct = () => {
        const plan = (dailyPlans && dailyPlans[todayStr]) || null;
        let total = 0, done = 0;
        if (plan) {
            if (plan.fitnessPlan) total++;
            if (plan.readingPlan) total++;
            if (plan.englishPlan) total++;
        }
        const todayLog = dailyLogs[todayStr];
        if (todayLog) {
            if (todayLog.trained) done++;
            if (todayLog.read) done++;
            if (todayLog.english) done++;
        }
        if (total === 0) total = 1;
        return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    };

    const pct = computePct();

    const animWidth = barWidth
        ? animValue.interpolate({ inputRange: [0, 100], outputRange: [0, barWidth] })
        : animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: pct,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();

        if (pct === 100) {
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.08, duration: 220, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 220, useNativeDriver: true })
            ]).start();
        }
    }, [pct, barWidth]);

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
    // python domain removed

    const handleSugarUpdate = (consumed: boolean) => {
        const wasSugarFree = todaysLog.sugarFree === true;
        const willBeSugarFree = !consumed;

        updateDailyLog(todayStr, { sugarFree: willBeSugarFree });

        // Timeout to allow state to flush before regenerating plan, updating UI
        setTimeout(() => {
            generateDailyPlan(todayStr);
        }, 0);
    };

    // XP/level visuals removed — replaced by credits and Aura

    const emotions: { emoji: string; value: Emotion }[] = [
        { emoji: '😁', value: 'great' },
        { emoji: '🙂', value: 'good' },
        { emoji: '😐', value: 'neutral' },
        { emoji: '😔', value: 'bad' },
        { emoji: '😫', value: 'terrible' }
    ];

    const Quote = MOTIVATIONAL_QUOTES[sugarFreeStreak % MOTIVATIONAL_QUOTES.length];

    const [pagesInput, setPagesInput] = useState('');
    const [snackMsg, setSnackMsg] = useState<string | null>(null);
    const snackAnim = useRef(new Animated.Value(80)).current;
    const addBtnScale = useRef(new Animated.Value(1)).current;
    const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
    const creditScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // pulse animation when credits change
        Animated.sequence([
            Animated.timing(creditScale, { toValue: 1.08, duration: 160, useNativeDriver: true }),
            Animated.timing(creditScale, { toValue: 1, duration: 180, useNativeDriver: true })
        ]).start();
    }, [creditosDisponibles]);

    // delta tooltip for credit changes
    const prevCredits = useRef<number | null>(creditosDisponibles || 0);
    const [creditDeltaText, setCreditDeltaText] = useState<string | null>(null);
    const deltaAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const prev = prevCredits.current ?? 0;
        const curr = creditosDisponibles || 0;
        const delta = curr - prev;
        if (delta !== 0) {
            setCreditDeltaText(`${delta > 0 ? '+' : '-'}${Math.abs(delta)}`);
            deltaAnim.setValue(0);
            Animated.sequence([
                Animated.timing(deltaAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.delay(900),
                Animated.timing(deltaAnim, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true })
            ]).start(() => setCreditDeltaText(null));
        }
        prevCredits.current = curr;
    }, [creditosDisponibles]);

    const showSnack = (msg: string) => {
        setSnackMsg(msg);
        snackAnim.setValue(80);
        Animated.timing(snackAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
            setTimeout(() => {
                Animated.timing(snackAnim, { toValue: 80, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setSnackMsg(null));
            }, 1400);
        });
    };

    const handleAddPagesHome = () => {
        const n = parseInt(pagesInput || '0', 10);
        if (!n || n <= 0) return showSnack('Introduce un número válido de páginas');
        // button press animation
        Animated.sequence([
            Animated.timing(addBtnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
            Animated.timing(addBtnScale, { toValue: 1, duration: 120, useNativeDriver: true })
        ]).start();
        const today = new Date().toISOString().split('T')[0];
        try {
            addStudyLog({ date: today, type: 'reading', timeMinutes: 0, pagesRead: n });
            setPagesInput('');
            const amount = n * 10;
            const total = (useStore.getState().creditosDisponibles || 0);
            showSnack(`+${amount} ✨  •  Total: ${total}`);
        } catch (e) {
            showSnack('Error: no se pudo registrar las páginas');
        }
    };

    const renderTaskToggle = (title: string, field: keyof typeof todaysLog, domain: 'Fitness' | 'Ingles' | 'Lectura', level: number, streak?: number) => (
        <View style={styles.taskContainer}>
            <TouchableOpacity
                style={styles.taskRow}
                onPress={() => {
                    if (todaysPlan) {
                        const isCurrentlyDone = todaysLog[field];
                        const newStatus = !isCurrentlyDone;
                        updateDailyLog(todayStr, { [field]: newStatus });
                    }
                }}
            >
                {todaysLog[field] ? (
                    <CheckCircle2 color={theme.colors.success} size={24} />
                ) : (
                    <Circle color={theme.colors.textLight} size={24} />
                )}
                <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                    <Text style={[styles.taskText, (todaysLog[field] as any) && styles.taskTextDone]}>{title}</Text>
                </View>
                {streak !== undefined && streak > 0 && (
                    <View style={styles.miniStreak}>
                        <Text style={styles.miniStreakText}>🔥 {streak}</Text>
                    </View>
                )}
            </TouchableOpacity>
            {/* Level progress removed */}
        </View>
    );
    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Image source={require('../../assets/icon.png')} style={{ width: 45, height: 45, resizeMode: 'contain' }} />
                    <Text style={[styles.date, { flex: 1, textAlign: 'center' }]}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                        <View style={{ alignItems: 'flex-end', marginLeft: theme.spacing.md }}>
                            <Animated.Text style={[styles.date, { transform: [{ scale: creditScale }], fontSize: 14, color: theme.colors.primary }]}>{creditosDisponibles || 0} ✨</Animated.Text>
                            {creditDeltaText && (
                                <Animated.View style={{ marginTop: 4, transform: [{ translateY: deltaAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }], opacity: deltaAnim }}>
                                    <View style={styles.deltaBadge}><Text style={styles.deltaText}>{creditDeltaText}</Text></View>
                                </Animated.View>
                            )}
                        </View>
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
                        {/* level progress removed */}
                </View>
            </View>

            {/* Boss card: Procrastinación (progreso de tareas = Caos Mental) */}
            <View style={[styles.card, styles.bossCard]}> 
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cardTitle}>Caos Mental</Text>
                    <Text style={styles.bossLabel}>HP BOSS: LA PROCRASTINACIÓN</Text>
                </View>
                <View style={{ marginTop: theme.spacing.sm }} />
                <View
                    style={styles.hpBarBg}
                    onLayout={(ev) => {
                        const w = ev.nativeEvent.layout.width;
                        if (barWidth !== w) setBarWidth(w);
                    }}
                >
                    <Animated.View style={[styles.hpBarFill, { width: animWidth }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
                    <Animated.Text style={[styles.bossPercent, { transform: [{ scale: scaleAnim }] }]}>{pct}%</Animated.Text>
                    <Text style={{ ...theme.typography.caption, color: theme.colors.textLight }}>🔋 INVERSIÓN: 0%</Text>
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
                                {/* mode removed */}
                            </View>
                            {/* discipline removed */}
                            <TouchableOpacity style={styles.finalizeBtn} onPress={() => {
                                const res = finalizeDay(todayStr);
                                if (res.defeated) {
                                    Alert.alert('¡Victoria!', `Derrotaste al Jefe. +${res.creditDelta} créditos`);
                                } else {
                                    Alert.alert('Día finalizado', `El Jefe sigue vivo (${res.hpRemaining} HP). Pierdes ${-res.creditDelta} créditos.`);
                                }
                            }}>
                                <Text style={styles.finalizeBtnText}>Finalizar Día</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Didactic daily missions as cards */}
                        <View style={styles.missionsContainer}>
                            <View style={styles.missionCard}>
                                <Text style={styles.missionLabel}>ENTRENAMIENTO</Text>
                                <Text style={styles.missionText}>{todaysLog.trained ? 'Completado' : 'No completado'}</Text>
                            </View>

                            <View style={styles.missionCard}>
                                <Text style={styles.missionLabel}>LECTURA</Text>
                                {(() => {
                                    // daily deterministic target between 5 and 20
                                    const day = new Date(todayStr).getDate();
                                    const target = Math.min(20, 5 + (day % 16));
                                    const pagesToday = (studyLogs || []).filter(s => s.date === todayStr && s.type === 'reading')
                                        .reduce((sum, s) => sum + (s.pagesRead || 0), 0);
                                    return (
                                        <>
                                                            <Text style={styles.missionText}>Meta: {target} páginas</Text>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
                                                                <TextInput
                                                                    placeholder='Páginas leídas'
                                                                    keyboardType='numeric'
                                                                    value={pagesInput}
                                                                    onChangeText={setPagesInput}
                                                                    style={styles.pagesInput}
                                                                />
                                                                <AnimatedTouchable style={[styles.addButton, { transform: [{ scale: addBtnScale }] }]} onPress={handleAddPagesHome}>
                                                                    <Text style={styles.addButtonText}>Añadir</Text>
                                                                </AnimatedTouchable>
                                                            </View>
                                                            <Text style={[styles.missionSub, { color: theme.colors.primary, marginTop: theme.spacing.sm }]}>Llevas: {pagesToday} págs</Text>
                                        </>
                                    );
                                })()}
                            </View>

                            <View style={styles.missionCard}>
                                <Text style={styles.missionLabel}>ESTUDIO</Text>
                                {(() => {
                                    const totalFocus = (studyLogs || []).filter(s => s.date === todayStr && s.type === 'focus')
                                        .reduce((sum, s) => sum + (s.timeMinutes || 0), 0);
                                    // deterministic study task
                                    const templates = [
                                        'Estudiar {n} frases en inglés (verbos irregulares)',
                                        'Practicar {n} tarjetas de vocabulario',
                                        'Escuchar {n} minutos de podcast y anotar 5 palabras nuevas',
                                        'Revisar {n} oraciones y traducir al español'
                                    ];
                                    const day = new Date(todayStr).getDate();
                                    const idx = day % templates.length;
                                    const n = 5 + (day % 16); // 5..20
                                    const task = templates[idx].replace('{n}', String(n));
                                    return (
                                        <>
                                            <Text style={styles.missionText}>{task}</Text>
                                            <Text style={[styles.missionSub, { color: theme.colors.primary }]}>Sesión: {totalFocus} min</Text>
                                            <TouchableOpacity
                                                style={[styles.smallActionBtn, todaysLog.english && styles.smallActionBtnDone]}
                                                onPress={() => {
                                                    const newStatus = !todaysLog.english;
                                                    // compute expected credit amount for showing in snack
                                                    let amount = 0;
                                                    if (newStatus && !todaysLog.english) {
                                                        try {
                                                            const plan = (dailyPlans && dailyPlans[todayStr]) || null;
                                                            const modo: any = plan?.modo || 'estandar';
                                                            const multipliers: Record<string, number> = { minimo: 0.5, estandar: 1, intenso: 1.5 };
                                                            const mult = multipliers[modo] || 1;
                                                            const baseEnglish = 50;
                                                            amount = Math.round(baseEnglish * mult);
                                                        } catch (e) { amount = 50; }
                                                    }
                                                    updateDailyLog(todayStr, { english: newStatus });
                                                    if (newStatus && amount > 0) {
                                                        showSnack(`+${amount} créditos por Estudio`);
                                                    }
                                                }}
                                            >
                                                <Text style={[styles.smallActionText]}>{todaysLog.english ? 'Completado' : 'Marcar como realizado'}</Text>
                                            </TouchableOpacity>
                                        </>
                                    );
                                })()}
                            </View>
                        </View>
                    </>
                )}
            </View>

            </ScrollView>

            {snackMsg && (
                <Animated.View style={[styles.snack, { transform: [{ translateY: snackAnim }] }] }>
                    <Text style={styles.snackText}>{snackMsg}</Text>
                </Animated.View>
            )}
        </View>
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
    bossCard: {
        paddingVertical: theme.spacing.md,
    },
    bossLabel: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
        fontWeight: '700'
    },
    hpBarBg: {
        height: 12,
        backgroundColor: '#FEECEE',
        borderRadius: 8,
        overflow: 'hidden',
    },
    hpBarFill: {
        height: '100%',
        backgroundColor: '#F43F5E',
    },
    bossPercent: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '700' },
    missionsContainer: { marginTop: theme.spacing.md },
    missionCard: { backgroundColor: '#FFF', padding: theme.spacing.md, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.sm },
    missionLabel: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700', marginBottom: 6 },
    missionText: { ...theme.typography.body, color: theme.colors.text },
    missionSub: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: 6 },
    snack: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
    },
    snackText: { color: '#FFFFFF', textAlign: 'center', ...theme.typography.body },
    deltaBadge: { backgroundColor: '#0EA5A4', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
    deltaText: { color: '#FFFFFF', fontWeight: '700' },
    smallActionBtn: { marginTop: theme.spacing.sm, backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
    smallActionBtnDone: { backgroundColor: theme.colors.success },
    smallActionText: { color: theme.colors.text, fontWeight: '700' },
    pagesInput: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EEE',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.sm,
        flex: 1,
    },
    addButton: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.borderRadius.sm, marginLeft: theme.spacing.sm },
    addButtonText: { color: '#FFF', fontWeight: '700' },
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
    
    finalizeBtn: {
        marginTop: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
        alignSelf: 'flex-end'
    },
    finalizeBtnText: { color: '#FFF', fontWeight: '700' },
    
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
