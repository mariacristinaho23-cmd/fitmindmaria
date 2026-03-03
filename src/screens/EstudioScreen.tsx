// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, calculateStreak, getLocalDateStr } from '../store/useStore';
import { CheckSquare, Square } from 'lucide-react-native';

export default function EstudioScreen() {
    const {
        dailyLogs, updateDailyLog, studyLogs, addStudyLog, readingMonthlyGoal, setReadingGoal
    } = useStore();

    const readingStreak = calculateStreak(dailyLogs, 'read');
    const englishStreak = calculateStreak(dailyLogs, 'english');

    const [activeTab, setActiveTab] = useState<'reading' | 'english'>('reading');

    const [timeMinutes, setTimeMinutes] = useState('');

    // Reading
    const [pagesRead, setPagesRead] = useState('');

    // English
    const [practiceType, setPracticeType] = useState<'listening' | 'speaking' | 'reading' | 'writing'>('reading');
    const [newWords, setNewWords] = useState('');

    // (python removed)

    const handleSave = () => {
        if (!timeMinutes) {
            Alert.alert("Faltan datos", "Agrega el tiempo de estudio.");
            return;
        }

        const todayStr = getLocalDateStr();
        const log: any = {
            date: todayStr,
            type: activeTab,
            timeMinutes: parseInt(timeMinutes)
        };

        if (activeTab === 'reading') {
            if (!pagesRead) {
                Alert.alert("Faltan datos", "Agrega la cantidad de páginas leídas.");
                return;
            }
            log.pagesRead = parseInt(pagesRead);
            updateDailyLog(todayStr, { read: true });
        } else if (activeTab === 'english') {
            log.practiceType = practiceType;
            log.newWords = newWords;
            updateDailyLog(todayStr, { english: true });
        }

        addStudyLog(log);
        Alert.alert("¡Brillante!", "Sesión de estudio registrada con éxito.");

        setTimeMinutes('');
        setPagesRead('');
        setNewWords('');
    };

    const getFilteredLogs = () => studyLogs.filter(l => l.type === activeTab).slice(0, 5);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {['reading', 'english'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab as any)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'reading' ? '📖 Lectura' : '🇺🇸 Inglés'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    {activeTab === 'reading' ? 'Registro de Lectura' : 'Práctica de Inglés'}
                </Text>

                <View style={styles.streakContainer}>
                    <Text style={styles.streakNumber}>{activeTab === 'reading' ? readingStreak : englishStreak}</Text>
                    <Text style={styles.streakLabel}>🔥 racha de días</Text>
                </View>

                <Text style={styles.label}>Tiempo (minutos):</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: 30"
                    keyboardType="numeric"
                    value={timeMinutes}
                    onChangeText={setTimeMinutes}
                />

                {activeTab === 'reading' && (
                    <>
                        <Text style={styles.label}>Páginas leídas:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 15"
                            keyboardType="numeric"
                            value={pagesRead}
                            onChangeText={setPagesRead}
                        />
                        <View style={styles.goalRow}>
                            <Text style={styles.label}>Meta Mensual (páginas):</Text>
                            <TextInput
                                style={[styles.input, { width: 80, marginLeft: 10, marginBottom: 0 }]}
                                keyboardType="numeric"
                                value={readingMonthlyGoal.toString()}
                                onChangeText={(val) => setReadingGoal(parseInt(val) || 0)}
                            />
                        </View>
                    </>
                )}

                {activeTab === 'english' && (
                    <>
                        <Text style={styles.label}>Tipo de Práctica:</Text>
                        <View style={styles.practiceTypes}>
                            {['listening', 'speaking', 'reading', 'writing'].map(pt => (
                                <TouchableOpacity
                                    key={pt}
                                    style={[styles.chip, practiceType === pt && styles.chipActive]}
                                    onPress={() => setPracticeType(pt as any)}
                                >
                                    <Text style={[styles.chipText, practiceType === pt && styles.chipTextActive]}>{pt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.label}>Nuevas Palabras (opcional):</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: relentless, breakthrough"
                            value={newWords}
                            onChangeText={setNewWords}
                        />
                    </>
                )}

                {/* python tab removed */}

                <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                    <Text style={styles.submitBtnText}>Guardar Progreso</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Historial Reciente</Text>
                {getFilteredLogs().map(log => (
                    <View key={log.id} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{log.date}</Text>
                        <Text style={styles.historyText}>
                            {log.timeMinutes} min
                            {log.type === 'reading' && ` • ${log.pagesRead} páginas`}
                            {log.type === 'english' && ` • ${log.practiceType}`}
                        </Text>
                    </View>
                ))}
                {getFilteredLogs().length === 0 && <Text style={styles.subtext}>Aún no hay registros.</Text>}
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.lg },
    tabContainer: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
    tab: {
        flex: 1, paddingVertical: theme.spacing.sm, backgroundColor: '#E0E0E0',
        borderRadius: theme.borderRadius.full, alignItems: 'center'
    },
    tabActive: { backgroundColor: theme.colors.primary },
    tabText: { ...theme.typography.caption, fontWeight: '600', color: theme.colors.text },
    tabTextActive: { color: theme.colors.surface },
    card: {
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg, marginBottom: theme.spacing.lg,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
    label: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
    input: {
        backgroundColor: '#F5F5F5', borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.md, color: theme.colors.text, marginBottom: theme.spacing.md,
    },
    streakContainer: { alignItems: 'center', marginBottom: theme.spacing.md },
    streakNumber: { fontSize: 36, fontWeight: '800', color: theme.colors.primary },
    streakLabel: { ...theme.typography.caption, color: theme.colors.textLight },
    goalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
    practiceTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
    chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F5F5F5', borderRadius: 20 },
    chipActive: { backgroundColor: theme.colors.accent },
    chipText: { ...theme.typography.caption, color: theme.colors.text },
    chipTextActive: { color: theme.colors.surface, fontWeight: '600' },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
    checkboxText: { ...theme.typography.body, marginLeft: theme.spacing.sm, color: theme.colors.text },
    submitBtn: {
        backgroundColor: theme.colors.primary, padding: theme.spacing.md,
        borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: theme.spacing.sm
    },
    submitBtnText: { ...theme.typography.body, fontWeight: '700', color: theme.colors.surface },
    historyItem: { marginBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: theme.spacing.sm },
    historyDate: { ...theme.typography.caption, color: theme.colors.textLight },
    historyText: { ...theme.typography.body, color: theme.colors.text, marginTop: 4 },
    subtext: { ...theme.typography.caption, color: theme.colors.textLight, marginTop: theme.spacing.sm },
});
