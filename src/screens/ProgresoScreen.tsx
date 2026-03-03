import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, calculateStreak } from '../store/useStore';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - theme.spacing.lg * 2;

export default function ProgresoScreen() {
    const { workoutHistory, studyLogs, dailyLogs, dailyPlans, exerciseLibrary, monthlyTrainingGoal, setMonthlyTrainingGoal, creditosDisponibles, updateDailyLog } = useStore();
    const sugarFreeStreak = calculateStreak(dailyLogs, 'sugarFree');

    const chartConfig = {
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        color: (opacity = 1) => `rgba(212, 163, 115, ${opacity})`, // primary color with opacity
        labelColor: (opacity = 1) => theme.colors.textLight,
        strokeWidth: 2,
        barPercentage: 0.6,
        useShadowColorFromDataset: false,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: theme.colors.secondary
        }
    };

    // Helper to get last 7 days strings and labels
    const getLast7Days = () => {
        const dates = [];
        const labels = [];
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');

            dates.push(`${year}-${month}-${day}`);
            labels.push(dayNames[d.getDay()]);
        }
        return { dates, labels };
    };

    const { dates, labels } = getLast7Days();

    // Parse real sugar data from dailyLogs
    const sugarDataList = dates.map(date => {
        const log = dailyLogs[date];
        return log?.sugarFree ? 1 : 0;
    });

    const sugarData = {
        labels: labels,
        datasets: [{ data: sugarDataList.length ? sugarDataList : [0] }] // 1 means sugar-free
    };

    // Parse days trained per day (0 or 1) for the last 7 days
    const workoutDaysList = dates.map(date => {
        const sessions = workoutHistory.filter(s => s.date === date);
        return sessions.length > 0 ? 1 : 0;
    });

    const workoutData = {
        labels: labels,
        datasets: [{ data: workoutDaysList.length ? workoutDaysList : [0] }]
    };

    // Count unique days trained in current month (from dailyLogs.trained or workoutHistory entries)
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const monthDates = new Set<string>();

    Object.keys(dailyLogs).forEach(d => {
        const log = dailyLogs[d];
        if (log?.trained) {
            const dt = new Date(d);
            if (dt.getFullYear() === thisYear && dt.getMonth() === thisMonth) monthDates.add(d);
        }
    });
    workoutHistory.forEach(s => {
        try {
            const dt = new Date(s.date);
            if (dt.getFullYear() === thisYear && dt.getMonth() === thisMonth) monthDates.add(s.date);
        } catch (e) { }
    });

    const currentMonthTrained = monthDates.size;

    // Strength evolution: pick top 3 most frequent exercises and plot max weight per day
    const exerciseCounts: Record<string, number> = {};
    for (const s of workoutHistory) {
        if (!s.exercises) continue;
        for (const e of s.exercises) {
            exerciseCounts[e.exerciseId] = (exerciseCounts[e.exerciseId] || 0) + 1;
        }
    }

    const topExercises = Object.keys(exerciseCounts).sort((a, b) => exerciseCounts[b] - exerciseCounts[a]).slice(0, 3);

    const strengthCharts = topExercises.map(exId => {
        const dataPoints = dates.map(date => {
            const sessions = workoutHistory.filter(s => s.date === date && s.exercises);
            let maxW = 0;
            for (const s of sessions) {
                const found = s.exercises?.find(x => x.exerciseId === exId);
                if (found && found.weight > maxW) maxW = found.weight;
            }
            return maxW;
        });
        const label = (exerciseLibrary.find(x => x.id === exId)?.name) || exId;
        return { id: exId, label, data: dataPoints };
    });

    const readingLogs = studyLogs.filter(l => l.type === 'reading').length;
    const englishLogs = studyLogs.filter(l => l.type === 'english').length;
    const totalStudyLogs = Math.max(1, readingLogs + englishLogs);

    const studyProgressData = {
        labels: ["Lectura", "Inglés"],
        data: [readingLogs / totalStudyLogs, englishLogs / totalStudyLogs]
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <View style={styles.header}>
                <Text style={styles.title}>Estadísticas y Niveles</Text>
            </View>

            <View style={styles.headerRow}>
                <View style={[styles.smallCard, { marginRight: theme.spacing.sm }] }>
                    <Text style={styles.smallLabel}>DÍAS SIN AZÚCAR</Text>
                    <Text style={styles.smallValue}>{sugarFreeStreak}</Text>
                </View>
                <View style={styles.smallCard}>
                    <Text style={styles.smallLabel}>RACHA FITNESS</Text>
                    <Text style={styles.smallValue}>{calculateStreak(dailyLogs, 'trained')}</Text>
                </View>
            </View>

            <View style={styles.domainsCard}>
                <Text style={styles.domainsTitle}>Aura / Cumplimiento Hoy</Text>
                {/* compute today's aura */}
                {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const plan = (dailyPlans && (dailyPlans as any)[today]) || null;
                    const tasks = ['trained', 'read', 'english', 'sugarFree'];
                    let total = 0, done = 0;
                    for (const t of tasks) {
                        // consider task exists if plan has a non-empty instruction for that domain
                        if (t === 'trained' && plan?.fitnessPlan) total++;
                        if (t === 'read' && plan?.readingPlan) total++;
                        if (t === 'english' && plan?.englishPlan) total++;
                        if (t === 'sugarFree' && plan?.sugarPlan) total++;
                    }
                    const todayLog = dailyLogs[today];
                    if (total === 0) total = 1;
                    if (todayLog) {
                        if (todayLog.trained) done++;
                        if (todayLog.read) done++;
                        if (todayLog.english) done++;
                        if (todayLog.sugarFree) done++;
                    }
                    const auraPercent = Math.round((done / total) * 100);
                    let auraLabel = 'Equilibrio';
                    if (auraPercent >= 80) auraLabel = 'Enfoque Total';
                    else if (auraPercent < 40) auraLabel = 'Caos';

                    return (
                        <>
                            <View style={styles.domainRow}>
                                <Text style={styles.domainLabel}>{auraLabel}</Text>
                                <Text style={styles.domainXP}>{auraPercent}%</Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${Math.min(100, auraPercent)}%`, backgroundColor: theme.colors.primary }]} />
                            </View>
                            <Text style={[styles.subtext, { marginTop: theme.spacing.sm }]}>Créditos disponibles: {creditosDisponibles}</Text>
                        </>
                    );
                })()}

                <TouchableOpacity style={styles.resetButton} onPress={() => {
                    const today = new Date().toISOString().split('T')[0];
                    updateDailyLog(today, { sugarFree: false });
                }}>
                    <Text style={styles.resetButtonText}>Reiniciar Racha de Azúcar (Hoy fallé)</Text>
                </TouchableOpacity>
            </View>

            {/* Strength charts (keep existing) */}
            {strengthCharts.length > 0 ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Evolución de Fuerza (ejercicios frecuentes)</Text>
                    {strengthCharts.map(sc => (
                        <View key={sc.id} style={{ marginBottom: 12, width: '100%' }}>
                            <Text style={[styles.summaryText, { marginBottom: 6 }]}>{sc.label}</Text>
                            <LineChart
                                data={{ labels, datasets: [{ data: sc.data }] }}
                                width={screenWidth}
                                height={160}
                                chartConfig={{
                                    ...chartConfig,
                                    color: (opacity = 1) => `rgba(212, 163, 115, ${opacity})`,
                                }}
                                bezier
                                style={{ borderRadius: theme.borderRadius.sm }}
                            />
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Evolución de Fuerza (ejercicios frecuentes)</Text>
                    <Text style={styles.subtext}>Aún no hay registros de fuerza. Registra ejercicios con peso para ver la evolución.</Text>
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Meta Mensual de Entrenamiento</Text>
                <Text style={styles.planText}>Meta actual: {monthlyTrainingGoal} días/mes</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
                    <TextInput
                        style={[styles.input, { width: 120 }]}
                        keyboardType="numeric"
                        value={String(monthlyTrainingGoal)}
                        onChangeText={(v) => setMonthlyTrainingGoal(parseInt(v) || 0)}
                    />
                    <Text style={{ marginLeft: theme.spacing.md }}>{currentMonthTrained} días entrenados este mes</Text>
                </View>
                <View style={{ marginTop: theme.spacing.md }}>
                    <View style={{ height: 10, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                        <View style={{ width: `${Math.min(100, Math.round((currentMonthTrained / Math.max(1, monthlyTrainingGoal)) * 100))}%`, height: '100%', backgroundColor: theme.colors.primary }} />
                    </View>
                    <Text style={[styles.subtext, { marginTop: theme.spacing.sm }]}>{Math.round((currentMonthTrained / Math.max(1, monthlyTrainingGoal)) * 100)}% de la meta mensual</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Distribución de Estudio</Text>
                <ProgressChart
                    data={studyProgressData}
                    width={screenWidth}
                    height={220}
                    strokeWidth={16}
                    radius={32}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1, index) => {
                            const colors = ['rgba(226, 181, 169, 1)', 'rgba(179, 197, 192, 1)', 'rgba(212, 163, 115, 1)'];
                            return colors[index ?? 0] || `rgba(0,0,0,${opacity})`;
                        }
                    }}
                    hideLegend={false}
                    style={styles.chart}
                />
                <Text style={styles.statsText}>Sesiones totales: <Text style={{ fontWeight: '700', color: theme.colors.primary }}>{studyLogs.length}</Text></Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Resumen Automático</Text>
                <Text style={styles.summaryText}>• Has mantenido tu compromiso con el estudio un {Math.round((studyLogs.length / 7) * 100)}% de los días esta semana.</Text>
                <Text style={styles.summaryText}>• Tu consistencia en fitness es admirable, ¡sigue así!.</Text>
                <Text style={styles.summaryText}>• La racha sin azúcar muestra un gran control impulsivo.</Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.lg },
    header: { marginBottom: theme.spacing.lg },
    title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.body, color: theme.colors.textLight },
    card: {
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg, marginBottom: theme.spacing.lg,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        alignItems: 'center'
    },
    cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md, alignSelf: 'flex-start' },
    chart: { borderRadius: theme.borderRadius.sm, marginVertical: theme.spacing.sm },
    statsText: { ...theme.typography.body, color: theme.colors.textLight, marginTop: theme.spacing.sm, alignSelf: 'flex-start' },
    summaryText: { ...theme.typography.body, color: theme.colors.text, marginBottom: theme.spacing.sm, lineHeight: 24, alignSelf: 'flex-start' }
    ,
    subtext: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: theme.spacing.sm }
    ,
    planText: { ...theme.typography.body, color: theme.colors.text, marginTop: theme.spacing.xs, alignSelf: 'flex-start' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', padding: theme.spacing.sm, borderRadius: theme.borderRadius.sm, height: 40, color: theme.colors.text }
    ,
    headerRow: { flexDirection: 'row', marginBottom: theme.spacing.md, alignItems: 'center' },
    smallCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
    smallLabel: { ...theme.typography.caption, color: theme.colors.textLight },
    smallValue: { ...theme.typography.h2, color: theme.colors.text, marginTop: theme.spacing.xs },
    domainsCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg, width: '100%' },
    domainsTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.sm },
    domainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm },
    domainLabel: { ...theme.typography.body, color: theme.colors.text },
    domainXP: { ...theme.typography.caption, color: theme.colors.textLight },
    progressTrack: { width: '100%', height: 8, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden', marginTop: theme.spacing.sm },
    progressFill: { height: '100%', backgroundColor: theme.colors.primary },
    resetButton: { marginTop: theme.spacing.md, backgroundColor: '#fff', borderRadius: theme.borderRadius.sm, paddingVertical: theme.spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#F4E6E6' },
    resetButtonText: { ...theme.typography.body, color: theme.colors.error }
});
