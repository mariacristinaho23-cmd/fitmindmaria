// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Animated } from 'react-native';
import { theme } from '../styles/theme';
import { useStore, getLocalDateStr } from '../store/useStore';
import { Flame, Star, Heart, BookOpen } from 'lucide-react-native';

const MANTRAS_POSITIVISMO = [
    "Hoy decido enfocarme en lo bueno, mi mente es un imán para los milagros.",
    "Tengo el poder de crear la realidad que deseo con mis pensamientos.",
    "Cada respiración me llena de paz y expulsa cualquier tensión.",
    "Soy capaz, soy fuerte y merezco todas las cosas maravillosas que la vida ofrece."
];

const MANTRAS_EXITO = [
    "El éxito fluye hacia mí de forma natural y constante.",
    "Cada paso que doy me acerca más a mis metas más grandes.",
    "Soy el arquitecto de mi propio destino; construyo mi éxito día a día.",
    "Atraigo oportunidades increíbles y tengo el coraje de tomarlas."
];

const MANTRAS_AGRADECIMIENTO = [
    "Agradezco este nuevo día y todas las infinitas posibilidades que trae.",
    "Mi corazón rebosa de gratitud por todo lo que tengo y todo lo que está por venir.",
    "La gratitud multiplica mi alegría y abre puertas inesperadas.",
    "Doy gracias por mi salud, mi fuerza y las personas que me inspiran."
];

const MENSAJES_BIBLICOS = [
    '"Todo lo puedo en Cristo que me fortalece." - Filipenses 4:13',
    '"Porque yo sé los planes que tengo para vosotros, planes de bienestar y no de calamidad, a fin de daros un futuro y una esperanza." - Jeremías 29:11',
    '"No temas, porque yo estoy contigo; no te desalientes, porque yo soy tu Dios." - Isaías 41:10',
    '"Confía en el Señor de todo corazón, y no en tu propia inteligencia." - Proverbios 3:5'
];

export default function ReprogramacionScreen() {
    const { addCraving, addJournalEntry, addGratitudeEntry, cravings, journalEntries, gratitudeEntries } = useStore();

    const [activeTab, setActiveTab] = useState<'mantras' | 'gratitud' | 'reflexion'>('mantras');

    // Gratitud State
    const [grat1, setGrat1] = useState('');
    const [grat2, setGrat2] = useState('');
    const [grat3, setGrat3] = useState('');

    // Reflexion State
    const [trigger, setTrigger] = useState('');
    const [intensity, setIntensity] = useState<number>(3);
    const [felt, setFelt] = useState('');
    const [thought, setThought] = useState('');
    const [action, setAction] = useState('');

    const todayDateStr = getLocalDateStr();
    // Use date to pick the mantra of the day deterministically
    const dayOfMonth = new Date(todayDateStr + "T12:00:00Z").getDate() || 1;

    const mantraPositivismo = MANTRAS_POSITIVISMO[dayOfMonth % MANTRAS_POSITIVISMO.length];
    const mantraExito = MANTRAS_EXITO[dayOfMonth % MANTRAS_EXITO.length];
    const mantraAgradecimiento = MANTRAS_AGRADECIMIENTO[dayOfMonth % MANTRAS_AGRADECIMIENTO.length];
    const mensajeBiblico = MENSAJES_BIBLICOS[dayOfMonth % MENSAJES_BIBLICOS.length];

    const handleAddGratitude = () => {
        if (!grat1 || !grat2 || !grat3) {
            Alert.alert("Faltan datos", "Por favor completa las 3 cosas por las que estás agradecida hoy.");
            return;
        }
        addGratitudeEntry({
            date: todayDateStr,
            item1: grat1,
            item2: grat2,
            item3: grat3
        });
        setGrat1(''); setGrat2(''); setGrat3('');
        Alert.alert("¡Gracias!", "Tu gratitud eleva tu frecuencia. ¡Sigue así!");
    };

    const handleAddCraving = () => {
        if (!trigger) {
            Alert.alert("Faltan datos", "Describe qué detonó el antojo.");
            return;
        }
        addCraving({
            date: todayDateStr,
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            intensity,
            trigger
        });
        setTrigger(''); setIntensity(3);
        Alert.alert("¡Reencuadre Positivo!", "Ese antojo no te define. Tienes el control total de tus decisiones.");
    };

    const handleAddJournal = () => {
        if (!felt || !thought || !action) {
            Alert.alert("Faltan datos", "Por favor completa qué sentiste, pensaste y qué hiciste.");
            return;
        }
        addJournalEntry({
            date: todayDateStr,
            felt, thought, action
        });
        setFelt(''); setThought(''); setAction('');
        Alert.alert("Guardado", "Tu diario ha sido actualizado.");
    };

    return (
        <View style={styles.container}>
            {/* TABS */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'mantras' && styles.tabActive]} onPress={() => setActiveTab('mantras')}>
                    <Text style={[styles.tabText, activeTab === 'mantras' && styles.tabTextActive]}>Mantras</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'gratitud' && styles.tabActive]} onPress={() => setActiveTab('gratitud')}>
                    <Text style={[styles.tabText, activeTab === 'gratitud' && styles.tabTextActive]}>Gratitud</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'reflexion' && styles.tabActive]} onPress={() => setActiveTab('reflexion')}>
                    <Text style={[styles.tabText, activeTab === 'reflexion' && styles.tabTextActive]}>Reflexión</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* --- TAB: MANTRAS --- */}
                {activeTab === 'mantras' && (
                    <View>
                        <Text style={styles.headerTitle}>Alimento para tu Mente</Text>
                        <Text style={styles.headerSub}>Lee estos mensajes en voz alta y concientízalos.</Text>

                        <View style={[styles.mantraCard, { borderLeftColor: '#4CAF50' }]}>
                            <View style={styles.mantraHeader}>
                                <Flame color="#4CAF50" size={20} />
                                <Text style={styles.mantraTitle}>Positivismo</Text>
                            </View>
                            <Text style={styles.mantraText}>"{mantraPositivismo}"</Text>
                        </View>

                        <View style={[styles.mantraCard, { borderLeftColor: '#FF9800' }]}>
                            <View style={styles.mantraHeader}>
                                <Star color="#FF9800" size={20} />
                                <Text style={styles.mantraTitle}>Éxito</Text>
                            </View>
                            <Text style={styles.mantraText}>"{mantraExito}"</Text>
                        </View>

                        <View style={[styles.mantraCard, { borderLeftColor: '#E91E63' }]}>
                            <View style={styles.mantraHeader}>
                                <Heart color="#E91E63" size={20} />
                                <Text style={styles.mantraTitle}>Agradecimiento</Text>
                            </View>
                            <Text style={styles.mantraText}>"{mantraAgradecimiento}"</Text>
                        </View>

                        <View style={[styles.mantraCard, { borderLeftColor: '#2196F3' }]}>
                            <View style={styles.mantraHeader}>
                                <BookOpen color="#2196F3" size={20} />
                                <Text style={styles.mantraTitle}>Mensaje Bíblico</Text>
                            </View>
                            <Text style={styles.mantraText}>{mensajeBiblico}</Text>
                        </View>
                    </View>
                )}

                {/* --- TAB: GRATITUD --- */}
                {activeTab === 'gratitud' && (
                    <View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>3 Cosas que Agradezco Hoy</Text>
                            <Text style={styles.label}>1. Estoy muy agradecida por...</Text>
                            <TextInput style={styles.input} value={grat1} onChangeText={setGrat1} placeholder="Ej: La salud de mi familia" />

                            <Text style={styles.label}>2. También agradezco profundamente que...</Text>
                            <TextInput style={styles.input} value={grat2} onChangeText={setGrat2} placeholder="Ej: Pude entrenar hoy" />

                            <Text style={styles.label}>3. Y por último, doy gracias por...</Text>
                            <TextInput style={styles.input} value={grat3} onChangeText={setGrat3} placeholder="Ej: Haber superado un reto difícil" />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddGratitude}>
                                <Text style={styles.submitBtnText}>Agradecer</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.cardTitle, { marginTop: theme.spacing.md }]}>Historial de Gratitud</Text>
                        {gratitudeEntries.length === 0 ? (
                            <Text style={styles.emptyText}>Llena tu corazón de gratitud comenzando hoy.</Text>
                        ) : (
                            gratitudeEntries.slice(0, 5).map(g => (
                                <View key={g.id} style={styles.historyItem}>
                                    <Text style={styles.historyDate}>{g.date}</Text>
                                    <Text style={styles.historyText}>1. {g.item1}</Text>
                                    <Text style={styles.historyText}>2. {g.item2}</Text>
                                    <Text style={styles.historyText}>3. {g.item3}</Text>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* --- TAB: REFLEXION --- */}
                {activeTab === 'reflexion' && (
                    <View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Registro de Antojos</Text>
                            <Text style={styles.label}>Detonante (¿qué lo causó?):</Text>
                            <TextInput style={styles.input} placeholder="Ej: Estrés en el trabajo" value={trigger} onChangeText={setTrigger} />

                            <Text style={styles.label}>Intensidad: {intensity}</Text>
                            <View style={styles.intensityRow}>
                                {[1, 2, 3, 4, 5].map(val => (
                                    <TouchableOpacity key={val} style={[styles.intensityBtn, intensity === val && styles.intensityBtnActive]} onPress={() => setIntensity(val)}>
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
                            <TextInput style={styles.textArea} multiline numberOfLines={3} value={felt} onChangeText={setFelt} placeholder="Tus emociones aquí..." />

                            <Text style={styles.label}>¿Qué pensé?</Text>
                            <TextInput style={styles.textArea} multiline numberOfLines={3} value={thought} onChangeText={setThought} placeholder="Tus pensamientos aquí..." />

                            <Text style={styles.label}>¿Qué elegí hacer?</Text>
                            <TextInput style={styles.textArea} multiline numberOfLines={3} value={action} onChangeText={setAction} placeholder="Tu acción aquí..." />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddJournal}>
                                <Text style={styles.submitBtnText}>Guardar Entrada</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Historial Diarios Reciente</Text>
                            {journalEntries.length === 0 && <Text style={styles.emptyText}>No hay entradas aún.</Text>}
                            {journalEntries.slice(0, 3).map((entry) => (
                                <View key={entry.id} style={styles.historyItem}>
                                    <Text style={styles.historyDate}>{entry.date}</Text>
                                    <Text style={styles.historyText}><Text style={{ fontWeight: '600' }}>Sentí:</Text> {entry.felt}</Text>
                                    <Text style={styles.historyText}><Text style={{ fontWeight: '600' }}>Pensé:</Text> {entry.thought}</Text>
                                    <Text style={styles.historyText}><Text style={{ fontWeight: '600' }}>Hice:</Text> {entry.action}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    tabsContainer: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
    tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: theme.colors.primary },
    tabText: { ...theme.typography.body, color: theme.colors.textLight, fontWeight: '600' },
    tabTextActive: { color: theme.colors.primary, fontWeight: '700' },
    content: { padding: theme.spacing.lg },
    headerTitle: { ...theme.typography.h2, color: theme.colors.text, marginBottom: 4 },
    headerSub: { ...theme.typography.body, color: theme.colors.textLight, marginBottom: theme.spacing.lg },
    mantraCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 } },
    mantraHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    mantraTitle: { ...theme.typography.h3, marginLeft: 8, color: theme.colors.text },
    mantraText: { ...theme.typography.body, color: theme.colors.text, fontStyle: 'italic', fontSize: 16, lineHeight: 24 },
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
    label: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs },
    input: { backgroundColor: '#F5F5F5', borderRadius: theme.borderRadius.sm, padding: theme.spacing.md, color: theme.colors.text, marginBottom: theme.spacing.md },
    textArea: { backgroundColor: '#F5F5F5', borderRadius: theme.borderRadius.sm, padding: theme.spacing.md, color: theme.colors.text, marginBottom: theme.spacing.md, height: 80, textAlignVertical: 'top' },
    intensityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
    intensityBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
    intensityBtnActive: { backgroundColor: theme.colors.error },
    intensityText: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
    intensityTextActive: { color: theme.colors.surface },
    submitBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.sm, alignItems: 'center', marginTop: 8 },
    submitBtnText: { ...theme.typography.body, fontWeight: '700', color: theme.colors.surface },
    historyItem: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#F5F5F5' },
    historyDate: { ...theme.typography.caption, color: theme.colors.textLight, marginBottom: 4 },
    historyText: { ...theme.typography.body, color: theme.colors.text, marginVertical: 2 },
    emptyText: { ...theme.typography.body, color: theme.colors.textLight, fontStyle: 'italic', marginTop: 8 }
});

