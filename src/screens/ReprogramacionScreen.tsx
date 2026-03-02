import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';

export default function ReprogramacionScreen() {
    const { addCraving, addJournalEntry, cravings, journalEntries } = useStore();

    const [trigger, setTrigger] = useState('');
    const [intensity, setIntensity] = useState<number>(3);

    const [felt, setFelt] = useState('');
    const [thought, setThought] = useState('');
    const [action, setAction] = useState('');

    const handleAddCraving = () => {
        if (!trigger) {
            Alert.alert("Faltan datos", "Describe qué detonó el antojo.");
            return;
        }
        addCraving({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            intensity,
            trigger
        });
        setTrigger('');
        setIntensity(3);
        Alert.alert("¡Reencuadre Positivo!", "Ese antojo no te define. Tienes el control total de tus decisiones. ¡Sigue brillando!", [{ text: "Gracias" }]);
    };

    const handleAddJournal = () => {
        if (!felt || !thought || !action) {
            Alert.alert("Faltan datos", "Por favor completa qué sentiste, pensaste y qué hiciste.");
            return;
        }
        addJournalEntry({
            date: new Date().toISOString().split('T')[0],
            felt,
            thought,
            action
        });
        setFelt('');
        setThought('');
        setAction('');
        Alert.alert("Guardado", "Tu diario ha sido actualizado.");
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Registro de Antojos</Text>
                <Text style={styles.label}>Detonante (¿qué lo causó?):</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Estrés en el trabajo"
                    value={trigger}
                    onChangeText={setTrigger}
                />
                <Text style={styles.label}>Intensidad: {intensity}</Text>
                <View style={styles.intensityRow}>
                    {[1, 2, 3, 4, 5].map(val => (
                        <TouchableOpacity
                            key={val}
                            style={[styles.intensityBtn, intensity === val && styles.intensityBtnActive]}
                            onPress={() => setIntensity(val)}
                        >
                            <Text style={[styles.intensityText, intensity === val && styles.intensityTextActive]}>{val}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddCraving}>
                    <Text style={styles.submitBtnText}>Registrar Antojo</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Diario Guiado</Text>
                <Text style={styles.label}>¿Qué sentí?</Text>
                <TextInput
                    style={styles.textArea}
                    multiline numberOfLines={3}
                    value={felt} onChangeText={setFelt}
                    placeholder="Tus emociones aquí..."
                />
                <Text style={styles.label}>¿Qué pensé?</Text>
                <TextInput
                    style={styles.textArea}
                    multiline numberOfLines={3}
                    value={thought} onChangeText={setThought}
                    placeholder="Tus pensamientos aquí..."
                />
                <Text style={styles.label}>¿Qué elegí hacer?</Text>
                <TextInput
                    style={styles.textArea}
                    multiline numberOfLines={3}
                    value={action} onChangeText={setAction}
                    placeholder="Tu acción aquí..."
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddJournal}>
                    <Text style={styles.submitBtnText}>Guardar Entrada</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Historial Reciente</Text>
                {journalEntries.slice(0, 3).map((entry) => (
                    <View key={entry.id} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{entry.date}</Text>
                        <Text style={styles.historyText}><Text style={{ fontWeight: '600' }}>Sentí:</Text> {entry.felt}</Text>
                        <Text style={styles.historyText}><Text style={{ fontWeight: '600' }}>Pensé:</Text> {entry.thought}</Text>
                        <Text style={styles.historyText}><Text style={{ fontWeight: '600' }}>Hice:</Text> {entry.action}</Text>
                    </View>
                ))}
                {journalEntries.length === 0 && <Text style={styles.emptyText}>No hay entradas aún.</Text>}
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
    label: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.md,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    textArea: {
        backgroundColor: '#F5F5F5',
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.md,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        height: 80,
        textAlignVertical: 'top',
    },
    intensityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    intensityBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    intensityBtnActive: {
        backgroundColor: theme.colors.error,
    },
    intensityText: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: '600',
    },
    intensityTextActive: {
        color: theme.colors.surface,
    },
    submitBtn: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    submitBtnText: {
        ...theme.typography.body,
        fontWeight: '700',
        color: theme.colors.surface,
    },
    historyItem: {
        marginBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        paddingBottom: theme.spacing.md,
    },
    historyDate: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
        marginBottom: theme.spacing.xs,
    },
    historyText: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textLight,
        fontStyle: 'italic',
    }
});
