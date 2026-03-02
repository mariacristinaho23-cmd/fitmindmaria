import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, calculateStreak } from '../store/useStore';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - theme.spacing.lg * 2;

export default function ProgresoScreen() {
    const { workoutHistory, studyLogs, dailyLogs } = useStore();
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

    // Parse real workout data from workoutHistory (summing minutes per day)
    const workoutDataList = dates.map(date => {
        const sessions = workoutHistory.filter(s => s.date === date);
        return sessions.reduce((total, session) => total + session.durationMinutes, 0);
    });

    const workoutData = {
        labels: labels,
        datasets: [{ data: workoutDataList.length ? workoutDataList : [0] }] // Minutes
    };

    const readingLogs = studyLogs.filter(l => l.type === 'reading').length;
    const englishLogs = studyLogs.filter(l => l.type === 'english').length;
    const pythonLogs = studyLogs.filter(l => l.type === 'python').length;
    const totalStudyLogs = Math.max(1, readingLogs + englishLogs + pythonLogs);

    const studyProgressData = {
        labels: ["Lectura", "Inglés", "Python"],
        data: [readingLogs / totalStudyLogs, englishLogs / totalStudyLogs, pythonLogs / totalStudyLogs]
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <View style={styles.header}>
                <Text style={styles.title}>Tu Progreso Semanal</Text>
                <Text style={styles.subtitle}>Sigue construyendo tu disciplina, un día a la vez.</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Días sin Azúcar</Text>
                <LineChart
                    data={sugarData}
                    width={screenWidth}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                />
                <Text style={styles.statsText}>Racha actual: <Text style={{ fontWeight: '700', color: theme.colors.primary }}>{sugarFreeStreak} días</Text></Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Minutos de Entrenamiento</Text>
                <BarChart
                    data={workoutData}
                    width={screenWidth}
                    height={220}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(129, 178, 154, ${opacity})`, // success color
                    }}
                    yAxisLabel=""
                    yAxisSuffix="m"
                    style={styles.chart}
                />
                <Text style={styles.statsText}>Total histórico: {workoutHistory.length} sesiones</Text>
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
});
