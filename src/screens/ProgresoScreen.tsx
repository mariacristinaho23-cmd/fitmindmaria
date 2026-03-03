// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, calculateStreak } from '../store/useStore';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { deleteWorkoutFull } from '../lib/workouts';

const screenWidth = Dimensions.get('window').width - theme.spacing.lg * 2;

export default function ProgresoScreen() {
    const { workoutHistory, dailyLogs, currentDate, exerciseLibrary, monthlyTrainingGoal, setMonthlyTrainingGoal, removeWorkoutSession } = useStore();
    const sugarFreeStreak = calculateStreak(dailyLogs, 'sugarFree');

    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionToView, setSessionToView] = useState<any>(null);

    const openSessionModal = (session: any) => {
        setSessionToView(session);
        setShowSessionModal(true);
    };

    const closeSessionModal = () => {
        setShowSessionModal(false);
        setSessionToView(null);
    };

    const handleDeleteSession = (sessionId: string) => {
        Alert.alert('Eliminar sesión', '¿Deseas eliminar esta sesión?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    const s = (workoutHistory || []).find(w => w.id === sessionId);
                    if (s?.remoteId) {
                        try {
                            await deleteWorkoutFull(s.remoteId);
                        } catch (e) {
                            console.error('Error deleting remote workout:', e);
                        }
                    }
                    removeWorkoutSession(sessionId);
                    if (sessionToView?.id === sessionId) {
                        setSessionToView(null);
                        setShowSessionModal(false);
                    }
                }
            }
        ]);
    };

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
            const d = new Date(currentDate + "T12:00:00Z");
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
    const now = new Date(currentDate + "T12:00:00Z");
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



    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <View style={styles.header}>
                <Text style={styles.title}>Estadísticas y Niveles</Text>
            </View>

            <View style={styles.headerRow}>
                <View style={[styles.smallCard, { marginRight: theme.spacing.sm }]}>
                    <Text style={styles.smallLabel}>DÍAS SIN AZÚCAR</Text>
                    <Text style={styles.smallValue}>{sugarFreeStreak}</Text>
                </View>
                <View style={styles.smallCard}>
                    <Text style={styles.smallLabel}>RACHA FITNESS</Text>
                    <Text style={styles.smallValue}>{calculateStreak(dailyLogs, 'trained')}</Text>
                </View>
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
                <Text style={styles.cardTitle}>Historial de Entrenamientos</Text>
                {(workoutHistory || []).map(w => (
                    <View key={w.id} style={[styles.historyItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }]}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => openSessionModal(w)}>
                            <Text style={styles.historyDate}>{w.date}</Text>
                            <Text style={styles.historyText}>{w.routineName} — {w.exercises ? w.exercises.length + ' ejercicios' : ''}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.smallOutlineBtn, { borderColor: theme.colors.error }]} onPress={() => handleDeleteSession(w.id)}>
                            <Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                {(workoutHistory || []).length === 0 && <Text style={styles.subtext}>Aún no hay entrenamientos registrados.</Text>}
            </View>

            {/* Session viewer modal */}
            <Modal visible={showSessionModal} animationType='slide' transparent={true}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
                    <View style={{ backgroundColor: theme.colors.surface, margin: 20, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, maxHeight: '80%' }}>
                        <Text style={styles.cardTitle}>Detalle de Sesión</Text>
                        <Text style={styles.subtext}>{sessionToView?.date} — {sessionToView?.routineName}</Text>
                        <ScrollView style={{ marginTop: 12 }}>
                            {(sessionToView?.exercises || []).map((e: any, i: number) => (
                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                                    <Text style={{ flex: 1 }}>{(exerciseLibrary || []).find(x => x.id === e.exerciseId)?.name || e.exerciseId}</Text>
                                    <Text style={{ marginLeft: 12 }}>{e.sets}x{e.reps} @ {e.weight}kg</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md }}>
                            <TouchableOpacity style={styles.outlineBtn} onPress={closeSessionModal}><Text style={styles.outlineBtnText}>Cerrar</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.error }]} onPress={() => handleDeleteSession(sessionToView?.id)}><Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Eliminar</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



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
    resetButtonText: { ...theme.typography.body, color: theme.colors.error },
    historyItem: { marginBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: theme.spacing.sm },
    historyDate: { ...theme.typography.caption, color: theme.colors.textLight },
    historyText: { ...theme.typography.body, color: theme.colors.text, marginTop: 4 },
    smallOutlineBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.sm },
    outlineBtnText: { ...theme.typography.body, color: theme.colors.primary, marginLeft: theme.spacing.xs },
    outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.sm, marginBottom: theme.spacing.sm }
});
